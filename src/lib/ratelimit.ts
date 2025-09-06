import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "./redis"

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  timeout: 1000,
  analytics: true,
})

export interface RateLimitConfig {
  identifier: string
  limit: number
  window: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

export const checkRateLimit = async ({
  identifier,
  limit,
  window,
}: RateLimitConfig): Promise<RateLimitResult> => {
  const key = `rate_limit:${identifier}`
  const now = Date.now()

  try {
    const current = await redis.get(key)
    const windowStart = Math.floor(now / (window * 1000)) * (window * 1000)

    if (!current) {
      await redis.setex(key, window, JSON.stringify({ count: 1, windowStart }))
      return {
        success: true,
        remaining: limit - 1,
        reset: windowStart + window * 1000,
      }
    }

    const data = JSON.parse(current as string)

    if (data.windowStart < windowStart) {
      await redis.setex(key, window, JSON.stringify({ count: 1, windowStart }))
      return {
        success: true,
        remaining: limit - 1,
        reset: windowStart + window * 1000,
      }
    }

    if (data.count >= limit) {
      return {
        success: false,
        remaining: 0,
        reset: data.windowStart + window * 1000,
      }
    }

    const newCount = data.count + 1
    await redis.setex(
      key,
      window,
      JSON.stringify({ count: newCount, windowStart: data.windowStart }),
    )

    return {
      success: true,
      remaining: limit - newCount,
      reset: data.windowStart + window * 1000,
    }
  } catch (error) {
    console.error("Rate limit error:", error)
    return {
      success: true,
      remaining: limit - 1,
      reset: now + window * 1000,
    }
  }
}
