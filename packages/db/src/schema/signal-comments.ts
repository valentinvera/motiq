import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { organization, user } from "./auth"
import { organizationIsolationPolicy } from "./rls"
import { signal } from "./signals"

export const signalComment = pgTable(
  "signal_comment",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    signalId: text("signal_id")
      .notNull()
      .references(() => signal.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("signal_comment_signal_idx").on(
      table.organizationId,
      table.signalId,
      table.createdAt
    ),
    organizationIsolationPolicy(),
  ]
).enableRLS()
