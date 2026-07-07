import { db } from "@motiq/db"
import { agentRun } from "@motiq/db/schema/agent-runs"
import { pipelineRun } from "@motiq/db/schema/pipeline-runs"
import { and, count, desc, eq } from "drizzle-orm"
import { z } from "zod"
import { orgProcedure, router } from "../index"

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

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(pipelineRun)
          .where(where)
          .orderBy(desc(pipelineRun.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(pipelineRun).where(where),
      ])

      return {
        items,
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
