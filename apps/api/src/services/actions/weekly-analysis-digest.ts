import { db } from "@motiq/db"
import { alert } from "@motiq/db/schema/alerts"
import { member, organization, user } from "@motiq/db/schema/auth"
import { customer } from "@motiq/db/schema/customers"
import { signal } from "@motiq/db/schema/signals"
import { env } from "@motiq/env/api"
import { sendReactEmail } from "@motiq/mail/resend"
import type { InferSelectModel } from "drizzle-orm"
import { and, desc, eq, gte, inArray } from "drizzle-orm"

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const MAX_WEEKLY_ROWS = 1000
const DIACRITIC_REGEX = /[\u0300-\u036f]/g
const NON_WORD_REGEX = /[^\p{L}\p{N}\s-]/gu
const ROLE_SPLIT_REGEX = /[,\s]+/
const UNDERSCORE_REGEX = /_/g
const WHITESPACE_REGEX = /\s+/

type AlertRecord = InferSelectModel<typeof alert>
type CustomerRecord = InferSelectModel<typeof customer>
type OrganizationRecord = InferSelectModel<typeof organization>
type SignalRecord = InferSelectModel<typeof signal>

interface CountedItem {
  label: string
  count: number
  percentage: number
}

interface Analysis {
  criticalAlerts: number
  customerConcentration: string
  recommendations: string[]
  repeatedCustomers: Array<{
    name: string
    count: number
    company?: string | null
    email?: string | null
  }>
  repeatedThemes: string[]
  topAlertChannel: CountedItem | null
  topAlertSource: CountedItem | null
  topAlertType: CountedItem | null
  topSignalChannel: CountedItem | null
  topSignalSource: CountedItem | null
  topSignalType: CountedItem | null
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "cada",
  "como",
  "could",
  "desde",
  "does",
  "esta",
  "este",
  "esto",
  "from",
  "have",
  "into",
  "para",
  "pero",
  "porq",
  "porque",
  "that",
  "them",
  "this",
  "todo",
  "with",
  "would",
  "your",
])

function appUrl(path: string) {
  return new URL(path, env.CORS_ORIGIN).toString()
}

function formatDateRange(since: Date, now: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return `${formatter.format(since)} - ${formatter.format(now)}`
}

