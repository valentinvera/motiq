import {
  chatModel,
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
  validateUIMessages,
} from "@motiq/ai"
import { auth } from "@motiq/auth"
import { db } from "@motiq/db"
import { agentAction } from "@motiq/db/schema/agent-actions"
import { alert } from "@motiq/db/schema/alerts"
import { app as appTable } from "@motiq/db/schema/apps"
import { chat as chatTable } from "@motiq/db/schema/chats"
import { signal } from "@motiq/db/schema/signals"
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  or,
  type SQL,
  sql,
} from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"
import { logAgentActivity } from "../services/activity-audit.js"
import { eventBus } from "../services/event-bus.js"
import { sendSlackMessage } from "./apps/slack.js"

const app = new Hono()

type AlertRecord = typeof alert.$inferSelect
type SignalRecord = typeof signal.$inferSelect

const signalTypeSchema = z.enum([
  "bug",
  "feature_request",
  "complaint",
  "question",
  "praise",
  "churn_risk",
  "other",
])
const signalPrioritySchema = z.enum(["critical", "high", "medium", "low"])
const alertSeveritySchema = z.enum(["critical", "high", "medium", "low"])

const messageSchema = z.object({
  id: z.string().optional(),
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(["system", "user", "assistant"]),
      content: z.string().optional(),
      parts: z
        .array(
          z.object({
            type: z.string(),
            text: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
})

const createChatSchema = z.object({
  message: z.string().trim().min(1),
})

async function getAuthContext(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
  })

  if (!session) {
    return null
  }

  const sessionData = session.session as Record<string, unknown>
  const organizationId = (sessionData.activeOrganizationId as string) ?? null
  if (!organizationId) {
    return null
  }

  return {
    organizationId,
    userId: session.user.id,
  }
}

const normalizeTitle = (text: string) => {
  const title = text.replace(/\s+/g, " ").trim()
  if (title.length <= 72) {
    return title
  }
  return `${title.slice(0, 69)}...`
}

const toStoredMessages = (messages: UIMessage[]) =>
  messages as unknown as Record<string, unknown>[]

const fromStoredMessages = (
  messages: Record<string, unknown>[] | null | undefined
) => (messages ?? []) as unknown as UIMessage[]

app.get("/", async (c) => {
  const authContext = await getAuthContext(c.req.raw.headers)
  if (!authContext) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const chats = await db
    .select({
      id: chatTable.id,
      title: chatTable.title,
      createdAt: chatTable.createdAt,
      updatedAt: chatTable.updatedAt,
    })
    .from(chatTable)
    .where(eq(chatTable.organizationId, authContext.organizationId))
    .orderBy(desc(chatTable.updatedAt))
    .limit(24)

  return c.json({ items: chats })
})

app.post("/new", async (c) => {
  const authContext = await getAuthContext(c.req.raw.headers)
  if (!authContext) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const body = await c.req.json()
  const parsed = createChatSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: "Invalid request body" }, 400)
  }

  const id = crypto.randomUUID()
  const userMessage: UIMessage = {
    id: crypto.randomUUID(),
    role: "user",
    parts: [{ type: "text", text: parsed.data.message }],
  }

  await db.insert(chatTable).values({
    id,
    organizationId: authContext.organizationId,
    userId: authContext.userId,
    title: normalizeTitle(parsed.data.message),
    messages: toStoredMessages([userMessage]),
  })

  return c.json({ id })
})

app.get("/:id", async (c) => {
  const authContext = await getAuthContext(c.req.raw.headers)
  if (!authContext) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const id = c.req.param("id")
  const [chat] = await db
    .select()
    .from(chatTable)
    .where(
      and(
        eq(chatTable.id, id),
        eq(chatTable.organizationId, authContext.organizationId)
      )
    )
    .limit(1)

  if (!chat) {
    return c.json({ error: "Chat not found" }, 404)
  }

  return c.json({
    id: chat.id,
    title: chat.title,
    messages: fromStoredMessages(chat.messages),
  })
})

