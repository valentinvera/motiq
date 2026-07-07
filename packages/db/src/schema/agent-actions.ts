import { jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { organization, user } from "./auth"
import { actionTypeEnum } from "./autonomy-rules"
import { pipelineRun } from "./pipeline-runs"
import { organizationIsolationPolicy } from "./rls"

export const actionStatusEnum = pgEnum("action_status", [
  "proposed",
  "approved",
  "executed",
  "rejected",
  "undone",
])

export const agentAction = pgTable(
  "agent_action",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    pipelineRunId: text("pipeline_run_id").references(() => pipelineRun.id, {
      onDelete: "set null",
    }),
    actionType: actionTypeEnum("action_type").notNull(),
    status: actionStatusEnum("status").notNull().default("proposed"),
    title: text("title").notNull(),
    description: text("description"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    undoPayload: jsonb("undo_payload").$type<Record<string, unknown>>(),
    approvedBy: text("approved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    executedAt: timestamp("executed_at"),
    undoneAt: timestamp("undone_at"),
    undoneBy: text("undone_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (_table) => [organizationIsolationPolicy()]
).enableRLS()
