import { env } from "@motiq/env/api"
import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

export const get = async <T>(key: string): Promise<T | null> => {
  return await redis.get<T>(key)
}

export const set = async <T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> => {
  if (ttlSeconds !== undefined) {
    await redis.set(key, value, { ex: ttlSeconds })
  } else {
    await redis.set(key, value)
  }
}

export const del = async (...keys: string[]): Promise<number> => {
  return await redis.del(...keys)
}

export const delPattern = async (pattern: string): Promise<number> => {
  const keys = await redis.keys(pattern)
  if (keys.length === 0) {
    return 0
  }
  return await redis.del(...keys)
}

export const exists = async (...keys: string[]): Promise<number> => {
  return await redis.exists(...keys)
}

export const expire = async (
  key: string,
  ttlSeconds: number
): Promise<number> => {
  return await redis.expire(key, ttlSeconds)
}

export const ttl = async (key: string): Promise<number> => {
  return await redis.ttl(key)
}

export const incr = async (key: string, amount = 1): Promise<number> => {
  if (amount === 1) {
    return await redis.incr(key)
  }
  return await redis.incrby(key, amount)
}

export const getOrSet = async <T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds?: number
): Promise<T> => {
  const cached = await get<T>(key)
  if (cached !== null) {
    return cached
  }

  const value = await factory()
  await set(key, value, ttlSeconds)
  return value
}

// biome-ignore lint/performance/noBarrelFile: re-exporting Redis class for consumer convenience
export { Redis } from "@upstash/redis"