app.post("/:id", async (c) => {
  const authContext = await getAuthContext(c.req.raw.headers)
  if (!authContext) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const id = c.req.param("id")
  const [chat] = await db
    .select()
    .from(chatTable)
    .where(
      and(
        eq(chatTable.id, id),
        eq(chatTable.organizationId, authContext.organizationId)
      )
    )
    .limit(1)

  if (!chat) {
    return c.json({ error: "Chat not found" }, 404)
  }

  const body = await c.req.json()
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: "Invalid request body" }, 400)
  }

  const messages = parsed.data.messages as UIMessage[]
  if (!messages.some((message) => message.role === "user")) {
    return c.json({ error: "Chat requires at least one user message" }, 400)
  }

  const validatedMessages = await validateUIMessages({ messages })

  const result = streamText({
    model: chatModel,
    system: await buildSystemPrompt(authContext.organizationId),
    messages: await convertToModelMessages(validatedMessages),
    tools: createChatTools(authContext),
    maxOutputTokens: 700,
    stopWhen: stepCountIs(3),
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: finishedMessages }) => {
      await db
        .update(chatTable)
        .set({
          messages: toStoredMessages(finishedMessages),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(chatTable.id, id),
            eq(chatTable.organizationId, authContext.organizationId)
          )
        )
    },
  })
})

app.post("/", async (c) => {
  const authContext = await getAuthContext(c.req.raw.headers)
  if (!authContext) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401)
    }
    return c.json({ error: "No active organization" }, 400)
  }

  const body = await c.req.json()
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: "Invalid request body" }, 400)
  }

  const messages = parsed.data.messages as UIMessage[]
  const validatedMessages = await validateUIMessages({ messages })

  const result = streamText({
    model: chatModel,
    system: await buildSystemPrompt(authContext.organizationId),
    messages: await convertToModelMessages(validatedMessages),
    tools: createChatTools(authContext),
    maxOutputTokens: 700,
    stopWhen: stepCountIs(3),
  })

  return result.toUIMessageStreamResponse()
})

function createChatTools(authContext: {
  organizationId: string
  userId: string
}) {
  return {
    getSlackStatus: tool({
      description:
        "Get the connected Slack integration status and latest Slack ingestion activity for this workspace.",
      inputSchema: z.object({}),
      execute: async () => getSlackStatus(authContext.organizationId),
    }),
    listSlackSignals: tool({
      description:
        "List recent customer signals that came from Slack. Use this when the user asks about Slack feedback, recent signals, or customer issues from Slack.",
      inputSchema: z.object({
        limit: z.number().min(1).max(20).optional(),
        priority: signalPrioritySchema.optional(),
        type: signalTypeSchema.optional(),
        search: z.string().trim().min(1).optional(),
      }),
      execute: async (input) =>
        listSlackSignals({
          organizationId: authContext.organizationId,
          limit: input.limit,
          priority: input.priority,
          type: input.type,
          search: input.search,
        }),
    }),
    listOpenAlerts: tool({
      description:
        "List open alerts that still need attention. Use this when the user asks what needs review, what is urgent, or what can be escalated.",
      inputSchema: z.object({
        limit: z.number().min(1).max(20).optional(),
        severity: alertSeveritySchema.optional(),
        search: z.string().trim().min(1).optional(),
      }),
      execute: async (input) =>
        listOpenAlerts({
          organizationId: authContext.organizationId,
          limit: input.limit,
          severity: input.severity,
          search: input.search,
        }),
    }),
    createAlertFromSignal: tool({
      description:
        "Create an alert from a specific signal. Only use this when the user explicitly asks to create an alert from a signal.",
      inputSchema: z.object({
        signalId: z.string().optional(),
        query: z.string().trim().min(1).optional(),
      }),
      execute: async (input) =>
        createAlertFromSignalForChat({
          organizationId: authContext.organizationId,
          userId: authContext.userId,
          signalId: input.signalId,
          query: input.query,
        }),
    }),
    escalateAlertToSlack: tool({
      description:
        "Escalate an open alert to the connected Slack channel. Only use this when the user explicitly asks to escalate, send, or post an alert to Slack.",
      inputSchema: z.object({
        alertId: z.string().optional(),
        query: z.string().trim().min(1).optional(),
      }),
      execute: async (input) =>
        escalateAlertToSlackForChat({
          organizationId: authContext.organizationId,
          userId: authContext.userId,
          alertId: input.alertId,
          query: input.query,
        }),
    }),
  }
}

