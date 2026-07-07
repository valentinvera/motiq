import { db } from "@motiq/db"
import { agentAction } from "@motiq/db/schema/agent-actions"
import { app } from "@motiq/db/schema/apps"
import { autonomyRule } from "@motiq/db/schema/autonomy-rules"
import { and, eq } from "drizzle-orm"
import { sendSlackMessage } from "../../routes/apps/slack"
import { logAgentActivity } from "../activity-audit"
import { eventBus } from "../event-bus"
import {
  isNotificationEnabled,
  type NotificationPreferenceKey,
} from "../notification-preferences"

interface AlertPayload {
  alertId?: string
  title: string
  severity: string
  type: string
  description: string | null
  organizationId: string
}

export async function notifySlackAlert(
  payload: AlertPayload
): Promise<boolean> {
  const preferenceKey = getAlertNotificationPreference(payload)

  if (!(await isNotificationEnabled(payload.organizationId, preferenceKey))) {
    await logAgentActivity({
      organizationId: payload.organizationId,
      activityType: "action_proposed",
      title: "Slack Alert Suppressed (Notifications Off)",
      description: `${getNotificationLabel(preferenceKey)} notifications are disabled for this workspace. Would have alerted: ${payload.title}`,
    })
    return false
  }

  const rule = await db.query.autonomyRule.findFirst({
    where: and(
      eq(autonomyRule.organizationId, payload.organizationId),
      eq(autonomyRule.actionType, "slack_escalation")
    ),
  })

  const level = rule?.autonomyLevel ?? "suggest"

  if (level === "observe") {
    await logAgentActivity({
      organizationId: payload.organizationId,
      activityType: "action_proposed",
      title: "Slack Escalation Suppressed (Observe Mode)",
      description: `Would have alerted: ${payload.title}`,
    })
    return false
  }

  if (level === "suggest") {
    const actionId = crypto.randomUUID()
    await db.insert(agentAction).values({
      id: actionId,
      organizationId: payload.organizationId,
      actionType: "slack_escalation",
      status: "proposed",
      title: "Slack Escalation Proposed",
      description: `Pending approval to alert: ${payload.title}`,
      payload: {
        alertId: payload.alertId,
        targetPayload: payload as unknown as Record<string, unknown>,
      },
    })
    eventBus.emit("action:proposed", {
      organizationId: payload.organizationId,
      actionId,
    })
    await logAgentActivity({
      organizationId: payload.organizationId,
      activityType: "action_proposed",
      title: "Slack Escalation Proposed",
      description: `Pending approval to alert: ${payload.title}`,
      entityType: "agent_action",
      entityId: actionId,
    })
    return false
  }

  const slackApps = await db
    .select()
    .from(app)
    .where(
      and(
        eq(app.organizationId, payload.organizationId),
        eq(app.type, "slack"),
        eq(app.status, "active")
      )
    )

  if (slackApps.length === 0) {
    await logAgentActivity({
      organizationId: payload.organizationId,
      activityType: "action_failed",
      title: "Slack Escalation Failed",
      description: `No active Slack app is connected for alert: ${payload.title}`,
      entityType: "alert",
      entityId: payload.alertId ?? null,
      metadata: {
        alertId: payload.alertId ?? null,
        reason: "no_active_slack_app",
      },
    })
    return false
  }

  const severityEmoji: Record<string, string> = {
    critical: ":red_circle:",
    high: ":large_orange_circle:",
    medium: ":large_yellow_circle:",
    low: ":large_blue_circle:",
  }

  const emoji = severityEmoji[payload.severity] ?? ":white_circle:"

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} ${payload.title}`,
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
      fields: [
        {
          type: "mrkdwn",
          text: payload.description,
        },
      ],
    })
  }

  await logAgentActivity({
    organizationId: payload.organizationId,
    activityType: "action_started",
    title: "Slack Escalation Delivery Started",
    description: `Attempting to alert Slack: ${payload.title}`,
    entityType: "alert",
    entityId: payload.alertId ?? null,
    metadata: {
      alertId: payload.alertId ?? null,
      slackAppCount: slackApps.length,
    },
  })

  let sent = false
  let skippedSlackApps = 0
  for (const slackApp of slackApps) {
    const creds = slackApp.credentials as Record<string, unknown> | null
    const config = slackApp.config as Record<string, unknown> | null
    const accessToken = creds?.accessToken as string | undefined
    const channel = config?.incomingWebhookChannelId as string | undefined

    if (!(accessToken && channel)) {
      skippedSlackApps += 1
      continue
    }

    const ok = await sendSlackMessage(
      accessToken,
      channel,
      `${emoji} ${payload.title}`,
      blocks
    )
    if (ok) {
      sent = true
    }
  }

  if (!sent) {
    await logAgentActivity({
      organizationId: payload.organizationId,
      activityType: "action_failed",
      title: "Slack Escalation Failed",
      description: `Slack escalation could not be delivered: ${payload.title}`,
      entityType: "alert",
      entityId: payload.alertId ?? null,
      metadata: {
        alertId: payload.alertId ?? null,
        slackAppCount: slackApps.length,
        skippedSlackApps,
      },
    })
    return false
  }

  const actionId = crypto.randomUUID()
  await db.insert(agentAction).values({
    id: actionId,
    organizationId: payload.organizationId,
    actionType: "slack_escalation",
    status: "executed",
    title: "Slack Escalation Executed",
    description: `Alerted Slack: ${payload.title}`,
    payload: {
      alertId: payload.alertId,
      targetPayload: payload as unknown as Record<string, unknown>,
    },
    executedAt: new Date(),
  })
  await logAgentActivity({
    organizationId: payload.organizationId,
    activityType: "action_executed",
    title: "Slack Escalation Sent",
    description: `Alerted Slack: ${payload.title}`,
    entityType: "agent_action",
    entityId: actionId,
  })

  return true
}

function getAlertNotificationPreference(
  payload: AlertPayload
): NotificationPreferenceKey {
  if (payload.type === "churn_risk") {
    return "churn_risk"
  }

  if (["pattern", "spike", "trend", "recommendation"].includes(payload.type)) {
    return "new_patterns"
  }

  return "critical_alerts"
}

function getNotificationLabel(key: NotificationPreferenceKey) {
  const labels: Record<NotificationPreferenceKey, string> = {
    daily_digest: "Daily digest",
    critical_alerts: "Critical alert",
    new_patterns: "New pattern",
    churn_risk: "Churn risk",
  }
  return labels[key]
}
