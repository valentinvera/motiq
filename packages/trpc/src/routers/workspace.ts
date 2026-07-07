import { db } from "@motiq/db"
import {
  invitation,
  member,
  organization,
  session,
  user,
} from "@motiq/db/schema/auth"
import { TRPCError } from "@trpc/server"
import { and, desc, eq, gt, ne, sql } from "drizzle-orm"
import { z } from "zod"
import {
  orgProcedure,
  protectedProcedure,
  publicProcedure,
  requirePermission,
  router,
} from "../index"
import { logActivity } from "../lib/activity-log"

function emitWorkspaceMembersUpdated(payload: {
  organizationId: string
  userId?: string
  action:
    | "left"
    | "removed"
    | "role_updated"
    | "ownership_transferred"
    | "invitation_canceled"
}) {
  const eventBus = (
    globalThis as typeof globalThis & {
      __motiqEventBus?: {
        emit: (eventName: string, payload: unknown) => boolean
      }
    }
  ).__motiqEventBus

  eventBus?.emit("workspace:members_updated", payload)
}

function emitWorkspaceDeleted(payload: {
  organizationId: string
  deletedByUserId: string
}) {
  const eventBus = (
    globalThis as typeof globalThis & {
      __motiqEventBus?: {
        emit: (eventName: string, payload: unknown) => boolean
      }
    }
  ).__motiqEventBus

  eventBus?.emit("workspace:deleted", payload)
}

function isOwnerRole(role: string) {
  return role
    .split(",")
    .map((value) => value.trim())
    .includes("owner")
}