async function getSlackStatus(organizationId: string) {
  const [slackApps, latestSlackSignal, openAlertCount] = await Promise.all([
    db
      .select({
        id: appTable.id,
        status: appTable.status,
        config: appTable.config,
        credentials: appTable.credentials,
        lastSyncAt: appTable.lastSyncAt,
        createdAt: appTable.createdAt,
      })
      .from(appTable)
      .where(
        and(
          eq(appTable.organizationId, organizationId),
          eq(appTable.type, "slack")
        )
      )
      .orderBy(desc(appTable.createdAt)),
    db
      .select({
        id: signal.id,
        title: signal.title,
        createdAt: signal.createdAt,
        customerName: signal.customerName,
      })
      .from(signal)
      .where(
        and(
          eq(signal.organizationId, organizationId),
          eq(signal.source, "slack")
        )
      )
      .orderBy(desc(signal.createdAt))
      .limit(1),
    db
      .select({ count: count() })
      .from(alert)
      .where(
        and(
          eq(alert.organizationId, organizationId),
          eq(alert.acknowledged, false)
        )
      ),
  ])

  return {
    connected: slackApps.some((slackApp) => slackApp.status === "active"),
    appCount: slackApps.length,
    activeAppCount: slackApps.filter((slackApp) => slackApp.status === "active")
      .length,
    channels: slackApps.map((slackApp) => {
      const config = slackApp.config as Record<string, unknown> | null
      const credentials = slackApp.credentials as Record<string, unknown> | null
      return {
        appId: slackApp.id,
        status: slackApp.status,
        teamName: credentials?.teamName ?? null,
        channelName: config?.incomingWebhookChannel ?? null,
        channelId: config?.incomingWebhookChannelId ?? null,
        joinedChannel: config?.joinedChannel ?? null,
        lastSyncAt: slackApp.lastSyncAt?.toISOString() ?? null,
      }
    }),
    latestSlackSignal: latestSlackSignal[0]
      ? {
          ...latestSlackSignal[0],
          createdAt: latestSlackSignal[0].createdAt.toISOString(),
        }
      : null,
    openAlertCount: openAlertCount[0]?.count ?? 0,
  }
}

async function listSlackSignals(params: {
  organizationId: string
  limit?: number
  priority?: z.infer<typeof signalPrioritySchema>
  type?: z.infer<typeof signalTypeSchema>
  search?: string
}) {
  const conditions: SQL[] = [
    eq(signal.organizationId, params.organizationId),
    eq(signal.source, "slack"),
  ]
  if (params.priority) {
    conditions.push(eq(signal.priority, params.priority))
  }
  if (params.type) {
    conditions.push(eq(signal.type, params.type))
  }
  if (params.search) {
    const term = `%${params.search}%`
    const searchCondition = or(
      ilike(signal.title, term),
      ilike(signal.content, term),
      ilike(signal.customerName, term)
    )
    if (searchCondition) {
      conditions.push(searchCondition)
    }
  }

  const items = await db
    .select({
      id: signal.id,
      title: signal.title,
      content: signal.content,
      type: signal.type,
      priority: signal.priority,
      status: signal.status,
      customerName: signal.customerName,
      createdAt: signal.createdAt,
    })
    .from(signal)
    .where(and(...conditions))
    .orderBy(desc(signal.createdAt))
    .limit(params.limit ?? 10)

  return {
    items: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  }
}

