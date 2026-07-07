import { jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { organization } from "./auth"
import { organizationIsolationPolicy } from "./rls"

export const activityTypeEnum = pgEnum("activity_type", [
  "signal_received",
  "signal_queued",
  "signal_processing_started",
  "signal_classified",
  "signal_processing_completed",
  "signal_processing_failed",
  "signal_skipped",
  "pattern_detected",
  "customer_created",
  "customer_updated",
  "agent_run_started",
  "agent_run_completed",
  "agent_run_failed",
  "alert_created",
  "alert_deduped",
  "alert_skipped",
  "risk_flagged",
  "action_started",
  "action_proposed",
  "action_executed",
  "action_failed",
  "action_undone",
  "autonomy_changed",
  "workspace_invitation_canceled",
])

export const activityLog = pgTable(
  "activity_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    activityType: activityTypeEnum("activity_type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (_table) => [organizationIsolationPolicy()]
).enableRLS()
