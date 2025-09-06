import { defineConfig } from "drizzle-kit"
import type { Config } from "drizzle-kit"
import { env } from "@/env/server"

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config)
