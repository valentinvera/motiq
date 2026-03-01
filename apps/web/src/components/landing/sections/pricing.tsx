import { Button } from "@motiq/ui/components/button"
import { CheckIcon } from "@motiq/ui/icons/check"

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
      "Custom alerts & routing rules",
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
      "SLA + enterprise-grade security",
      "White-glove onboarding",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

export const Pricing = () => {
  return (
    <section className="relative overflow-hidden bg-zinc-950" id="pricing">
      <div className="relative mx-auto max-w-7xl border-white/5 border-x border-t">
        <div className="relative overflow-hidden border-white/5 border-b px-8 pt-24 pb-8 md:pt-20 md:pr-20 md:pb-20 md:pl-10">
          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <span className="mb-6 block font-mono text-[10px] text-lime-500 uppercase tracking-[0.2em]">
                {"04 // Pricing"}
              </span>
              <h2 className="font-bold text-4xl text-white leading-none tracking-tighter sm:text-5xl md:text-7xl">
                Lock in <br />
                <span className="text-zinc-700 italic">Beta Rates.</span>
              </h2>
            </div>
            <p className="max-w-md text-lg text-zinc-500 leading-relaxed">
              Transparent, scalable pricing designed for high-growth SaaS. Join
              the waitlist to secure early-adopter benefits.
            </p>
          </div>
          <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.02]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3">
          {plans.map((plan, i) => (
            <div
              className={`border-white/5 border-b p-8 md:border-b-0 md:p-12 ${i < plans.length - 1 ? "md:border-r" : ""} group relative flex flex-col`}
              key={plan.name}
            >
              <div className="relative z-10 flex flex-1 flex-col">
                <div className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-white text-xl uppercase tracking-widest">
                      {plan.name}
                    </h3>
                    {plan.popular && (
                      <span className="rounded-sm bg-lime-400 px-2 py-0.5 font-black text-[9px] text-zinc-950 uppercase tracking-tighter">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-5xl text-white tabular-nums tracking-tighter">
                      {plan.price}
                    </span>
                    {plan.price !== "Custom" && (
                      <span className="font-mono text-xs text-zinc-600 uppercase tracking-widest">
                        /mo
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
                    {plan.description}
                  </p>
                </div>
                <div className="mb-12 space-y-4">
                  {plan.features.map((feature) => (
                    <div className="flex items-start gap-3" key={feature}>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors group-hover:border-lime-500/30">
                        <CheckIcon className="h-2.5 w-2.5 text-lime-400" />
                      </div>
                      <span className="text-sm text-zinc-400 leading-tight tracking-tight">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  className={`h-12 w-full cursor-pointer rounded-sm font-bold text-xs uppercase tracking-[0.2em] transition-all ${
                    plan.popular
                      ? "bg-white text-zinc-950 hover:bg-lime-400"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                  onClick={() => {
                    const input = document.getElementById("waitlist-email")
                    if (input) {
                      input.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      })
                      setTimeout(() => input.focus(), 500)
                    }
                  }}
                >
                  {plan.cta}
                </Button>
              </div>
              <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.01] transition-opacity group-hover:opacity-[0.03]" />
              <div className="halftone pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-[0.02]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
