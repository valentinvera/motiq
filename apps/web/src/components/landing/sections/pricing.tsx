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
    <section className="relative bg-black py-20 md:py-32" id="pricing">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 flex flex-col items-start justify-between gap-8 md:mb-24 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="mb-4 inline-block rounded-full border border-white/10 px-3 py-1 font-medium text-[10px] text-white/60 uppercase tracking-widest">
              Pricing
            </span>
            <h2 className="font-medium text-4xl text-white leading-tight tracking-tighter md:text-5xl lg:text-6xl">
              Lock in <br />
              <span className="text-white/40">Beta Rates.</span>
            </h2>
          </div>
          <p className="max-w-xs text-lg text-white/50 leading-relaxed md:text-right">
            Transparent, scalable pricing designed for high-growth SaaS.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              className={`relative flex flex-col rounded-3xl border p-10 transition-all duration-500 ${plan.popular ? "border-white/20 bg-white/10" : "border-white/5 bg-white/2 hover:bg-white/4"}`}
              key={plan.name}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-10 rounded-full bg-white px-3 py-1 font-bold text-[9px] text-black uppercase tracking-widest">
                  Recommended
                </div>
              )}

              <div className="mb-12">
                <h3 className="mb-2 font-medium text-white text-xl">
                  {plan.name}
                </h3>
                <p className="h-10 text-sm text-white/50 leading-relaxed">
                  {plan.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-light text-5xl text-white tracking-tighter">
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className="font-medium text-sm text-white/40">
                      /mo
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-12 flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <div className="flex items-start gap-4" key={feature}>
                    <div className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                      <CheckIcon className="size-2" />
                    </div>
                    <span className="font-medium text-sm text-white/70">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className={`h-12 w-full cursor-pointer rounded-sm font-medium text-sm transition-all ${
                  plan.popular
                    ? "bg-white text-black hover:bg-white/80"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
                onClick={() => {
                  if (plan.cta === "Contact Sales") {
                    return
                  }
                  const input = document.getElementById("waitlist-email")
                  if (input) {
                    input.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    })
                    setTimeout(() => input.focus(), 500)
                  }
                }}
                type="button"
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
