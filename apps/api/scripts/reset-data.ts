import { serve, spawn } from "bun"

interface TableRow {
  table_schema: string
  table_name: string
}

const REQUIRED_CONFIRMATION_FLAG = "--yes"
const COOKIE_CLEAR_TIMEOUT_MS = 15_000
const LOCAL_COOKIE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"])
const AUTH_COOKIE_NAMES = [
  "better-auth.session_token",
  "better-auth.session_data",
  "better-auth.account_data",
  "better-auth.dont_remember",
  "__Secure-better-auth.session_token",
  "__Secure-better-auth.session_data",
  "__Secure-better-auth.account_data",
  "__Secure-better-auth.dont_remember",
]

const args = new Set(process.argv.slice(2))

if (args.has("--help") || args.has("-h")) {
  console.log(`
Usage:
  bun run reset:data -- --yes

This deletes application data without dropping tables:
  - Truncates all base tables in the public Postgres schema
  - Flushes all keys in the configured Upstash Redis database
  - Deletes all customers from the configured Polar sandbox account
  - Clears local Better Auth browser cookies when BETTER_AUTH_URL is localhost

Required env file:
  apps/api/.env
`)
  process.exit(0)
}

if (!args.has(REQUIRED_CONFIRMATION_FLAG)) {
  console.error(
    `Refusing to delete data without ${REQUIRED_CONFIRMATION_FLAG}. Run: bun run reset:data -- ${REQUIRED_CONFIRMATION_FLAG}`
  )
  process.exit(1)
}

function quoteIdent(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
}

function normalizeRows<T>(result: T[] | { rows: T[] }) {
  return Array.isArray(result) ? result : result.rows
}

async function truncateDatabaseData() {
  const [{ db }, { sql }] = await Promise.all([
    import("@motiq/db"),
    import("drizzle-orm"),
  ])

  const result = (await db.execute(sql`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name <> '__drizzle_migrations'
    ORDER BY table_schema, table_name
  `)) as unknown as TableRow[] | { rows: TableRow[] }

  const tables = normalizeRows(result)

  if (tables.length === 0) {
    console.log("Postgres: no public tables found")
    return 0
  }

  const qualifiedTableNames = tables
    .map((table) => {
      return `${quoteIdent(table.table_schema)}.${quoteIdent(table.table_name)}`
    })
    .join(", ")

  await db.execute(
    sql.raw(`TRUNCATE TABLE ${qualifiedTableNames} RESTART IDENTITY CASCADE`)
  )

  console.log(`Postgres: truncated ${tables.length} tables`)
  return tables.length
}

async function flushRedisData() {
  const { redis } = await import("@motiq/cache")
  const keyCount = await redis.dbsize()

  if (keyCount > 0) {
    await redis.flushdb()
  }

  console.log(`Upstash Redis: removed ${keyCount} keys`)
  return keyCount
}

async function deletePolarSandboxCustomers() {
  const { polarClient } = await import("@motiq/auth/payments")
  let deletedCount = 0

  while (true) {
    const page = await polarClient.customers.list({ limit: 100, page: 1 })
    const customers = page.result.items

    if (customers.length === 0) {
      break
    }

    for (const customer of customers) {
      await polarClient.customers.delete({ id: customer.id })
      deletedCount += 1
    }
  }

  console.log(`Polar sandbox: deleted ${deletedCount} customers`)
  return deletedCount
}

function getExpiredCookieHeaders() {
  return AUTH_COOKIE_NAMES.map((name) => {
    const secure = name.startsWith("__Secure-") ? "; Secure" : ""
    return `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax${secure}`
  })
}

async function openInDefaultBrowser(url: string) {
  let command = ["xdg-open", url]
  if (process.platform === "darwin") {
    command = ["open", url]
  } else if (process.platform === "win32") {
    command = ["cmd", "/c", "start", "", url]
  }

  try {
    const proc = spawn(command, {
      stderr: "ignore",
      stdout: "ignore",
    })
    return (await proc.exited) === 0
  } catch {
    return false
  }
}

async function clearLocalBrowserCookies() {
  const { env } = await import("@motiq/env/api")
  const authUrl = new URL(env.BETTER_AUTH_URL)

  if (!LOCAL_COOKIE_HOSTS.has(authUrl.hostname)) {
    console.log(
      `Browser cookies: skipped automatic clearing for ${authUrl.origin}; browser cookies can only be cleared locally by the browser for that domain`
    )
    return false
  }

  let markVisited: (visited: boolean) => void = () => undefined
  const visited = new Promise<boolean>((resolve) => {
    markVisited = resolve
  })

  const server = serve({
    fetch() {
      markVisited(true)

      const headers = new Headers({
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
      })

      for (const cookie of getExpiredCookieHeaders()) {
        headers.append("Set-Cookie", cookie)
      }

      return new Response(
        "<!doctype html><title>Motiq reset</title><body>Local Motiq auth cookies cleared. You can close this tab.</body>",
        { headers }
      )
    },
    hostname: "127.0.0.1",
    port: 0,
  })

  const clearUrl = `http://localhost:${server.port}/clear-motiq-cookies`
  const opened = await openInDefaultBrowser(clearUrl)
  if (!opened) {
    console.log(`Browser cookies: open ${clearUrl} to clear local auth cookies`)
  }

  const cleared = await Promise.race([
    visited,
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), COOKIE_CLEAR_TIMEOUT_MS)
    }),
  ])

  await server.stop(true)

  if (cleared) {
    console.log("Browser cookies: cleared local Better Auth cookies")
  } else {
    console.log(
      "Browser cookies: cleanup URL was not opened; cookies may remain"
    )
  }

  return cleared
}

async function main() {
  console.log("Resetting external and database data...")

  const polarCustomers = await deletePolarSandboxCustomers()
  const redisKeys = await flushRedisData()
  const dbTables = await truncateDatabaseData()
  await clearLocalBrowserCookies()

  console.log("Reset complete")
  console.log(
    `Summary: ${dbTables} DB tables truncated, ${redisKeys} Redis keys removed, ${polarCustomers} Polar customers deleted`
  )
}

main().catch((error: unknown) => {
  console.error("Reset failed")
  console.error(error)
  process.exit(1)
})
