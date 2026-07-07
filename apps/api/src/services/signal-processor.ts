import { db } from "@motiq/db"
import { agentRun } from "@motiq/db/schema/agent-runs"
import { alert } from "@motiq/db/schema/alerts"
import { customer } from "@motiq/db/schema/customers"
import { pipelineRun } from "@motiq/db/schema/pipeline-runs"
import { signal } from "@motiq/db/schema/signals"
import { and, asc, desc, eq } from "drizzle-orm"
import { notifySlackAlert } from "./actions/slack-notify"
import { logAgentActivity } from "./activity-audit"
import { type TriageResult, triageSignal } from "./agents/triage"
import { eventBus } from "./event-bus"
import { dequeueSignal, retrySignal, type SignalJob } from "./signal-queue"

type SignalRecord = typeof signal.$inferSelect

function normalizeSignalContent(content: string) {
  return content.trim().replace(/\s+/g, " ").toLowerCase()
}

function getReusableClassification(
  candidate: SignalRecord
): TriageResult | null {
  if (!(candidate.type && candidate.priority)) {
    return null
  }

  const metadata = (candidate.metadata as Record<string, unknown> | null) ?? {}
  const sentiment = metadata.sentiment
  const revenueImpact = metadata.revenueImpact

  if (typeof sentiment !== "number" || typeof revenueImpact !== "string") {
    return null
  }

  return {
    type: candidate.type,
    priority: candidate.priority,
    sentiment,
    revenueImpact,
  }
}

async function findExistingAlertForSameSignalContent(
  signalRecord: SignalRecord
) {
  const normalizedContent = normalizeSignalContent(signalRecord.content)
  if (!normalizedContent) {
    return null
  }

  const existingAlerts = await db
    .select({
      alertId: alert.id,
      sourceSignalId: signal.id,
      sourceSignalSource: signal.source,
      sourceSignalContent: signal.content,
    })
    .from(alert)
    .leftJoin(signal, eq(alert.signalId, signal.id))
    .where(eq(alert.organizationId, signalRecord.organizationId))
    .orderBy(desc(alert.createdAt))
    .limit(100)

  for (const existing of existingAlerts) {
    if (!existing.sourceSignalId) {
      continue
    }

    if (existing.sourceSignalSource !== signalRecord.source) {
      continue
    }

    if (
      normalizeSignalContent(existing.sourceSignalContent ?? "") !==
      normalizedContent
    ) {
      continue
    }

    return {
      alertId: existing.alertId,
      sourceSignalId: existing.sourceSignalId,
    }
  }

  return null
}

async function dequeueSignalOrFindPendingSignal(): Promise<{
  job: SignalJob
  signalRecord: SignalRecord
} | null> {
  const queuedJob = await dequeueSignal()

  if (queuedJob) {
    const [signalRecord] = await db
      .select()
      .from(signal)
      .where(eq(signal.id, queuedJob.signalId))
      .limit(1)

    if (!signalRecord) {
      console.warn(`Signal ${queuedJob.signalId} not found, skipping`)
      return null
    }

    return { job: queuedJob, signalRecord }
  }

  const [pendingSignal] = await db
    .select()
    .from(signal)
    .where(eq(signal.status, "new"))
    .orderBy(asc(signal.createdAt))
    .limit(1)

  if (!pendingSignal) {
    return null
  }

  return {
    job: {
      signalId: pendingSignal.id,
      organizationId: pendingSignal.organizationId,
      source: pendingSignal.source,
      createdAt: new Date().toISOString(),
    },
    signalRecord: pendingSignal,
  }
}

async function findReusableTriageClassification(signalRecord: SignalRecord) {
  const normalizedContent = normalizeSignalContent(signalRecord.content)
  if (!normalizedContent) {
    return null
  }

  const candidates = await db
    .select()
    .from(signal)
    .where(
      and(
        eq(signal.organizationId, signalRecord.organizationId),
        eq(signal.source, signalRecord.source),
        eq(signal.status, "triaged")
      )
    )
    .orderBy(desc(signal.createdAt))
    .limit(50)

  for (const candidate of candidates) {
    if (candidate.id === signalRecord.id) {
      continue
    }

    if (normalizeSignalContent(candidate.content) !== normalizedContent) {
      continue
    }

    const classification = getReusableClassification(candidate)
    if (classification) {
      return { classification, sourceSignalId: candidate.id }
    }
  }

  return null
}