async function listOpenAlerts(params: {
  organizationId: string
  limit?: number
  severity?: z.infer<typeof alertSeveritySchema>
  search?: string
}) {
  const conditions: SQL[] = [
    eq(alert.organizationId, params.organizationId),
    eq(alert.acknowledged, false),
  ]
  if (params.severity) {
    conditions.push(eq(alert.severity, params.severity))
  }
  if (params.search) {
    const term = `%${params.search}%`
    const searchCondition = or(
      ilike(alert.title, term),
      ilike(alert.description, term)
    )
    if (searchCondition) {
      conditions.push(searchCondition)
    }
  }

  const items = await db
    .select({
      id: alert.id,
      signalId: alert.signalId,
      title: alert.title,
      description: alert.description,
      type: alert.type,
      severity: alert.severity,
      createdAt: alert.createdAt,
    })
    .from(alert)
    .where(and(...conditions))
    .orderBy(desc(alert.createdAt))
    .limit(params.limit ?? 10)

  return {
    items: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  }
}

async function createAlertFromSignalForChat(params: {
  organizationId: string
  userId: string
  signalId?: string
  query?: string
}) {
  const signalRecord = await findSignalForChat(params)
  if (!signalRecord) {
    return {
      success: false,
      reason: "signal_not_found",
      message: "No matching signal was found in this workspace.",
    }
  }

  const existingAlert = await findAlertBySignal({
    organizationId: params.organizationId,
    signalId: signalRecord.id,
  })
  if (existingAlert) {
    await markSignalStatus({
      organizationId: params.organizationId,
      signalId: signalRecord.id,
      status: "processed",
    })
    return {
      success: true,
      status: "already_exists",
      alertId: existingAlert.id,
      signalId: signalRecord.id,
      title: existingAlert.title,
    }
  }

  const [createdAlert] = await db
    .insert(alert)
    .values({
      id: crypto.randomUUID(),
      organizationId: params.organizationId,
      signalId: signalRecord.id,
      type: getAlertTypeFromSignal(signalRecord),
      severity: signalRecord.priority ?? "medium",
      title: signalRecord.title,
      description: getSignalAlertDescription(signalRecord),
      metadata: {
        source: "chat",
        createdBy: params.userId,
        createdAt: new Date().toISOString(),
      },
    })
    .returning()

  if (!createdAlert) {
    return { success: false, reason: "create_failed" }
  }

  await markSignalStatus({
    organizationId: params.organizationId,
    signalId: signalRecord.id,
    status: "processed",
  })
  eventBus.emit("alert:created", {
    organizationId: params.organizationId,
    alertId: createdAlert.id,
    signalId: signalRecord.id,
  })
  await logAgentActivity({
    organizationId: params.organizationId,
    activityType: "alert_created",
    title: "Chat Created Alert",
    description: `Created alert from signal: ${signalRecord.title}`,
    entityType: "alert",
    entityId: createdAlert.id,
    metadata: { source: "chat", signalId: signalRecord.id },
  })

  return {
    success: true,
    status: "created",
    alertId: createdAlert.id,
    signalId: signalRecord.id,
    title: createdAlert.title,
  }
}

