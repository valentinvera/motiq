import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@motiq/ui/components/accordion"
import { motion } from "motion/react"

const faqs = [
  {
    question: "What feedback channels does Motiq monitor?",
    answer:
      "Motiq connects to all your existing feedback sources: support tickets (Zendesk, Intercom), Slack channels, customer interviews, NPS surveys, app reviews, and more. Our agents continuously monitor these channels 24/7 to detect patterns and critical signals.",
  },
  {
    question: "How do the AI agents work?",
    answer:
      "Our agents are specialized AI models trained to triage, classify, and analyze customer feedback. They run autonomously in the background, detecting patterns like complaint spikes, feature request trends, or signs of churn risk—then alert you instantly via Slack or email.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most teams are up and running in under 10 minutes. Connect your feedback sources with one click, configure your alert preferences, and our agents start monitoring immediately. No code or technical knowledge required.",
  },
  {
    question: "How does Motiq determine what's critical?",
    answer:
      "Our AI considers multiple factors: customer tier (Enterprise vs Free), sentiment severity, issue frequency, ARR at risk, and historical patterns. Critical issues are automatically prioritized and routed to the right team with full context.",
  },
  {
    question: "Does it integrate with our existing tools?",
    answer:
      "Yes! Motiq integrates seamlessly with Slack, Linear, Jira, Notion, and 50+ other tools. Alerts appear where your team already works, and issues can be auto-created in your project management system.",
  },
  {
    question: "What about customer data privacy?",
    answer:
      "Security is our foundation. We're SOC 2 Type II compliant, use bank-grade encryption, and never train our models on your customer data. You maintain full control over data access and retention policies.",
  },
]

export const Faq = () => {
  return (
    <section className="bg-zinc-950 py-12 md:py-24" id="faq">
      <div className="mx-auto max-w-3xl px-4">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <span className="mb-4 inline-block font-medium text-lime-400 text-sm uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="mb-4 text-balance font-bold text-3xl text-white md:text-5xl">
            Frequently asked questions
          </h2>
        </motion.div>

        <Accordion className="w-full" collapsible type="single">
          {faqs.map((faq, i) => (
            <AccordionItem
              className="border-b-zinc-800"
              key={faq.question}
              value={`item-${i}`}
            >
              <AccordionTrigger className="text-left font-medium text-lg text-white hover:text-lime-400">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-zinc-400">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
