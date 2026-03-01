import { IntegrationsOrbit } from "../integrations-orbit"

export const Integrations = () => {
  return (
    <section className="relative overflow-hidden bg-zinc-950" id="integrations">
      <div className="relative mx-auto max-w-7xl overflow-hidden border-white/5 border-x border-t">
        <div className="relative overflow-hidden border-white/5 border-b px-8 pt-24 pb-16 md:pt-20 md:pr-20 md:pb-20 md:pl-10">
          <div className="relative z-10 flex flex-col justify-start gap-12 lg:flex-row lg:items-end lg:gap-95">
            <div>
              <span className="mb-6 block font-mono text-[10px] text-lime-500 uppercase tracking-[0.2em]">
                {"03 // Ecosystem"}
              </span>
              <h2 className="font-bold text-4xl text-white leading-none tracking-tighter sm:text-5xl md:text-7xl">
                Universal <br />
                <span className="text-zinc-700 italic">Intake.</span>
              </h2>
            </div>
            <div className="max-w-md">
              <p className="text-lg text-zinc-500 leading-relaxed">
                Motiq connects to your entire support and feedback stack. Deploy
                agents to your existing channels in one click.
              </p>
            </div>
          </div>
          <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.02]" />
        </div>
        <div className="relative flex min-h-150 items-center justify-center overflow-hidden bg-zinc-900/10 md:min-h-175">
          <div className="halftone pointer-events-none absolute inset-0 opacity-[0.03]" />
          <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.01]" />
          <div className="relative z-10 w-full scale-75 md:scale-100">
            <IntegrationsOrbit />
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-sm border border-white/10 bg-zinc-950 px-4 py-2 md:bottom-8 md:left-8">
            <div className="size-1.5 animate-pulse rounded-full bg-lime-500" />
            <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-[0.2em]">
              Adapter_Status: Connected
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
