import { createFileRoute } from "@tanstack/react-router"
import { Header } from "@/components/landing/sections/header"
import { Hero } from "@/components/landing/sections/hero"

// import { Features } from "@/components/landing/sections/features"
// import { HowItWorks } from "@/components/landing/sections/how-it-works"
// import { Integrations } from "@/components/landing/sections/integrations"
// import { Pricing } from "@/components/landing/sections/pricing"
// import { Faq } from "@/components/landing/sections/faq"
// import { Cta } from "@/components/landing/sections/cta"
// import { Footer } from "@/components/landing/sections/footer"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="relative h-dvh overflow-hidden bg-zinc-950 selection:bg-lime-500/30 selection:text-lime-200">
      <Header />
      <main>
        <Hero />
        {/* <Features /> */}
        {/* <HowItWorks /> */}
        {/* <Integrations /> */}
        {/* <Pricing /> */}
        {/* <Faq /> */}
        {/* <Cta /> */}
      </main>
      {/* <Footer /> */}
    </div>
  )
}
