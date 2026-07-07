import {
  generateStructuredObject,
  repairJsonOutput,
  triageModel,
} from "@motiq/ai"
import { z } from "zod"

const triageSchema = z.object({
  type: z.enum([
    "bug",
    "feature_request",
    "complaint",
    "question",
    "praise",
    "churn_risk",
    "other",
  ]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  sentiment: z.number().min(-1).max(1),
  revenueImpact: z.string(),
})

export type TriageResult = z.infer<typeof triageSchema>

interface TriageInput {
  title: string
  content: string
  source: string
  customerName: string | null
  customerTier: string | null
}

export async function triageSignal(input: TriageInput): Promise<TriageResult> {
  const { output } = await generateStructuredObject({
    model: triageModel,
    schema: triageSchema,
    temperature: 0,
    repairText: repairJsonOutput,
    prompt: `You are a customer feedback triage agent for a B2B SaaS platform. Classify the following customer signal. Return only valid JSON matching the requested schema. Do not include Markdown, headings, tables, prose, or code fences.

Source: ${input.source}
${input.customerName ? `Customer: ${input.customerName}` : ""}
${input.customerTier ? `Tier: ${input.customerTier}` : ""}

Title: ${input.title}

Content:
${input.content}

Classify this signal:
- type: What kind of feedback is this? (bug, feature_request, complaint, question, praise, churn_risk, other)
- priority: How urgent is this? Consider customer tier and business impact. (critical, high, medium, low)
- sentiment: Score from -1 (very negative) to 1 (very positive)
- revenueImpact: Brief description of estimated revenue/business impact`,
  })

  return output
}
