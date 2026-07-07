import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import type { LanguageModelV3 } from "@ai-sdk/provider"
import { env } from "@motiq/env/api"
import { generateText, Output } from "ai"
import type { z } from "zod"

const FENCED_JSON_PATTERN = /```(?:json)?\s*([\s\S]*?)```/i
const TRIAGE_TYPE_TABLE_PATTERN = /\|\s*\*\*type\*\*\s*\|\s*`?([a-z_]+)`?\s*\|/i
const TRIAGE_PRIORITY_TABLE_PATTERN =
  /\|\s*\*\*priority\*\*\s*\|\s*`?([a-z_]+)`?\s*\|/i
const TRIAGE_SENTIMENT_TABLE_PATTERN =
  /\|\s*\*\*sentiment\*\*\s*\|\s*`?(-?\d+(?:\.\d+)?)`?\s*\|/i
const TRIAGE_REVENUE_IMPACT_TABLE_PATTERN =
  /\|\s*\*\*revenueImpact\*\*\s*\|\s*(.*?)\s*\|/i
const MARKDOWN_BOLD_PATTERN = /\*\*/g

export const openrouter = createOpenAICompatible({
  name: "openrouter",
  apiKey: env.OPENROUTER_AI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  supportsStructuredOutputs: true,
  headers: {
    "HTTP-Referer": env.CORS_ORIGIN,
    "X-Title": env.APP_NAME,
  },
})

export function repairJsonOutput({ text }: { text: string }) {
  const trimmed = text.trim()

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed
  }

  const fencedJson = FENCED_JSON_PATTERN.exec(text)?.[1]?.trim()
  if (fencedJson) {
    return fencedJson
  }

  const objectStart = text.indexOf("{")
  const arrayStart = text.indexOf("[")
  const starts = [objectStart, arrayStart].filter((index) => index >= 0)
  const start = starts.length > 0 ? Math.min(...starts) : -1

  if (start >= 0) {
    const endChar = text[start] === "{" ? "}" : "]"
    const end = text.lastIndexOf(endChar)
    if (end > start) {
      return text.slice(start, end + 1).trim()
    }
  }

  const type = TRIAGE_TYPE_TABLE_PATTERN.exec(text)?.[1]
  const priority = TRIAGE_PRIORITY_TABLE_PATTERN.exec(text)?.[1]
  const sentimentText = TRIAGE_SENTIMENT_TABLE_PATTERN.exec(text)?.[1]
  const revenueImpact = TRIAGE_REVENUE_IMPACT_TABLE_PATTERN.exec(text)?.[1]

  if (type && priority && sentimentText && revenueImpact) {
    return JSON.stringify({
      type,
      priority,
      sentiment: Number(sentimentText),
      revenueImpact: revenueImpact.replace(MARKDOWN_BOLD_PATTERN, "").trim(),
    })
  }

  return null
}

type RepairStructuredTextFunction = (options: {
  text: string
  error: unknown
}) => Promise<string | null> | string | null

export async function generateStructuredObject<TSchema extends z.ZodType>({
  model,
  schema,
  prompt,
  temperature,
  repairText,
}: {
  model: LanguageModelV3
  schema: TSchema
  prompt: string
  temperature?: number
  repairText?: RepairStructuredTextFunction
}): Promise<{ output: z.infer<TSchema> }> {
  try {
    const result = await generateText({
      model,
      output: Output.object({ schema }),
      prompt,
      temperature,
    })

    return { output: result.output as z.infer<TSchema> }
  } catch (error) {
    if (!repairText) {
      throw error
    }

    const textResult = await generateText({
      model,
      prompt,
      temperature,
    })
    const repaired = await repairText({ text: textResult.text, error })

    if (!repaired) {
      throw error
    }

    return { output: schema.parse(JSON.parse(repaired)) as z.infer<TSchema> }
  }
}

export const OPENROUTER_MODELS = {
  extraction: "minimax/minimax-m3",
  triage: "minimax/minimax-m3",
  risk: "qwen/qwen3.7-plus",
  chat: "deepseek/deepseek-v4-flash",
  premium: "qwen/qwen3.7-max",
  chatFallback: "moonshotai/kimi-k2.6",
} as const

export const extractionModel: LanguageModelV3 = openrouter(
  OPENROUTER_MODELS.extraction
)
export const triageModel: LanguageModelV3 = openrouter(OPENROUTER_MODELS.triage)
export const riskModel: LanguageModelV3 = openrouter(OPENROUTER_MODELS.risk)
export const chatModel: LanguageModelV3 = openrouter(OPENROUTER_MODELS.chat)
export const premiumModel: LanguageModelV3 = openrouter(
  OPENROUTER_MODELS.premium
)
export const chatFallbackModel: LanguageModelV3 = openrouter(
  OPENROUTER_MODELS.chatFallback
)

export const model = triageModel

export const MODEL_ID = OPENROUTER_MODELS.triage

export type { UIMessage } from "ai"
// biome-ignore lint/performance/noBarrelFile: re-exporting AI SDK utilities for convenience
export {
  convertToModelMessages,
  generateText,
  Output,
  stepCountIs,
  streamText,
  tool,
  validateUIMessages,
} from "ai"
