import { db } from "@motiq/db"
import { agentRun } from "@motiq/db/schema/agent-runs"
import { pipelineRun } from "@motiq/db/schema/pipeline-runs"
import { and, desc, eq, sql } from "drizzle-orm"
import { z } from "zod"
import { orgProcedure, router } from "../index"

const PIPELINE_LIST_SCAN_LIMIT = 500

type PipelineRunRecord = typeof pipelineRun.$inferSelect

function getLogicalPipelineKey(record: PipelineRunRecord) {
  if (record.triggeredBy === "new_signal" && record.triggerSignalId) {
    return `new_signal:${record.triggerSignalId}`
  }

  return record.id
}

function dedupePipelineRuns(records: PipelineRunRecord[]) {
  const seen = new Set<string>()
  const deduped: PipelineRunRecord[] = []

  for (const record of records) {
    const key = getLogicalPipelineKey(record)
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(record)
  }

  return deduped
}

function countLogicalPipelineRuns(where: ReturnType<typeof and>) {
  return db
    .select({
      count:
        sql<number>`count(distinct case when ${pipelineRun.triggeredBy} = 'new_signal' and ${pipelineRun.triggerSignalId} is not null then ${pipelineRun.triggerSignalId} else ${pipelineRun.id} end)`.mapWith(
          Number
        ),
    })
    .from(pipelineRun)
    .where(where)
}

export const pipelineRouter = router({
  list: orgProcedure
    .input(
      z
        .object({
          status: z
            .enum(["pending", "running", "completed", "failed"])
            .optional(),
          limit: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const filters = input ?? {}
      const limit = filters.limit ?? 20
      const offset = filters.offset ?? 0
      const conditions = [eq(pipelineRun.organizationId, ctx.organizationId)]

      if (filters.status) {
        conditions.push(eq(pipelineRun.status, filters.status))
      }

      const where = and(...conditions)

      const [records, totalResult] = await Promise.all([
        db
          .select()
          .from(pipelineRun)
          .where(where)
          .orderBy(desc(pipelineRun.createdAt))
          .limit(PIPELINE_LIST_SCAN_LIMIT),
        countLogicalPipelineRuns(where),
      ])

      const logicalRuns = dedupePipelineRuns(records)

      return {
        items: logicalRuns.slice(offset, offset + limit),
        total: totalResult[0]?.count ?? 0,
      }
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [result] = await db
        .select()
        .from(pipelineRun)
        .where(
          and(
            eq(pipelineRun.id, input.id),
            eq(pipelineRun.organizationId, ctx.organizationId)
          )
        )
        .limit(1)
      return result ?? null
    }),

  getSteps: orgProcedure
    .input(z.object({ pipelineRunId: z.string() }))
    .query(async ({ ctx, input }) => {
      const steps = await db
        .select()
        .from(agentRun)
        .where(
          and(
            eq(agentRun.pipelineRunId, input.pipelineRunId),
            eq(agentRun.organizationId, ctx.organizationId)
          )
        )
        .orderBy(agentRun.pipelineStep)
      return steps
    }),
})
