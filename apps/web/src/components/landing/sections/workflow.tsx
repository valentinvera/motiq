import { TimelineItem } from "@motiq/ui/components/timeline"
import { AlertCircle } from "@motiq/ui/icons/alert-circle"
import { IntercomIcon } from "@motiq/ui/icons/intercom"
import { JiraIcon } from "@motiq/ui/icons/jira"
import { LinearIcon } from "@motiq/ui/icons/linear"
import { SlackIcon } from "@motiq/ui/icons/slack"
import { TrendingUp } from "@motiq/ui/icons/trending-up"
import { Zap } from "@motiq/ui/icons/zap"
import { ZendeskIcon } from "@motiq/ui/icons/zendesk"
import { motion } from "motion/react"

export const Workflow = () => {
  const data = [
    {
      label: "Phase_01",
      title: "Connect",
      content: (
        <div className="max-w-3xl">
          <p className="mb-12 max-w-xl font-normal text-lg text-zinc-400 leading-relaxed md:text-xl">
            Integrate your entire stack in seconds. Motiq gathers signals from
            every channel your customers use.
          </p>
          <div className="group relative overflow-hidden rounded-sm border border-white/5 bg-zinc-950">
            <div className="grid grid-cols-5 divide-x divide-white/5">
              {[
                {
                  icon: IntercomIcon,
                  label: "Intercom",
                  color: "",
                  bgColor: "bg-zinc-950",
                },
                {
                  icon: ZendeskIcon,
                  label: "Zendesk",
                  color: "text-white",
                  bgColor: "bg-zinc-950",
                },
                {
                  icon: SlackIcon,
                  label: "Slack",
                  color: "",
                  bgColor: "bg-zinc-950",
                },
                {
                  icon: LinearIcon,
                  label: "Linear",
                  color: "text-[#5E6AD2]",
                  bgColor: "bg-zinc-950",
                },
                {
                  icon: JiraIcon,
                  label: "Jira",
                  color: "",
                  bgColor: "bg-zinc-950",
                },
              ].map((item) => (
                <div
                  className="group/item relative flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden bg-zinc-950"
                  key={item.label}
                >
                  <div
                    className={`flex size-12 items-center justify-center rounded-xl transition-all duration-500 group-hover/item:scale-110 ${item.bgColor} border border-white/5 shadow-2xl`}
                  >
                    <item.icon className={`size-7 ${item.color}`} />
                  </div>
                  <span className="font-bold text-[8px] text-zinc-700 uppercase tracking-[0.2em] transition-colors group-hover/item:text-lime-500/50">
                    {item.label}
                  </span>
                  <div className="halftone pointer-events-none absolute inset-0 opacity-0 group-hover/item:opacity-[0.03]" />
                </div>
              ))}
            </div>
            <motion.div
              animate={{ left: ["-100%", "200%"] }}
              className="pointer-events-none absolute top-0 bottom-0 z-10 w-32 skew-x-12 bg-linear-to-r from-transparent via-lime-500/5 to-transparent"
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          </div>
        </div>
      ),
    },
    {
      label: "Phase_02",
      title: "Monitor",
      content: (
        <div className="max-w-3xl">
          <p className="mb-12 max-w-xl font-normal text-lg text-zinc-400 leading-relaxed md:text-xl">
            Our AI engine classifies, triages, and surfaces the insights that
            actually matter to your bottom line.
          </p>
          <div className="relative w-full py-8">
            <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.02]" />
            <div className="relative flex flex-col items-stretch gap-4 lg:flex-row lg:gap-0">
              <motion.div
                className="group relative flex flex-col justify-between overflow-hidden rounded-sm border border-white/10 bg-zinc-900/40 p-6 lg:w-1/3"
                initial={{ opacity: 0, x: -20 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <div className="relative z-10">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10">
                      <IntercomIcon className="size-4 text-white" />
                    </div>
                    <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
                      Inbound_Signal
                    </span>
                  </div>
                  <p className="border-white/10 border-l py-1 pl-4 font-medium text-xs text-zinc-300 italic leading-relaxed md:text-xs min-[425px]:text-sm">
                    "Hey, our{" "}
                    <span className="text-white">
                      dashboard has been unusable
                    </span>{" "}
                    all morning. Pages take forever to load and my team{" "}
                    <span className="text-red-400">can't access reports</span>.
                    We have a board meeting tomorrow."
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between opacity-30 transition-opacity group-hover:opacity-100">
                  <span className="font-mono text-[8px] text-zinc-600">
                    ID: 0x82A1
                  </span>
                  <span className="font-mono text-[8px] text-zinc-600">
                    12:42:01
                  </span>
                </div>
                <div className="halftone absolute inset-0 opacity-[0.02]" />
              </motion.div>
              <div className="relative hidden items-center justify-center lg:flex lg:w-12">
                <div className="h-px w-full bg-white/5" />
                <motion.div
                  animate={{ left: ["0%", "100%"] }}
                  className="absolute size-1.5 rounded-full bg-lime-500 shadow-[0_0_8px_#a3e635]"
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                />
              </div>
              <div className="relative z-10 flex flex-col gap-2 lg:w-1/3">
                {[
                  {
                    name: "Triage_Bot",
                    icon: Zap,
                    val: "LATENCY",
                    color: "lime",
                  },
                  {
                    name: "Pattern_Bot",
                    icon: TrendingUp,
                    val: "SPIKE",
                    color: "blue",
                  },
                  {
                    name: "Risk_Bot",
                    icon: AlertCircle,
                    val: "SLA_WARN",
                    color: "orange",
                  },
                ].map((agent, i) => (
                  <motion.div
                    className="group/agent flex items-center justify-between rounded-sm border border-white/10 bg-zinc-950 p-4 transition-colors hover:border-white/20"
                    initial={{ opacity: 0, scale: 0.95 }}
                    key={agent.name}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-8 items-center justify-center rounded-sm border border-white/5 bg-zinc-900 group-hover/agent:border-${agent.color}-500/30 transition-colors`}
                      >
                        <agent.icon className="size-3.5 text-zinc-500 transition-colors group-hover/agent:text-white" />
                      </div>
                      <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-tighter">
                        {agent.name}
                      </span>
                    </div>
                    <span
                      className={`font-black text-[8px] text-${agent.color}-500/80 uppercase tracking-widest`}
                    >
                      {agent.val}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="relative hidden items-center justify-center lg:flex lg:w-12">
                <div className="h-px w-full bg-white/5" />
                <motion.div
                  animate={{ left: ["0%", "100%"] }}
                  className="absolute size-1.5 rounded-full bg-lime-500 shadow-[0_0_8px_#a3e635]"
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                    delay: 1,
                  }}
                />
              </div>
              <motion.div
                className="group/output relative flex flex-col overflow-hidden rounded-sm border border-white/10 bg-zinc-950 transition-all hover:border-lime-500/20 lg:w-[28%]"
                initial={{ opacity: 0, x: 20 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <div className="relative z-10 flex items-center justify-between border-white/5 border-b bg-white/2 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="size-1 animate-pulse rounded-full bg-lime-500 shadow-[0_0_8px_#a3e635]" />
                    <span className="font-bold font-mono text-[8px] text-white uppercase tracking-[0.2em]">
                      Output
                    </span>
                  </div>
                  <span className="font-mono text-[7px] text-zinc-600 uppercase">
                    Conf: 0.99
                  </span>
                </div>
                <div className="relative z-10 flex flex-1 flex-col gap-6 p-5">
                  <div className="space-y-4">
                    <div>
                      <span className="mb-1 block font-mono text-[7px] text-zinc-600 uppercase tracking-widest">
                        Classification
                      </span>
                      <span className="font-bold text-[11px] text-red-400 uppercase tracking-tight">
                        Critical_Bug
                      </span>
                    </div>
                    <div>
                      <span className="mb-1 block font-mono text-[7px] text-zinc-600 uppercase tracking-widest">
                        Target_Segment
                      </span>
                      <span className="font-bold text-[11px] text-blue-400 uppercase tracking-tight">
                        Enterprise_Tier
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 mt-auto overflow-hidden border-white/5 border-t bg-black/40 p-4">
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-mono text-[6px] text-zinc-600 uppercase">
                        Forwarding_To
                      </span>
                      <span className="font-bold font-mono text-[9px] text-white uppercase tracking-tighter">
                        #eng-priority
                      </span>
                    </div>
                    <div className="size-1.5 rounded-full border border-lime-500/40 bg-lime-500/20" />
                  </div>
                </div>
                <div className="halftone pointer-events-none absolute inset-0 opacity-[0.03]" />
                <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.01]" />
              </motion.div>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Phase_03",
      title: "Act",
      content: (
        <div className="max-w-3xl">
          <p className="mb-12 max-w-xl font-normal text-lg text-zinc-400 leading-relaxed md:text-xl">
            Close the loop automatically. Motiq triggers alerts and prepares the
            right response.
          </p>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-white/5 bg-white/5 shadow-2xl">
            {[
              {
                title: "Slack_Notification",
                action: "DISPATCHED",
                target: "#engineering-core",
                icon: SlackIcon,
                iconColor: "text-zinc-600 group-hover:text-white",
                actionColor: "text-lime-500",
              },
              {
                title: "Linear_Issue",
                action: "CREATED",
                target: "ENG-1842",
                icon: LinearIcon,
                iconColor: "text-[#5E6AD2]",
                actionColor: "text-[#5E6AD2]",
              },
              {
                title: "Jira_Ticket",
                action: "CREATED",
                target: "MOTIQ-314",
                icon: JiraIcon,
                iconColor: "text-[#2684FF]",
                actionColor: "text-[#2684FF]",
              },
            ].map((item, i) => (
              <motion.div
                className="group relative flex items-center justify-between bg-zinc-950 p-4 transition-colors hover:bg-zinc-900 md:p-6"
                initial={{ opacity: 0 }}
                key={item.title}
                transition={{ delay: i * 0.1 }}
                whileInView={{ opacity: 1 }}
              >
                <div className="relative z-10 flex items-center gap-3 md:gap-6">
                  <div
                    className={`flex size-10 items-center justify-center transition-transform group-hover:scale-110 ${item.iconColor}`}
                  >
                    <item.icon className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                      {item.title}
                    </span>
                    <span className="font-bold text-sm text-white leading-none tracking-tight">
                      {item.target}
                    </span>
                  </div>
                </div>
                <div className="relative z-10 flex shrink-0 items-center gap-2 md:gap-3">
                  <span
                    className={`font-black text-[9px] tracking-widest ${item.actionColor} transition-colors group-hover:animate-pulse md:tracking-[0.2em]`}
                  >
                    {item.action}
                  </span>
                  <div className="size-1 rounded-full bg-zinc-800 transition-colors group-hover:bg-lime-500" />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-grain opacity-0 group-hover:opacity-[0.02]" />
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
  ]

  return (
    <section className="bg-zinc-950" id="how-it-works">
      <div className="relative w-full overflow-hidden bg-zinc-950 font-sans">
        <div className="mx-auto max-w-7xl border-white/5 border-x border-t">
          <div className="relative overflow-hidden border-white/5 border-b px-8 pt-24 pb-8 md:pt-20 md:pr-20 md:pb-20 md:pl-10">
            <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <span className="mb-6 block font-mono text-[10px] text-lime-500 uppercase tracking-[0.2em]">
                  {"02 // Workflow"}
                </span>
                <h2 className="font-bold text-4xl text-white leading-none tracking-tighter sm:text-5xl md:text-7xl">
                  Intelligence <br />
                  <span className="text-zinc-700 italic">Workflow.</span>
                </h2>
              </div>
              <p className="max-w-md text-lg text-zinc-500 leading-relaxed">
                Our end-to-end processing pipeline ensures no feedback loop is
                left unmonitored. From ingestion to action in milliseconds.
              </p>
            </div>
            <div className="halftone pointer-events-none absolute inset-0 opacity-[0.03]" />
          </div>
          <div className="flex flex-col">
            {data.map((item) => (
              <TimelineItem item={item} key={item.title} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
