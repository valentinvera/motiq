import { createHmac, timingSafeEqual } from "node:crypto"
import { db } from "@motiq/db"
import { app } from "@motiq/db/schema/apps"
import { env } from "@motiq/env/api"
import { and, eq } from "drizzle-orm"
import { Hono } from "hono"
import {
  buildRedirectUrl,
  ingestSignal,
  parseOAuthState,
  persistAppCredentials,
} from "./_helpers"

const polar = new Hono()

const WHSEC_PREFIX = /^whsec_/
const getPublicApiUrl = () => process.env.PUBLIC_API_URL ?? env.BETTER_AUTH_URL

polar.get("/oauth/callback", async (c) => {
  const code = c.req.query("code")
  const state = c.req.query("state")
  if (!(code && state)) {
    return c.json({ error: "Missing code or state" }, 400)
  }
  const parsed = parseOAuthState(state)

  const tokenRes = await fetch("https://api.polar.sh/v1/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: env.POLAR_APP_CLIENT_ID,
      client_secret: env.POLAR_APP_CLIENT_SECRET,
      redirect_uri: `${getPublicApiUrl()}/api/apps/polar/oauth/callback`,
    }),
  })
  const tokenData = (await tokenRes.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    scope?: string
    error?: string
  }
  if (!tokenData.access_token) {
    return c.redirect(
      buildRedirectUrl(parsed, "polar", tokenData.error ?? "oauth_failed")
    )
  }

  const meRes = await fetch("https://api.polar.sh/v1/oauth2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const me = (await meRes.json()) as {
    sub?: string
    email?: string
    organization_id?: string
  }

  await persistAppCredentials({
    appId: parsed.appId,
    organizationId: parsed.organizationId,
    credentials: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
      scope: tokenData.scope,
    },
    config: {
      polarUserId: me.sub,
      polarEmail: me.email,
      polarOrgId: me.organization_id,
    },
  })

  return c.redirect(buildRedirectUrl(parsed, "polar"))
})

polar.post("/webhook", async (c) => {
  const signature = c.req.header("webhook-signature")
  const id = c.req.header("webhook-id")
  const timestamp = c.req.header("webhook-timestamp")
  const raw = await c.req.text()

  if (env.POLAR_WEBHOOK_SECRET) {
    if (!(signature && id && timestamp)) {
      return c.json({ error: "missing_signature_headers" }, 401)
    }
    const signed = `${id}.${timestamp}.${raw}`
    const secretBytes = Buffer.from(
      env.POLAR_WEBHOOK_SECRET.replace(WHSEC_PREFIX, ""),
      "base64"
    )
    const expected = createHmac("sha256", secretBytes)
      .update(signed)
      .digest("base64")
    const provided = signature
      .split(" ")
      .map((p) => p.split(",")[1])
      .filter(Boolean)
    const match = provided.some((sig) => {
      const a = Buffer.from(expected)
      const b = Buffer.from(sig ?? "")
      return a.length === b.length && timingSafeEqual(a, b)
    })
    if (!match) {
      return c.json({ error: "invalid_signature" }, 401)
    }
  }

  const payload = JSON.parse(raw) as {
    type?: string
    data?: {
      id?: string
      organization_id?: string
      customer?: { name?: string; email?: string }
      product?: { name?: string }
      amount?: number
      status?: string
    }
  }

  if (!(payload.type && payload.data?.id)) {
    return c.json({ ok: true })
  }

  const apps = await db
    .select()
    .from(app)
    .where(and(eq(app.type, "polar"), eq(app.status, "active")))

  const matched = apps.find((i) => {
    const cfg = i.config as Record<string, unknown> | null
    return (
      !payload.data?.organization_id ||
      cfg?.polarOrgId === payload.data.organization_id
    )
  })
  if (!matched) {
    return c.json({ ok: true })
  }

  await ingestSignal({
    organizationId: matched.organizationId,
    appId: matched.id,
    source: "polar",
    externalId: payload.data.id,
    title: `Polar ${payload.type}`,
    content: payload.data.product?.name ?? payload.type,
    customerName: payload.data.customer?.name,
    customerEmail: payload.data.customer?.email,
    metadata: {
      event: payload.type,
      amount: payload.data.amount,
      status: payload.data.status,
    },
  })

  return c.json({ ok: true })
})

export { polar }
