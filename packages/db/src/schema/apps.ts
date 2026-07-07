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

export const appTypeEnum = pgEnum("app_type", [
  "slack",
  "zendesk",
  "freshdesk",
  "typeform",
  "google_forms",
  "gong",
  "email",
  "discord",
  "telegram",
  "gmail",
  "notion",
  "linear",
  "jira",
  "polar",
])

export const appStatusEnum = pgEnum("app_status", ["active", "paused", "error"])

export const app = pgTable(
  "app",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    type: appTypeEnum("type").notNull(),
    status: appStatusEnum("status").notNull().default("active"),
    credentials: jsonb("credentials").$type<Record<string, unknown>>(),
    config: jsonb("config").$type<Record<string, unknown>>(),
    lastSyncAt: timestamp("last_sync_at"),
    retroactiveSyncDays: integer("retroactive_sync_days").default(90),
    retroactiveSyncStatus: text("retroactive_sync_status"),
    retroactiveSyncStartedAt: timestamp("retroactive_sync_started_at"),
    retroactiveSyncCompletedAt: timestamp("retroactive_sync_completed_at"),
    historicalSignalCount: integer("historical_signal_count").default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (_table) => [organizationIsolationPolicy()]
).enableRLS()
