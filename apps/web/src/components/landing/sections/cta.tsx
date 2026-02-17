import { Button } from "@motiq/ui/components/button"
import { ArrowRightIcon } from "@motiq/ui/icons/arrow-right"
import { motion } from "motion/react"

export const Cta = () => {
  return (
    <section className="relative overflow-hidden py-12 md:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-lime-500/50 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-lime-900/20 via-zinc-950 to-zinc-950" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <motion.h2
          className="mb-6 text-balance font-bold text-4xl text-white tracking-tight md:text-[65px] min-[575px]:text-5xl min-[690px]:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Ready to stop missing critical signals?
        </motion.h2>

        <motion.p
          className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-zinc-400 md:text-xl"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Join CS and Product leaders who catch issues before they become churn.
          Get early access today.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Button
            className="relative inline-flex h-14 overflow-hidden rounded-full p-px focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-slate-50"
            onClick={() => {
              const input = document.getElementById("waitlist-email")
              if (input) {
                input.scrollIntoView({ behavior: "smooth", block: "center" })
                setTimeout(() => input.focus(), 500)
              }
            }}
            size="lg"
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#a3e635_50%,#E2E8F0_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-zinc-950 px-8 py-1 font-medium text-sm text-white backdrop-blur-3xl">
              Get Started Free
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </span>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