async function escalateAlertToSlackForChat(params: {
  organizationId: string
  userId: string
  alertId?: string
  query?: string
}) {
  const alertRecord = await findAlertForChat(params)
  if (!alertRecord) {
    return {
      success: false,
      reason: "alert_not_found",
      message: "No matching alert was found in this workspace.",
    }
  }

  if (getAlertResolutionStatus(alertRecord) === "escalated") {
    return {
      success: true,
      status: "already_escalated",
      alertId: alertRecord.id,
      title: alertRecord.title,
    }
  }

  const actionId = crypto.randomUUID()
  const [action] = await db
    .insert(agentAction)
    .values({
      id: actionId,
      organizationId: params.organizationId,
      actionType: "slack_escalation",
      status: "approved",
      title: "Slack Escalation Approved",
      description: `Escalate alert from chat: ${alertRecord.title}`,
      approvedBy: params.userId,
      payload: {
        alertId: alertRecord.id,
        signalId: alertRecord.signalId,
        source: "chat",
        targetPayload: getSlackPayloadFromAlert(alertRecord),
      },
    })
    .returning()

  if (!action) {
    return { success: false, reason: "action_create_failed" }
  }

  const sent = await sendAlertToSlack({
    organizationId: params.organizationId,
    actionId,
    payload: getSlackPayloadFromAlert(alertRecord),
  })

  if (!sent) {
    await db
      .update(agentAction)
      .set({ status: "rejected" })
      .where(eq(agentAction.id, actionId))
    return {
      success: false,
      reason: "slack_delivery_failed",
      alertId: alertRecord.id,
      title: alertRecord.title,
    }
  }

  await db
    .update(agentAction)
    .set({
      status: "executed",
      executedAt: new Date(),
    })
    .where(eq(agentAction.id, actionId))

  await db
    .update(alert)
    .set({
      acknowledged: true,
      acknowledgedBy: params.userId,
      metadata: buildAlertResolutionMetadata(alertRecord, {
        status: "escalated",
        label: "Escalated to Slack",
        actionId,
        decidedAt: new Date().toISOString(),
        decidedBy: params.userId,
        source: "chat",
      }),
    })
    .where(
      and(
        eq(alert.id, alertRecord.id),
        eq(alert.organizationId, params.organizationId)
      )
    )

  await rejectPendingSlackEscalations({
    organizationId: params.organizationId,
    alertId: alertRecord.id,
  })

  if (alertRecord.signalId) {
    await markSignalStatus({
      organizationId: params.organizationId,
      signalId: alertRecord.signalId,
      status: "processed",
    })
  }
  eventBus.emit("alert:updated", {
    organizationId: params.organizationId,
    alertId: alertRecord.id,
  })

  return {
    success: true,
    status: "escalated",
    alertId: alertRecord.id,
    actionId,
    title: alertRecord.title,
  }
}

async function findSignalForChat(params: {
  organizationId: string
  signalId?: string
  query?: string
}) {
  if (params.signalId) {
    const [result] = await db
      .select()
      .from(signal)
      .where(
        and(
          eq(signal.id, params.signalId),
          eq(signal.organizationId, params.organizationId)
        )
      )
      .limit(1)
    return result ?? null
  }

  if (!params.query) {
    return null
  }

  const term = `%${params.query}%`
  const [result] = await db
    .select()
    .from(signal)
    .where(
      and(
        eq(signal.organizationId, params.organizationId),
        or(
          ilike(signal.title, term),
          ilike(signal.content, term),
          ilike(signal.customerName, term)
        )
      )
    )
    .orderBy(desc(signal.createdAt))
    .limit(1)

  return result ?? null
}

async function findAlertForChat(params: {
  organizationId: string
  alertId?: string
  query?: string
}) {
  if (params.alertId) {
    const [result] = await db
      .select()
      .from(alert)
      .where(
        and(
          eq(alert.id, params.alertId),
          eq(alert.organizationId, params.organizationId)
        )
      )
      .limit(1)
    return result ?? null
  }

  if (!params.query) {
    const [latestOpen] = await db
      .select()
      .from(alert)
      .where(
        and(
          eq(alert.organizationId, params.organizationId),
          eq(alert.acknowledged, false)
        )
      )
      .orderBy(desc(alert.createdAt))
      .limit(1)
    return latestOpen ?? null
  }

  const term = `%${params.query}%`
  const [result] = await db
    .select()
    .from(alert)
    .where(
      and(
        eq(alert.organizationId, params.organizationId),
        or(ilike(alert.title, term), ilike(alert.description, term))
      )
    )
    .orderBy(desc(alert.createdAt))
    .limit(1)

  return result ?? null
}

async function findAlertBySignal(params: {
  organizationId: string
  signalId: string
}) {
  const [result] = await db
    .select()
    .from(alert)
    .where(
      and(
        eq(alert.organizationId, params.organizationId),
        eq(alert.signalId, params.signalId)
      )
    )
    .limit(1)
  return result ?? null
}

