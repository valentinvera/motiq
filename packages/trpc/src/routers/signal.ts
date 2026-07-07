import { db } from "@motiq/db"
import { agentAction } from "@motiq/db/schema/agent-actions"
import { alert } from "@motiq/db/schema/alerts"
import { signal } from "@motiq/db/schema/signals"
import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm"
import { z } from "zod"
import { orgProcedure, router } from "../index"
import { executeApprovedAction } from "../lib/action-executor"

const signalTypeSchema = z.enum([
  "bug",
  "feature_request",
  "complaint",
  "question",
  "praise",
  "churn_risk",
  "other",
])

const signalPrioritySchema = z.enum(["critical", "high", "medium", "low"])
const signalStatusSchema = z.enum(["new", "triaged", "processed", "ignored"])

type SignalRecord = typeof signal.$inferSelect

async function getSignalForOrganization(params: {
  id: string
  organizationId: string
}) {
  const [result] = await db
    .select()
    .from(signal)
    .where(
      and(
        eq(signal.id, params.id),
        eq(signal.organizationId, params.organizationId)
      )
    )
    .limit(1)

  return result ?? null
}

function getAlertSeverity(signalRecord: SignalRecord) {
  return signalRecord.priority ?? "medium"
}

function getAlertType(signalRecord: SignalRecord) {
  return signalRecord.type === "churn_risk" ? "churn_risk" : "escalation"
}

function getSignalAlertDescription(signalRecord: SignalRecord) {
  const type = signalRecord.type ?? "signal"
  const priority = signalRecord.priority ?? "unprioritized"
  const customer = signalRecord.customerName ?? "unknown customer"
  return (
    "Manual alert from " +
    priority +
    " " +
    type +
    " by " +
    customer +
    ". " +
    signalRecord.content
  )
}

async function createAlertFromSignal(params: {
  signalRecord: SignalRecord
  acknowledged?: boolean
  acknowledgedBy?: string
  metadata?: Record<string, unknown>
}) {
  const [existing] = await db
    .select()
    .from(alert)
    .where(
      and(
        eq(alert.organizationId, params.signalRecord.organizationId),
        eq(alert.signalId, params.signalRecord.id)
      )
    )
    .limit(1)

  if (existing) {
    if (
      params.acknowledged === undefined &&
      params.acknowledgedBy === undefined &&
      params.metadata === undefined
    ) {
      return existing
    }

    const [updated] = await db
      .update(alert)
      .set({
        acknowledged: params.acknowledged ?? existing.acknowledged,
        acknowledgedBy: params.acknowledgedBy ?? existing.acknowledgedBy,
        metadata: {
          ...((existing.metadata as Record<string, unknown> | null) ?? {}),
          ...(params.metadata ?? {}),
        },
      })
      .where(
        and(
          eq(alert.id, existing.id),
          eq(alert.organizationId, params.signalRecord.organizationId)
        )
      )
      .returning()

    return updated ?? existing
  }

  const [created] = await db
    .insert(alert)
    .values({
      id: crypto.randomUUID(),
      organizationId: params.signalRecord.organizationId,
      signalId: params.signalRecord.id,
      type: getAlertType(params.signalRecord),
      severity: getAlertSeverity(params.signalRecord),
      title: params.signalRecord.title,
      description: getSignalAlertDescription(params.signalRecord),
      acknowledged: params.acknowledged ?? false,
      acknowledgedBy: params.acknowledgedBy,
      metadata: params.metadata,
    })
    .returning()

  if (!created) {
    throw new Error("Failed to create alert")
  }

  return created
}

