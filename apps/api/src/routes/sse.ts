import { auth } from "@motiq/auth"
import { redis } from "@motiq/cache"
import { type Context, Hono } from "hono"
import { streamSSE } from "hono/streaming"
import {
  type EventMap,
  type EventName,
  eventBus,
  getRealtimeChannel,
  type RealtimeEvent,
  realtimeEventNames,
} from "../services/event-bus.js"

export const sse = new Hono()

type RedisSubscription = ReturnType<typeof redis.subscribe<RealtimeEvent>>

async function handleSseRequest(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  const sess = session?.session as { activeOrganizationId?: string } | undefined

  if (!sess?.activeOrganizationId) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const activeOrgId = sess.activeOrganizationId

  return streamSSE(c, async (stream) => {
    let closed = false
    let cleanedUp = false
    let redisSubscription: RedisSubscription | null = null

    const handleEvent = async <K extends EventName>(
      payload: EventMap[K],
      type: K
    ) => {
      if (closed || payload.organizationId !== activeOrgId) {
        return
      }

      try {
        await stream.writeSSE({
          event: type,
          data: JSON.stringify(payload),
        })
      } catch (err) {
        console.error("SSE write error:", err)
      }
    }

    const localListeners = realtimeEventNames.map((eventName) => {
      const listener = (payload: EventMap[typeof eventName]) => {
        handleEvent(payload, eventName).catch((error) => {
          console.error(`SSE local event ${eventName} failed:`, error)
        })
      }

      eventBus.on(eventName, listener)
      return { eventName, listener }
    })

    const handleRedisMessage = (data: { message: RealtimeEvent }) => {
      const event = data.message
      if (!realtimeEventNames.includes(event.type)) {
        return
      }

      handleEvent(event.payload, event.type).catch((error) => {
        console.error(`SSE Redis event ${event.type} failed:`, error)
      })
    }

    const handleRedisError = (error: Error) => {
      console.error("SSE Redis subscription error:", error)
    }

    try {
      redisSubscription = redis.subscribe<RealtimeEvent>(
        getRealtimeChannel(activeOrgId)
      )
      redisSubscription.on("message", handleRedisMessage)
      redisSubscription.on("error", handleRedisError)
    } catch (error) {
      console.error("Failed to subscribe SSE Redis listener:", error)
    }

    const interval = setInterval(async () => {
      if (closed) {
        clearInterval(interval)
        return
      }

      try {
        await stream.writeSSE({ event: "ping", data: "ping" })
      } catch {
        closed = true
      }
    }, 5000)

    const cleanup = () => {
      if (cleanedUp) {
        return
      }

      cleanedUp = true
      closed = true
      clearInterval(interval)

      for (const { eventName, listener } of localListeners) {
        eventBus.off(eventName, listener)
      }

      if (redisSubscription) {
        redisSubscription.removeAllListeners()
        redisSubscription.unsubscribe().catch((error) => {
          console.error("Failed to unsubscribe SSE Redis listener:", error)
        })
      }
    }

    stream.onAbort(cleanup)

    while (!closed) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    cleanup()
  })
}

sse.get("/", handleSseRequest)
sse.get("", handleSseRequest)
