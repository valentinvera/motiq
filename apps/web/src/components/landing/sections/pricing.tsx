import { Button } from "@motiq/ui/components/button"
import { HoverBorderGradient } from "@motiq/ui/components/hover-border-gradient"
import { CheckIcon } from "@motiq/ui/icons/check"
import { Sparkles } from "@motiq/ui/icons/sparkles"
import { motion } from "motion/react"

const plans = [
  {
    name: "Starter",
    price: "$299",
    description: "Perfect for small teams getting started.",
    features: [
      "10k interactions/month",
      "3 data source connections",
      "Core agents (Triage + Pattern)",
      "Slack/Email alerts",
      "Email support",
    ],
    cta: "Join Waitlist",
    popular: false,
  },
  {
    name: "Growth",
    price: "$799",
    description: "For teams that need scale and power.",
    features: [
      "100k interactions/month",
      "Unlimited data sources",
      "All agents + custom routing",
      "Advanced pattern detection",
      "Priority support + Slack channel",
    ],
    cta: "Join Waitlist",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations requiring custom solutions.",
    features: [
      "Unlimited interactions",
      "Custom agent training",
      "Dedicated success manager",
      "SLA + SOC 2 compliance",
      "White-glove onboarding",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

export const Pricing = () => {
  return (
    <section
      className="relative overflow-hidden bg-zinc-950 py-12 md:py-24"
      id="pricing"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <span className="mb-4 inline-block font-medium text-lime-400 text-sm uppercase tracking-wider">
            Early Access Pricing
          </span>
          <h2 className="mb-4 text-balance font-bold text-3xl text-white md:text-5xl">
            Lock in beta pricing now
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base text-zinc-400 md:text-lg">
            Join the waitlist and get 50% off for the first 6 months. Limited
            spots available.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              className={`relative flex flex-col rounded-2xl border p-8 ${
                plan.popular
                  ? "border-lime-500/50 bg-zinc-900/80"
                  : "border-zinc-800 bg-zinc-900/30"
              }`}
              initial={{ opacity: 0, y: 20 }}
              key={plan.name}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 -mt-3 mr-4 rounded-full bg-lime-500 px-3 py-1 font-bold text-xs text-zinc-950 uppercase tracking-wide">
                  Most Popular
                </div>
              )}

              <h3 className="mb-2 font-bold text-white text-xl">{plan.name}</h3>
              <div className="mb-4 flex items-baseline gap-1">
                <span className="font-bold text-4xl text-white tabular-nums">
                  {plan.price}
                </span>
                {plan.price !== "Custom" && (
                  <span className="text-zinc-500">/month</span>
                )}
              </div>
              <p className="mb-6 text-sm text-zinc-400">{plan.description}</p>

              <div className="mb-8 flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <div className="flex items-center gap-3" key={feature}>
                    <CheckIcon className="h-5 w-5 shrink-0 text-lime-400" />
                    <span className="text-sm text-zinc-300">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.popular ? (
                <HoverBorderGradient
                  as="button"
                  className="flex h-12 w-full items-center justify-center bg-zinc-900 text-white"
                  containerClassName="w-full"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-lime-400" />
                  <span>{plan.cta}</span>
                </HoverBorderGradient>
              ) : (
                <Button
                  className="h-12 w-full border border-zinc-700 bg-transparent text-white hover:bg-zinc-800"
                  variant="outline"
                >
                  {plan.cta}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