export const signalRouter = router({
  list: orgProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          type: signalTypeSchema.optional(),
          priority: signalPrioritySchema.optional(),
          status: signalStatusSchema.optional(),
          limit: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const filters = input ?? {}
      const limit = filters.limit ?? 20
      const offset = filters.offset ?? 0
      const conditions = [eq(signal.organizationId, ctx.organizationId)]
      if (filters.search) {
        const term = `%${filters.search}%`
        const searchCondition = or(
          ilike(signal.title, term),
          ilike(signal.content, term)
        )
        if (searchCondition) {
          conditions.push(searchCondition)
        }
      }
      if (filters.type) {
        conditions.push(eq(signal.type, filters.type))
      }
      if (filters.priority) {
        conditions.push(eq(signal.priority, filters.priority))
      }
      if (filters.status) {
        conditions.push(eq(signal.status, filters.status))
      }

      const where = and(...conditions)

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(signal)
          .where(where)
          .orderBy(desc(signal.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(signal).where(where),
      ])

      return {
        items,
        total: totalResult[0]?.count ?? 0,
      }
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const signalRecord = await getSignalForOrganization({
        id: input.id,
        organizationId: ctx.organizationId,
      })

      if (!signalRecord) {
        return null
      }

      const [relatedAlert] = await db
        .select()
        .from(alert)
        .where(
          and(
            eq(alert.organizationId, ctx.organizationId),
            eq(alert.signalId, signalRecord.id)
          )
        )
        .orderBy(desc(alert.createdAt))
        .limit(1)

      return {
        ...signalRecord,
        relatedAlert: relatedAlert ?? null,
      }
    }),

  updateStatus: orgProcedure
    .input(
      z.object({
        id: z.string(),
        status: signalStatusSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(signal)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(
            eq(signal.id, input.id),
            eq(signal.organizationId, ctx.organizationId)
          )
        )
      return { success: true }
    }),

  ignore: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(signal)
        .set({ status: "ignored", updatedAt: new Date() })
        .where(
          and(
            eq(signal.id, input.id),
            eq(signal.organizationId, ctx.organizationId)
          )
        )

      return { success: true }
    }),

  createAlert: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const signalRecord = await getSignalForOrganization({
        id: input.id,
        organizationId: ctx.organizationId,
      })
      if (!signalRecord) {
        throw new Error("Signal not found")
      }

      const createdAlert = await createAlertFromSignal({ signalRecord })

      await db
        .update(signal)
        .set({ status: "processed", updatedAt: new Date() })
        .where(
          and(
            eq(signal.id, input.id),
            eq(signal.organizationId, ctx.organizationId)
          )
        )

      return { success: true, alertId: createdAlert.id }
    }),

  escalateToSlack: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const signalRecord = await getSignalForOrganization({
        id: input.id,
        organizationId: ctx.organizationId,
      })
      if (!signalRecord) {
        throw new Error("Signal not found")
      }

      const createdAlert = await createAlertFromSignal({
        signalRecord,
        acknowledged: true,
        acknowledgedBy: ctx.session.user.id,
        metadata: {
          resolution: {
            status: "escalated",
            label: "Escalated to Slack",
            decidedAt: new Date().toISOString(),
            decidedBy: ctx.session.user.id,
          },
        },
      })

      const actionId = crypto.randomUUID()
      const [action] = await db
        .insert(agentAction)
        .values({
          id: actionId,
          organizationId: ctx.organizationId,
          actionType: "slack_escalation",
          status: "approved",
          title: "Slack Escalation Approved",
          description: `Escalate signal: ${signalRecord.title}`,
          approvedBy: ctx.session.user.id,
          payload: {
            signalId: signalRecord.id,
            alertId: createdAlert.id,
            targetPayload: {
              title: signalRecord.title,
              severity: getAlertSeverity(signalRecord),
              type: getAlertType(signalRecord),
              description: getSignalAlertDescription(signalRecord),
              organizationId: ctx.organizationId,
            },
          },
        })
        .returning()

      if (!action) {
        throw new Error("Failed to create escalation action")
      }

      await executeApprovedAction({
        action,
        approvedBy: ctx.session.user.id,
      })

      await db
        .update(signal)
        .set({ status: "processed", updatedAt: new Date() })
        .where(
          and(
            eq(signal.id, input.id),
            eq(signal.organizationId, ctx.organizationId)
          )
        )

      return { success: true, alertId: createdAlert.id, actionId }
    }),

  getActionableCount: orgProcedure.query(async ({ ctx }) => {
    const [result] = await db
      .select({ count: count() })
      .from(signal)
      .where(
        and(
          eq(signal.organizationId, ctx.organizationId),
          inArray(signal.status, ["new", "triaged"])
        )
      )

    return { count: result?.count ?? 0 }
  }),

  getStats: orgProcedure.query(async ({ ctx }) => {
    const results = await db
      .select({
        type: signal.type,
        count: count(),
      })
      .from(signal)
      .where(eq(signal.organizationId, ctx.organizationId))
      .groupBy(signal.type)

    const byType: Record<string, number> = {}
    let total = 0
    for (const row of results) {
      const key = row.type ?? "unclassified"
      byType[key] = row.count
      total += row.count
    }

    return { total, byType }
  }),
})
