import { createFileRoute, redirect } from "@tanstack/react-router"
import { Footer } from "@/components/landing/footer"
import { Header } from "@/components/landing/header"
import { Apps } from "@/components/landing/sections/apps"
import { Cta } from "@/components/landing/sections/cta"
import { Faq } from "@/components/landing/sections/faq"
import { Features } from "@/components/landing/sections/features"
import { Hero } from "@/components/landing/sections/hero"
import { Pricing } from "@/components/landing/sections/pricing"
import { Workflow } from "@/components/landing/sections/workflow"

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.auth) {
      throw redirect({ to: "/overview" })
    }
  },
  head: () => ({
    meta: [{ title: "Motiq — Autonomous Customer Intelligence" }],
  }),
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
        <Apps />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
