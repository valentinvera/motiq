import { env } from "@motiq/env/api"
import { neon, neonConfig, Pool } from "@neondatabase/serverless"
import { sql } from "drizzle-orm"
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http"
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless"
import ws from "ws"
import { activityLog } from "./schema/activity-log"
import { agentAction } from "./schema/agent-actions"
import { agentRun } from "./schema/agent-runs"
import { alert } from "./schema/alerts"
import { app } from "./schema/apps"
import {
  account,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from "./schema/auth"
import { autonomyRule } from "./schema/autonomy-rules"
import { chat } from "./schema/chats"
import { customer } from "./schema/customers"
import { mention } from "./schema/mentions"
import { pipelineRun } from "./schema/pipeline-runs"
import { signalComment } from "./schema/signal-comments"
import { signalRelation } from "./schema/signal-relations"
import { signal } from "./schema/signals"
import { waitlist } from "./schema/waitlist"

neonConfig.webSocketConstructor = ws

const schema = {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
  waitlist,
  app,
  signal,
  signalComment,
  signalRelation,
  customer,
  agentRun,
  pipelineRun,
  alert,
  autonomyRule,
  chat,
  agentAction,
  activityLog,
  mention,
}

// HTTP driver — fast, stateless (auth, waitlist, admin operations)
const neonSql = neon(env.DATABASE_URL)
export const db = drizzleHttp(neonSql, { schema })

// WebSocket pool — lazy init, stateful connections for tenant-scoped transactions
let _pool: Pool | null = null
let _tenantDb: ReturnType<typeof drizzleWs<typeof schema>> | null = null

function getTenantDb() {
  if (!_tenantDb) {
    _pool = new Pool({ connectionString: env.DATABASE_URL })
    _tenantDb = drizzleWs(_pool, { schema })
  }
  return _tenantDb
}

// Transaction type for consumers
type TenantDbInstance = ReturnType<typeof getTenantDb>
type TransactionFn = Parameters<TenantDbInstance["transaction"]>[0]
export type TenantTx = Parameters<TransactionFn>[0]

/**
 * Execute queries within a tenant-scoped transaction.
 * Drops privileges to `motiq_authenticated` role and sets `app.current_tenant`
 * so PostgreSQL RLS policies enforce organization isolation.
 *
 * Requires one-time setup: `bun run db:setup-rls`
 */
export async function withTenant<T>(
  organizationId: string,
  callback: (tx: TenantTx) => Promise<T>
): Promise<T> {
  const tenantDb = getTenantDb()
  return await tenantDb.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL ROLE motiq_authenticated`)
    await tx.execute(
      sql`SELECT set_config('app.current_tenant', ${organizationId}, true)`
    )
    return callback(tx)
  })
}

/** Close the WebSocket pool (for graceful shutdown / tests). */
export async function closeTenantPool() {
  if (_pool) {
    await _pool.end()
    _pool = null
    _tenantDb = null
  }
}
