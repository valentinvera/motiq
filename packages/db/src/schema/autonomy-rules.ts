import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { organization, user } from "./auth"
import { organizationIsolationPolicy } from "./rls"

export const autonomyLevelEnum = pgEnum("autonomy_level", [
  "observe",
  "suggest",
  "auto",
])

export const actionTypeEnum = pgEnum("action_type", [
  "route_ticket",
  "create_jira",
  "slack_escalation",
  "email_csm",
  "daily_digest",
])

export const autonomyRule = pgTable(
  "autonomy_rule",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    actionType: actionTypeEnum("action_type").notNull(),
    autonomyLevel: autonomyLevelEnum("autonomy_level")
      .notNull()
      .default("observe"),
    autoApproveThreshold: integer("auto_approve_threshold")
      .notNull()
      .default(10),
    manualApprovalCount: integer("manual_approval_count").notNull().default(0),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (_table) => [organizationIsolationPolicy()]
).enableRLS()
