import { auth } from "@motiq/auth"
import { type Context, Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { eventBus } from "../services/event-bus"

export const sse = new Hono()

async function handleSseRequest(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  const sess = session?.session as { activeOrganizationId?: string } | undefined

  if (!sess?.activeOrganizationId) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const activeOrgId = sess.activeOrganizationId

  return streamSSE(c, async (stream) => {
    let closed = false

    const handleEvent = async (
      payload: { organizationId: string },
      type: string
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

    const onSignalCreated = (p: { organizationId: string }) =>
      handleEvent(p, "signal:created")
    const onSignalUpdated = (p: { organizationId: string }) =>
      handleEvent(p, "signal:updated")
    const onSignalCommentCreated = (p: { organizationId: string }) =>
      handleEvent(p, "signal-comment:created")
    const onAlertCreated = (p: { organizationId: string }) =>
      handleEvent(p, "alert:created")
    const onAlertUpdated = (p: { organizationId: string }) =>
      handleEvent(p, "alert:updated")
    const onActivityCreated = (p: { organizationId: string }) =>
      handleEvent(p, "activity:created")
    const onPipelineCreated = (p: { organizationId: string }) =>
      handleEvent(p, "pipeline:created")
    const onPipelineUpdated = (p: { organizationId: string }) =>
      handleEvent(p, "pipeline:updated")
    const onActionProposed = (p: { organizationId: string }) =>
      handleEvent(p, "action:proposed")
    const onMentionCreated = (p: { organizationId: string }) =>
      handleEvent(p, "mention:created")
    const onMentionUpdated = (p: { organizationId: string }) =>
      handleEvent(p, "mention:updated")
    const onWorkspaceMembersUpdated = (p: { organizationId: string }) =>
      handleEvent(p, "workspace:members_updated")
    const onWorkspaceDeleted = (p: { organizationId: string }) =>
      handleEvent(p, "workspace:deleted")

    eventBus.on("signal:created", onSignalCreated)
    eventBus.on("signal:updated", onSignalUpdated)
    eventBus.on("signal-comment:created", onSignalCommentCreated)
    eventBus.on("alert:created", onAlertCreated)
    eventBus.on("alert:updated", onAlertUpdated)
    eventBus.on("activity:created", onActivityCreated)
    eventBus.on("pipeline:created", onPipelineCreated)
    eventBus.on("pipeline:updated", onPipelineUpdated)
    eventBus.on("action:proposed", onActionProposed)
    eventBus.on("mention:created", onMentionCreated)
    eventBus.on("mention:updated", onMentionUpdated)
    eventBus.on("workspace:members_updated", onWorkspaceMembersUpdated)
    eventBus.on("workspace:deleted", onWorkspaceDeleted)

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

    stream.onAbort(() => {
      closed = true
      clearInterval(interval)
      eventBus.off("signal:created", onSignalCreated)
      eventBus.off("signal:updated", onSignalUpdated)
      eventBus.off("signal-comment:created", onSignalCommentCreated)
      eventBus.off("alert:created", onAlertCreated)
      eventBus.off("alert:updated", onAlertUpdated)
      eventBus.off("activity:created", onActivityCreated)
      eventBus.off("pipeline:created", onPipelineCreated)
      eventBus.off("pipeline:updated", onPipelineUpdated)
      eventBus.off("action:proposed", onActionProposed)
      eventBus.off("mention:created", onMentionCreated)
      eventBus.off("mention:updated", onMentionUpdated)
      eventBus.off("workspace:members_updated", onWorkspaceMembersUpdated)
      eventBus.off("workspace:deleted", onWorkspaceDeleted)
    })

    while (!closed) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  })
}

sse.get("/", handleSseRequest)
sse.get("", handleSseRequest)
