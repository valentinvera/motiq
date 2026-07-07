import { db } from "@motiq/db"
import { agentAction } from "@motiq/db/schema/agent-actions"
import { alert } from "@motiq/db/schema/alerts"
import { autonomyRule } from "@motiq/db/schema/autonomy-rules"
import { signal } from "@motiq/db/schema/signals"
import { and, desc, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { orgProcedure, requirePermission, router } from "../index"
import { executeApprovedAction } from "../lib/action-executor"
import { ensureDefaultAutonomyRules } from "../lib/autonomy-defaults"

const autonomyLevelSchema = z.enum(["observe", "suggest", "auto"])

type AgentActionRecord = typeof agentAction.$inferSelect
type AlertRecord = typeof alert.$inferSelect

function getLinkedAlertId(action: AgentActionRecord) {
  const payload = (action.payload as Record<string, unknown> | null) ?? {}
  const alertId = payload.alertId
  return typeof alertId === "string" ? alertId : null
}

function buildAlertResolutionMetadata(
  alertRecord: AlertRecord,
  resolution: Record<string, unknown>
) {
  return {
    ...((alertRecord.metadata as Record<string, unknown> | null) ?? {}),
    resolution,
  }
}

async function updateLinkedAlertResolution(params: {
  action: AgentActionRecord
  organizationId: string
  userId: string
  status: "escalated" | "ignored"
  label: string
}) {
  const alertId = getLinkedAlertId(params.action)
  if (!alertId) {
    return
  }

  const [alertRecord] = await db
    .select()
    .from(alert)
    .where(
      and(
        eq(alert.id, alertId),
        eq(alert.organizationId, params.organizationId)
      )
    )
    .limit(1)

  if (!alertRecord) {
    return
  }

  await db
    .update(alert)
    .set({
      acknowledged: true,
      acknowledgedBy: params.userId,
      metadata: buildAlertResolutionMetadata(alertRecord, {
        status: params.status,
        label: params.label,
        actionId: params.action.id,
        decidedAt: new Date().toISOString(),
        decidedBy: params.userId,
      }),
    })
    .where(
      and(
        eq(alert.id, alertId),
        eq(alert.organizationId, params.organizationId)
      )
    )

  if (alertRecord.signalId) {
    await db
      .update(signal)
      .set({
        status: params.status === "ignored" ? "ignored" : "processed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(signal.id, alertRecord.signalId),
          eq(signal.organizationId, params.organizationId)
        )
      )
  }
}

export const autonomyRouter = router({
  getRules: orgProcedure.query(async ({ ctx }) => {
    await ensureDefaultAutonomyRules(ctx.organizationId)
    const rules = await db
      .select()
      .from(autonomyRule)
      .where(eq(autonomyRule.organizationId, ctx.organizationId))
    return rules
  }),

  updateRule: requirePermission("autonomy", "update")
    .input(
      z.object({
        id: z.string(),
        autonomyLevel: autonomyLevelSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(autonomyRule)
        .set({
          autonomyLevel: input.autonomyLevel,
          updatedBy: ctx.session.user.id,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(autonomyRule.id, input.id),
            eq(autonomyRule.organizationId, ctx.organizationId)
          )
        )
      return { success: true }
    }),

  getActionQueue: orgProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20
      const offset = input?.offset ?? 0
      const actions = await db
        .select()
        .from(agentAction)
        .where(
          and(
            eq(agentAction.organizationId, ctx.organizationId),
            eq(agentAction.status, "proposed")
          )
        )
        .orderBy(desc(agentAction.createdAt))
        .limit(100)

      const linkedAlertIds = Array.from(
        new Set(actions.map(getLinkedAlertId).filter((id) => id !== null))
      )
      const acknowledgedAlerts = linkedAlertIds.length
        ? await db
            .select({ id: alert.id })
            .from(alert)
            .where(
              and(
                eq(alert.organizationId, ctx.organizationId),
                eq(alert.acknowledged, true),
                inArray(alert.id, linkedAlertIds)
              )
            )
        : []
      const acknowledgedAlertIds = new Set(
        acknowledgedAlerts.map((item) => item.id)
      )

      return actions
        .filter((action) => {
          const linkedAlertId = getLinkedAlertId(action)
          return !(linkedAlertId && acknowledgedAlertIds.has(linkedAlertId))
        })
        .slice(offset, offset + limit)
    }),

  approveAction: requirePermission("autonomy", "update")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [action] = await db
        .select()
        .from(agentAction)
        .where(
          and(
            eq(agentAction.id, input.id),
            eq(agentAction.organizationId, ctx.organizationId),
            eq(agentAction.status, "proposed")
          )
        )
        .limit(1)

      if (!action) {
        throw new Error("Action not found or already handled")
      }

      await executeApprovedAction({
        action,
        approvedBy: ctx.session.user.id,
      })

      await updateLinkedAlertResolution({
        action,
        organizationId: ctx.organizationId,
        userId: ctx.session.user.id,
        status: "escalated",
        label: "Escalated to Slack",
      })

      return { success: true, executed: true }
    }),

  rejectAction: requirePermission("autonomy", "update")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [action] = await db
        .select()
        .from(agentAction)
        .where(
          and(
            eq(agentAction.id, input.id),
            eq(agentAction.organizationId, ctx.organizationId),
            eq(agentAction.status, "proposed")
          )
        )
        .limit(1)

      if (!action) {
        throw new Error("Action not found or already handled")
      }

      await db
        .update(agentAction)
        .set({ status: "rejected" })
        .where(
          and(
            eq(agentAction.id, input.id),
            eq(agentAction.organizationId, ctx.organizationId)
          )
        )

      return { success: true }
    }),

  undoAction: requirePermission("autonomy", "update")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(agentAction)
        .set({
          status: "undone",
          undoneAt: new Date(),
          undoneBy: ctx.session.user.id,
        })
        .where(
          and(
            eq(agentAction.id, input.id),
            eq(agentAction.organizationId, ctx.organizationId)
          )
        )
      return { success: true }
    }),
})
