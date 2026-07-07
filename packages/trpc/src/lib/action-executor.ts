import { db } from "@motiq/db"
import { agentAction as actionTable } from "@motiq/db/schema/agent-actions"
import { app } from "@motiq/db/schema/apps"
import { and, eq } from "drizzle-orm"
import { logActivity } from "./activity-log"

type AgentAction = typeof actionTable.$inferSelect

interface SlackAlertPayload {
  title: string
  severity: string
  type: string
  description: string | null
  organizationId: string
}

export async function executeApprovedAction(params: {
  action: AgentAction
  approvedBy: string
}) {
  if (params.action.actionType === "slack_escalation") {
    return await executeSlackEscalation(params)
  }

  throw new Error(`${params.action.actionType} execution is not available yet`)
}

async function executeSlackEscalation({
  action,
  approvedBy,
}: {
  action: AgentAction
  approvedBy: string
}) {
  const payload = getSlackPayload(action)
  const slackApps = await db
    .select()
    .from(app)
    .where(
      and(
        eq(app.organizationId, action.organizationId),
        eq(app.type, "slack"),
        eq(app.status, "active")
      )
    )

  if (slackApps.length === 0) {
    await logActivity({
      organizationId: action.organizationId,
      activityType: "action_failed",
      title: "Slack Escalation Failed",
      description: "No active Slack app is connected.",
      entityType: "agent_action",
      entityId: action.id,
    })
    throw new Error("No active Slack app is connected")
  }

  let sent = false
  for (const slackApp of slackApps) {
    const creds = slackApp.credentials as Record<string, unknown> | null
    const config = slackApp.config as Record<string, unknown> | null
    const accessToken = creds?.accessToken as string | undefined
    const channel = config?.incomingWebhookChannelId as string | undefined
    if (!(accessToken && channel)) {
      continue
    }

    const ok = await sendSlackMessage({
      accessToken,
      channel,
      text: `${severityEmoji(payload.severity)} ${payload.title}`,
      blocks: buildSlackBlocks(payload),
    })
    sent ||= ok
  }

  if (!sent) {
    await logActivity({
      organizationId: action.organizationId,
      activityType: "action_failed",
      title: "Slack Escalation Failed",
      description: "Slack escalation could not be delivered.",
      entityType: "agent_action",
      entityId: action.id,
    })
    throw new Error("Slack escalation could not be delivered")
  }

  await db
    .update(actionTable)
    .set({
      status: "executed",
      approvedBy,
      executedAt: new Date(),
    })
    .where(eq(actionTable.id, action.id))

  await logActivity({
    organizationId: action.organizationId,
    activityType: "action_executed",
    title: "Slack Escalation Sent",
    description: `Alerted Slack: ${payload.title}`,
    entityType: "agent_action",
    entityId: action.id,
  })

  return { executed: true }
}

function getSlackPayload(action: AgentAction): SlackAlertPayload {
  const payload = action.payload ?? {}
  const targetPayload = payload.targetPayload as
    | Partial<SlackAlertPayload>
    | undefined

  return {
    title: targetPayload?.title ?? action.title,
    severity: targetPayload?.severity ?? "medium",
    type: targetPayload?.type ?? "alert",
    description: targetPayload?.description ?? action.description ?? null,
    organizationId: action.organizationId,
  }
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

function buildSlackBlocks(payload: SlackAlertPayload) {
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
        {
          type: "mrkdwn",
          text: `*Severity:*\n${payload.severity}`,
        },
        {
          type: "mrkdwn",
          text: `*Type:*\n${payload.type.replace("_", " ")}`,
        },
      ],
    },
  ]

  if (payload.description) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: payload.description,
      },
    })
  }

  return blocks
}

async function sendSlackMessage(params: {
  accessToken: string
  channel: string
  text: string
  blocks: unknown[]
}) {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: params.channel,
      text: params.text,
      blocks: params.blocks,
    }),
  })

  const data = (await response.json()) as { ok: boolean; error?: string }
  if (!data.ok) {
    console.error("[actions] Slack delivery failed:", data.error)
  }
  return data.ok
}
