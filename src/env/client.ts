import { createEnv } from "@t3-oss/env-core"
import * as z from "zod"

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_BASE_URL: z.url(),
    VITE_SENTRY_DSN: z.string(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
})