function titleize(value: string) {
  return value
    .replace(UNDERSCORE_REGEX, " ")
    .split(WHITESPACE_REGEX)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[]
) {
  if (!metadata) {
    return null
  }

  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function getSignalChannel(record: SignalRecord) {
  return (
    getMetadataString(record.metadata, [
      "channelName",
      "channel",
      "channelId",
    ]) ?? titleize(record.source)
  )
}

function getAlertSignal(
  record: AlertRecord,
  signalsById: Map<string, SignalRecord>
) {
  return record.signalId ? signalsById.get(record.signalId) : null
}

function getAlertSource(
  record: AlertRecord,
  signalsById: Map<string, SignalRecord>
) {
  const relatedSignal = getAlertSignal(record, signalsById)
  if (relatedSignal) {
    return titleize(relatedSignal.source)
  }

  return getMetadataString(record.metadata, ["source", "app", "provider"])
}

function getAlertChannel(
  record: AlertRecord,
  signalsById: Map<string, SignalRecord>
) {
  const relatedSignal = getAlertSignal(record, signalsById)
  if (relatedSignal) {
    return getSignalChannel(relatedSignal)
  }

  return getMetadataString(record.metadata, [
    "channelName",
    "channel",
    "channelId",
  ])
}

function countBy<T>(
  items: T[],
  getLabel: (item: T) => string | null | undefined
) {
  const counts = new Map<string, number>()

  for (const item of items) {
    const label = getLabel(item)?.trim()
    if (!label) {
      continue
    }
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ count, label }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function topItem<T>(
  items: T[],
  getLabel: (item: T) => string | null | undefined
): CountedItem | null {
  const [top] = countBy(items, getLabel)
  if (!top) {
    return null
  }

  return {
    ...top,
    percentage: Math.round((top.count / items.length) * 100),
  }
}

function normalizeToken(value: string) {
  return value.normalize("NFD").replace(DIACRITIC_REGEX, "").toLowerCase()
}

function getRepeatedThemes(signals: SignalRecord[], alerts: AlertRecord[]) {
  const counts = new Map<string, number>()
  const content = [
    ...signals.map((record) => `${record.title} ${record.content}`),
    ...alerts.map((record) => `${record.title} ${record.description ?? ""}`),
  ]
    .join(" ")
    .replace(NON_WORD_REGEX, " ")

  for (const token of normalizeToken(content).split(WHITESPACE_REGEX)) {
    if (token.length < 4 || STOP_WORDS.has(token)) {
      continue
    }
    counts.set(token, (counts.get(token) ?? 0) + 1)
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([word, count]) => `${titleize(word)} appeared ${count} times`)
}

function mapCustomers(customers: CustomerRecord[]) {
  const byId = new Map<string, CustomerRecord>()
  const byEmail = new Map<string, CustomerRecord>()
  const byName = new Map<string, CustomerRecord>()

  for (const record of customers) {
    byId.set(record.id, record)
    byEmail.set(record.email.toLowerCase(), record)
    if (record.name) {
      byName.set(record.name.toLowerCase(), record)
    }
  }

  return { byEmail, byId, byName }
}

function getCustomerForSignal(
  record: SignalRecord,
  customerMaps: ReturnType<typeof mapCustomers>
) {
  if (record.customerId) {
    const match = customerMaps.byId.get(record.customerId)
    if (match) {
      return match
    }
  }

  if (record.customerEmail) {
    const match = customerMaps.byEmail.get(record.customerEmail.toLowerCase())
    if (match) {
      return match
    }
  }

  if (record.customerName) {
    const match = customerMaps.byName.get(record.customerName.toLowerCase())
    if (match) {
      return match
    }
  }

  return null
}

function getCustomerKey(record: SignalRecord, profile: CustomerRecord | null) {
  if (profile) {
    return profile.id
  }
  if (record.customerEmail) {
    return record.customerEmail.toLowerCase()
  }
  if (record.customerName) {
    return record.customerName.toLowerCase()
  }
  return null
}

function getCustomerLabel(
  record: SignalRecord,
  profile: CustomerRecord | null
) {
  return (
    profile?.company ??
    profile?.name ??
    record.customerName ??
    record.customerEmail ??
    "Unknown customer"
  )
}

function analyzeCustomers(
  signals: SignalRecord[],
  customers: CustomerRecord[]
) {
  const customerMaps = mapCustomers(customers)
  const counts = new Map<
    string,
    {
      company?: string | null
      count: number
      email?: string | null
      name: string
    }
  >()

  for (const record of signals) {
    const profile = getCustomerForSignal(record, customerMaps)
    const key = getCustomerKey(record, profile)
    if (!key) {
      continue
    }

    const existing = counts.get(key)
    if (existing) {
      existing.count += 1
      continue
    }

    counts.set(key, {
      company: profile?.company ?? null,
      count: 1,
      email: profile?.email ?? record.customerEmail ?? null,
      name: getCustomerLabel(record, profile),
    })
  }

  const sorted = [...counts.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  )

  const repeatedCustomers = sorted
    .filter((record) => record.count > 1)
    .slice(0, 5)

  if (sorted.length === 0) {
    return {
      customerConcentration:
        "No customer identities were captured in this week's signals.",
      repeatedCustomers,
    }
  }

  const topCustomer = sorted[0]
  if (!topCustomer) {
    return {
      customerConcentration:
        "No customer identities were captured in this week's signals.",
      repeatedCustomers,
    }
  }

  const percentage = Math.round((topCustomer.count / signals.length) * 100)

  if (sorted.length === 1) {
    return {
      customerConcentration: `All identified signals came from ${topCustomer.name}.`,
      repeatedCustomers,
    }
  }

  const accountText = topCustomer.company
    ? `the ${topCustomer.company} account`
    : topCustomer.name

  return {
    customerConcentration: `${accountText} represented ${percentage}% of identified signal volume across ${sorted.length} customer accounts.`,
    repeatedCustomers,
  }
}

function buildRecommendations(params: {
  criticalAlerts: number
  repeatedCustomers: Array<{ count: number; name: string }>
  topSignalChannel: CountedItem | null
  topSignalSource: CountedItem | null
  topSignalType: CountedItem | null
}) {
  const recommendations: string[] = []

  if (params.criticalAlerts > 0) {
    recommendations.push(
      "Prioritize critical alerts first and assign a clear owner for each unresolved escalation."
    )
  }

  if (params.topSignalType?.label === "Bug") {
    recommendations.push(
      "Bug reports led signal volume, so group the affected reports and validate whether one product area is causing repeated friction."
    )
  }

  if (params.topSignalType?.label === "Churn Risk") {
    recommendations.push(
      "Churn-risk language was prominent, so review the related accounts before renewal or expansion conversations."
    )
  }

  if ((params.topSignalChannel?.percentage ?? 0) >= 50) {
    recommendations.push(
      `${params.topSignalChannel?.label} is carrying most of the feedback volume; consider a tighter triage path for that channel.`
    )
  }

  if ((params.topSignalSource?.percentage ?? 0) >= 50) {
    recommendations.push(
      `${params.topSignalSource?.label} is the dominant source this week; confirm the integration is routed to the right team.`
    )
  }

  if (params.repeatedCustomers.length > 0) {
    const topCustomer = params.repeatedCustomers[0]
    if (!topCustomer) {
      return recommendations.slice(0, 4)
    }
    recommendations.push(
      `${topCustomer.name} appeared repeatedly; review their signal history before the next customer touchpoint.`
    )
  }

  return recommendations.slice(0, 4)
}

function buildAnalysis(
  signals: SignalRecord[],
  alerts: AlertRecord[],
  customers: CustomerRecord[],
  signalsById: Map<string, SignalRecord>
): Analysis {
  const topSignalSource = topItem(signals, (record) => titleize(record.source))
  const topSignalChannel = topItem(signals, getSignalChannel)
  const topAlertSource = topItem(alerts, (record) =>
    getAlertSource(record, signalsById)
  )
  const topAlertChannel = topItem(alerts, (record) =>
    getAlertChannel(record, signalsById)
  )
  const topSignalType = topItem(signals, (record) =>
    record.type ? titleize(record.type) : "Unclassified"
  )
  const topAlertType = topItem(alerts, (record) => titleize(record.type))
  const criticalAlerts = alerts.filter(
    (record) => record.severity === "critical"
  ).length
  const customerAnalysis = analyzeCustomers(signals, customers)

  return {
    criticalAlerts,
    customerConcentration: customerAnalysis.customerConcentration,
    recommendations: buildRecommendations({
      criticalAlerts,
      repeatedCustomers: customerAnalysis.repeatedCustomers,
      topSignalChannel,
      topSignalSource,
      topSignalType,
    }),
    repeatedCustomers: customerAnalysis.repeatedCustomers,
    repeatedThemes: getRepeatedThemes(signals, alerts),
    topAlertChannel,
    topAlertSource,
    topAlertType,
    topSignalChannel,
    topSignalSource,
    topSignalType,
  }
}

function isLeadershipRole(role: string) {
  const roles = role
    .split(ROLE_SPLIT_REGEX)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return roles.includes("owner") || roles.includes("admin")
}

async function getRecipients(organizationId: string) {
  const records = await db
    .select({
      email: user.email,
      name: user.name,
      role: member.role,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, organizationId))

  const recipients = new Map<string, { email: string; name: string }>()

  for (const record of records) {
    if (isLeadershipRole(record.role)) {
      recipients.set(record.email, {
        email: record.email,
        name: record.name,
      })
    }
  }

  return [...recipients.values()]
}

function getWeeklySignals(organizationId: string, since: Date) {
  return db
    .select()
    .from(signal)
    .where(
      and(
        eq(signal.organizationId, organizationId),
        gte(signal.createdAt, since)
      )
    )
    .orderBy(desc(signal.createdAt))
    .limit(MAX_WEEKLY_ROWS)
}

function getWeeklyAlerts(organizationId: string, since: Date) {
  return db
    .select()
    .from(alert)
    .where(
      and(eq(alert.organizationId, organizationId), gte(alert.createdAt, since))
    )
    .orderBy(desc(alert.createdAt))
    .limit(MAX_WEEKLY_ROWS)
}

function getRelatedSignals(
  organizationId: string,
  weeklySignals: SignalRecord[],
  weeklyAlerts: AlertRecord[]
) {
  const knownSignalIds = new Set(weeklySignals.map((record) => record.id))
  const missingSignalIds = [
    ...new Set(
      weeklyAlerts
        .map((record) => record.signalId)
        .filter((id): id is string => Boolean(id && !knownSignalIds.has(id)))
    ),
  ]

  if (missingSignalIds.length === 0) {
    return []
  }

  return db
    .select()
    .from(signal)
    .where(
      and(
        eq(signal.organizationId, organizationId),
        inArray(signal.id, missingSignalIds)
      )
    )
    .limit(MAX_WEEKLY_ROWS)
}

async function sendWeeklyAnalysisDigestForOrganization(
  org: OrganizationRecord,
  now: Date
) {
  const since = new Date(now.getTime() - WEEK_MS)
  const [weeklySignals, weeklyAlerts, customers, recipients] =
    await Promise.all([
      getWeeklySignals(org.id, since),
      getWeeklyAlerts(org.id, since),
      db.select().from(customer).where(eq(customer.organizationId, org.id)),
      getRecipients(org.id),
    ])

  if (weeklySignals.length === 0 && weeklyAlerts.length === 0) {
    return { sent: 0, skipped: true }
  }

  if (recipients.length === 0) {
    return { sent: 0, skipped: true }
  }

  const relatedSignals = await getRelatedSignals(
    org.id,
    weeklySignals,
    weeklyAlerts
  )
  const signalsById = new Map<string, SignalRecord>()

  for (const record of [...weeklySignals, ...relatedSignals]) {
    signalsById.set(record.id, record)
  }

  const analysis = buildAnalysis(
    weeklySignals,
    weeklyAlerts,
    customers,
    signalsById
  )
  const { WeeklyAnalysisEmail } = await import(
    "@motiq/mail/templates/weekly-analysis"
  )
  const dateRange = formatDateRange(since, now)

  let sent = 0
  for (const recipient of recipients) {
    const result = await sendReactEmail({
      to: recipient.email,
      subject: `Motiq Weekly Analysis - ${org.name}`,
      react: WeeklyAnalysisEmail({
        alertsUrl: appUrl("/alerts"),
        criticalAlerts: analysis.criticalAlerts,
        customerConcentration: analysis.customerConcentration,
        dateRange,
        organizationName: org.name,
        overviewUrl: appUrl("/overview"),
        recommendations: analysis.recommendations,
        repeatedCustomers: analysis.repeatedCustomers,
        repeatedThemes: analysis.repeatedThemes,
        topAlertChannel: analysis.topAlertChannel,
        topAlertSource: analysis.topAlertSource,
        topAlertType: analysis.topAlertType,
        topSignalChannel: analysis.topSignalChannel,
        topSignalSource: analysis.topSignalSource,
        topSignalType: analysis.topSignalType,
        totalAlerts: weeklyAlerts.length,
        totalSignals: weeklySignals.length,
      }),
    })

    if (result.success) {
      sent += 1
    }
  }

  return { sent, skipped: false }
}

export async function sendWeeklyAnalysisDigests(now = new Date()) {
  const organizations = await db.select().from(organization)
  let sent = 0
  let skipped = 0

  for (const org of organizations) {
    try {
      const result = await sendWeeklyAnalysisDigestForOrganization(org, now)
      sent += result.sent
      if (result.skipped) {
        skipped += 1
      }
    } catch (error) {
      skipped += 1
      console.error(
        "[cron] Weekly analysis failed for organization",
        org.id,
        error
      )
    }
  }

  return {
    organizations: organizations.length,
    sent,
    skipped,
  }
}
