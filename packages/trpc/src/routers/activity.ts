import { db } from "@motiq/db"
import { activityLog } from "@motiq/db/schema/activity-log"
import { and, count, desc, eq } from "drizzle-orm"
import { z } from "zod"
import { orgProcedure, router } from "../index"

export const activityRouter = router({
  list: orgProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50
      const offset = input?.offset ?? 0

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(activityLog)
          .where(eq(activityLog.organizationId, ctx.organizationId))
          .orderBy(desc(activityLog.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(activityLog)
          .where(eq(activityLog.organizationId, ctx.organizationId)),
      ])

      return {
        items,
        total: totalResult[0]?.count ?? 0,
      }
    }),

  getByEntity: orgProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await db
        .select()
        .from(activityLog)
        .where(
          and(
            eq(activityLog.organizationId, ctx.organizationId),
            eq(activityLog.entityType, input.entityType),
            eq(activityLog.entityId, input.entityId)
          )
        )
        .orderBy(desc(activityLog.createdAt))
      return items
    }),
})
