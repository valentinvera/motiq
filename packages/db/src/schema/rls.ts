import { sql } from "drizzle-orm"
import { pgPolicy } from "drizzle-orm/pg-core"

const tenantIsolationExpression = sql`organization_id = current_setting('app.current_tenant', true)`

export function organizationIsolationPolicy() {
  return pgPolicy("organization_isolation", {
    as: "permissive",
    for: "all",
    to: "public",
    using: tenantIsolationExpression,
    withCheck: tenantIsolationExpression,
  })
}
