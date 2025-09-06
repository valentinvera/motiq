import { Redis } from "@upstash/redis"
import { env } from "@/env/server"

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data as T
    } catch (error) {
      console.error("Cache get error:", error)
      return null
    }
  },

  async set(key: string, value: string, ttl = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error("Cache set error:", error)
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error("Cache delete error:", error)
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error("Cache delete pattern error:", error)
    }
  },
}