function getAlertTypeFromSignal(signalRecord: SignalRecord) {
  return signalRecord.type === "churn_risk" ? "churn_risk" : "escalation"
}

function getSignalAlertDescription(signalRecord: SignalRecord) {
  const type = signalRecord.type ?? "signal"
  const priority = signalRecord.priority ?? "unprioritized"
  const customer = signalRecord.customerName ?? "unknown customer"
  return `Manual alert from ${priority} ${type} by ${customer}. ${signalRecord.content}`
}

function buildAlertResolutionMetadata(
  alertRecord: AlertRecord,
  resolution: Record<string, unknown>
) {
  return {
    ...((alertRecord.metadata as Record<string, unknown> | null) ?? {}),
    resolution,
  }
}

function getAlertResolutionStatus(alertRecord: AlertRecord) {
  const metadata =
    (alertRecord.metadata as Record<string, unknown> | null) ?? {}
  const resolution = metadata.resolution as Record<string, unknown> | undefined
  return typeof resolution?.status === "string" ? resolution.status : null
}

function getSlackPayloadFromAlert(alertRecord: AlertRecord) {
  return {
    alertId: alertRecord.id,
    title: alertRecord.title,
    severity: alertRecord.severity,
    type: alertRecord.type,
    description: alertRecord.description,
    organizationId: alertRecord.organizationId,
  }
}

async function sendAlertToSlack(params: {
  organizationId: string
  actionId: string
  payload: {
    title: string
    severity: string
    type: string
    description: string | null
  }
}) {
  const slackApps = await db
    .select()
    .from(appTable)
    .where(
      and(
        eq(appTable.organizationId, params.organizationId),
        eq(appTable.type, "slack"),
        eq(appTable.status, "active")
      )
    )

  if (slackApps.length === 0) {
    await logAgentActivity({
      organizationId: params.organizationId,
      activityType: "action_failed",
      title: "Chat Slack Escalation Failed",
      description: "No active Slack app is connected.",
      entityType: "agent_action",
      entityId: params.actionId,
    })
    return false
  }

  await logAgentActivity({
    organizationId: params.organizationId,
    activityType: "action_started",
    title: "Chat Slack Escalation Started",
    description: `Attempting to alert Slack: ${params.payload.title}`,
    entityType: "agent_action",
    entityId: params.actionId,
  })

  let sent = false
  for (const slackApp of slackApps) {
    const creds = slackApp.credentials as Record<string, unknown> | null
    const config = slackApp.config as Record<string, unknown> | null
    const accessToken = creds?.accessToken as string | undefined
    const channel = config?.incomingWebhookChannelId as string | undefined
    if (!(accessToken && channel)) {
      continue
    }

    const ok = await sendSlackMessage(
      accessToken,
      channel,
      `${severityEmoji(params.payload.severity)} ${params.payload.title}`,
      buildSlackBlocks(params.payload)
    )
    sent ||= ok
  }

  await logAgentActivity({
    organizationId: params.organizationId,
    activityType: sent ? "action_executed" : "action_failed",
    title: sent ? "Chat Slack Escalation Sent" : "Chat Slack Escalation Failed",
    description: sent
      ? `Alerted Slack: ${params.payload.title}`
      : `Slack escalation could not be delivered: ${params.payload.title}`,
    entityType: "agent_action",
    entityId: params.actionId,
  })

  return sent
}

function severityEmoji(severity: string) {
  const map: Record<string, string> = {
    critical: ":red_circle:",
    high: ":large_orange_circle:",
    medium: ":large_yellow_circle:",
    low: ":large_blue_circle:",
  }
  return map[severity] ?? ":white_circle:"
}

function buildSlackBlocks(payload: {
  title: string
  severity: string
  type: string
  description: string | null
}) {
  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${severityEmoji(payload.severity)} ${payload.title}`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Severity:*\n${payload.severity}` },
        { type: "mrkdwn", text: `*Type:*\n${payload.type.replace("_", " ")}` },
      ],
    },
  ]

  if (payload.description) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: payload.description },
    })
  }

  return blocks
}

