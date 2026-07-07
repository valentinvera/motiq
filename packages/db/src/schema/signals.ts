import { jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { app } from "./apps"
import { organization } from "./auth"
import { customer } from "./customers"
import { organizationIsolationPolicy } from "./rls"

export const signalSourceEnum = pgEnum("signal_source", [
  "zendesk",
  "intercom",
  "freshdesk",
  "typeform",
  "google_forms",
  "gong",
  "chorus",
  "product_analytics",
  "social",
  "email",
  "slack",
  "discord",
  "telegram",
  "gmail",
  "notion",
  "linear",
  "jira",
  "polar",
])

export const signalTypeEnum = pgEnum("signal_type", [
  "bug",
  "feature_request",
  "complaint",
  "question",
  "praise",
  "churn_risk",
  "other",
])

export const signalPriorityEnum = pgEnum("signal_priority", [
  "critical",
  "high",
  "medium",
  "low",
])

export const signalStatusEnum = pgEnum("signal_status", [
  "new",
  "triaged",
  "processed",
  "ignored",
])

export const signal = pgTable(
  "signal",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    appId: text("app_id").references(() => app.id, {
      onDelete: "set null",
    }),
    customerId: text("customer_id").references(() => customer.id, {
      onDelete: "set null",
    }),
    externalId: text("external_id"),
    source: signalSourceEnum("source").notNull(),
    type: signalTypeEnum("type"),
    priority: signalPriorityEnum("priority"),
    status: signalStatusEnum("status").notNull().default("new"),
    title: text("title").notNull(),
    content: text("content").notNull(),
    customerEmail: text("customer_email"),
    customerName: text("customer_name"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    detectedAt: timestamp("detected_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (_table) => [organizationIsolationPolicy()]
).enableRLS()
