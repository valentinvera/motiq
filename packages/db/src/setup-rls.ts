import { fileURLToPath } from "node:url"
import { neon, neonConfig } from "@neondatabase/serverless"
import { config } from "dotenv"
import ws from "ws"

config({
  path: fileURLToPath(new URL("../../../apps/api/.env", import.meta.url)),
})

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

neonConfig.webSocketConstructor = ws
const sql = neon(process.env.DATABASE_URL)

const TENANT_ROLE = "motiq_authenticated"
const POLICY_NAME = "organization_isolation"

const AUTH_MANAGED_TENANT_TABLES = new Set(["invitation", "member"])

interface TableRow {
  table_name: string
}

interface RlsTableRow extends TableRow {
  rls_enabled: boolean
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
}

async function getTenantScopedTables() {
  const rows = (await sql`
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'organization_id'
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name
  `) as TableRow[]

  return rows
    .map((row) => row.table_name)
    .filter((table) => !AUTH_MANAGED_TENANT_TABLES.has(table))
}

async function assertTenantTablesHaveRls(tenantTables: string[]) {
  const rows = (await sql`
    SELECT
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname
  `) as RlsTableRow[]

  const tenantTableSet = new Set(tenantTables)
  const missingTables = rows
    .filter((row) => tenantTableSet.has(row.table_name) && !row.rls_enabled)
    .map((row) => row.table_name)

  if (missingTables.length > 0) {
    throw new Error(`RLS is still disabled on: ${missingTables.join(", ")}`)
  }
}

async function setupRls() {
  const tenantTables = await getTenantScopedTables()

  if (tenantTables.length === 0) {
    throw new Error("No tenant-scoped tables with organization_id were found")
  }

  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'motiq_authenticated') THEN
        CREATE ROLE motiq_authenticated NOLOGIN;
      END IF;
    END $$;
  `
  console.log(`  role ${TENANT_ROLE} created (or already exists)`)

  await sql.query(`GRANT ${quoteIdentifier(TENANT_ROLE)} TO CURRENT_USER`)
  console.log(`  granted ${TENANT_ROLE} to current user`)

  await sql.query(
    `GRANT USAGE ON SCHEMA public TO ${quoteIdentifier(TENANT_ROLE)}`
  )
  await sql.query(
    `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ${quoteIdentifier(
      TENANT_ROLE
    )}`
  )
  console.log(`  reset table privileges for ${TENANT_ROLE}`)

  for (const table of tenantTables) {
    const tableName = quoteIdentifier(table)

    await sql.query(`REVOKE ALL PRIVILEGES ON TABLE ${tableName} FROM PUBLIC`)
    await sql.query(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`)
    await sql.query(`DROP POLICY IF EXISTS "${POLICY_NAME}" ON ${tableName}`)
    await sql.query(
      `CREATE POLICY "${POLICY_NAME}" ON ${tableName}
       AS PERMISSIVE
       FOR ALL
       TO ${quoteIdentifier(TENANT_ROLE)}
       USING (organization_id = current_setting('app.current_tenant', true))
       WITH CHECK (organization_id = current_setting('app.current_tenant', true))`
    )
    await sql.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ${tableName} TO ${quoteIdentifier(
        TENANT_ROLE
      )}`
    )
  }
  console.log(
    `  enabled RLS and recreated policies on ${tenantTables.length} tables`
  )

  const enums = (await sql`
    SELECT typname
    FROM pg_type
    WHERE typtype = 'e'
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ORDER BY typname
  `) as Array<{ typname: string }>

  for (const row of enums) {
    await sql.query(
      `GRANT USAGE ON TYPE ${quoteIdentifier(row.typname)} TO ${quoteIdentifier(
        TENANT_ROLE
      )}`
    )
  }
  console.log(`  granted usage on ${enums.length} enum types`)

  await sql.query(
    `GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO ${quoteIdentifier(
      TENANT_ROLE
    )}`
  )
  console.log("  granted usage on sequences")

  await assertTenantTablesHaveRls(tenantTables)
  console.log("  verified RLS is enabled on all tenant-scoped tables")

  console.log("\nRLS setup complete")
  console.log(`Protected tables: ${tenantTables.join(", ")}`)
  console.log(
    `Excluded auth-managed tables: ${[...AUTH_MANAGED_TENANT_TABLES].join(", ")}`
  )
}

setupRls()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("RLS setup failed:", error)
    process.exit(1)
  })
