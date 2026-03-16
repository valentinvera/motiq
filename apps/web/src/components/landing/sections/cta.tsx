import { Button } from "@motiq/ui/components/button"
import { motion } from "motion/react"

export const Cta = () => {
  return (
    <section className="relative overflow-hidden border-white/5 border-t bg-black py-32">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-[-10%] left-[-10%] h-[50%] w-[90%] rounded-full bg-cyan-500/20 blur-[120px] md:bottom-[-38%] md:h-[70%] md:w-[70%] md:bg-cyan-500/15 md:blur-[150px]" />
        <div className="absolute right-[-15%] bottom-[-5%] h-[40%] w-[80%] rounded-full bg-teal-500/15 blur-[120px] md:bottom-[-28%] md:h-[60%] md:w-[60%] md:bg-teal-500/12 md:blur-[150px]" />
        <div className="absolute top-[55%] left-[20%] h-[50%] w-[70%] rounded-full bg-cyan-400/5 blur-[150px]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-black" />

      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, scale: 1 }}
        >
          <h2 className="mb-8 font-medium text-5xl text-white leading-[0.9] tracking-tighter md:text-7xl lg:text-[100px]">
            Don't miss another <br />
            <span className="text-white/40">critical signal.</span>
          </h2>

          <p className="mx-auto mb-12 max-w-2xl font-light text-lg text-white/50 leading-relaxed md:text-xl">
            Be among the first to deploy autonomous customer intelligence. Join
            the waitlist for early access.
          </p>

          <Button
            className="h-16 cursor-pointer rounded-sm bg-white px-12 text-black text-lg transition-all hover:bg-white/80 active:scale-95"
            onClick={() => {
              const input = document.getElementById("waitlist-email")
              if (input) {
                input.scrollIntoView({ behavior: "smooth", block: "center" })
                setTimeout(() => input.focus(), 500)
              }
            }}
          >
            Get Early Access
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
