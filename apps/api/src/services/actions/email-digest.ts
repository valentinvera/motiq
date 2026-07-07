import { db } from "@motiq/db"
import { agentAction } from "@motiq/db/schema/agent-actions"
import { alert } from "@motiq/db/schema/alerts"
import { member, organization, user } from "@motiq/db/schema/auth"
import { autonomyRule } from "@motiq/db/schema/autonomy-rules"
import { signal } from "@motiq/db/schema/signals"
import { sendReactEmail } from "@motiq/mail/resend"
import { and, count, eq, gte } from "drizzle-orm"
import { logAgentActivity } from "../activity-audit.js"
import { eventBus } from "../event-bus.js"
import { isNotificationEnabled } from "../notification-preferences.js"

export async function sendDailyDigest(
  organizationId: string
): Promise<{ sent: number }> {
  if (!(await isNotificationEnabled(organizationId, "daily_digest"))) {
    await logAgentActivity({
      organizationId,
      activityType: "action_proposed",
      title: "Daily Digest Suppressed (Notifications Off)",
      description:
        "Daily digest notifications are disabled for this workspace.",
    })
    return { sent: 0 }
  }

  const rule = await db.query.autonomyRule.findFirst({
    where: and(
      eq(autonomyRule.organizationId, organizationId),
      eq(autonomyRule.actionType, "daily_digest")
    ),
  })

  const level = rule?.autonomyLevel ?? "suggest"

  if (level === "observe") {
    await logAgentActivity({
      organizationId,
      activityType: "action_proposed",
      title: "Daily Digest Suppressed (Observe Mode)",
      description: "Would have sent the daily digest email.",
    })
    return { sent: 0 }
  }

  if (level === "suggest") {
    const actionId = crypto.randomUUID()
    await db.insert(agentAction).values({
      id: actionId,
      organizationId,
      actionType: "daily_digest",
      status: "proposed",
      title: "Daily Digest Proposed",
      description: "Pending approval to send daily digest.",
      payload: {},
    })
    eventBus.emit("action:proposed", {
      organizationId,
      actionId,
    })
    await logAgentActivity({
      organizationId,
      activityType: "action_proposed",
      title: "Daily Digest Proposed",
      description: "Pending approval to send daily digest.",
      entityType: "agent_action",
      entityId: actionId,
    })
    return { sent: 0 }
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1)

  if (!org) {
    return { sent: 0 }
  }

  const signalStats = await db
    .select({
      type: signal.type,
      count: count(),
    })
    .from(signal)
    .where(
      and(
        eq(signal.organizationId, organizationId),
        gte(signal.createdAt, since)
      )
    )
    .groupBy(signal.type)

  const totalSignals = signalStats.reduce((sum, s) => sum + s.count, 0)

  const criticalAlerts = await db
    .select()
    .from(alert)
    .where(
      and(
        eq(alert.organizationId, organizationId),
        eq(alert.acknowledged, false)
      )
    )
    .limit(10)

  const [unackResult] = await db
    .select({ count: count() })
    .from(alert)
    .where(
      and(
        eq(alert.organizationId, organizationId),
        eq(alert.acknowledged, false)
      )
    )

  const members = await db
    .select({ email: user.email, name: user.name })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, organizationId))

  if (members.length === 0 || totalSignals === 0) {
    return { sent: 0 }
  }

  const { DigestEmail } = await import("@motiq/mail/templates/digest")

  let sent = 0
  for (const m of members) {
    const result = await sendReactEmail({
      to: m.email,
      subject: `Motiq Daily Digest — ${totalSignals} signals`,
      react: DigestEmail({
        organizationName: org.name,
        date: new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        totalSignals,
        signalsByType: signalStats.map((s) => ({
          type: s.type ?? "unclassified",
          count: s.count,
        })),
        criticalAlerts: criticalAlerts.map((a) => ({
          title: a.title,
          severity: a.severity,
          type: a.type,
        })),
        unacknowledgedCount: unackResult?.count ?? 0,
        overviewUrl: "https://app.motiq.app/overview",
      }),
    })
    if (result.success) {
      sent++
    }
  }

  if (sent > 0) {
    const actionId = crypto.randomUUID()
    await db.insert(agentAction).values({
      id: actionId,
      organizationId,
      actionType: "daily_digest",
      status: "executed",
      title: "Daily Digest Executed",
      description: `Sent digest to ${sent} members.`,
      payload: { sentCount: sent },
      executedAt: new Date(),
    })
    await logAgentActivity({
      organizationId,
      activityType: "action_executed",
      title: "Daily Digest Sent",
      description: `Sent digest to ${sent} members.`,
      entityType: "agent_action",
      entityId: actionId,
    })
  }

  return { sent }
}
