import { db } from "@motiq/db"
import { agentAction } from "@motiq/db/schema/agent-actions"
import { alert } from "@motiq/db/schema/alerts"
import { signal } from "@motiq/db/schema/signals"
import { and, count, desc, eq, sql } from "drizzle-orm"
import { z } from "zod"
import { orgProcedure, router } from "../index"
import { executeApprovedAction } from "../lib/action-executor"

type AlertRecord = typeof alert.$inferSelect

function buildResolutionMetadata(
  alertRecord: AlertRecord,
  resolution: Record<string, unknown>
) {
  return {
    ...((alertRecord.metadata as Record<string, unknown> | null) ?? {}),
    resolution,
  }
}

async function updateRelatedSignalStatus(params: {
  alertRecord: AlertRecord
  status: "processed" | "ignored"
}) {
  if (!params.alertRecord.signalId) {
    return
  }

  await db
    .update(signal)
    .set({ status: params.status, updatedAt: new Date() })
    .where(
      and(
        eq(signal.id, params.alertRecord.signalId),
        eq(signal.organizationId, params.alertRecord.organizationId)
      )
    )
}

async function getPendingSlackEscalationAction(alertRecord: AlertRecord) {
  const [result] = await db
    .select()
    .from(agentAction)
    .where(
      and(
        eq(agentAction.organizationId, alertRecord.organizationId),
        eq(agentAction.actionType, "slack_escalation"),
        eq(agentAction.status, "proposed"),
        sql`${agentAction.payload}->>'alertId' = ${alertRecord.id}`
      )
    )
    .limit(1)

  return result ?? null
}

async function rejectPendingSlackEscalationAction(alertRecord: AlertRecord) {
  await db
    .update(agentAction)
    .set({ status: "rejected" })
    .where(
      and(
        eq(agentAction.organizationId, alertRecord.organizationId),
        eq(agentAction.actionType, "slack_escalation"),
        eq(agentAction.status, "proposed"),
        sql`${agentAction.payload}->>'alertId' = ${alertRecord.id}`
      )
    )
}

async function getAlertForOrganization(params: {
  id: string
  organizationId: string
}) {
  const [result] = await db
    .select()
    .from(alert)
    .where(
      and(
        eq(alert.id, params.id),
        eq(alert.organizationId, params.organizationId)
      )
    )
    .limit(1)

  return result ?? null
}

export const alertRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    const alerts = await db
      .select()
      .from(alert)
      .where(eq(alert.organizationId, ctx.organizationId))
      .orderBy(desc(alert.createdAt))
    return alerts
  }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [result] = await db
        .select()
        .from(alert)
        .where(
          and(
            eq(alert.id, input.id),
            eq(alert.organizationId, ctx.organizationId)
          )
        )
        .limit(1)
      return result ?? null
    }),

  acknowledge: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const alertRecord = await getAlertForOrganization({
        id: input.id,
        organizationId: ctx.organizationId,
      })
      if (!alertRecord) {
        throw new Error("Alert not found")
      }

      await db
        .update(alert)
        .set({
          acknowledged: true,
          acknowledgedBy: ctx.session.user.id,
          metadata: buildResolutionMetadata(alertRecord, {
            status: "reviewed",
            label: "Marked as reviewed",
            decidedAt: new Date().toISOString(),
            decidedBy: ctx.session.user.id,
          }),
        })
        .where(
          and(
            eq(alert.id, input.id),
            eq(alert.organizationId, ctx.organizationId)
          )
        )
      await updateRelatedSignalStatus({
        alertRecord,
        status: "processed",
      })
      await rejectPendingSlackEscalationAction(alertRecord)

      return { success: true }
    }),

  ignore: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const alertRecord = await getAlertForOrganization({
        id: input.id,
        organizationId: ctx.organizationId,
      })
      if (!alertRecord) {
        throw new Error("Alert not found")
      }

      await db
        .update(alert)
        .set({
          acknowledged: true,
          acknowledgedBy: ctx.session.user.id,
          metadata: buildResolutionMetadata(alertRecord, {
            status: "ignored",
            label: "Ignored",
            decidedAt: new Date().toISOString(),
            decidedBy: ctx.session.user.id,
          }),
        })
        .where(
          and(
            eq(alert.id, input.id),
            eq(alert.organizationId, ctx.organizationId)
          )
        )

      await updateRelatedSignalStatus({
        alertRecord,
        status: "ignored",
      })
      await rejectPendingSlackEscalationAction(alertRecord)

      return { success: true }
    }),

  escalateToSlack: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const alertRecord = await getAlertForOrganization({
        id: input.id,
        organizationId: ctx.organizationId,
      })
      if (!alertRecord) {
        throw new Error("Alert not found")
      }

      const pendingAction = await getPendingSlackEscalationAction(alertRecord)
      let action = pendingAction
      let actionId = pendingAction?.id ?? crypto.randomUUID()

      if (pendingAction) {
        const [approvedAction] = await db
          .update(agentAction)
          .set({
            status: "approved",
            title: "Slack Escalation Approved",
            approvedBy: ctx.session.user.id,
          })
          .where(
            and(
              eq(agentAction.id, pendingAction.id),
              eq(agentAction.organizationId, ctx.organizationId)
            )
          )
          .returning()

        action = approvedAction ?? pendingAction
      } else {
        const [insertedAction] = await db
          .insert(agentAction)
          .values({
            id: actionId,
            organizationId: ctx.organizationId,
            actionType: "slack_escalation",
            status: "approved",
            title: "Slack Escalation Approved",
            description: `Escalate alert: ${alertRecord.title}`,
            approvedBy: ctx.session.user.id,
            payload: {
              alertId: alertRecord.id,
              targetPayload: {
                title: alertRecord.title,
                severity: alertRecord.severity,
                type: alertRecord.type,
                description: alertRecord.description,
                organizationId: ctx.organizationId,
              },
            },
          })
          .returning()

        action = insertedAction ?? null
      }

      if (!action) {
        throw new Error("Failed to create escalation action")
      }

      actionId = action.id

      await executeApprovedAction({
        action,
        approvedBy: ctx.session.user.id,
      })

      await db
        .update(alert)
        .set({
          acknowledged: true,
          acknowledgedBy: ctx.session.user.id,
          metadata: buildResolutionMetadata(alertRecord, {
            status: "escalated",
            label: "Escalated to Slack",
            actionId,
            decidedAt: new Date().toISOString(),
            decidedBy: ctx.session.user.id,
          }),
        })
        .where(
          and(
            eq(alert.id, input.id),
            eq(alert.organizationId, ctx.organizationId)
          )
        )

      await updateRelatedSignalStatus({
        alertRecord,
        status: "processed",
      })

      return { success: true }
    }),

  getUnacknowledgedCount: orgProcedure.query(async ({ ctx }) => {
    const [result] = await db
      .select({ count: count() })
      .from(alert)
      .where(
        and(
          eq(alert.organizationId, ctx.organizationId),
          eq(alert.acknowledged, false)
        )
      )
    return { count: result?.count ?? 0 }
  }),
})
