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
          "Create forms, surveys, and quizzes 10x faster with AI. Just chat to build, share instantly, and analyze results in real-time.",
        keywords: ["AI form builder", "form generator", "survey tool", "AI quiz maker", "Motiq"],
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
          description: "Create forms, surveys, and quizzes 10x faster with AI.",
        }),
      },
    ],
  }),
})

function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 z-0 block dark:hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px),
            radial-gradient(circle, rgba(51,65,85,0.4) 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px",
          backgroundPosition: "0 0",
        }}
      />

      <div
        className="absolute inset-0 z-0 hidden dark:block"
        style={{
          background: "#000000",
          backgroundImage: `
            radial-gradient(circle, rgba(255, 255, 255, 0.2) 1.5px, transparent 1.5px)
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
