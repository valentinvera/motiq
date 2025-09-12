import { createFileRoute } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/")({
  component: App,
  head: () => ({
    meta: [
      ...seo({
        title: "Motiq",
        description:
          "Create forms, 10x faster with AI. Just chat to build, share instantly, and analyze results in real-time.",
        keywords: ["AI form builder", "form generator", "Motiq"],
        url: "/",
      }),
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Motiq",
          url: "https://motiq-ai.vercel.app",
          operatingSystem: "Any",
          description: "Create forms 10x faster with AI.",
        }),
      },
    ],
  }),
})

function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "var(--grid-bg)",
          backgroundImage: `
            radial-gradient(circle, var(--grid-dot-color) var(--grid-dot-size), transparent var(--grid-dot-size))
          `,
          backgroundSize: "30px 30px",
          backgroundPosition: "0 0",
        }}
      />
      <Header />
      <main className="overflow-hidden">
        <Hero />
      </main>
    </div>
  )
}
