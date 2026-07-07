import {
  generateStructuredObject,
  repairJsonOutput,
  riskModel,
} from "@motiq/ai"
import { db } from "@motiq/db"
import { agentRun } from "@motiq/db/schema/agent-runs"
import { alert } from "@motiq/db/schema/alerts"
import { customer } from "@motiq/db/schema/customers"
import { pipelineRun } from "@motiq/db/schema/pipeline-runs"
import { signal } from "@motiq/db/schema/signals"
import { and, desc, eq, gte, inArray } from "drizzle-orm"
import { z } from "zod"
import { notifySlackAlert } from "../actions/slack-notify.js"
import { logAgentActivity } from "../activity-audit.js"
import { eventBus } from "../event-bus.js"

const riskSchema = z.object({
  risks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      severity: z.enum(["critical", "high", "medium", "low"]),
      customerName: z.string().optional(),
      signalIds: z.array(z.string()),
    })
  ),
})

async function findExistingAlertForRisk(params: {
  organizationId: string
  signalIds: string[]
}) {
  if (params.signalIds.length === 0) {
    return null
  }

  const [existing] = await db
    .select({ id: alert.id, signalId: alert.signalId })
    .from(alert)
    .where(
      and(
        eq(alert.organizationId, params.organizationId),
        inArray(alert.signalId, params.signalIds)
      )
    )
    .orderBy(desc(alert.createdAt))
    .limit(1)

  return existing ?? null
}

