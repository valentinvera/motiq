import { env } from "@motiq/env/api"
import { neon, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import ws from "ws"
import { account, session, user, verification } from "./schema/auth"
import { waitlist } from "./schema/waitlist"

neonConfig.webSocketConstructor = ws

const sql = neon(env.DATABASE_URL)
export const db = drizzle(sql, {
  schema: { user, session, account, verification, waitlist },
})
