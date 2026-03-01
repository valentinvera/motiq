import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@motiq/ui/components/accordion"

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
      "Yes! Motiq integrates seamlessly with Slack, Linear, Jira, Notion, and more. Alerts appear where your team already works, and issues can be auto-created in your project management system.",
  },
  {
    question: "What about customer data privacy?",
    answer:
      "Security is our foundation. We use end-to-end encryption and are building toward SOC 2 compliance. Your customer data is never used to train our models, and you maintain full control over data access and retention policies.",
  },
]

export const Faq = () => {
  return (
    <section className="relative overflow-hidden bg-zinc-950" id="faq">
      <div className="relative mx-auto max-w-7xl overflow-hidden border-white/5 border-x border-t">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="relative border-white/5 border-b bg-zinc-900/10 px-8 pt-24 pb-8 md:col-span-4 md:border-r md:border-b-0 md:p-12">
            <div className="sticky top-32">
              <span className="mb-6 block font-mono text-[10px] text-lime-500 uppercase tracking-[0.2em]">
                {"05 // Faq"}
              </span>
              <h2 className="mb-8 font-bold text-4xl text-white uppercase leading-none tracking-tighter md:text-5xl">
                F.A.Q.
              </h2>
              <p className="max-w-xs text-sm text-zinc-500 leading-relaxed">
                Everything you need to know about our autonomous intelligence
                engine.
              </p>
            </div>
            <div className="halftone pointer-events-none absolute inset-0 opacity-[0.02]" />
          </div>
          <div className="p-0 md:col-span-8">
            <Accordion className="w-full" collapsible type="single">
              {faqs.map((faq, i) => (
                <AccordionItem
                  className="border-white/5 border-b px-8 py-4 transition-all last:border-b-0 hover:bg-white/2 md:px-12"
                  key={faq.question}
                  value={`item-${i}`}
                >
                  <AccordionTrigger className="cursor-pointer py-6 text-left font-bold text-lg text-white hover:text-lime-400 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-2xl pb-8 text-base text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  )
}
