import { createHmac, timingSafeEqual } from "node:crypto"
import { db } from "@motiq/db"
import { app } from "@motiq/db/schema/apps"
import { env } from "@motiq/env/api"
import { and, eq } from "drizzle-orm"
import { Hono } from "hono"
import { ingestSlackMessageSignals } from "../../services/slack-signal-ingestion.js"

const slack = new Hono()
const getPublicApiUrl = () => process.env.PUBLIC_API_URL ?? env.BETTER_AUTH_URL

slack.get("/oauth/callback", async (c) => {
  const code = c.req.query("code")
  const state = c.req.query("state")

  if (!(code && state)) {
    return c.json({ error: "Missing code or state" }, 400)
  }

  const clientId = env.SLACK_CLIENT_ID
  const clientSecret = env.SLACK_CLIENT_SECRET
  if (!(clientId && clientSecret)) {
    return c.json({ error: "Slack not configured" }, 500)
  }

  const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${getPublicApiUrl()}/api/apps/slack/oauth/callback`,
    }),
  })

  const tokenData = (await tokenResponse.json()) as {
    ok: boolean
    access_token?: string
    team?: { id: string; name: string }
    incoming_webhook?: { channel: string; channel_id: string }
    error?: string
  }

  if (!(tokenData.ok && tokenData.access_token)) {
    return c.json({ error: tokenData.error ?? "OAuth failed" }, 500)
  }

  const joinedChannel = tokenData.incoming_webhook?.channel_id
    ? await joinSlackChannel(
        tokenData.access_token,
        tokenData.incoming_webhook.channel_id
      )
    : false
  const connectedAtTs = String(Date.now() / 1000)

  const { organizationId, appId, from } = JSON.parse(
    Buffer.from(state, "base64url").toString()
  ) as {
    organizationId: string
    appId: string
    from?: "onboarding" | "app"
  }

  await db
    .update(app)
    .set({
      credentials: {
        accessToken: tokenData.access_token,
        teamId: tokenData.team?.id,
        teamName: tokenData.team?.name,
      },
      config: {
        incomingWebhookChannel: tokenData.incoming_webhook?.channel,
        incomingWebhookChannelId: tokenData.incoming_webhook?.channel_id,
        joinedChannel,
        connectedAtTs,
        lastHistoryTs: connectedAtTs,
      },
      status: "active",
      updatedAt: new Date(),
    })
    .where(and(eq(app.id, appId), eq(app.organizationId, organizationId)))

  const target = from === "onboarding" ? "/onboarding/apps" : "/apps"
  return c.redirect(`${env.CORS_ORIGIN}${target}?connected=slack`)
})

async function joinSlackChannel(accessToken: string, channel: string) {
  const response = await fetch("https://slack.com/api/conversations.join", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel }),
  })

  const data = (await response.json()) as { ok: boolean; error?: string }
  if (!data.ok && data.error !== "method_not_supported_for_channel_type") {
    console.error("[slack] Channel join failed:", data.error)
  }

  return data.ok || data.error === "already_in_channel"
}

slack.post("/events", async (c) => {
  const rawBody = await c.req.text()

  if (!verifySlackRequest(c.req.raw.headers, rawBody)) {
    return c.json({ error: "Invalid Slack signature" }, 401)
  }

  const body = JSON.parse(rawBody)

  if (body.type === "url_verification") {
    return c.json({ challenge: body.challenge })
  }

  if (body.type !== "event_callback") {
    return c.json({ ok: true })
  }

  const event = body.event
  if (!event || event.type !== "message" || event.subtype || event.bot_id) {
    return c.json({ ok: true })
  }

  const teamId = body.team_id as string | undefined
  if (!teamId) {
    return c.json({ ok: true })
  }

  const apps = await db
    .select()
    .from(app)
    .where(and(eq(app.type, "slack"), eq(app.status, "active")))

  const matched = apps.find((i) => {
    const creds = i.credentials as Record<string, unknown> | null
    return creds?.teamId === teamId
  })

  if (!matched) {
    return c.json({ ok: true })
  }

  const text = (event.text as string) ?? ""
  const userId = event.user as string
  const channel = event.channel as string
  const ts = event.ts as string
  const config = (matched.config as Record<string, unknown> | null) ?? {}
  const channelName =
    typeof config.incomingWebhookChannel === "string"
      ? config.incomingWebhookChannel
      : undefined

  await ingestSlackMessageSignals({
    organizationId: matched.organizationId,
    appId: matched.id,
    text,
    userId,
    channel,
    channelName,
    messageTs: ts,
    ingestionMode: "events",
    detectedAt: new Date(),
  })

  return c.json({ ok: true })
})

function verifySlackRequest(headers: Headers, rawBody: string): boolean {
  if (!env.SLACK_SIGNING_SECRET) {
    return true
  }

  const timestamp = headers.get("x-slack-request-timestamp")
  const signature = headers.get("x-slack-signature")
  if (!(timestamp && signature)) {
    return false
  }

  const requestTime = Number(timestamp)
  if (!Number.isFinite(requestTime)) {
    return false
  }

  const fiveMinutes = 60 * 5
  if (Math.abs(Date.now() / 1000 - requestTime) > fiveMinutes) {
    return false
  }

  const base = `v0:${timestamp}:${rawBody}`
  const digest = createHmac("sha256", env.SLACK_SIGNING_SECRET)
    .update(base)
    .digest("hex")
  const expected = `v0=${digest}`

  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return (
    signatureBuffer.length === expectedBuffer.length &&
    timingSafeEqual(signatureBuffer, expectedBuffer)
  )
}

export async function sendSlackMessage(
  accessToken: string,
  channel: string,
  text: string,
  blocks?: unknown[]
): Promise<boolean> {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel,
      text,
      blocks,
    }),
  })

  const data = (await response.json()) as { ok: boolean }
  return data.ok
}

export { slack }
