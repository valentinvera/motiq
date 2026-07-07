import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { organization, user } from "./auth"
import { organizationIsolationPolicy } from "./rls"

export const mentionEntityTypeEnum = pgEnum("mention_entity_type", [
  "signal",
  "alert",
])

export const mention = pgTable(
  "mention",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    entityType: mentionEntityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    mentionedUserId: text("mentioned_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mentionedByUserId: text("mentioned_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    message: text("message"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("mention_org_entity_idx").on(
      table.organizationId,
      table.entityType,
      table.entityId
    ),
    index("mention_user_unread_idx").on(
      table.organizationId,
      table.mentionedUserId,
      table.readAt
    ),
    organizationIsolationPolicy(),
  ]
).enableRLS()
