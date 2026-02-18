import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  server: {
    PORT: z.string().min(1),
    CORS_ORIGIN: z.string(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_PRODUCT_ID: z.string().min(1),
    POLAR_SUCCESS_URL: z.url(),
    UPSTASH_REDIS_REST_URL: z.url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
