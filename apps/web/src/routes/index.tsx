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
    <div className="relative min-h-dvh scroll-smooth bg-black antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
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
