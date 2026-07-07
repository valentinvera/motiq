import { EventEmitter } from "node:events"

interface EventMap {
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

class TypedEventEmitter extends EventEmitter {
  emit<K extends keyof EventMap>(eventName: K, payload: EventMap[K]): boolean {
    return super.emit(eventName, payload)
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