async function markSignalStatus(params: {
  organizationId: string
  signalId: string
  status: "processed" | "ignored"
}) {
  await db
    .update(signal)
    .set({ status: params.status, updatedAt: new Date() })
    .where(
      and(
        eq(signal.id, params.signalId),
        eq(signal.organizationId, params.organizationId)
      )
    )
  eventBus.emit("signal:updated", {
    organizationId: params.organizationId,
    signalId: params.signalId,
  })
}

async function rejectPendingSlackEscalations(params: {
  organizationId: string
  alertId: string
}) {
  await db
    .update(agentAction)
    .set({ status: "rejected" })
    .where(
      and(
        eq(agentAction.organizationId, params.organizationId),
        eq(agentAction.actionType, "slack_escalation"),
        eq(agentAction.status, "proposed"),
        sql`${agentAction.payload}->>'alertId' = ${params.alertId}`
      )
    )
}

async function buildSystemPrompt(organizationId: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [recentSignals, signalCounts, unackAlerts, alertCounts] =
    await Promise.all([
      db
        .select({
          type: signal.type,
          priority: signal.priority,
          title: signal.title,
          customerName: signal.customerName,
          source: signal.source,
          createdAt: signal.createdAt,
        })
        .from(signal)
        .where(
          and(
            eq(signal.organizationId, organizationId),
            gte(signal.createdAt, since)
          )
        )
        .orderBy(desc(signal.createdAt))
        .limit(15),
      db
        .select({ type: signal.type, count: count() })
        .from(signal)
        .where(
          and(
            eq(signal.organizationId, organizationId),
            gte(signal.createdAt, since)
          )
        )
        .groupBy(signal.type),
      db
        .select({
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          createdAt: alert.createdAt,
        })
        .from(alert)
        .where(
          and(
            eq(alert.organizationId, organizationId),
            eq(alert.acknowledged, false)
          )
        )
        .orderBy(desc(alert.createdAt))
        .limit(8),
      db
        .select({ severity: alert.severity, count: count() })
        .from(alert)
        .where(
          and(
            eq(alert.organizationId, organizationId),
            eq(alert.acknowledged, false)
          )
        )
        .groupBy(alert.severity),
    ])

  return `You are Motiq AI, an intelligent customer intelligence assistant for a B2B SaaS company. You help product and customer success teams understand customer feedback, identify patterns, and take action.

You have access to the following data from the last 7 days:

## Signal Summary
${signalCounts.map((s) => `- ${s.type ?? "unclassified"}: ${s.count}`).join("\n")}

## Recent Signals (last 15)
${recentSignals.map((s) => `- [${s.type}/${s.priority}] "${s.title}" from ${s.customerName ?? "unknown"} via ${s.source} (${s.createdAt.toISOString()})`).join("\n")}

## Unacknowledged Alerts
${alertCounts.map((a) => `- ${a.severity}: ${a.count}`).join("\n")}

${unackAlerts.map((a) => `- [${a.severity}/${a.type}] ${a.title}: ${a.description ?? ""}`).join("\n")}

Guidelines:
- Be concise and actionable
- Reference specific signals and alerts when relevant
- Suggest concrete next steps when appropriate
- If asked about something outside your data scope, say so clearly
- Use read-only tools when the user asks about Slack status, recent signals, or open alerts
- Only use createAlertFromSignal when the user explicitly asks to create an alert from a signal
- Only use escalateAlertToSlack when the user explicitly asks to escalate, send, or post an alert to Slack
- Treat /slack status, /slack signals, /slack alerts, and /slack escalate as namespaced Slack workflow shortcuts
- Treat @slack signals, @slack alerts, @signals, @alerts, and @autonomy as context hints for the user's question
- Keep normal answers short by default; use bullets only when they make the answer easier to scan
- Format responses with markdown for readability`
}

export default app
