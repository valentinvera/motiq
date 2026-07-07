import { db } from "@motiq/db"
import { app } from "@motiq/db/schema/apps"
import { signal } from "@motiq/db/schema/signals"
import { env } from "@motiq/env/api"
import { and, desc, eq } from "drizzle-orm"
import { logAgentActivity } from "../../services/activity-audit"
import { eventBus } from "../../services/event-bus"
import { enqueueSignal } from "../../services/signal-queue"

export interface OAuthState {
  organizationId: string
  appId: string
  from?: "onboarding" | "app"
}

export function parseOAuthState(state: string): OAuthState {
  return JSON.parse(Buffer.from(state, "base64url").toString()) as OAuthState
}

export function buildRedirectUrl(
  state: OAuthState,
  provider: string,
  error?: string
) {
  const target = state.from === "onboarding" ? "/onboarding/apps" : "/apps"
  const qs = error
    ? `?error=${encodeURIComponent(error)}`
    : `?connected=${provider}`
  return `${env.CORS_ORIGIN}${target}${qs}`
}

export async function persistAppCredentials(params: {
  appId: string
  organizationId: string
  credentials: Record<string, unknown>
  config?: Record<string, unknown>
}) {
  await db
    .update(app)
    .set({
      credentials: params.credentials,
      config: params.config,
      status: "active",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(app.id, params.appId),
        eq(app.organizationId, params.organizationId)
      )
    )
}

type SignalSource =
  | "slack"
  | "discord"
  | "telegram"
  | "gmail"
  | "notion"
  | "linear"
  | "jira"
  | "polar"
  | "zendesk"

const SIGNAL_DEDUPE_CANDIDATE_LIMIT = 250

function normalizeSignalContent(content: string) {
  return content.trim().replace(/\s+/g, " ").toLowerCase()
}

function nullableEqual(
  left: string | null | undefined,
  right: string | null | undefined
) {
  return (left ?? null) === (right ?? null)
}

async function findDuplicateSignal(params: {
  organizationId: string
  appId: string | null
  source: SignalSource
  content: string
  customerName?: string | null
  customerEmail?: string | null
}) {
  const normalizedContent = normalizeSignalContent(params.content)
  if (!normalizedContent) {
    return null
  }

  const candidates = await db
    .select()
    .from(signal)
    .where(
      and(
        eq(signal.organizationId, params.organizationId),
        eq(signal.source, params.source)
      )
    )
    .orderBy(desc(signal.createdAt))
    .limit(SIGNAL_DEDUPE_CANDIDATE_LIMIT)

  return (
    candidates.find((candidate) => {
      return (
        nullableEqual(candidate.appId, params.appId) &&
        nullableEqual(candidate.customerName, params.customerName) &&
        nullableEqual(candidate.customerEmail, params.customerEmail) &&
        normalizeSignalContent(candidate.content) === normalizedContent
      )
    }) ?? null
  )
}

export async function ingestSignal(params: {
  organizationId: string
  appId: string | null
  source: SignalSource
  externalId: string
  title: string
  content: string
  customerName?: string | null
  customerEmail?: string | null
  metadata?: Record<string, unknown>
  detectedAt?: Date
}) {
  const existing = await db.query.signal.findFirst({
    where: and(
      eq(signal.organizationId, params.organizationId),
      eq(signal.source, params.source),
      eq(signal.externalId, params.externalId)
    ),
  })

  if (existing) {
    await logAgentActivity({
      organizationId: params.organizationId,
      activityType: "signal_skipped",
      title: "Signal Skipped: duplicate external event",
      description:
        "Skipped " +
        params.title +
        " because " +
        params.source +
        " already sent this event.",
      entityType: "signal",
      entityId: existing.id,
      metadata: {
        source: params.source,
        appId: params.appId,
        externalId: params.externalId,
      },
    })
    return existing.id
  }

  const duplicate = await findDuplicateSignal({
    organizationId: params.organizationId,
    appId: params.appId,
    source: params.source,
    content: params.content,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
  })

  if (duplicate) {
    await logAgentActivity({
      organizationId: params.organizationId,
      activityType: "signal_skipped",
      title: "Signal Skipped: duplicate content",
      description: `Skipped ${params.title} because the same signal already exists.`,
      entityType: "signal",
      entityId: duplicate.id,
      metadata: {
        source: params.source,
        appId: params.appId,
        duplicateSignalId: duplicate.id,
        externalId: params.externalId,
      },
    })
    return duplicate.id
  }

  const signalId = crypto.randomUUID()
  await db.insert(signal).values({
    id: signalId,
    organizationId: params.organizationId,
    appId: params.appId,
    externalId: params.externalId,
    source: params.source,
    status: "new",
    title: params.title,
    content: params.content,
    customerName: params.customerName ?? null,
    customerEmail: params.customerEmail ?? null,
    metadata: params.metadata ?? null,
    detectedAt: params.detectedAt ?? new Date(),
  })

  eventBus.emit("signal:created", {
    organizationId: params.organizationId,
    signalId,
  })

  await logAgentActivity({
    organizationId: params.organizationId,
    activityType: "signal_received",
    title: "Signal Received",
    description: `Received ${params.source} signal: ${params.title}.`,
    entityType: "signal",
    entityId: signalId,
    metadata: {
      source: params.source,
      appId: params.appId,
      externalId: params.externalId,
      customerName: params.customerName ?? null,
      customerEmail: params.customerEmail ?? null,
    },
  })

  await enqueueSignal({
    signalId,
    organizationId: params.organizationId,
    source: params.source,
    createdAt: new Date().toISOString(),
  })

  await logAgentActivity({
    organizationId: params.organizationId,
    activityType: "signal_queued",
    title: "Signal Queued",
    description:
      "Queued " +
      params.source +
      " signal for agent processing: " +
      params.title +
      ".",
    entityType: "signal",
    entityId: signalId,
    metadata: {
      source: params.source,
      appId: params.appId,
      externalId: params.externalId,
    },
  })

  return signalId
}
