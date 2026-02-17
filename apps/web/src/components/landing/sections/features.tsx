import { MagicCard } from "@motiq/ui/components/magic-card"
import { AlertTriangle } from "@motiq/ui/icons/alert-triangle"
import { Bell } from "@motiq/ui/icons/bell"
import { Bot } from "@motiq/ui/icons/bot"
import { TrendingUp } from "@motiq/ui/icons/trending-up"
import { motion } from "motion/react"

export const Features = () => {
  return (
    <section className="relative bg-zinc-950 py-12 md:py-24" id="features">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          className="mb-16 max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <span className="mb-4 inline-block font-medium text-lime-400 text-sm uppercase tracking-wider">
            Features
          </span>
          <h2 className="mb-6 font-bold text-3xl text-white tracking-tight md:text-5xl">
            Your 24/7 customer <br />
            <span className="text-zinc-500">intelligence team.</span>
          </h2>
          <p className="max-w-2xl text-base text-zinc-400 md:text-lg">
            AI agents that never sleep. Monitoring feedback, detecting patterns,
            and alerting you before small issues become big problems.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-2 lg:h-150">
          <MagicCard className="col-span-1 md:col-span-8 md:row-span-1">
            <div className="flex h-full flex-col justify-between p-6 sm:p-8">
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-lime-400" />
                    <h3 className="font-semibold text-white text-xl">
                      Autonomous Triage
                    </h3>
                  </div>
                  <p className="max-w-md text-zinc-400">
                    AI automatically classifies feedback as bug, feature
                    request, or complaint. Prioritizes by urgency and customer
                    value.
                  </p>
                </div>

                <div className="mt-8 space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 font-mono text-sm">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded bg-red-500/20 px-2 py-1 font-semibold text-red-400 text-xs">
                      CRITICAL
                    </div>
                    <div className="flex-1">
                      <p className="text-zinc-300">
                        "Login broken for Enterprise users"
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        🏢 Enterprise · Bug · ARR: $50k
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded bg-orange-500/20 px-2 py-1 font-semibold text-orange-400 text-xs">
                      HIGH
                    </div>
                    <div className="flex-1">
                      <p className="text-zinc-300">"Need dark mode feature"</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        ✨ Feature Request · 8 mentions this week
                      </p>
                    </div>
                  </div>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-lime-500" />
                </div>
              </div>
            </div>
          </MagicCard>

          <MagicCard
            className="col-span-1 md:col-span-4 md:row-span-1"
            gradientColor="rgba(249, 115, 22, 0.15)"
          >
            <div className="flex h-full flex-col p-6 sm:p-8">
              <div className="mb-auto flex items-center gap-2">
                <Bell className="h-6 w-6 text-orange-400" />
                <h3 className="font-semibold text-white text-xl">
                  24/7 Monitoring
                </h3>
              </div>

              <div className="flex flex-1 items-center justify-center py-6">
                <div className="text-center">
                  <div className="mb-2 flex items-center justify-center gap-1">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-lime-500" />
                    <span className="text-lime-400 text-xs">ACTIVE</span>
                  </div>
                  <span className="block font-bold text-6xl text-white tracking-tighter">
                    4<span className="text-4xl text-orange-400" />
                  </span>
                  <span className="text-sm text-zinc-500">Agents running</span>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                Agents never sleep. Continuous monitoring of all feedback
                sources.
              </p>
            </div>
          </MagicCard>

          <MagicCard
            className="col-span-1 md:col-span-4 md:row-span-1"
            gradientColor="rgba(59, 130, 246, 0.15)"
          >
            <div className="flex h-full flex-col p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-blue-400" />
                <h3 className="font-semibold text-white text-xl">
                  Proactive Alerts
                </h3>
              </div>

              <div className="relative flex flex-1 flex-col justify-center gap-2">
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-blue-500" />
                    <span className="font-semibold text-blue-300 text-xs">
                      Motiq Alert
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    🚨 5 Enterprise customers mentioned "slow" in last 24h
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-zinc-400">
                Slack, email, or webhook alerts when patterns emerge.
              </p>
            </div>
          </MagicCard>

          <MagicCard
            className="col-span-1 md:col-span-8 md:row-span-1"
            gradientColor="rgba(236, 72, 153, 0.15)"
          >
            <div className="flex h-full flex-col justify-between p-6 sm:p-8">
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-6 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-pink-400" />
                  <h3 className="font-semibold text-white text-xl">
                    Pattern Detection
                  </h3>
                </div>

                <div className="flex h-full items-end gap-2 px-4 pb-0 sm:gap-4">
                  {[20, 25, 22, 28, 30, 85, 90, 88, 92, 95].map((h, i) => (
                    <motion.div
                      className={`w-full rounded-t-sm transition-colors ${
                        i >= 5
                          ? "bg-pink-500/40 hover:bg-pink-500/60"
                          : "bg-pink-500/20 hover:bg-pink-500/30"
                      }`}
                      initial={{ height: "10%" }}
                      key={h}
                      transition={{
                        delay: i * 0.05,
                        duration: 0.8,
                        ease: "backOut",
                      }}
                      viewport={{ once: true }}
                      whileInView={{ height: `${h}%` }}
                    >
                      {i >= 5 && <div className="h-1 w-full bg-pink-500" />}
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-zinc-800 border-t pt-4">
                  <p className="max-w-sm text-zinc-400">
                    Detects spikes, trends, and anomalies across all feedback
                    channels.
                  </p>
                  <div className="rounded-full bg-pink-500/20 px-3 py-1 font-medium text-pink-400 text-xs">
                    5x spike detected
                  </div>
                </div>
              </div>
            </div>
          </MagicCard>
        </div>
      </div>
    </section>
  )
}
