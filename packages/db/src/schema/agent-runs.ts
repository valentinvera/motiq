import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { organization } from "./auth"
import { pipelineRun } from "./pipeline-runs"
import { organizationIsolationPolicy } from "./rls"
import { signal } from "./signals"

export const agentTypeEnum = pgEnum("agent_type", [
  "triage",
  "pattern",
  "risk",
  "intelligence",
])

export const agentRunStatusEnum = pgEnum("agent_run_status", [
  "pending",
  "running",
  "completed",
  "failed",
])

export const agentRun = pgTable(
  "agent_run",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    pipelineRunId: text("pipeline_run_id").references(() => pipelineRun.id, {
      onDelete: "cascade",
    }),
    pipelineStep: integer("pipeline_step"),
    signalId: text("signal_id").references(() => signal.id, {
      onDelete: "set null",
    }),
    agentType: agentTypeEnum("agent_type").notNull(),
    status: agentRunStatusEnum("status").notNull().default("pending"),
    input: jsonb("input").$type<Record<string, unknown>>(),
    output: jsonb("output").$type<Record<string, unknown>>(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    error: text("error"),
  },
  (_table) => [organizationIsolationPolicy()]
).enableRLS()
