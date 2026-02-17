import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  company: text("company"),
  role: text("role"),
  source: text("source"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  contacted: integer("contacted").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
