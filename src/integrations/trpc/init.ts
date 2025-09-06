import { TRPCError, initTRPC } from "@trpc/server"
import superjson from "superjson"
import { cache } from "react"
import { getWebRequest } from "@tanstack/react-start/server"
import { api } from "@/lib/auth"

interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  emailVerified?: boolean | null
  image?: string | null
  createdAt?: Date | null
  updatedAt?: Date | null
}

interface TRPCContext {
  user: SessionUser | null
  ip?: string
}

export const createTRPCContext = cache(async (): Promise<TRPCContext> => {
  const session = await api.getSession({ headers: getWebRequest().headers })

  return {
    user: session?.user || null,
    ip: getWebRequest().headers.get("x-forwarded-for") || "unknown",
  }
})

export const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
})

const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  return next({ ctx })
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(authMiddleware)
