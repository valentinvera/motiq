import { db } from "@motiq/db"
import { organization } from "@motiq/db/schema/auth"
import { eq } from "drizzle-orm"

export type NotificationPreferenceKey =
  | "daily_digest"
  | "critical_alerts"
  | "new_patterns"
  | "churn_risk"

type NotificationPreferences = Record<NotificationPreferenceKey, boolean>

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  daily_digest: false,
  critical_alerts: false,
  new_patterns: false,
  churn_risk: false,
}

function parseMetadata(metadata: string | null) {
  if (!metadata) {
    return {}
  }

  try {
    return JSON.parse(metadata) as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function getNotificationPreferences(
  organizationId: string
): Promise<NotificationPreferences> {
  const [org] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1)

  const metadata = parseMetadata(org?.metadata ?? null)
  const notifications =
    metadata.notifications && typeof metadata.notifications === "object"
      ? (metadata.notifications as Record<string, unknown>)
      : {}

  return {
    daily_digest:
      typeof notifications.daily_digest === "boolean"
        ? notifications.daily_digest
        : DEFAULT_NOTIFICATION_PREFERENCES.daily_digest,
    critical_alerts:
      typeof notifications.critical_alerts === "boolean"
        ? notifications.critical_alerts
        : DEFAULT_NOTIFICATION_PREFERENCES.critical_alerts,
    new_patterns:
      typeof notifications.new_patterns === "boolean"
        ? notifications.new_patterns
        : DEFAULT_NOTIFICATION_PREFERENCES.new_patterns,
    churn_risk:
      typeof notifications.churn_risk === "boolean"
        ? notifications.churn_risk
        : DEFAULT_NOTIFICATION_PREFERENCES.churn_risk,
  }
}

export async function isNotificationEnabled(
  organizationId: string,
  key: NotificationPreferenceKey
) {
  const preferences = await getNotificationPreferences(organizationId)
  return preferences[key]
}
