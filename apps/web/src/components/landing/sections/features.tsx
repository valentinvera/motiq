import { AlertTriangle } from "@motiq/ui/icons/alert-triangle"
import { Bell } from "@motiq/ui/icons/bell"
import { Bot } from "@motiq/ui/icons/bot"
import { TrendingUp } from "@motiq/ui/icons/trending-up"
import { motion } from "motion/react"

export const Features = () => {
  const features = [
    {
      id: "01",
      title: "Smart Triage",
      icon: Bot,
      description:
        "Every piece of feedback is automatically classified by intent, customer segment, and urgency. The platform routes signals where they belong, completely autonomously.",
      visual: (
        <div className="w-full max-w-sm space-y-4">
          {[
            {
              text: "Dashboard is slow",
              tag: "LATENCY",
              color: "text-red-400 border-red-400/20 bg-red-400/10",
            },
            {
              text: "Integrate with Slack",
              tag: "FEATURE",
              color: "text-blue-400 border-blue-400/20 bg-blue-400/10",
            },
          ].map((item) => (
            <div
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
              key={item.text}
            >
              <span className="text-sm text-white/80">{item.text}</span>
              <span
                className={`rounded-md border px-2 py-1 font-bold font-mono text-[10px] ${item.color}`}
              >
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "02",
      title: "90-Day Scan",
      icon: Bell,
      description:
        "Skip the cold start. Connect your stack and AI agents analyze 3 months of historical data in minutes to find hidden churn risks immediately.",
      visual: (
        <div className="relative flex size-40 items-center justify-center">
          <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border border-white/10 border-dashed" />
          <div className="absolute inset-4 animate-[spin_15s_linear_infinite_reverse] rounded-full border border-white/5 border-dashed" />
          <span className="font-normal text-5xl text-white tracking-tighter">
            90<span className="text-white/40">d</span>
          </span>
        </div>
      ),
    },
    {
      id: "03",
      title: "Safe Autonomy",
      icon: AlertTriangle,
      description:
        "Progressive autonomy builds trust over time. Start in Observe mode, graduate to Suggest, and unlock Auto-Execution when you're ready.",
      visual: (
        <div className="w-full max-w-sm space-y-3">
          {[
            { level: "Observe", active: true },
            { level: "Suggest", active: true },
            { level: "Auto-Execute", active: false },
          ].map((item, i) => (
            <div
              className={`flex items-center justify-between rounded-xl border p-4 ${item.active ? "border-white/20 bg-white/10" : "border-white/5 bg-white/2"}`}
              key={item.level}
            >
              <span
                className={`font-medium text-sm ${item.active ? "text-white" : "text-white/40"}`}
              >
                {i + 1}. {item.level}
              </span>
              <div
                className={`h-2 w-2 rounded-full ${item.active ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "bg-white/20"}`}
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "04",
      title: "Memory Graph",
      icon: TrendingUp,
      description:
        "We don't just analyze isolated tickets. The platform builds a relational graph of every customer, connecting latency complaints to future usage drops.",
      visual: (
        <div className="flex items-end gap-12">
          <div className="flex flex-col">
            <span className="font-normal text-6xl text-white tracking-tighter">
              99.9<span className="text-white/40">%</span>
            </span>
            <span className="mt-2 border-white/10 border-t pt-2 font-mono text-[10px] text-white/50 uppercase tracking-widest">
              Accuracy Rate
            </span>
          </div>
          <div className="flex flex-col pb-1">
            <span className="font-medium text-2xl text-white tracking-tight">
              24/7
            </span>
            <span className="mt-2 font-mono text-[10px] text-white/50 uppercase tracking-widest">
              Active Monitor
            </span>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section className="relative bg-black py-32" id="features">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <div className="sticky top-32 space-y-6">
              <span className="inline-block rounded-full border border-white/10 px-3 py-1 font-medium text-[10px] text-white/60 uppercase tracking-widest">
                Features
              </span>
              <h2 className="font-medium text-4xl text-white leading-tight tracking-tighter md:text-5xl lg:text-6xl">
                Built for <br />
                <span className="text-white/40">Action.</span>
              </h2>
              <p className="max-w-sm text-lg text-white/50 leading-relaxed">
                AI agents analyze every customer interaction autonomously,
                turning raw feedback into actionable intelligence.
              </p>
            </div>
          </div>

          <div className="space-y-32 md:col-span-7">
            {features.map((feature) => (
              <motion.div
                className="flex flex-col gap-8"
                initial={{ opacity: 0, y: 40 }}
                key={feature.id}
                transition={{ duration: 0.8 }}
                viewport={{ margin: "-100px", once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-6 border-white/10 border-b pb-6">
                  <span
                    aria-hidden="true"
                    className="font-normal text-4xl text-white/40 tracking-tighter"
                  >
                    {feature.id}
                  </span>
                  <h3 className="font-medium text-3xl text-white tracking-tight">
                    {feature.title}
                  </h3>
                </div>

                <p className="text-lg text-white/60 leading-relaxed">
                  {feature.description}
                </p>

                <div className="mt-8 flex items-center justify-center rounded-3xl border border-white/5 bg-white/2 p-12">
                  {feature.visual}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
