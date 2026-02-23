import { AlertTriangle } from "@motiq/ui/icons/alert-triangle"
import { Bell } from "@motiq/ui/icons/bell"
import { Bot } from "@motiq/ui/icons/bot"
import { TrendingUp } from "@motiq/ui/icons/trending-up"
import { motion } from "motion/react"

export const Features = () => {
  return (
    <section className="relative overflow-hidden bg-zinc-950" id="features">
      <div className="mx-auto max-w-7xl border-white/5 border-x">
        <div className="relative overflow-hidden border-white/5 border-b px-8 pt-24 pb-16 md:pt-20 md:pr-20 md:pb-20 md:pl-10">
          <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.03]" />
          <div className="relative z-10 flex flex-col justify-start gap-12 lg:flex-row lg:items-end lg:gap-76">
            <div className="space-y-6">
              <span className="block font-mono text-[10px] text-lime-500 uppercase tracking-[0.2em]">
                {"01 // Features"}
              </span>
              <h2 className="font-bold text-4xl text-white leading-none tracking-tighter sm:text-5xl md:text-7xl">
                Precision <br />
                <span className="text-zinc-800">Intelligence.</span>
              </h2>
            </div>
            <div className="max-w-md">
              <p className="text-lg text-zinc-500 leading-relaxed">
                Motiq analyzes every customer interaction autonomously, turning
                raw feedback into actionable intelligence with zero manual
                effort.
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-px border-white/5 border-b bg-white/5 md:grid-cols-12">
          <div className="group relative flex min-h-150 flex-col overflow-hidden bg-zinc-950 p-8 md:col-span-8 md:p-12">
            <div className="relative z-20 mb-12 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-sm border border-white/10 bg-zinc-900">
                  <Bot className="size-4 text-lime-400" />
                </div>
                <span className="font-bold font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
                  {"Module_01 // Classification"}
                </span>
              </div>
              <h3 className="font-bold text-3xl text-white uppercase tracking-tighter">
                Smart Triage
              </h3>
              <p className="max-w-sm text-base text-zinc-500 leading-relaxed">
                Every piece of feedback is automatically classified by intent,
                customer segment, and urgency — then routed to the right team.
              </p>
            </div>
            <div className="relative mt-8 flex-1 overflow-hidden rounded-sm border border-white/5 bg-zinc-900/10">
              <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.05]" />
              <div className="perspective-[2000px] absolute inset-0 flex items-center justify-center">
                <div
                  className="grid-lines absolute inset-0 opacity-20"
                  style={{
                    transform: "rotateX(60deg) rotateZ(45deg) scale(2)",
                    transformStyle: "preserve-3d",
                  }}
                />
                <div className="relative flex h-full w-full items-center justify-center">
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    {[0, 1, 2].map((n) => (
                      <motion.div
                        animate={{
                          opacity: [0.2, 0.5, 0.2],
                          height: [200, 300, 200],
                        }}
                        className="absolute h-64 w-px bg-linear-to-b from-transparent via-lime-500/40 to-transparent"
                        key={`line-${n}`}
                        style={{
                          left: `${30 + n * 20}%`,
                          transform: "rotateX(60deg) rotateZ(45deg)",
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: n * 0.5,
                        }}
                      />
                    ))}
                  </div>
                  <div className="relative z-10 flex h-full w-full scale-[0.45] items-center justify-center transition-transform duration-500 sm:scale-[0.7] md:scale-100">
                    {[
                      {
                        label: "RAW_FEED_0x1",
                        type: "Input",
                        color: "zinc",
                        x: -280,
                        y: 0,
                        delay: 0,
                      },
                      {
                        label: "INTENT: ESCALATION",
                        type: "Logic",
                        color: "red",
                        x: 0,
                        y: -140,
                        delay: 0.2,
                      },
                      {
                        label: "SEGMENT: ENTERPRISE",
                        type: "Logic",
                        color: "blue",
                        x: 0,
                        y: 140,
                        delay: 0.4,
                      },
                      {
                        label: "ACTION: AUTO_ROUTE",
                        type: "Result",
                        color: "lime",
                        x: 280,
                        y: 0,
                        delay: 0.6,
                      },
                    ].map((block) => (
                      <motion.div
                        className={`absolute w-60 border p-5 border-${block.color}-500/20 rounded-sm bg-zinc-900/95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl`}
                        initial={{
                          opacity: 0,
                          rotateX: 45,
                          rotateZ: 35,
                          y: block.y,
                          x: block.x - 100,
                        }}
                        key={block.label}
                        style={{ transformStyle: "preserve-3d" }}
                        transition={{
                          delay: block.delay,
                          duration: 0.8,
                          ease: "circOut",
                        }}
                        whileInView={{ opacity: 1, x: block.x }}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold font-mono text-[8px] text-zinc-500 uppercase tracking-[0.2em]">
                              {block.type}
                            </span>
                            <div
                              className={`size-1.5 rounded-full bg-${block.color}-500 shadow-[0_0_10px_rgba(var(--tw-color-${block.color}-500),0.6)]`}
                            />
                          </div>
                          <span
                            className={
                              "font-bold text-[14px] text-white uppercase leading-tight tracking-tight"
                            }
                          >
                            {block.label}
                          </span>
                        </div>
                        <div
                          className={`absolute inset-0 -right-1.5 -bottom-1.5 border-r-2 border-b-2 border-${block.color}-500/10 -z-10 translate-x-1.5 translate-y-1.5 rounded-sm`}
                        />
                      </motion.div>
                    ))}
                  </div>
                  <svg className="pointer-events-none absolute inset-0 size-full opacity-10">
                    <title>Classification flow lines</title>
                    <line
                      stroke="white"
                      strokeWidth="0.5"
                      x1="25%"
                      x2="75%"
                      y1="50%"
                      y2="50%"
                    />
                    <line
                      stroke="white"
                      strokeWidth="0.5"
                      x1="50%"
                      x2="50%"
                      y1="20%"
                      y2="80%"
                    />
                  </svg>
                </div>
              </div>
              <div className="absolute right-8 bottom-4 flex flex-col items-end text-right">
                <span className="font-mono text-[7px] text-zinc-700 uppercase tracking-[0.4em]">
                  Auto_Classification_Pipeline
                </span>
                <div className="mt-2 h-0.5 w-12 bg-lime-500/20" />
              </div>
            </div>
            <div className="halftone pointer-events-none absolute inset-0 opacity-[0.02]" />
          </div>
          <div className="group relative overflow-hidden border-white/5 border-t bg-zinc-950 p-8 md:col-span-4 md:border-t-0 md:p-12">
            <div className="relative z-20 flex h-full flex-col">
              <div className="mb-12 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-sm border border-white/10 bg-zinc-900">
                    <Bell className="size-4 text-orange-500" />
                  </div>
                  <span className="font-bold font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
                    {"Module_02 // Vigilance"}
                  </span>
                </div>
                <h3 className="font-bold text-3xl text-white uppercase tracking-tighter">
                  24/7 Watch
                </h3>
              </div>
              <div className="relative flex flex-1 flex-col items-center justify-center">
                <div className="relative flex size-56 items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    className="absolute inset-0 rounded-full border border-white/10 border-dashed"
                    transition={{
                      duration: 30,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  />
                  <svg className="absolute inset-0 size-full -rotate-90 opacity-20">
                    <title>Scan pattern</title>
                    <circle
                      cx="50%"
                      cy="50%"
                      fill="none"
                      r="45%"
                      stroke="white"
                      strokeDasharray="2 10"
                      strokeWidth="1"
                    />
                  </svg>
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="font-bold text-6xl text-white tabular-nums leading-none tracking-tighter">
                      99<span className="text-orange-500">.</span>9
                    </span>
                    <div className="mt-4 flex items-center gap-2 rounded-sm border border-orange-500/20 bg-orange-500/10 px-3 py-1">
                      <div className="size-1 animate-ping rounded-full bg-orange-500" />
                      <span className="font-bold font-mono text-[8px] text-orange-400 uppercase tracking-widest">
                        Active_Scan
                      </span>
                    </div>
                  </div>
                  {[0, 120, 240].map((angle) => (
                    <motion.div
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      className="absolute size-1.5 rounded-full bg-white/20"
                      key={angle}
                      style={{
                        transform: `rotate(${angle}deg) translate(100px) rotate(-${angle}deg)`,
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: (angle / 120) * 0.5,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-12 flex items-center justify-between border-white/5 border-t pt-6">
                <span className="font-mono text-[8px] text-zinc-600 uppercase">
                  Agent_Status
                </span>
                <span className="font-bold font-mono text-[9px] text-white uppercase tracking-tighter">
                  All_Agents_Online
                </span>
              </div>
            </div>
            <div className="halftone pointer-events-none absolute inset-0 opacity-[0.03]" />
          </div>
          <div className="group relative overflow-hidden border-white/5 border-t bg-zinc-950 p-8 md:col-span-4 md:border-r md:p-12">
            <div className="relative z-20 flex h-full flex-col">
              <div className="mb-12 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-sm border border-white/10 bg-zinc-900">
                    <AlertTriangle className="size-4 text-blue-500" />
                  </div>
                  <span className="font-bold font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
                    {"Module_03 // Action"}
                  </span>
                </div>
                <h3 className="font-bold text-3xl text-white uppercase tracking-tighter">
                  Alert Core
                </h3>
              </div>
              <div className="flex-1 space-y-px overflow-hidden rounded-sm border border-white/10 bg-white/5">
                {[
                  { channel: "Slack", status: "ACK", color: "lime" },
                  { channel: "Discord", status: "WEBHOOK", color: "blue" },
                  { channel: "Notion", status: "SYNC", color: "white" },
                ].map((item) => (
                  <div
                    className="group/row flex items-center justify-between bg-zinc-950 p-4 transition-colors hover:bg-zinc-900"
                    key={item.channel}
                  >
                    <span className="font-bold text-[10px] text-white uppercase tracking-tight">
                      {item.channel}
                    </span>
                    <span
                      className={`font-mono text-[8px] text-${item.color === "white" ? "zinc-500" : `${item.color}-500`} font-black`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <p className="font-mono text-[10px] text-zinc-600 leading-relaxed">
                  &gt; All_Alerts_Delivered
                  <br />
                  &gt; Zero_Missed_Signals
                </p>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden border-white/5 border-t bg-zinc-950 p-8 md:col-span-8 md:p-12">
            <div className="relative z-20 flex h-full flex-col items-start gap-12 md:flex-row md:items-start">
              <div className="flex-1 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-sm border border-white/10 bg-zinc-900">
                      <TrendingUp className="size-4 text-lime-500" />
                    </div>
                    <span className="font-bold font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
                      {"Module_04 // Analytics"}
                    </span>
                  </div>
                  <h3 className="font-bold text-3xl text-white uppercase leading-none tracking-tighter">
                    Pattern Lab
                  </h3>
                </div>
                <p className="max-w-sm text-base text-zinc-500 leading-relaxed">
                  Detects complaint spikes, feature request trends, and
                  sentiment shifts across all your feedback channels.
                </p>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="mb-1 font-mono text-[8px] text-zinc-600 uppercase">
                      Processing
                    </span>
                    <span className="font-bold text-white text-xs tabular-nums tracking-tighter">
                      12.4k{" "}
                      <span className="text-[10px] text-zinc-700">
                        signals/day
                      </span>
                    </span>
                  </div>
                  <div className="h-8 w-px bg-white/5" />
                  <div className="flex flex-col">
                    <span className="mb-1 font-mono text-[8px] text-zinc-600 uppercase">
                      Accuracy
                    </span>
                    <span className="font-bold text-lime-500 text-xs tabular-nums tracking-tighter">
                      99.98%
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative flex aspect-square w-full flex-1 flex-col overflow-hidden rounded-sm border border-white/5 bg-zinc-900/20 p-6 md:aspect-square md:max-w-sm min-[425px]:aspect-video">
                <div className="grid flex-1 grid-cols-10 gap-1">
                  {Array.from({ length: 100 }, (_, n) => ({
                    n,
                    hash: ((n * 13 + 7) % 100) / 100,
                    hash2: ((n * 31 + 17) % 100) / 100,
                    hash3: ((n * 47 + 23) % 100) / 100,
                  })).map(({ n, hash, hash2, hash3 }) => (
                    <motion.div
                      className="aspect-square rounded-[1px] bg-white/[0.02]"
                      initial={{ opacity: 0.1 }}
                      key={`cell-${n}`}
                      style={{
                        backgroundColor:
                          hash > 0.9 ? "rgba(163,230,53,0.2)" : "",
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: hash2 * 2,
                      }}
                      whileInView={{
                        opacity: [0.1, hash3 > 0.8 ? 0.8 : 0.1, 0.1],
                      }}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between font-mono text-[7px] text-zinc-700 uppercase tracking-widest">
                  <span>Feedback_Heatmap</span>
                  <span>Live_Analysis</span>
                </div>
                <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.05]" />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.01]" />
          </div>
        </div>
      </div>
    </section>
  )
}