async function syncCustomerProfile({
  customerTier,
  job,
  signalRecord,
}: {
  customerTier?: "free" | "starter" | "pro" | "enterprise"
  job: SignalJob
  signalRecord: SignalRecord
}) {
  if (!signalRecord.customerEmail) {
    return
  }

  const existingCustomer = await db.query.customer.findFirst({
    where: and(
      eq(customer.organizationId, job.organizationId),
      eq(customer.email, signalRecord.customerEmail)
    ),
  })

  if (existingCustomer) {
    await db
      .update(customer)
      .set({
        name: signalRecord.customerName ?? existingCustomer.name,
        tier: customerTier ?? existingCustomer.tier,
        signalCount: existingCustomer.signalCount + 1,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customer.id, existingCustomer.id))
    await logAgentActivity({
      organizationId: job.organizationId,
      activityType: "customer_updated",
      title: "Customer Profile Updated",
      description: `Updated customer profile for ${signalRecord.customerEmail}.`,
      entityType: "customer",
      entityId: existingCustomer.id,
      metadata: {
        signalId: job.signalId,
        customerEmail: signalRecord.customerEmail,
      },
    })
    return
  }

  const customerId = crypto.randomUUID()
  await db.insert(customer).values({
    id: customerId,
    organizationId: job.organizationId,
    email: signalRecord.customerEmail,
    name: signalRecord.customerName,
    tier: customerTier ?? "free",
    signalCount: 1,
  })
  await logAgentActivity({
    organizationId: job.organizationId,
    activityType: "customer_created",
    title: "Customer Profile Created",
    description: `Created customer profile for ${signalRecord.customerEmail}.`,
    entityType: "customer",
    entityId: customerId,
    metadata: {
      signalId: job.signalId,
      customerEmail: signalRecord.customerEmail,
    },
  })
}

async function handleSignalAlertDecision({
  classification,
  classificationSource,
  job,
  reusableTriageSignalId,
  runId,
  signalRecord,
}: {
  classification: TriageResult
  classificationSource: "cache" | "model"
  job: SignalJob
  reusableTriageSignalId?: string
  runId: string
  signalRecord: SignalRecord
}) {
  if (!["critical", "high"].includes(classification.priority)) {
    await logAgentActivity({
      organizationId: job.organizationId,
      activityType: "alert_skipped",
      title: "Alert Skipped",
      description: `No alert created because priority is ${classification.priority}.`,
      entityType: "signal",
      entityId: job.signalId,
      metadata: {
        type: classification.type,
        priority: classification.priority,
      },
    })
    return
  }

  const existingAlert =
    await findExistingAlertForSameSignalContent(signalRecord)
  if (existingAlert) {
    await db
      .update(signal)
      .set({
        metadata: {
          ...(signalRecord.metadata as Record<string, unknown> | null),
          sentiment: classification.sentiment,
          revenueImpact: classification.revenueImpact,
          triageClassificationSource: classificationSource,
          reusedTriageSignalId: reusableTriageSignalId,
          alertDeduped: true,
          duplicateAlertId: existingAlert.alertId,
          duplicateAlertSignalId: existingAlert.sourceSignalId,
        },
        updatedAt: new Date(),
      })
      .where(eq(signal.id, job.signalId))
    eventBus.emit("signal:updated", {
      organizationId: job.organizationId,
      signalId: job.signalId,
    })
    await logAgentActivity({
      organizationId: job.organizationId,
      activityType: "alert_deduped",
      title: "Alert Deduped",
      description: `Skipped duplicate alert for ${signalRecord.title}.`,
      entityType: "alert",
      entityId: existingAlert.alertId,
      metadata: {
        signalId: job.signalId,
        duplicateAlertId: existingAlert.alertId,
        duplicateAlertSignalId: existingAlert.sourceSignalId,
      },
    })
    return
  }

  const alertId = crypto.randomUUID()
  await db.insert(alert).values({
    id: alertId,
    organizationId: job.organizationId,
    signalId: job.signalId,
    agentRunId: runId,
    type: "escalation",
    severity: classification.priority,
    title: signalRecord.title,
    description: `New ${classification.priority} ${classification.type} from ${signalRecord.customerName ?? "unknown customer"}. ${classification.revenueImpact}`,
    metadata: {
      source: signalRecord.source,
      signalType: classification.type,
      sentiment: classification.sentiment,
    },
    createdAt: new Date(),
  })

  eventBus.emit("alert:created", {
    organizationId: job.organizationId,
    alertId,
    signalId: job.signalId,
  })

  await logAgentActivity({
    organizationId: job.organizationId,
    activityType: "alert_created",
    title: "Alert Created",
    description: `Created ${classification.priority} alert from ${classification.type} signal.`,
    entityType: "alert",
    entityId: alertId,
    metadata: { signalId: job.signalId, agentRunId: runId },
  })

  await notifySlackAlert({
    alertId,
    organizationId: job.organizationId,
    title: signalRecord.title,
    severity: classification.priority,
    type: "escalation",
    description: classification.revenueImpact,
  }).catch((error) => {
    console.error("Slack triage alert proposal failed:", error)
  })
}

