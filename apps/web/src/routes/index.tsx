import { createFileRoute } from "@tanstack/react-router"
import { Footer } from "@/components/landing/footer"
import { Header } from "@/components/landing/header"
import { Cta } from "@/components/landing/sections/cta"
import { Faq } from "@/components/landing/sections/faq"
import { Features } from "@/components/landing/sections/features"
import { Hero } from "@/components/landing/sections/hero"
import { Integrations } from "@/components/landing/sections/integrations"
import { Pricing } from "@/components/landing/sections/pricing"
import { Workflow } from "@/components/landing/sections/workflow"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="relative min-h-dvh scroll-smooth bg-zinc-950 antialiased selection:bg-lime-500/30 selection:text-lime-200">
      <div className="pointer-events-none fixed inset-0 z-50 bg-grain opacity-[0.015]" />

      <Header />
      <main className="relative z-10">
        <Hero />
        <Features />
        <Workflow />
        <Integrations />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
