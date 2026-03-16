import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@motiq/ui/components/accordion"

const faqs = [
  {
    question: "What channels does Motiq monitor?",
    answer:
      "Motiq connects to all your existing feedback sources: support tickets (Zendesk, Intercom), Slack channels, customer interviews, NPS surveys, app reviews, and more. Our agents continuously monitor these channels 24/7 to detect patterns and critical signals.",
  },
  {
    question: "How do the agents work?",
    answer:
      "Our agents are specialized AI models trained to triage, classify, and analyze customer feedback. They run autonomously in the background, detecting patterns like complaint spikes, feature request trends, or signs of churn risk—then alert you instantly via Slack or email.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most teams are up and running in under 10 minutes. Connect your feedback sources with one click, configure your alert preferences, and our agents start monitoring immediately. No code or technical knowledge required.",
  },
  {
    question: "How does it know what is critical?",
    answer:
      "Our AI considers multiple factors: customer tier (Enterprise vs Free), sentiment severity, issue frequency, ARR at risk, and historical patterns. Critical issues are automatically prioritized and routed to the right team with full context.",
  },
  {
    question: "Does it integrate with our tools?",
    answer:
      "Yes! Motiq integrates seamlessly with Slack, Linear, Jira, Notion, and more. Alerts appear where your team already works, and issues can be auto-created in your project management system.",
  },
]

export const Faq = () => {
  return (
    <section className="relative bg-black py-24 md:py-32" id="faq">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-20 space-y-4 text-center">
          <span className="inline-block rounded-full border border-white/10 px-3 py-1 font-medium text-[10px] text-white/60 uppercase tracking-widest">
            FAQ
          </span>
          <h2 className="font-medium text-4xl text-white leading-tight tracking-tighter md:text-5xl lg:text-6xl">
            Got <span className="text-white/40">Questions?</span>
          </h2>
        </div>

        <div className="border-white/10 border-t">
          <Accordion className="w-full" collapsible type="single">
            {faqs.map((faq, i) => (
              <AccordionItem
                className="border-white/10 border-b"
                key={i}
                value={`item-${i}`}
              >
                <AccordionTrigger className="cursor-pointer py-8 text-left font-semibold text-lg text-white transition-colors hover:text-white/70 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-8 text-base text-zinc-400 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
