import { redis } from "@motiq/cache"
import type { Context, Next } from "hono"

interface RateLimitOptions {
  windowMs: number
  max: number
  keyPrefix?: string
}

export const rateLimit = (options: RateLimitOptions) => {
  const { windowMs, max, keyPrefix = "rl" } = options
  const windowSec = Math.ceil(windowMs / 1000)

  return async (c: Context, next: Next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown"

    const key = `${keyPrefix}:${ip}`

    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, windowSec)
    }

    c.header("X-RateLimit-Limit", String(max))
    c.header("X-RateLimit-Remaining", String(Math.max(0, max - current)))

    if (current > max) {
      return c.json({ error: "Too many requests" }, 429)
    }

    await next()
  }
}
