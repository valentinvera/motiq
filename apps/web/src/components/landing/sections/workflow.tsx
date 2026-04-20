import { DiscordIcon } from "@motiq/ui/icons/discord"
import { GmailIcon } from "@motiq/ui/icons/gmail"
import { JiraIcon } from "@motiq/ui/icons/jira"
import { LinearIcon } from "@motiq/ui/icons/linear"
import { NotionIcon } from "@motiq/ui/icons/notion"
import { PolarIcon } from "@motiq/ui/icons/polar"
import { SlackIcon } from "@motiq/ui/icons/slack"
import { TelegramIcon } from "@motiq/ui/icons/telegram"
import { ZendeskIcon } from "@motiq/ui/icons/zendesk"
import { motion } from "motion/react"

export const Workflow = () => {
  return (
    <section className="relative bg-black py-32" id="how-it-works">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <div className="sticky top-32 space-y-6">
              <span className="inline-block rounded-full border border-white/10 px-3 py-1 font-medium text-[10px] text-white/60 uppercase tracking-widest">
                Workflow
              </span>
              <h2 className="font-medium text-4xl text-white leading-tight tracking-tighter md:text-5xl lg:text-6xl">
                How It <br />
                <span className="text-white/40">Works.</span>
              </h2>
              <p className="max-w-sm text-lg text-white/50 leading-relaxed">
                From chaotic inbox to resolved issues in milliseconds. The
                definitive workflow for modern SaaS.
              </p>
            </div>
          </div>

          <div className="relative md:col-span-7">
            <div className="absolute top-0 bottom-0 left-5 w-px bg-white/5 md:left-9.75" />

            <div className="space-y-20 md:space-y-32">
              <motion.div
                className="relative pl-16 md:pl-24"
                initial={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.8 }}
                viewport={{ margin: "-100px", once: true }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <div className="absolute top-0 left-0 z-10 flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 font-normal text-sm text-white backdrop-blur-md md:size-20 md:text-xl">
                  1
                </div>
                <div className="space-y-6">
                  <h3 className="font-medium text-3xl text-white tracking-tight">
                    Connect & Scan
                  </h3>
                  <p className="text-lg text-white/60 leading-relaxed">
                    Integrate your entire stack in seconds. Stop drowning in
                    tabs with our Unified Inbox, while AI agents instantly
                    analyze 90 days of history.
                  </p>
                  <div className="flex flex-wrap gap-4 rounded-3xl border border-white/5 bg-white/2 p-8">
                    {[
                      { Icon: TelegramIcon, name: "telegram" },
                      { Icon: GmailIcon, name: "gmail" },
                      { Icon: PolarIcon, name: "polar" },
                      { Icon: NotionIcon, name: "notion" },
                      {
                        Icon: DiscordIcon,
                        className: "text-[#5865F2]",
                        name: "discord",
                      },
                      { Icon: SlackIcon, name: "slack" },
                      {
                        Icon: ZendeskIcon,
                        className: "text-white",
                        name: "zendesk",
                      },
                      { Icon: JiraIcon, name: "jira" },
                      { Icon: LinearIcon, name: "linear" },
                    ].map((item) => (
                      <div
                        className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/50"
                        key={item.name}
                      >
                        <item.Icon
                          className={`size-8 ${item.className || ""}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="relative pl-16 md:pl-24"
                initial={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.8 }}
                viewport={{ margin: "-100px", once: true }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <div className="absolute top-0 left-0 z-10 flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 font-normal text-sm text-white backdrop-blur-md md:size-20 md:text-xl">
                  2
                </div>
                <div className="space-y-6">
                  <h3 className="font-medium text-3xl text-white tracking-tight">
                    Memory Synthesis
                  </h3>
                  <p className="text-lg text-white/60 leading-relaxed">
                    Our pipeline classifies, detects patterns across time, and
                    assigns rigorous confidence scores to every insight.
                  </p>
                  <div className="flex items-center justify-center gap-4 rounded-3xl border border-white/5 bg-white/2 p-12">
                    <div className="font-mono text-[10px] text-white/40 uppercase">
                      Raw Data
                    </div>
                    <div className="h-px w-12 bg-white/10" />
                    <div className="flex size-24 items-center justify-center rounded-full border border-white/20 bg-white/5">
                      <div className="flex size-16 items-center justify-center rounded-full border border-white/40">
                        <div className="size-2 animate-pulse rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,1)]" />
                      </div>
                    </div>
                    <div className="h-px w-12 bg-white/10" />
                    <div className="font-mono text-[10px] text-white/90 uppercase tracking-widest">
                      Insight
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="relative pl-16 md:pl-24"
                initial={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.8 }}
                viewport={{ margin: "-100px", once: true }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <div className="absolute top-0 left-0 z-10 flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 font-normal text-sm text-white backdrop-blur-md md:size-20 md:text-xl">
                  3
                </div>
                <div className="space-y-6">
                  <h3 className="font-medium text-3xl text-white tracking-tight">
                    Autonomous Action
                  </h3>
                  <p className="text-lg text-white/60 leading-relaxed">
                    Dashboards are dead. Close the loop automatically. Start in
                    Observe mode, graduate to Auto execution.
                  </p>
                  <div className="space-y-3 rounded-3xl border border-white/5 bg-white/2 p-8">
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-4">
                        <SlackIcon className="size-5 text-white/60" />
                        <span className="font-medium text-sm text-white">
                          Notify Engineering
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
                        Dispatched
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-4">
                        <JiraIcon className="size-5 text-white/60" />
                        <span className="font-medium text-sm text-white">
                          Create Ticket #ENG-24
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-white/90 uppercase tracking-widest">
                        Created
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
