import { EventEmitter } from "node:events"
import { redis } from "@motiq/cache"

export interface EventMap {
  "signal:created": { organizationId: string; signalId: string }
  "signal:updated": { organizationId: string; signalId: string }
  "signal-comment:created": {
    organizationId: string
    signalId: string
    commentId: string
  }
  "alert:created": {
    organizationId: string
    alertId: string
    signalId?: string | null
  }
  "alert:updated": { organizationId: string; alertId: string }
  "activity:created": {
    id: string
    organizationId: string
    activityType: string
    title: string
    description: string | null
    entityType: string | null
    entityId: string | null
    createdAt: string
  }
  "pipeline:created": {
    organizationId: string
    pipelineRunId: string
    status: string
  }
  "pipeline:updated": {
    organizationId: string
    pipelineRunId: string
    status: string
  }
  "action:proposed": { organizationId: string; actionId: string }
  "mention:created": {
    organizationId: string
    mentionId: string
    entityType: "signal" | "alert"
    entityId: string
    mentionedUserId: string
  }
  "mention:updated": {
    organizationId: string
    mentionId: string
    entityType: "signal" | "alert"
    entityId: string
    mentionedUserId: string
  }
  "workspace:members_updated": {
    organizationId: string
    userId?: string
    action:
      | "left"
      | "removed"
      | "role_updated"
      | "ownership_transferred"
      | "invitation_canceled"
  }
  "workspace:deleted": {
    organizationId: string
    deletedByUserId: string
  }
}

export type EventName = keyof EventMap

export type RealtimeEvent = {
  [K in EventName]: {
    id: string
    type: K
    payload: EventMap[K]
    publishedAt: string
  }
}[EventName]

export const realtimeEventNames = [
  "signal:created",
  "signal:updated",
  "signal-comment:created",
  "alert:created",
  "alert:updated",
  "activity:created",
  "pipeline:created",
  "pipeline:updated",
  "action:proposed",
  "mention:created",
  "mention:updated",
  "workspace:members_updated",
  "workspace:deleted",
] as const satisfies readonly EventName[]

export function getRealtimeChannel(organizationId: string) {
  return `motiq:events:${organizationId}`
}

async function publishRealtimeEvent<K extends EventName>(
  eventName: K,
  payload: EventMap[K]
) {
  const event: RealtimeEvent = {
    id: crypto.randomUUID(),
    type: eventName,
    payload,
    publishedAt: new Date().toISOString(),
  } as RealtimeEvent

  await redis.publish(getRealtimeChannel(payload.organizationId), event)
}

class TypedEventEmitter extends EventEmitter {
  emit<K extends keyof EventMap>(eventName: K, payload: EventMap[K]): boolean {
    const deliveredLocally = super.emit(eventName, payload)

    publishRealtimeEvent(eventName, payload).catch((error) => {
      console.error(`Failed to publish realtime event ${eventName}:`, error)
    })

    return deliveredLocally
  }

  on<K extends keyof EventMap>(
    eventName: K,
    listener: (payload: EventMap[K]) => void
  ): this {
    return super.on(eventName, listener)
  }

  off<K extends keyof EventMap>(
    eventName: K,
    listener: (payload: EventMap[K]) => void
  ): this {
    return super.off(eventName, listener)
  }
}

export const eventBus = new TypedEventEmitter()

;(
  globalThis as typeof globalThis & {
    __motiqEventBus?: typeof eventBus
  }
).__motiqEventBus = eventBus
