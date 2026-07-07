import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { agentRun } from "./agent-runs"
import { organization, user } from "./auth"
import { organizationIsolationPolicy } from "./rls"
import { signal } from "./signals"

export const alertTypeEnum = pgEnum("alert_type", [
  "spike",
  "churn_risk",
  "escalation",
  "pattern",
])

export const alertSeverityEnum = pgEnum("alert_severity", [
  "critical",
  "high",
  "medium",
  "low",
])

export const alert = pgTable(
  "alert",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    signalId: text("signal_id").references(() => signal.id, {
      onDelete: "set null",
    }),
    agentRunId: text("agent_run_id").references(() => agentRun.id, {
      onDelete: "set null",
    }),
    type: alertTypeEnum("type").notNull(),
    severity: alertSeverityEnum("severity").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    acknowledged: boolean("acknowledged").notNull().default(false),
    acknowledgedBy: text("acknowledged_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (_table) => [organizationIsolationPolicy()]
).enableRLS()