export async function detectChurnRisks(
  organizationId: string,
  pipelineRunId?: string
): Promise<void> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const recentSignals = await db
    .select()
    .from(signal)
    .where(
      and(
        eq(signal.organizationId, organizationId),
        gte(signal.createdAt, since),
        inArray(signal.type, ["complaint", "bug"])
      )
    )
    .orderBy(desc(signal.createdAt))
    .limit(200)

  if (recentSignals.length < 2) {
    return
  }

  const runId = crypto.randomUUID()
  await db.insert(agentRun).values({
    id: runId,
    organizationId,
    agentType: "risk",
    status: "running",
    pipelineRunId,
    pipelineStep: pipelineRunId ? 1 : null,
    input: { signalCount: recentSignals.length, since: since.toISOString() },
    startedAt: new Date(),
  })

  await logAgentActivity({
    organizationId,
    activityType: "agent_run_started",
    title: "Risk Agent Started",
    description:
      "Analyzing " +
      recentSignals.length +
      " recent complaint and bug signals.",
    entityType: "agent_run",
    entityId: runId,
    metadata: { pipelineRunId, signalCount: recentSignals.length },
  })

  try {
    const signalSummaries = recentSignals.map((s) => ({
      id: s.id,
      type: s.type,
      priority: s.priority,
      title: s.title,
      content: s.content.slice(0, 300),
      customerName: s.customerName,
      customerEmail: s.customerEmail,
      customerTier:
        (s.metadata as Record<string, unknown> | null)?.customerTier ?? null,
      createdAt: s.createdAt.toISOString(),
    }))

    const { output } = await generateStructuredObject({
      model: riskModel,
      schema: riskSchema,
      repairText: repairJsonOutput,
      prompt: `You are a churn risk detection agent for a B2B SaaS customer intelligence platform. Analyze complaints and bug reports from the last 7 days and identify customers at risk of churning. Return only valid JSON matching the requested schema. Do not include Markdown, headings, prose, or code fences.

Signals (complaints and bugs only, ${recentSignals.length} total):
${JSON.stringify(signalSummaries, null, 2)}

Identify churn risks:
- Look for customers with multiple negative signals
- Consider customer tier (enterprise customers are higher priority)
- Look for escalating patterns (increasing severity over time)
- Look for competitive mention signals
- Only flag genuine risks, not routine issues
- Include the signal IDs that support each risk assessment
- If no risks are found, return an empty array`,
    })

    let createdRiskAlerts = 0
    let dedupedRiskAlerts = 0

    for (const risk of output.risks) {
      const existingAlert = await findExistingAlertForRisk({
        organizationId,
        signalIds: risk.signalIds,
      })

      if (existingAlert) {
        dedupedRiskAlerts += 1
        await logAgentActivity({
          organizationId,
          activityType: "alert_deduped",
          title: "Risk Alert Deduped",
          description:
            "Skipped duplicate churn risk alert because an alert already exists for the supporting signal.",
          entityType: "alert",
          entityId: existingAlert.id,
          metadata: {
            agentRunId: runId,
            signalIds: risk.signalIds,
            existingSignalId: existingAlert.signalId,
            severity: risk.severity,
            customerName: risk.customerName ?? null,
          },
        })
        continue
      }

      if (risk.customerName) {
        await updateCustomerRiskScores({
          organizationId,
          signalIds: risk.signalIds,
          severity: risk.severity,
        })
      }

      const alertId = crypto.randomUUID()
      await db.insert(alert).values({
        id: alertId,
        organizationId,
        agentRunId: runId,
        signalId: risk.signalIds[0] ?? null,
        type: "churn_risk",
        severity: risk.severity,
        title: risk.title,
        description: risk.description,
        metadata: {
          customerName: risk.customerName,
          relatedSignals: risk.signalIds,
        },
        createdAt: new Date(),
      })

      eventBus.emit("alert:created", {
        organizationId,
        alertId,
        signalId: risk.signalIds[0] ?? null,
      })

      await notifySlackAlert({
        alertId,
        organizationId,
        title: risk.title,
        severity: risk.severity,
        type: "churn_risk",
        description: risk.description,
      }).catch((error) => {
        console.error("Slack risk alert proposal failed:", error)
      })

      createdRiskAlerts += 1

      await logAgentActivity({
        organizationId,
        activityType: "alert_created",
        title: "Risk Alert Created",
        description: `Created ${risk.severity} churn risk alert: ${risk.title}`,
        entityType: "alert",
        entityId: alertId,
        metadata: {
          agentRunId: runId,
          signalIds: risk.signalIds,
          severity: risk.severity,
          customerName: risk.customerName ?? null,
        },
      })

      await logAgentActivity({
        organizationId,
        activityType: "risk_flagged",
        title: `Churn Risk Flagged: ${risk.title}`,
        description: risk.description,
        entityType: "alert",
        entityId: alertId,
      })
    }

    if (output.risks.length === 0) {
      await logAgentActivity({
        organizationId,
        activityType: "alert_skipped",
        title: "No Churn Risk Alert Created",
        description:
          "Risk agent found no genuine churn risks in recent signals.",
        entityType: "agent_run",
        entityId: runId,
        metadata: { signalCount: recentSignals.length },
      })
    }

    if (pipelineRunId) {
      await db
        .update(pipelineRun)
        .set({ stepsCompleted: 1 })
        .where(eq(pipelineRun.id, pipelineRunId))
      eventBus.emit("pipeline:updated", {
        organizationId,
        pipelineRunId,
        status: "running",
      })
    }

    await db
      .update(agentRun)
      .set({
        status: "completed",
        output: output as unknown as Record<string, unknown>,
        completedAt: new Date(),
      })
      .where(eq(agentRun.id, runId))

    await logAgentActivity({
      organizationId,
      activityType: "agent_run_completed",
      title: "Risk Agent Completed",
      description:
        "Created " +
        createdRiskAlerts +
        " churn risk alert" +
        (createdRiskAlerts === 1 ? "" : "s") +
        (dedupedRiskAlerts > 0
          ? " and deduped " +
            dedupedRiskAlerts +
            " duplicate risk" +
            (dedupedRiskAlerts === 1 ? "" : "s") +
            "."
          : "."),
      entityType: "agent_run",
      entityId: runId,
      metadata: {
        pipelineRunId,
        riskCount: output.risks.length,
        createdRiskAlerts,
        dedupedRiskAlerts,
      },
    })
  } catch (error) {
    console.error("Risk detection failed:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    await db
      .update(agentRun)
      .set({
        status: "failed",
        error: message,
        completedAt: new Date(),
      })
      .where(eq(agentRun.id, runId))

    await logAgentActivity({
      organizationId,
      activityType: "agent_run_failed",
      title: "Risk Agent Failed",
      description: message,
      entityType: "agent_run",
      entityId: runId,
      metadata: { pipelineRunId },
    })
  }
}

async function updateCustomerRiskScores({
  organizationId,
  signalIds,
  severity,
}: {
  organizationId: string
  signalIds: string[]
  severity: "critical" | "high" | "medium" | "low"
}) {
  const relatedSignals = await db
    .select({ customerEmail: signal.customerEmail })
    .from(signal)
    .where(inArray(signal.id, signalIds))

  const riskValue = severityToRiskScore(severity)
  for (const relatedSignal of relatedSignals) {
    if (!relatedSignal.customerEmail) {
      continue
    }

    const existingCustomer = await db.query.customer.findFirst({
      where: and(
        eq(customer.organizationId, organizationId),
        eq(customer.email, relatedSignal.customerEmail)
      ),
    })

    if (!existingCustomer) {
      continue
    }

    await db
      .update(customer)
      .set({
        riskScore: Math.max(existingCustomer.riskScore ?? 0, riskValue),
      })
      .where(eq(customer.id, existingCustomer.id))
  }
}

function severityToRiskScore(severity: "critical" | "high" | "medium" | "low") {
  const severityValues: Record<string, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  }
  return severityValues[severity] ?? 25
}
