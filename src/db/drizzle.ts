import { upstashCache } from "drizzle-orm/cache/upstash"
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { serverOnly } from "@tanstack/react-start"
import * as schema from "./schema"
import { env } from "@/env/server"

const sql = neon(env.DATABASE_URL)

const getDb = serverOnly(() =>
  drizzle({
    client: sql,
    casing: "snake_case",
    schema,
    cache: upstashCache({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
      global: true,
    }),
  }),
)

export const db = getDb()
