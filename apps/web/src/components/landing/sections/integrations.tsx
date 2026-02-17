import { motion } from "motion/react"
import { IntegrationsOrbit } from "../integrations-orbit"

export const Integrations = () => {
  return (
    <section
      className="relative overflow-hidden bg-zinc-950 py-12 md:py-24"
      id="integrations"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-150 w-300 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-500/10 mix-blend-screen blur-[120px]" />

        <div className="absolute top-1/2 left-1/2 h-75 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-400/5 blur-[80px]" />
      </div>

      <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 h-20 bg-linear-to-b from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-20 h-20 bg-linear-to-t from-zinc-950 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <span className="mb-4 inline-block font-medium text-lime-400 text-sm uppercase tracking-wider">
            Integrations
          </span>
          <h2 className="mb-4 text-balance font-bold text-3xl text-white md:text-5xl">
            Connects with your entire stack
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base text-zinc-400 md:text-lg">
            Seamlessly integrate Motiq with your existing tools and workflows.
            No complex setup required.
          </p>
        </motion.div>

        <div className="relative flex min-h-100 flex-col items-center justify-center antialiased md:min-h-150">
          <IntegrationsOrbit />
        </div>
      </div>
    </section>
  )
}
