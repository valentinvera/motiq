import { db } from "@motiq/db"
import { member, organization } from "@motiq/db/schema/auth"
import { pipelineRun } from "@motiq/db/schema/pipeline-runs"
import { signal } from "@motiq/db/schema/signals"
import { and, eq, gte, inArray } from "drizzle-orm"
import { sendDailyDigest } from "./actions/email-digest"
import { detectChurnRisks } from "./agents/risk"
import { eventBus } from "./event-bus"

async function getActiveOrganizationIds(): Promise<string[]> {
  const orgs = await db
    .selectDistinct({ id: organization.id })
    .from(organization)
    .innerJoin(member, eq(member.organizationId, organization.id))
  return orgs.map((o) => o.id)
}

async function hasScheduledPipelineWork(organizationId: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentRiskSignals = await db
    .select({ id: signal.id })
    .from(signal)
    .where(
      and(
        eq(signal.organizationId, organizationId),
        gte(signal.createdAt, since),
        inArray(signal.type, ["complaint", "bug"])
      )
    )
    .limit(2)

  return recentRiskSignals.length >= 2
}

async function runUnifiedPipeline(): Promise<void> {
  const orgIds = await getActiveOrganizationIds()
  for (const orgId of orgIds) {
    const hasWork = await hasScheduledPipelineWork(orgId)
    if (!hasWork) {
      continue
    }

    const runId = crypto.randomUUID()
    await db.insert(pipelineRun).values({
      id: runId,
      organizationId: orgId,
      triggeredBy: "scheduled",
      status: "running",
      stepsCompleted: 1, // Triage is step 1, done separately logic-wise but logically part of the pipeline scope
      totalSteps: 1,
      startedAt: new Date(),
    })
    eventBus.emit("pipeline:created", {
      organizationId: orgId,
      pipelineRunId: runId,
      status: "running",
    })

    try {
      await detectChurnRisks(orgId, runId)
      await db
        .update(pipelineRun)
        .set({
          status: "completed",
          stepsCompleted: 1,
          completedAt: new Date(),
        })
        .where(eq(pipelineRun.id, runId))
      eventBus.emit("pipeline:updated", {
        organizationId: orgId,
        pipelineRunId: runId,
        status: "completed",
      })
    } catch (error) {
      console.error(`Pipeline run failed for org ${orgId}:`, error)
      await db
        .update(pipelineRun)
        .set({
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        })
        .where(eq(pipelineRun.id, runId))
      eventBus.emit("pipeline:updated", {
        organizationId: orgId,
        pipelineRunId: runId,
        status: "failed",
      })
    }
  }
}

async function runDailyDigest(): Promise<void> {
  const orgIds = await getActiveOrganizationIds()
  for (const orgId of orgIds) {
    try {
      await sendDailyDigest(orgId)
    } catch (error) {
      console.error(`Daily digest failed for org ${orgId}:`, error)
    }
  }
}

let pipelineInterval: ReturnType<typeof setInterval> | null = null
let digestInterval: ReturnType<typeof setInterval> | null = null

const ONE_HOUR = 60 * 60 * 1000
const TWENTY_FOUR_HOURS = 24 * ONE_HOUR

export function startAgentScheduler(): void {
  if (pipelineInterval) {
    return
  }

  console.log("Agent scheduler started")
  console.log("  - Risk pipeline: every 1h")
  console.log("  - Daily digest: every 24h")

  pipelineInterval = setInterval(async () => {
    console.log("[scheduler] Running unified pipeline...")
    await runUnifiedPipeline()
  }, ONE_HOUR)

  digestInterval = setInterval(async () => {
    console.log("[scheduler] Running daily digest...")
    await runDailyDigest()
  }, TWENTY_FOUR_HOURS)
}

export function stopAgentScheduler(): void {
  if (pipelineInterval) {
    clearInterval(pipelineInterval)
    pipelineInterval = null
  }
  if (digestInterval) {
    clearInterval(digestInterval)
    digestInterval = null
  }
  console.log("Agent scheduler stopped")
}
