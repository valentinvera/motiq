import { ingestSignal } from "../routes/apps/_helpers.js"
import { logAgentActivity } from "./activity-audit.js"
import {
  type ExtractedFeedbackItem,
  extractFeedbackItemsFromSlackMessage,
} from "./agents/extract-feedback-items.js"

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
  extractFeedbackItems?: boolean
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

function getSingleFeedbackItem(text: string): ExtractedFeedbackItem {
  return {
    title: getSlackSignalTitle(text),
    content: text,
    customerName: null,
  }
}

async function logExtractionSkipped(params: SlackMessageSignalParams) {
  await logAgentActivity({
    organizationId: params.organizationId,
    activityType: "agent_run_completed",
    title: "Slack Feedback Extraction Skipped",
    description: "Ingested Slack message directly for faster processing.",
    entityType: "slack_message",
    entityId: params.messageTs,
    metadata: {
      appId: params.appId,
      channel: params.channel,
      ingestionMode: params.ingestionMode ?? "events",
    },
  })
}

async function logExtractionStarted(params: SlackMessageSignalParams) {
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
}

async function logExtractionCompleted(
  params: SlackMessageSignalParams,
  itemCount: number
) {
  await logAgentActivity({
    organizationId: params.organizationId,
    activityType: "agent_run_completed",
    title: "Slack Feedback Extraction Completed",
    description: `Extracted ${itemCount} feedback item${itemCount === 1 ? "" : "s"}.`,
    entityType: "slack_message",
    entityId: params.messageTs,
    metadata: {
      appId: params.appId,
      channel: params.channel,
      itemCount,
      ingestionMode: params.ingestionMode ?? "events",
    },
  })
}

async function logExtractionFailed(
  params: SlackMessageSignalParams,
  error: unknown
) {
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
}

async function getFeedbackItemsFromMessage(
  params: SlackMessageSignalParams,
  text: string
) {
  if (params.extractFeedbackItems === false) {
    await logExtractionSkipped(params)
    return [getSingleFeedbackItem(text)]
  }

  await logExtractionStarted(params)

  try {
    const items = await extractFeedbackItemsFromSlackMessage({ text })
    await logExtractionCompleted(params, items.length)
    return items
  } catch (error) {
    console.error(
      "[slack] Feedback extraction failed, ingesting message as one signal:",
      error
    )
    await logExtractionFailed(params, error)
    return [getSingleFeedbackItem(text)]
  }
}

export async function ingestSlackMessageSignals(
  params: SlackMessageSignalParams
) {
  const text = params.text.trim()
  if (!text || isMotiqGeneratedSlackMessage(text)) {
    return []
  }

  const items = await getFeedbackItemsFromMessage(params, text)

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
