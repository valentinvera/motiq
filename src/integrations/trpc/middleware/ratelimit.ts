import { TRPCError } from "@trpc/server"
import { t } from "../init"
import type { RateLimitConfig } from "@/lib/ratelimit"
import { checkRateLimit } from "@/lib/ratelimit"

export const rateLimitMiddleware = (config: Omit<RateLimitConfig, "identifier">) =>
  t.middleware(async ({ ctx, next }) => {
    const identifier = ctx.user?.id || ctx.ip || "anonymous"

    const { success, reset } = await checkRateLimit({
      identifier,
      ...config,
    })

    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
      })
    }

    return next()
  })
