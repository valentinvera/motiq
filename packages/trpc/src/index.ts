import { type Role, roles } from "@motiq/auth/permissions"
import { db } from "@motiq/db"
import { member as memberTable } from "@motiq/db/schema/auth"
import { initTRPC, TRPCError } from "@trpc/server"
import { and, eq } from "drizzle-orm"
import superjson from "superjson"
import type { Context } from "./context"

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router

export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})

export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const session = ctx.session.session as Record<string, unknown>
  const organizationId = (session.activeOrganizationId as string) ?? null
  if (!organizationId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No active organization",
      cause: "No activeOrganizationId in session",
    })
  }
  const userId = ctx.session.user.id
  const [m] = await db
    .select({ role: memberTable.role })
    .from(memberTable)
    .where(
      and(
        eq(memberTable.organizationId, organizationId),
        eq(memberTable.userId, userId)
      )
    )
    .limit(1)
  if (!m) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization",
    })
  }
  return next({
    ctx: {
      ...ctx,
      organizationId,
      memberRole: m.role as Role,
    },
  })
})

type Statement = keyof typeof import("@motiq/auth/permissions").statement

export function requirePermission<R extends Statement>(
  resource: R,
  action: string
) {
  return orgProcedure.use(({ ctx, next }) => {
    const role = roles[ctx.memberRole] as (typeof roles)["owner"] | undefined
    if (!role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Unknown role: ${ctx.memberRole}`,
      })
    }
    const result = role.authorize({ [resource]: [action] } as never)
    if (!result.success) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You don't have permission to ${action} ${resource}`,
      })
    }
    return next({ ctx })
  })
}
