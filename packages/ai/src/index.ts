import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { LanguageModelV3 } from "@ai-sdk/provider"
import { env } from "@motiq/env/api"

export const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export const model: LanguageModelV3 = google("gemini-2.5-flash")

export const MODEL_ID = "gemini-2.5-flash" as const

// biome-ignore lint/performance/noBarrelFile: re-exporting AI SDK utilities for convenience
export { generateObject, generateText, streamObject, streamText } from "ai"
