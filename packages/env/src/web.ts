import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_PORT: z.string().min(1),
    VITE_API_URL: z.url(),
    VITE_PROXY_SECURE: z.boolean().default(false),
    VITE_PROXY_COOKIE_DOMAIN_REWRITE: z.string().min(1).optional(),
  },
  runtimeEnv: (
    import.meta as unknown as { env: Record<string, string | undefined> }
  ).env,
  emptyStringAsUndefined: true,
})
