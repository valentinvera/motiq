import { Timeline } from "@motiq/ui/components/timeline"
import { AlertCircle } from "@motiq/ui/icons/alert-circle"
import { Bell } from "@motiq/ui/icons/bell"
import { Check } from "@motiq/ui/icons/check"
import { MessageSquare } from "@motiq/ui/icons/message-square"
import { Plug } from "@motiq/ui/icons/plug"
import { Sparkles } from "@motiq/ui/icons/sparkles"
import { TrendingUp } from "@motiq/ui/icons/trending-up"
import { Zap } from "@motiq/ui/icons/zap"
import { motion } from "motion/react"

export const HowItWorks = () => {
  const data = [
    {
      title: "Connect",
      content: (
        <div>
          <p className="mb-8 font-normal text-base text-zinc-400 md:text-lg">
            Connect your feedback sources in one click. Intercom, Zendesk,
            Typeform, or any tool where customers share feedback.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { name: "Intercom", icon: MessageSquare, color: "blue" },
              { name: "Zendesk", icon: MessageSquare, color: "green" },
              { name: "Typeform", icon: MessageSquare, color: "purple" },
            ].map((integration, i) => (
              <motion.div
                className="group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 p-6 transition-all hover:border-lime-500/50"
                initial={{ opacity: 0, y: 20 }}
                key={integration.name}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="absolute inset-0 bg-lime-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative z-10 mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 transition-transform group-hover:scale-110">
                  <Plug className="h-6 w-6 text-lime-400" />
                </div>
                <p className="relative z-10 font-medium text-sm text-zinc-300">
                  {integration.name}
                </p>
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  className="absolute top-2 right-2"
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.3,
                  }}
                >
                  <div className="h-2 w-2 rounded-full bg-lime-500" />
                </motion.div>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Check className="h-4 w-4 text-lime-400" />
              <span>Auto-syncs every 5 minutes · No code required</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Monitor",
      content: (
        <div>
          <p className="mb-8 font-normal text-base text-zinc-400 md:text-lg">
            AI agents work 24/7 analyzing every piece of feedback. Auto-triage,
            detect patterns, and spot issues before they escalate.
          </p>
          <div className="w-full space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-500/20">
                  <Zap className="h-4 w-4 text-lime-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">Triage Agent</p>
                  <p className="text-xs text-zinc-500">
                    Processing feedback...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  className="h-2 w-2 rounded-full bg-lime-500"
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                />
                <span className="text-lime-400 text-xs">ACTIVE</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">
                    Pattern Agent
                  </p>
                  <p className="text-xs text-zinc-500">Detecting trends...</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  className="h-2 w-2 rounded-full bg-blue-500"
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: 0.3,
                  }}
                />
                <span className="text-blue-400 text-xs">ACTIVE</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20">
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">Risk Agent</p>
                  <p className="text-xs text-zinc-500">
                    Monitoring churn signals...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  className="h-2 w-2 rounded-full bg-orange-500"
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: 0.6,
                  }}
                />
                <span className="text-orange-400 text-xs">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Act",
      content: (
        <div>
          <p className="mb-8 font-normal text-base text-zinc-400 md:text-lg">
            Get instant alerts when something needs attention. Slack, email, or
            webhook — we notify the right people at the right time.
          </p>
          <div className="space-y-4">
            <motion.div
              className="rounded-xl border border-red-500/30 bg-linear-to-br from-red-500/10 to-transparent p-4"
              initial={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-red-500">
                  <Bell className="h-3 w-3 text-white" />
                </div>
                <span className="font-semibold text-red-400 text-sm">
                  CRITICAL ALERT
                </span>
                <span className="ml-auto text-xs text-zinc-500">Just now</span>
              </div>
              <p className="mb-2 text-sm text-white">
                5 Enterprise customers reported login issues in last 2 hours
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="rounded bg-zinc-800 px-2 py-1">Bug</span>
                <span className="rounded bg-zinc-800 px-2 py-1">
                  ARR Impact: $180k
                </span>
                <span className="ml-auto text-red-400">→ #engineering</span>
              </div>
            </motion.div>

            <motion.div
              className="rounded-xl border border-orange-500/30 bg-linear-to-br from-orange-500/10 to-transparent p-4"
              initial={{ opacity: 0, x: -20 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-500">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
                <span className="font-semibold text-orange-400 text-sm">
                  PATTERN DETECTED
                </span>
                <span className="ml-auto text-xs text-zinc-500">5 min ago</span>
              </div>
              <p className="mb-2 text-sm text-white">
                "Dark mode" mentioned 12x this week (vs 2x avg)
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="rounded bg-zinc-800 px-2 py-1">
                  Feature Request
                </span>
                <span className="ml-auto text-orange-400">
                  → product@company.com
                </span>
              </div>
            </motion.div>

            <motion.div
              className="rounded-xl border border-blue-500/30 bg-linear-to-br from-blue-500/10 to-transparent p-4"
              initial={{ opacity: 0, x: -20 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="font-semibold text-blue-400 text-sm">
                  INSIGHT
                </span>
                <span className="ml-auto text-xs text-zinc-500">
                  1 hour ago
                </span>
              </div>
              <p className="mb-2 text-sm text-white">
                NPS increased 8 points after recent UI update
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="rounded bg-zinc-800 px-2 py-1">Positive</span>
                <span className="ml-auto text-blue-400">
                  → Daily digest email
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section className="bg-zinc-950" id="how-it-works">
      <Timeline data={data} />
    </section>
  )
}
