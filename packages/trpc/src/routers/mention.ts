import { db } from "@motiq/db"
import { alert } from "@motiq/db/schema/alerts"
import { member, user } from "@motiq/db/schema/auth"
import { mention } from "@motiq/db/schema/mentions"
import { signal } from "@motiq/db/schema/signals"
import { TRPCError } from "@trpc/server"
import { and, count, desc, eq, inArray, isNull, or, sql } from "drizzle-orm"
import { z } from "zod"
import { orgProcedure, router } from "../index"

const entityTypeSchema = z.enum(["signal", "alert"])

type MentionEntityType = z.infer<typeof entityTypeSchema>
type MentionRecord = typeof mention.$inferSelect
interface MentionEntityRef {
  entityType: MentionEntityType
  entityId: string
}

function emitMentionEvent(
  eventName: "mention:created" | "mention:updated",
  payload: {
    organizationId: string
    mentionId: string
    entityType: MentionEntityType
    entityId: string
    mentionedUserId: string
  }
) {
  const eventBus = (
    globalThis as typeof globalThis & {
      __motiqEventBus?: {
        emit: (eventName: string, payload: unknown) => boolean
      }
    }
  ).__motiqEventBus

  eventBus?.emit(eventName, payload)
}

async function getEntity(params: {
  entityType: MentionEntityType
  entityId: string
  organizationId: string
}) {
  if (params.entityType === "signal") {
    const [result] = await db
      .select({ id: signal.id, title: signal.title })
      .from(signal)
      .where(
        and(
          eq(signal.id, params.entityId),
          eq(signal.organizationId, params.organizationId)
        )
      )
      .limit(1)

    return result ? { ...result, type: "signal" as const } : null
  }

  const [result] = await db
    .select({ id: alert.id, title: alert.title })
    .from(alert)
    .where(
      and(
        eq(alert.id, params.entityId),
        eq(alert.organizationId, params.organizationId)
      )
    )
    .limit(1)

  return result ? { ...result, type: "alert" as const } : null
}

function getRelatedSignalIdsFromAlertRecord(
  alertRecord: typeof alert.$inferSelect
) {
  const relatedSignals = (
    alertRecord.metadata as Record<string, unknown> | null
  )?.relatedSignals

  return Array.from(
    new Set([
      alertRecord.signalId,
      ...(Array.isArray(relatedSignals) ? relatedSignals : []),
    ])
  ).filter((id): id is string => typeof id === "string" && id.length > 0)
}

async function getRelatedMentionEntities(params: {
  entityType: MentionEntityType
  entityId: string
  organizationId: string
}): Promise<MentionEntityRef[]> {
  if (params.entityType === "signal") {
    const relatedAlerts = await db
      .select({ id: alert.id })
      .from(alert)
      .where(
        and(
          eq(alert.organizationId, params.organizationId),
          or(
            eq(alert.signalId, params.entityId),
            sql`${alert.metadata}->'relatedSignals' ? ${params.entityId}`
          )
        )
      )

    return relatedAlerts.map((item) => ({
      entityType: "alert",
      entityId: item.id,
    }))
  }

  const [alertRecord] = await db
    .select()
    .from(alert)
    .where(
      and(
        eq(alert.id, params.entityId),
        eq(alert.organizationId, params.organizationId)
      )
    )
    .limit(1)

  if (!alertRecord) {
    return []
  }

  return getRelatedSignalIdsFromAlertRecord(alertRecord).map((entityId) => ({
    entityType: "signal",
    entityId,
  }))
}

async function getRelatedMentionedUserIds(params: {
  entityType: MentionEntityType
  entityId: string
  organizationId: string
}) {
  const relatedEntities = await getRelatedMentionEntities(params)

  if (relatedEntities.length === 0) {
    return new Set<string>()
  }

  const conditions = relatedEntities.map((entity) =>
    and(
      eq(mention.entityType, entity.entityType),
      eq(mention.entityId, entity.entityId)
    )
  )

  const records = await db
    .select({ mentionedUserId: mention.mentionedUserId })
    .from(mention)
    .where(
      and(eq(mention.organizationId, params.organizationId), or(...conditions))
    )

  return new Set(records.map((record) => record.mentionedUserId))
}

