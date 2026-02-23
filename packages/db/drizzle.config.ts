import { config } from "dotenv"
import type { Config } from "drizzle-kit"
import { defineConfig } from "drizzle-kit"

config({ path: "../../apps/api/.env" })

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config)