export async function processNextSignal(): Promise<boolean> {
  const next = await dequeueSignalOrFindPendingSignal()
  if (!next) {
    return false
  }

  const { job, signalRecord } = next

  if (signalRecord.status !== "new") {
    await logAgentActivity({
      organizationId: job.organizationId,
      activityType: "signal_skipped",
      title: "Signal Skipped: already processed",
      description: `Skipped ${signalRecord.title} because status is ${signalRecord.status}.`,
      entityType: "signal",
      entityId: job.signalId,
      metadata: { status: signalRecord.status },
    })
    return true
  }

  let plRunId: string | null = null
  let runId: string | null = null

  try {
    plRunId = crypto.randomUUID()
    await db.insert(pipelineRun).values({
      id: plRunId,
      organizationId: job.organizationId,
      triggerSignalId: job.signalId,
      triggeredBy: "new_signal",
      status: "running",
      stepsCompleted: 0,
      totalSteps: 1,
      startedAt: new Date(),
    })
    eventBus.emit("pipeline:created", {
      organizationId: job.organizationId,
      pipelineRunId: plRunId,
      status: "running",
    })

    await logAgentActivity({
      organizationId: job.organizationId,
      activityType: "signal_processing_started",
      title: "Signal Processing Started",
      description: `Started triage pipeline for ${signalRecord.title}.`,
      entityType: "signal",
      entityId: job.signalId,
      metadata: { pipelineRunId: plRunId, source: signalRecord.source },
    })

    const customerTier = (
      signalRecord.metadata as Record<string, unknown> | null
    )?.customerTier as "free" | "starter" | "pro" | "enterprise" | undefined

    await syncCustomerProfile({ customerTier, job, signalRecord })

    runId = crypto.randomUUID()
    await db.insert(agentRun).values({
      id: runId,
      organizationId: job.organizationId,
      signalId: job.signalId,
      pipelineRunId: plRunId,
      pipelineStep: 1,
      agentType: "triage",
      status: "running",
      input: {
        title: signalRecord.title,
        content: signalRecord.content,
        source: signalRecord.source,
      },
      startedAt: new Date(),
    })

    await logAgentActivity({
      organizationId: job.organizationId,
      activityType: "agent_run_started",
      title: "Triage Agent Started",
      description: `Analyzing signal from ${signalRecord.source}.`,
      entityType: "agent_run",
      entityId: runId,
      metadata: { signalId: job.signalId, pipelineRunId: plRunId },
    })

    const reusableTriage = await findReusableTriageClassification(signalRecord)
    const classification =
      reusableTriage?.classification ??
      (await triageSignal({
        title: signalRecord.title,
        content: signalRecord.content,
        source: signalRecord.source,
        customerName: signalRecord.customerName,
        customerTier: customerTier ?? null,
      }))
    const classificationSource = reusableTriage ? "cache" : "model"

    await db
      .update(signal)
      .set({
        type: classification.type,
        priority: classification.priority,
        status: "triaged",
        metadata: {
          ...(signalRecord.metadata as Record<string, unknown> | null),
          sentiment: classification.sentiment,
          revenueImpact: classification.revenueImpact,
          triageClassificationSource: classificationSource,
          reusedTriageSignalId: reusableTriage?.sourceSignalId,
        },
        updatedAt: new Date(),
      })
      .where(eq(signal.id, job.signalId))

    eventBus.emit("signal:updated", {
      organizationId: job.organizationId,
      signalId: job.signalId,
    })

    await db
      .update(agentRun)
      .set({
        status: "completed",
        output: {
          ...classification,
          classificationSource,
          reusedTriageSignalId: reusableTriage?.sourceSignalId,
        },
        completedAt: new Date(),
      })
      .where(eq(agentRun.id, runId))

    await logAgentActivity({
      organizationId: job.organizationId,
      activityType: "agent_run_completed",
      title: "Triage Agent Completed",
      description: `Classified as ${classification.type} with ${classification.priority} priority using ${classificationSource}.`,
      entityType: "agent_run",
      entityId: runId,
      metadata: {
        signalId: job.signalId,
        pipelineRunId: plRunId,
        classificationSource,
        reusedTriageSignalId: reusableTriage?.sourceSignalId,
      },
    })

    await handleSignalAlertDecision({
      classification,
      classificationSource,
      job,
      reusableTriageSignalId: reusableTriage?.sourceSignalId,
      runId,
      signalRecord,
    })

    await db
      .update(pipelineRun)
      .set({
        status: "completed",
        stepsCompleted: 1,
        completedAt: new Date(),
      })
      .where(eq(pipelineRun.id, plRunId))
    eventBus.emit("pipeline:updated", {
      organizationId: job.organizationId,
      pipelineRunId: plRunId,
      status: "completed",
    })

    await logAgentActivity({
      organizationId: job.organizationId,
      activityType: "signal_classified",
      title: `Signal Triaged: ${classification.type}`,
      description: `Classified as ${classification.type} with ${classification.priority} priority`,
      entityType: "signal",
      entityId: job.signalId,
      metadata: {
        type: classification.type,
        priority: classification.priority,
        sentiment: classification.sentiment,
        revenueImpact: classification.revenueImpact,
      },
    })

    await logAgentActivity({
      organizationId: job.organizationId,
      activityType: "signal_processing_completed",
      title: "Signal Processing Completed",
      description: `Completed processing for ${signalRecord.title}.`,
      entityType: "signal",
      entityId: job.signalId,
      metadata: { pipelineRunId: plRunId, agentRunId: runId },
    })

    return true
  } catch (error) {
    console.error(`Failed to process signal ${job.signalId}:`, error)
    const message = error instanceof Error ? error.message : "Unknown error"
    if (runId) {
      await db
        .update(agentRun)
        .set({ status: "failed", error: message, completedAt: new Date() })
        .where(eq(agentRun.id, runId))
      await logAgentActivity({
        organizationId: job.organizationId,
        activityType: "agent_run_failed",
        title: "Triage Agent Failed",
        description: message,
        entityType: "agent_run",
        entityId: runId,
        metadata: { signalId: job.signalId, pipelineRunId: plRunId },
      })
    }
    if (plRunId) {
      await db
        .update(pipelineRun)
        .set({ status: "failed", error: message, completedAt: new Date() })
        .where(eq(pipelineRun.id, plRunId))
      eventBus.emit("pipeline:updated", {
        organizationId: job.organizationId,
        pipelineRunId: plRunId,
        status: "failed",
      })
    }
    await logAgentActivity({
      organizationId: job.organizationId,
      activityType: "signal_processing_failed",
      title: "Signal Processing Failed",
      description: message,
      entityType: "signal",
      entityId: job.signalId,
      metadata: { pipelineRunId: plRunId, agentRunId: runId },
    })
    await retrySignal(job, error)
    return true
  }
}

let pollingInterval: ReturnType<typeof setInterval> | null = null
let isProcessingSignals = false

export function startSignalProcessor(intervalMs = 5000): void {
  if (pollingInterval) {
    return
  }
  console.log(`Signal processor started (polling every ${intervalMs / 1000}s)`)
  pollingInterval = setInterval(async () => {
    if (isProcessingSignals) {
      return
    }

    isProcessingSignals = true
    try {
      let processed = true
      while (processed) {
        processed = await processNextSignal()
      }
    } catch (error) {
      console.error("Signal processor error:", error)
    } finally {
      isProcessingSignals = false
    }
  }, intervalMs)
}

export function stopSignalProcessor(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
    isProcessingSignals = false
    console.log("Signal processor stopped")
  }
}
