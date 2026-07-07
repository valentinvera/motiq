import {
  extractionModel,
  generateStructuredObject,
  repairJsonOutput,
} from "@motiq/ai"
import { z } from "zod"

const extractedFeedbackItemSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  customerName: z.string().nullable().optional(),
})

const extractionSchema = z.object({
  items: z.array(extractedFeedbackItemSchema).min(1).max(20),
})

export type ExtractedFeedbackItem = z.infer<typeof extractedFeedbackItemSchema>

const CUSTOMER_VERB_PATTERN =
  /^(?<customer>[A-Z][A-Za-z0-9&.' -]{1,70}?)\s+(?:says|said|asked|reported|complained|praised|wants|want|needs|need|mentioned|told|is evaluating|are evaluating)\b/i
const CUSTOMER_VERB_MENTION_PATTERN =
  /\b[A-Z][A-Za-z0-9&.' -]{1,70}?\s+(?:says|said|asked|reported|complained|praised|wants|want|needs|need|mentioned|told|is evaluating|are evaluating)\b/g
const FEEDBACK_TYPE_PREFIX_PATTERN =
  /^\s*(?:bug|feature request|feature|complaint|question|praise|churn risk)\s*:\s*/i
const INTRO_BLOCK_PATTERN = /(?:feedback|roundup|summary|recap|this week)/
const LIST_PREFIX_PATTERN = /^\s*(?:[-*•]|\d+[.)])\s+/
const PARAGRAPH_SEPARATOR_PATTERN = /\n{2,}/
const LINE_SEPARATOR_PATTERN = /\n+/
const SENTENCE_SEPARATOR_PATTERN = /(?<=[.!?])\s+/
const WORD_SEPARATOR_PATTERN = /\s+/

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function isIntroBlock(block: string) {
  const normalized = normalizeWhitespace(block).toLowerCase()
  return (
    normalized.length <= 120 &&
    INTRO_BLOCK_PATTERN.test(normalized) &&
    !CUSTOMER_VERB_PATTERN.test(block)
  )
}

function removeListPrefix(block: string) {
  return block.replace(LIST_PREFIX_PATTERN, "").trim()
}

function getCandidateBlocks(text: string) {
  const paragraphBlocks = text
    .split(PARAGRAPH_SEPARATOR_PATTERN)
    .map(removeListPrefix)
    .filter(Boolean)
    .filter((block) => !isIntroBlock(block))

  if (paragraphBlocks.length >= 2) {
    return paragraphBlocks
  }

  return text
    .split(LINE_SEPARATOR_PATTERN)
    .map(removeListPrefix)
    .filter(Boolean)
    .filter((block) => !isIntroBlock(block))
}

function stripFeedbackTypePrefix(content: string) {
  return content.replace(FEEDBACK_TYPE_PREFIX_PATTERN, "")
}

function extractCustomerName(content: string) {
  return (
    CUSTOMER_VERB_PATTERN.exec(
      stripFeedbackTypePrefix(content)
    )?.groups?.customer?.trim() ?? null
  )
}

function countCustomerMentions(content: string) {
  return (
    stripFeedbackTypePrefix(content).match(CUSTOMER_VERB_MENTION_PATTERN)
      ?.length ?? 0
  )
}

function titleFromContent(content: string, customerName: string | null) {
  const normalized = normalizeWhitespace(content)
  const firstSentence =
    normalized.split(SENTENCE_SEPARATOR_PATTERN)[0] ?? normalized
  if (customerName) {
    return truncate(`${customerName}: ${firstSentence}`, 90)
  }

  return truncate(firstSentence, 90)
}

async function repairExtractionJsonOutput({ text }: { text: string }) {
  const repaired = await repairJsonOutput({ text })
  if (!repaired) {
    return null
  }

  try {
    const parsed = JSON.parse(repaired) as unknown

    if (Array.isArray(parsed)) {
      return JSON.stringify({ items: parsed })
    }

    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>
      if (Array.isArray(record.items)) {
        return repaired
      }

      if (
        typeof record.title === "string" &&
        typeof record.content === "string"
      ) {
        return JSON.stringify({ items: [record] })
      }
    }
  } catch {
    return repaired
  }

  return repaired
}

function toStructuredFeedbackItem(content: string) {
  const customerName = extractCustomerName(content)
  return {
    title: titleFromContent(content, customerName),
    content: content.trim(),
    customerName,
  }
}

function extractStructuredFeedbackItems(text: string) {
  const blocks = getCandidateBlocks(text)
  const signalLikeBlocks = blocks.filter((block) => {
    return (
      CUSTOMER_VERB_PATTERN.test(stripFeedbackTypePrefix(block)) ||
      block.split(WORD_SEPARATOR_PATTERN).length >= 8
    )
  })

  if (
    signalLikeBlocks.length === 1 &&
    countCustomerMentions(signalLikeBlocks[0] ?? "") <= 1
  ) {
    return [toStructuredFeedbackItem(signalLikeBlocks[0] ?? "")]
  }

  if (signalLikeBlocks.length < 2) {
    return null
  }

  return signalLikeBlocks.slice(0, 20).map(toStructuredFeedbackItem)
}

export async function extractFeedbackItemsFromSlackMessage(input: {
  text: string
}) {
  const structuredItems = extractStructuredFeedbackItems(input.text)
  if (structuredItems) {
    return structuredItems
  }

  const { output } = await generateStructuredObject({
    model: extractionModel,
    schema: extractionSchema,
    temperature: 0,
    repairText: repairExtractionJsonOutput,
    prompt: [
      "You are extracting customer feedback signals from a Slack message. Return only valid JSON matching the requested schema. Do not include Markdown, headings, prose, or code fences.",
      "",
      "Slack message:",
      input.text,
      "",
      "Return distinct customer feedback items only.",
      "Rules:",
      "- If the message contains one feedback item, return exactly one item.",
      "- If the message contains multiple unrelated bugs, requests, complaints, questions, praise, churn risks, or customer updates, return one item per feedback item.",
      "- If the message is a roundup, summary, digest, or list, each customer/company paragraph is usually a separate item.",
      "- Do not split one coherent issue into multiple items.",
      "- If one sentence contains both praise and a problem joined by but/however, return one item focused on the problem and keep the praise as context.",
      "- If the message is a single paragraph about one customer/company, return exactly one item.",
      "- Keep each item self-contained and preserve the customer/company name when mentioned.",
      "- If a customer/company is explicitly mentioned, put it in customerName. Otherwise use null.",
      "- Use a concise title that summarizes the item, not a generic title.",
      "- Keep content faithful to the original message. Do not invent details.",
    ].join("\n"),
  })

  return output.items
}
