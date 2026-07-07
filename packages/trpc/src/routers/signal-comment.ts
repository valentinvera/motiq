import { db } from "@motiq/db"
import { user } from "@motiq/db/schema/auth"
import { signalComment } from "@motiq/db/schema/signal-comments"
import { signal } from "@motiq/db/schema/signals"
import { TRPCError } from "@trpc/server"
import { and, asc, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { orgProcedure, router } from "../index"

type SignalCommentRecord = typeof signalComment.$inferSelect

function emitSignalCommentCreated(payload: {
  organizationId: string
  signalId: string
  commentId: string
}) {
  const eventBus = (
    globalThis as typeof globalThis & {
      __motiqEventBus?: {
        emit: (eventName: string, payload: unknown) => boolean
      }
    }
  ).__motiqEventBus

  eventBus?.emit("signal-comment:created", payload)
}

async function assertSignalInOrganization(params: {
  signalId: string
  organizationId: string
}) {
  const [result] = await db
    .select({ id: signal.id })
    .from(signal)
    .where(
      and(
        eq(signal.id, params.signalId),
        eq(signal.organizationId, params.organizationId)
      )
    )
    .limit(1)

  if (!result) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Signal not found" })
  }
}

async function hydrateComments(records: SignalCommentRecord[]) {
  if (records.length === 0) {
    return []
  }

  const authorIds = Array.from(
    new Set(records.map((record) => record.authorUserId))
  )
  const authors = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(user)
    .where(inArray(user.id, authorIds))
  const authorById = new Map(authors.map((author) => [author.id, author]))

  return records.map((record) => ({
    ...record,
    author: authorById.get(record.authorUserId) ?? null,
  }))
}

export const signalCommentRouter = router({
  list: orgProcedure
    .input(z.object({ signalId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await assertSignalInOrganization({
        signalId: input.signalId,
        organizationId: ctx.organizationId,
      })

      const records = await db
        .select()
        .from(signalComment)
        .where(
          and(
            eq(signalComment.organizationId, ctx.organizationId),
            eq(signalComment.signalId, input.signalId)
          )
        )
        .orderBy(asc(signalComment.createdAt))

      return hydrateComments(records)
    }),

  create: orgProcedure
    .input(
      z.object({
        signalId: z.string().min(1),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertSignalInOrganization({
        signalId: input.signalId,
        organizationId: ctx.organizationId,
      })

      const [created] = await db
        .insert(signalComment)
        .values({
          id: crypto.randomUUID(),
          organizationId: ctx.organizationId,
          signalId: input.signalId,
          authorUserId: ctx.session.user.id,
          content: input.content,
        })
        .returning()

      if (!created) {
        throw new Error("Failed to create signal comment")
      }

      emitSignalCommentCreated({
        organizationId: ctx.organizationId,
        signalId: input.signalId,
        commentId: created.id,
      })

      return { success: true, commentId: created.id }
    }),
})
