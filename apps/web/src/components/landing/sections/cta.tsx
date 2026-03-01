import { Button } from "@motiq/ui/components/button"
import { ArrowRightIcon } from "@motiq/ui/icons/arrow-right"
import { motion } from "motion/react"

export const Cta = () => {
  return (
    <section className="relative overflow-hidden bg-zinc-950">
      <div className="relative mx-auto max-w-7xl overflow-hidden border-white/5 border-x border-t">
        <div className="grid min-h-100 grid-cols-1 md:min-h-150 md:grid-cols-12">
          <div className="relative flex flex-col justify-center overflow-hidden p-8 md:col-span-8 md:p-10">
            <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.03]" />
            <div className="relative z-10">
              <motion.h2
                className="mb-8 font-bold text-5xl text-white leading-[0.9] tracking-tighter sm:text-6xl md:text-8xl"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                Stop Missing <br />
                <span className="text-lime-400 italic">Critical Signals.</span>
              </motion.h2>
              <motion.p
                className="mb-12 max-w-lg text-lg text-zinc-500 leading-relaxed md:text-xl"
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                Be among the first to deploy autonomous customer intelligence.
                Join the waitlist for early access and founding-member pricing.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <Button
                  className="h-14 cursor-pointer rounded-sm bg-white px-8 font-bold text-xs text-zinc-950 uppercase tracking-[0.2em] transition-all hover:scale-[1.02] hover:bg-lime-400 active:scale-95"
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
                  Join the Waitlist
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
          <div className="relative flex flex-col justify-between border-white/5 border-t bg-zinc-900/20 p-8 md:col-span-4 md:border-t-0 md:border-l md:p-12">
            <div className="halftone absolute inset-0 opacity-[0.05]" />
            <div className="relative z-10 space-y-8">
              <div>
                <span className="mb-4 block font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                  Early_Access
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Founding-member pricing locked in.
                  <br />
                  Priority onboarding & setup.
                  <br />
                  Direct line to the team.
                </p>
              </div>
              <div>
                <span className="mb-4 block font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                  Day_One_Integrations
                </span>
                <div className="flex flex-wrap gap-2">
                  {["Intercom", "Zendesk", "Slack", "Linear", "Jira"].map(
                    (i) => (
                      <span
                        className="rounded border border-white/5 bg-white/5 px-2 py-1 font-bold text-[10px] text-zinc-500 uppercase tracking-tighter"
                        key={i}
                      >
                        {i}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="relative z-10 border-white/5 border-t pt-8">
              <span className="mb-2 block font-mono text-[10px] text-lime-500/50 uppercase tracking-widest">
                Launch_Status
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                {"Early_Access // 2026"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
