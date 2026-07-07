import { db } from "@motiq/db"
import { activityLog } from "@motiq/db/schema/activity-log"

type ActivityInsert = typeof activityLog.$inferInsert

export async function logActivity(
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

  const eventBus = (
    globalThis as typeof globalThis & {
      __motiqEventBus?: {
        emit: (eventName: string, payload: unknown) => boolean
      }
    }
  ).__motiqEventBus

  eventBus?.emit("activity:created", {
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
