import { createFileRoute } from "@tanstack/react-router"
import { CodeIcon } from "lucide-react"
import { ComingSoonPanel } from "@/components/app/settings-card"

export const Route = createFileRoute("/_authenticated/settings/developer")({
  head: () => ({
    meta: [{ title: "Developer | Motiq" }],
  }),
  component: DeveloperTab,
})

function DeveloperTab() {
  return (
    <ComingSoonPanel
      description="API keys, webhooks and developer tools. Coming soon."
      icon={<CodeIcon className="size-5 text-zinc-500" />}
      title="Developer"
    />
  )
}
