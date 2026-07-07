import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { organization } from "./auth"
import { organizationIsolationPolicy } from "./rls"
import { signal } from "./signals"

export const pipelineStatusEnum = pgEnum("pipeline_status", [
  "pending",
  "running",
  "completed",
  "failed",
])

export const pipelineTriggerEnum = pgEnum("pipeline_trigger", [
  "new_signal",
  "scheduled",
  "manual",
  "retroactive",
])

export const pipelineRun = pgTable(
  "pipeline_run",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    triggeredBy: pipelineTriggerEnum("triggered_by").notNull(),
    triggerSignalId: text("trigger_signal_id").references(() => signal.id, {
      onDelete: "set null",
    }),
    status: pipelineStatusEnum("status").notNull().default("pending"),
    stepsCompleted: integer("steps_completed").notNull().default(0),
    totalSteps: integer("total_steps").notNull().default(4),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    error: text("error"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (_table) => [organizationIsolationPolicy()]
).enableRLS()
