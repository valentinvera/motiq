import { db } from "@motiq/db"
import { activityLog } from "@motiq/db/schema/activity-log"
import { eventBus } from "./event-bus"

type ActivityInsert = typeof activityLog.$inferInsert

export async function logAgentActivity(
  input: Omit<ActivityInsert, "id" | "createdAt"> & {
    id?: string
    createdAt?: Date
  }
) {
  const id = input.id ?? crypto.randomUUID()
  const createdAt = input.createdAt ?? new Date()

  await db.insert(activityLog).values({
    ...input,
    id,
    createdAt,
  })

  eventBus.emit("activity:created", {
    id,
    organizationId: input.organizationId,
    activityType: input.activityType,
    title: input.title,
    description: input.description ?? null,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    createdAt: createdAt.toISOString(),
  })

  return id
}
