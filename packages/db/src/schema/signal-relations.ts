import {
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { organization } from "./auth"
import { organizationIsolationPolicy } from "./rls"
import { signal } from "./signals"

export const signalRelationTypeEnum = pgEnum("signal_relation_type", [
  "same_customer",
  "same_topic",
  "same_feature",
  "escalation",
  "follow_up",
])

export const signalRelation = pgTable(
  "signal_relation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    sourceSignalId: text("source_signal_id")
      .notNull()
      .references(() => signal.id, { onDelete: "cascade" }),
    targetSignalId: text("target_signal_id")
      .notNull()
      .references(() => signal.id, { onDelete: "cascade" }),
    relationType: signalRelationTypeEnum("relation_type").notNull(),
    strength: real("strength").notNull().default(0.5),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    detectedAt: timestamp("detected_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (_table) => [organizationIsolationPolicy()]
).enableRLS()
