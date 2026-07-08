import {
  type BillingPlan,
  type BillingPlanSlug,
  billingPlans,
} from "@motiq/auth/plans"

type Primitive = string | number | boolean

interface ActiveSubscription {
  amount: number | null
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date | string | null
  id: string | null
  metadata: Record<string, Primitive>
  productId: string | null
}

export interface ActiveBillingPlan {
  plan: BillingPlan
  subscription: ActiveSubscription
}

const checkoutPlans = billingPlans.filter((plan) => plan.checkout)

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object")
}

function getArrayField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) {
      return value
    }
  }

  return []
}

function getRecordField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (isRecord(value)) {
      return value
    }
  }

  return {}
}

function getStringField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string") {
      return value
    }
  }

  return null
}

function getNumberField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "number") {
      return value
    }
  }

  return null
}

function getBooleanField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "boolean") {
      return value
    }
  }

  return false
}

function getDateField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" || value instanceof Date) {
      return value
    }
  }

  return null
}

function toPrimitiveRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, Primitive] => {
      const value = entry[1]
      return (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      )
    })
  )
}

function isBillingPlanSlug(value: unknown): value is BillingPlanSlug {
  return checkoutPlans.some((plan) => plan.slug === value)
}

function planFromAmount(amount: number | null) {
  if (amount === 29_900) {
    return billingPlans.find((plan) => plan.slug === "starter") ?? null
  }

  if (amount === 79_900) {
    return billingPlans.find((plan) => plan.slug === "growth") ?? null
  }

  return null
}

function getPlanForSubscription(subscription: ActiveSubscription) {
  const planSlug = subscription.metadata.plan
  if (isBillingPlanSlug(planSlug)) {
    return billingPlans.find((plan) => plan.slug === planSlug) ?? null
  }

  return planFromAmount(subscription.amount)
}

function normalizeSubscription(value: unknown): ActiveSubscription | null {
  if (!isRecord(value)) {
    return null
  }

  const metadata = getRecordField(value, ["metadata"])

  return {
    amount: getNumberField(value, ["amount"]),
    cancelAtPeriodEnd: getBooleanField(value, [
      "cancelAtPeriodEnd",
      "cancel_at_period_end",
    ]),
    currentPeriodEnd: getDateField(value, [
      "currentPeriodEnd",
      "current_period_end",
    ]),
    id: getStringField(value, ["id"]),
    metadata: toPrimitiveRecord(metadata),
    productId: getStringField(value, ["productId", "product_id"]),
  }
}

export function getActiveBillingPlan(
  customerState: unknown
): ActiveBillingPlan | null {
  if (!isRecord(customerState)) {
    return null
  }

  const subscriptions = getArrayField(customerState, [
    "activeSubscriptions",
    "active_subscriptions",
  ])

  for (const value of subscriptions) {
    const subscription = normalizeSubscription(value)
    if (!subscription) {
      continue
    }

    const plan = getPlanForSubscription(subscription)
    if (plan) {
      return { plan, subscription }
    }
  }

  return null
}

export function formatBillingDate(value: Date | string | null) {
  if (!value) {
    return "Not scheduled"
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}
