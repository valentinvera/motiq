import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { organization, user } from "./auth"
import { organizationIsolationPolicy } from "./rls"

export const chat = pgTable(
  "chat",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    messages: jsonb("messages")
      .$type<Record<string, unknown>[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (_table) => [organizationIsolationPolicy()]
).enableRLS()
