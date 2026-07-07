import { db } from "@motiq/db"
import { autonomyRule } from "@motiq/db/schema/autonomy-rules"
import { eq } from "drizzle-orm"

const DEFAULT_RULES = [
  { actionType: "slack_escalation", autonomyLevel: "suggest" },
] as const

export async function ensureDefaultAutonomyRules(organizationId: string) {
  const existing = await db
    .select({ actionType: autonomyRule.actionType })
    .from(autonomyRule)
    .where(eq(autonomyRule.organizationId, organizationId))

  const existingTypes = new Set(existing.map((rule) => rule.actionType))
  const missing = DEFAULT_RULES.filter(
    (rule) => !existingTypes.has(rule.actionType)
  )

  if (missing.length === 0) {
    return
  }

  await db.insert(autonomyRule).values(
    missing.map((rule) => ({
      id: crypto.randomUUID(),
      organizationId,
      actionType: rule.actionType,
      autonomyLevel: rule.autonomyLevel,
      autoApproveThreshold: 10,
    }))
  )
}