async function getMemberUser(params: {
  organizationId: string
  userId: string
}) {
  const [result] = await db
    .select({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(
      and(
        eq(member.organizationId, params.organizationId),
        eq(member.userId, params.userId)
      )
    )
    .limit(1)

  return result ?? null
}

async function hydrateMentions(records: MentionRecord[]) {
  const userIds = Array.from(
    new Set(
      records.flatMap((item) => [item.mentionedUserId, item.mentionedByUserId])
    )
  )
  const users = userIds.length
    ? await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(user)
        .where(inArray(user.id, userIds))
    : []
  const userById = new Map(users.map((item) => [item.id, item]))

  const signalIds = records
    .filter((item) => item.entityType === "signal")
    .map((item) => item.entityId)
  const alertIds = records
    .filter((item) => item.entityType === "alert")
    .map((item) => item.entityId)

  const signals = signalIds.length
    ? await db
        .select({ id: signal.id, title: signal.title })
        .from(signal)
        .where(inArray(signal.id, Array.from(new Set(signalIds))))
    : []
  const alerts = alertIds.length
    ? await db
        .select({ id: alert.id, title: alert.title })
        .from(alert)
        .where(inArray(alert.id, Array.from(new Set(alertIds))))
    : []

  const signalById = new Map(signals.map((item) => [item.id, item.title]))
  const alertById = new Map(alerts.map((item) => [item.id, item.title]))

  return records.map((item) => ({
    ...item,
    mentionedUser: userById.get(item.mentionedUserId) ?? null,
    mentionedByUser: userById.get(item.mentionedByUserId) ?? null,
    entityTitle:
      item.entityType === "signal"
        ? (signalById.get(item.entityId) ?? "Signal")
        : (alertById.get(item.entityId) ?? "Alert"),
  }))
}

export const mentionRouter = router({
  create: orgProcedure
    .input(
      z.object({
        entityType: entityTypeSchema,
        entityId: z.string().min(1),
        mentionedUserId: z.string().min(1),
        message: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.mentionedUserId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Mention another workspace member",
        })
      }

      const [entity, mentionedUser] = await Promise.all([
        getEntity({
          entityType: input.entityType,
          entityId: input.entityId,
          organizationId: ctx.organizationId,
        }),
        getMemberUser({
          organizationId: ctx.organizationId,
          userId: input.mentionedUserId,
        }),
      ])

      if (!entity) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entity not found" })
      }

      if (!mentionedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace member not found",
        })
      }

      const relatedMentionedUserIds = await getRelatedMentionedUserIds({
        entityType: input.entityType,
        entityId: input.entityId,
        organizationId: ctx.organizationId,
      })

      if (relatedMentionedUserIds.has(input.mentionedUserId)) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "This teammate was already mentioned on a related signal or alert",
        })
      }

      const cleanMessage = input.message?.trim() || null

      const [existingUnread] = await db
        .select()
        .from(mention)
        .where(
          and(
            eq(mention.organizationId, ctx.organizationId),
            eq(mention.entityType, input.entityType),
            eq(mention.entityId, input.entityId),
            eq(mention.mentionedUserId, input.mentionedUserId),
            isNull(mention.readAt)
          )
        )
        .limit(1)

      if (existingUnread) {
        const [updated] = await db
          .update(mention)
          .set({
            mentionedByUserId: ctx.session.user.id,
            message: cleanMessage,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(mention.id, existingUnread.id),
              eq(mention.organizationId, ctx.organizationId)
            )
          )
          .returning()

        const result = updated ?? existingUnread
        emitMentionEvent("mention:updated", {
          organizationId: ctx.organizationId,
          mentionId: result.id,
          entityType: result.entityType,
          entityId: result.entityId,
          mentionedUserId: result.mentionedUserId,
        })

        return { success: true, mentionId: result.id, updated: true }
      }

      const [created] = await db
        .insert(mention)
        .values({
          id: crypto.randomUUID(),
          organizationId: ctx.organizationId,
          entityType: input.entityType,
          entityId: input.entityId,
          mentionedUserId: input.mentionedUserId,
          mentionedByUserId: ctx.session.user.id,
          message: cleanMessage,
        })
        .returning()

      if (!created) {
        throw new Error("Failed to create mention")
      }

      emitMentionEvent("mention:created", {
        organizationId: ctx.organizationId,
        mentionId: created.id,
        entityType: created.entityType,
        entityId: created.entityId,
        mentionedUserId: created.mentionedUserId,
      })

      return { success: true, mentionId: created.id, updated: false }
    }),

  getBlockedUserIds: orgProcedure
    .input(
      z.object({
        entityType: entityTypeSchema,
        entityId: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const relatedMentionedUserIds = await getRelatedMentionedUserIds({
        entityType: input.entityType,
        entityId: input.entityId,
        organizationId: ctx.organizationId,
      })

      return { userIds: Array.from(relatedMentionedUserIds) }
    }),

  listForEntity: orgProcedure
    .input(
      z.object({
        entityType: entityTypeSchema,
        entityId: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const records = await db
        .select()
        .from(mention)
        .where(
          and(
            eq(mention.organizationId, ctx.organizationId),
            eq(mention.entityType, input.entityType),
            eq(mention.entityId, input.entityId)
          )
        )
        .orderBy(desc(mention.createdAt))

      return hydrateMentions(records)
    }),

  listForMe: orgProcedure
    .input(
      z.object({ limit: z.number().min(1).max(50).default(20) }).optional()
    )
    .query(async ({ ctx, input }) => {
      const records = await db
        .select()
        .from(mention)
        .where(
          and(
            eq(mention.organizationId, ctx.organizationId),
            eq(mention.mentionedUserId, ctx.session.user.id)
          )
        )
        .orderBy(desc(mention.createdAt))
        .limit(input?.limit ?? 20)

      return hydrateMentions(records)
    }),

  getUnreadCount: orgProcedure.query(async ({ ctx }) => {
    const [result] = await db
      .select({ count: count() })
      .from(mention)
      .where(
        and(
          eq(mention.organizationId, ctx.organizationId),
          eq(mention.mentionedUserId, ctx.session.user.id),
          isNull(mention.readAt)
        )
      )

    return { count: result?.count ?? 0 }
  }),

  markRead: orgProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(mention)
        .set({ readAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(mention.id, input.id),
            eq(mention.organizationId, ctx.organizationId),
            eq(mention.mentionedUserId, ctx.session.user.id)
          )
        )
        .returning()

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mention not found" })
      }

      emitMentionEvent("mention:updated", {
        organizationId: ctx.organizationId,
        mentionId: updated.id,
        entityType: updated.entityType,
        entityId: updated.entityId,
        mentionedUserId: updated.mentionedUserId,
      })

      return { success: true }
    }),
})
