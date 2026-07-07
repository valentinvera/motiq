import { db } from "@motiq/db"
import { app } from "@motiq/db/schema/apps"
import { and, eq } from "drizzle-orm"
import { ingestSlackMessageSignals } from "../slack-signal-ingestion.js"

const POLLING_INTERVAL_MS = 5 * 60 * 1000
const SLACK_HISTORY_LIMIT = 100

let pollerStarted = false

interface SlackCredentials {
  accessToken?: string
  teamId?: string
  teamName?: string
}

interface SlackConfig {
  incomingWebhookChannel?: string
  incomingWebhookChannelId?: string
  lastHistoryTs?: string
}

interface SlackHistoryMessage {
  type?: string
  subtype?: string
  bot_id?: string
  user?: string
  text?: string
  ts?: string
}

interface SlackHistoryResponse {
  ok: boolean
  messages?: SlackHistoryMessage[]
  error?: string
}

export function runSlackPoller() {
  if (pollerStarted) {
    return
  }

  pollerStarted = true
  console.log("[slack] Starting polling worker...")

  setInterval(() => {
    pollSlackApps().catch((error) =>
      console.error("[slack] Polling cycle failed:", error)
    )
  }, POLLING_INTERVAL_MS)

  pollSlackApps().catch((error) =>
    console.error("[slack] Initial poll failed:", error)
  )
}

async function pollSlackApps() {
  const records = await db
    .select()
    .from(app)
    .where(and(eq(app.type, "slack"), eq(app.status, "active")))

  for (const record of records) {
    try {
      await syncSlack(record)
    } catch (error) {
      console.error(`[slack] Sync failed for ${record.id}:`, error)
    }
  }
}

async function syncSlack(record: typeof app.$inferSelect) {
  const credentials = record.credentials as SlackCredentials | null
  const config = (record.config as SlackConfig | null) ?? {}
  const accessToken = credentials?.accessToken
  const channel = config.incomingWebhookChannelId

  if (!(accessToken && channel)) {
    return
  }

  const response = await fetchSlackChannelHistory({
    accessToken,
    channel,
    oldest: config.lastHistoryTs,
  })

  if (!response.ok) {
    console.error(
      `[slack] conversations.history failed for ${record.id}: ${response.error ?? "unknown_error"}`
    )
    return
  }

  const messages = (response.messages ?? [])
    .filter(isIngestibleSlackMessage)
    .sort((left, right) => Number(left.ts) - Number(right.ts))

  for (const message of messages) {
    await ingestSlackMessageSignals({
      organizationId: record.organizationId,
      appId: record.id,
      text: message.text ?? "",
      userId: message.user ?? null,
      channel,
      channelName: config.incomingWebhookChannel,
      messageTs: message.ts ?? "",
      ingestionMode: "polling",
      detectedAt: slackTsToDate(message.ts),
    })
  }

  const latestTs = messages.at(-1)?.ts ?? config.lastHistoryTs

  await db
    .update(app)
    .set({
      lastSyncAt: new Date(),
      config: {
        ...config,
        lastHistoryTs: latestTs,
      },
      updatedAt: new Date(),
    })
    .where(eq(app.id, record.id))
}

async function fetchSlackChannelHistory({
  accessToken,
  channel,
  oldest,
}: {
  accessToken: string
  channel: string
  oldest?: string
}) {
  const params = new URLSearchParams({
    channel,
    limit: String(SLACK_HISTORY_LIMIT),
  })

  if (oldest) {
    params.set("oldest", oldest)
  }

  const response = await fetch(
    `https://slack.com/api/conversations.history?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!response.ok) {
    return {
      ok: false,
      error: `http_${response.status}`,
    } satisfies SlackHistoryResponse
  }

  return (await response.json()) as SlackHistoryResponse
}

function isIngestibleSlackMessage(message: SlackHistoryMessage) {
  return Boolean(
    message.type === "message" &&
      !message.subtype &&
      !message.bot_id &&
      message.text?.trim() &&
      message.ts
  )
}

function slackTsToDate(ts?: string) {
  if (!ts) {
    return new Date()
  }

  const timestamp = Number(ts) * 1000
  return Number.isFinite(timestamp) ? new Date(timestamp) : new Date()
}
