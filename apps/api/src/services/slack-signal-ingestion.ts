import { ingestSignal } from "../routes/apps/_helpers"
import { logAgentActivity } from "./activity-audit"
import {
  type ExtractedFeedbackItem,
  extractFeedbackItemsFromSlackMessage,
} from "./agents/extract-feedback-items"

const MOTIQ_GENERATED_SLACK_MESSAGE_PATTERN =
  /^:(?:red_circle|large_orange_circle|large_yellow_circle|large_blue_circle|white_circle):\s+slack:/

interface SlackMessageSignalParams {
  organizationId: string
  appId: string
  text: string
  userId?: string | null
  channel: string
  channelName?: string
  messageTs: string
  ingestionMode?: "events" | "polling"
  detectedAt: Date
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function isMotiqGeneratedSlackMessage(text: string) {
  const normalized = normalizeWhitespace(text).toLowerCase()
  return (
    MOTIQ_GENERATED_SLACK_MESSAGE_PATTERN.test(normalized) ||
    (normalized.includes("*severity:*") && normalized.includes("*type:*"))
  )
}

function getSlackSignalTitle(text: string) {
  const preview = normalizeWhitespace(text)
  if (!preview) {
    return "Slack message"
  }

  return `Slack: ${truncate(preview, 80)}`
}

export async function ingestSlackMessageSignals(
  params: SlackMessageSignalParams
) {
  const text = params.text.trim()
  if (!text || isMotiqGeneratedSlackMessage(text)) {
    return []
  }

  await logAgentActivity({
    organizationId: params.organizationId,
    activityType: "agent_run_started",
    title: "Slack Feedback Extraction Started",
    description: "Extracting feedback items from Slack message.",
    entityType: "slack_message",
    entityId: params.messageTs,
    metadata: {
      appId: params.appId,
      channel: params.channel,
      channelName: params.channelName,
      ingestionMode: params.ingestionMode ?? "events",
    },
  })

  let items: ExtractedFeedbackItem[]
  try {
    items = await extractFeedbackItemsFromSlackMessage({ text })
  } catch (error) {
    console.error(
      "[slack] Feedback extraction failed, ingesting message as one signal:",
      error
    )
    await logAgentActivity({
      organizationId: params.organizationId,
      activityType: "agent_run_failed",
      title: "Slack Feedback Extraction Failed",
      description:
        error instanceof Error ? error.message : "Unknown extraction error",
      entityType: "slack_message",
      entityId: params.messageTs,
      metadata: { appId: params.appId, channel: params.channel },
    })
    items = [
      {
        title: getSlackSignalTitle(text),
        content: text,
        customerName: null,
      },
    ]
  }

  await logAgentActivity({
    organizationId: params.organizationId,
    activityType: "agent_run_completed",
    title: "Slack Feedback Extraction Completed",
    description: `Extracted ${items.length} feedback item${items.length === 1 ? "" : "s"}.`,
    entityType: "slack_message",
    entityId: params.messageTs,
    metadata: {
      appId: params.appId,
      channel: params.channel,
      itemCount: items.length,
      ingestionMode: params.ingestionMode ?? "events",
    },
  })

  const signalIds: string[] = []
  for (const [index, item] of items.entries()) {
    const content = item.content.trim()
    if (!content) {
      continue
    }

    const title = item.title.trim()
    const signalId = await ingestSignal({
      organizationId: params.organizationId,
      appId: params.appId,
      externalId: `${params.messageTs}:${index}`,
      source: "slack",
      title: title
        ? `Slack: ${truncate(normalizeWhitespace(title), 80)}`
        : getSlackSignalTitle(content),
      content,
      customerName: item.customerName?.trim() || params.userId || null,
      metadata: {
        channel: params.channel,
        channelName: params.channelName,
        userId: params.userId,
        timestamp: params.messageTs,
        originalMessage: text,
        itemIndex: index,
        itemCount: items.length,
        ingestionMode: params.ingestionMode ?? "events",
      },
      detectedAt: params.detectedAt,
    })

    signalIds.push(signalId)
  }

  return signalIds
}