export const workspaceRouter = router({
  getInvitation: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [inv] = await db
        .select({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          organizationId: invitation.organizationId,
          organizationName: organization.name,
          organizationSlug: organization.slug,
          inviterName: user.name,
          inviterEmail: user.email,
        })
        .from(invitation)
        .innerJoin(organization, eq(invitation.organizationId, organization.id))
        .innerJoin(user, eq(invitation.inviterId, user.id))
        .where(eq(invitation.id, input.id))
        .limit(1)
      return inv ?? null
    }),

  getPendingInvitationForMe: protectedProcedure.query(async ({ ctx }) => {
    const email = ctx.session.user.email.trim().toLowerCase()
    const [inv] = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        organizationId: invitation.organizationId,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        inviterName: user.name,
        inviterEmail: user.email,
      })
      .from(invitation)
      .innerJoin(organization, eq(invitation.organizationId, organization.id))
      .innerJoin(user, eq(invitation.inviterId, user.id))
      .where(
        and(
          eq(invitation.status, "pending"),
          gt(invitation.expiresAt, new Date()),
          sql`lower(${invitation.email}) = ${email}`
        )
      )
      .orderBy(desc(invitation.createdAt))
      .limit(1)

    return inv ?? null
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const memberships = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        role: member.role,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, userId))
    return memberships
  }),

  getActive: protectedProcedure.query(async ({ ctx }) => {
    const sessionData = ctx.session.session as Record<string, unknown>
    const organizationId = (sessionData.activeOrganizationId as string) ?? null
    if (!organizationId) {
      return null
    }
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1)
    return org ?? null
  }),

  getCurrentRole: orgProcedure.query(({ ctx }) => {
    return { role: ctx.memberRole }
  }),

  getMembers: orgProcedure.query(async ({ ctx }) => {
    const members = await db
      .select({
        id: member.id,
        role: member.role,
        createdAt: member.createdAt,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, ctx.organizationId))
    return members
  }),

  getPendingInvitations: orgProcedure.query(async ({ ctx }) => {
    const invitations = await db
      .select()
      .from(invitation)
      .where(
        and(
          eq(invitation.organizationId, ctx.organizationId),
          eq(invitation.status, "pending")
        )
      )
    return invitations
  }),

  update: requirePermission("organization", "update")
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        slug: z.string().min(1).max(100).optional(),
        logo: z.string().url().optional().nullable(),
        metadata: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Partial<typeof organization.$inferInsert> = {}
      if (input.name !== undefined) {
        updates.name = input.name
      }
      if (input.slug !== undefined) {
        updates.slug = input.slug
      }
      if (input.logo !== undefined) {
        updates.logo = input.logo ?? null
      }
      if (input.metadata !== undefined) {
        updates.metadata = input.metadata
      }
      await db
        .update(organization)
        .set(updates)
        .where(eq(organization.id, ctx.organizationId))
      return { success: true }
    }),

  updateMemberRole: requirePermission("member", "update")
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["member", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [targetMember] = await db
        .select({ id: member.id, role: member.role })
        .from(member)
        .where(
          and(
            eq(member.id, input.memberId),
            eq(member.organizationId, ctx.organizationId)
          )
        )
        .limit(1)

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        })
      }

      if (targetMember.role === "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Owner role cannot be changed here",
        })
      }

      await db
        .update(member)
        .set({ role: input.role })
        .where(
          and(
            eq(member.id, input.memberId),
            eq(member.organizationId, ctx.organizationId)
          )
        )

      emitWorkspaceMembersUpdated({
        organizationId: ctx.organizationId,
        action: "role_updated",
      })

      return { success: true }
    }),

  transferOwnership: orgProcedure
    .input(z.object({ targetMemberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.memberRole !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can transfer ownership",
        })
      }

      const [currentOwner] = await db
        .select({ id: member.id, role: member.role })
        .from(member)
        .where(
          and(
            eq(member.organizationId, ctx.organizationId),
            eq(member.userId, ctx.session.user.id)
          )
        )
        .limit(1)

      if (!currentOwner || currentOwner.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can transfer ownership",
        })
      }

      const [targetMember] = await db
        .select({ id: member.id, role: member.role })
        .from(member)
        .where(
          and(
            eq(member.id, input.targetMemberId),
            eq(member.organizationId, ctx.organizationId)
          )
        )
        .limit(1)

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        })
      }

      if (targetMember.id === currentOwner.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose another member to transfer ownership",
        })
      }

      await db.transaction(async (tx) => {
        await tx
          .update(member)
          .set({ role: "owner" })
          .where(
            and(
              eq(member.id, targetMember.id),
              eq(member.organizationId, ctx.organizationId)
            )
          )

        await tx
          .update(member)
          .set({ role: "admin" })
          .where(
            and(
              eq(member.id, currentOwner.id),
              eq(member.organizationId, ctx.organizationId)
            )
          )
      })

      emitWorkspaceMembersUpdated({
        organizationId: ctx.organizationId,
        action: "ownership_transferred",
      })

      return { success: true }
    }),

  deleteActive: orgProcedure.mutation(async ({ ctx }) => {
    if (!isOwnerRole(ctx.memberRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the workspace owner can delete this workspace",
      })
    }

    const [nextWorkspace] = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        role: member.role,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(
        and(
          eq(member.userId, ctx.session.user.id),
          ne(member.organizationId, ctx.organizationId)
        )
      )
      .orderBy(desc(member.createdAt))
      .limit(1)

    await db.transaction(async (tx) => {
      await tx
        .update(session)
        .set({ activeOrganizationId: null })
        .where(eq(session.activeOrganizationId, ctx.organizationId))

      await tx
        .delete(organization)
        .where(eq(organization.id, ctx.organizationId))
    })

    emitWorkspaceDeleted({
      organizationId: ctx.organizationId,
      deletedByUserId: ctx.session.user.id,
    })

    return { success: true, nextWorkspace: nextWorkspace ?? null }
  }),

  leaveActive: orgProcedure.mutation(async ({ ctx }) => {
    if (isOwnerRole(ctx.memberRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Owners must transfer ownership or delete the workspace before leaving",
      })
    }

    await db
      .delete(member)
      .where(
        and(
          eq(member.organizationId, ctx.organizationId),
          eq(member.userId, ctx.session.user.id)
        )
      )

    emitWorkspaceMembersUpdated({
      organizationId: ctx.organizationId,
      userId: ctx.session.user.id,
      action: "left",
    })

    return { success: true }
  }),

  cancelPendingInvitation: requirePermission("invitation", "cancel")
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [targetInvitation] = await db
        .select({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
        })
        .from(invitation)
        .where(
          and(
            eq(invitation.id, input.invitationId),
            eq(invitation.organizationId, ctx.organizationId)
          )
        )
        .limit(1)

      if (!targetInvitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        })
      }

      if (targetInvitation.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending invitations can be canceled",
        })
      }

      await db
        .update(invitation)
        .set({ status: "canceled" })
        .where(
          and(
            eq(invitation.id, input.invitationId),
            eq(invitation.organizationId, ctx.organizationId),
            eq(invitation.status, "pending")
          )
        )

      const actorName = ctx.session.user.name?.trim() || ctx.session.user.email

      await logActivity({
        organizationId: ctx.organizationId,
        activityType: "workspace_invitation_canceled",
        title: "Invitation canceled",
        description: `${actorName} canceled the invitation to ${targetInvitation.email} as ${targetInvitation.role}.`,
        entityType: "invitation",
        entityId: targetInvitation.id,
        metadata: {
          actorUserId: ctx.session.user.id,
          actorName,
          invitationEmail: targetInvitation.email,
          invitationRole: targetInvitation.role,
        },
      })

      emitWorkspaceMembersUpdated({
        organizationId: ctx.organizationId,
        action: "invitation_canceled",
      })

      return { success: true }
    }),

  removeMember: requirePermission("member", "delete")
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [targetMember] = await db
        .select({ id: member.id, role: member.role })
        .from(member)
        .where(
          and(
            eq(member.id, input.memberId),
            eq(member.organizationId, ctx.organizationId)
          )
        )
        .limit(1)

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        })
      }

      if (targetMember.role === "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Owner cannot be removed from this endpoint",
        })
      }

      await db
        .delete(member)
        .where(
          and(
            eq(member.id, input.memberId),
            eq(member.organizationId, ctx.organizationId)
          )
        )

      emitWorkspaceMembersUpdated({
        organizationId: ctx.organizationId,
        action: "removed",
      })

      return { success: true }
    }),
})
