import { Input } from "@motiq/ui/components/input"
import { Label } from "@motiq/ui/components/label"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { LayoutGridIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  OnboardingLayout,
  OnboardingNextButton,
} from "@/components/app/onboarding-layout"
import { authClient } from "@/lib/auth-client"
import { startOnboardingFlow } from "@/lib/onboarding-flow"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/onboarding/workspace")({
  head: () => ({
    meta: [{ title: "Workspace | Motiq" }],
  }),
  component: WorkspaceStep,
})

const FORM_ID = "onboarding-workspace-form"
const TOTAL_STEPS = 4

function WorkspaceStep() {
  const { auth } = Route.useRouteContext()
  const navigate = useNavigate()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const activeOrg = useQuery(trpc.workspace.getActive.queryOptions())
  const [name, setName] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hydrated || activeOrg.isLoading) {
      return
    }
    if (activeOrg.data?.name) {
      setName(activeOrg.data.name)
    }
    setHydrated(true)
  }, [activeOrg.data, activeOrg.isLoading, hydrated])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      return
    }
    setLoading(true)
    startOnboardingFlow()

    const existing = activeOrg.data

    if (existing) {
      if (existing.name !== trimmed) {
        const { error } = await authClient.organization.update({
          data: { name: trimmed, slug: generateSlug(trimmed) },
          organizationId: existing.id,
        })
        if (error) {
          toast.error(error.message ?? "Failed to update workspace")
          setLoading(false)
          return
        }
        await queryClient.invalidateQueries({
          queryKey: trpc.workspace.getActive.queryKey(),
        })
        await queryClient.invalidateQueries({
          queryKey: trpc.workspace.list.queryKey(),
        })
      }
      navigate({ to: "/onboarding/team" })
      return
    }

    const slug = generateSlug(trimmed)
    const { error, data } = await authClient.organization.create({
      name: trimmed,
      slug,
    })

    if (error || !data) {
      toast.error(error?.message ?? "Failed to create workspace")
      setLoading(false)
      return
    }

    await authClient.organization.setActive({ organizationId: data.id })
    await queryClient.invalidateQueries({
      queryKey: trpc.workspace.getActive.queryKey(),
    })
    await queryClient.invalidateQueries({
      queryKey: trpc.workspace.list.queryKey(),
    })
    navigate({ to: "/onboarding/team" })
  }

  return (
    <OnboardingLayout
      description="This is where signals, alerts, and your team live. You can rename it anytime."
      nextSlot={
        <OnboardingNextButton
          disabled={!name.trim()}
          form={FORM_ID}
          loading={loading}
          type="submit"
        />
      }
      preview={<WorkspacePreview name={name} />}
      step={1}
      title="Name your workspace"
      totalSteps={TOTAL_STEPS}
      user={auth.user}
    >
      <form className="space-y-4" id={FORM_ID} onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label
            className="ml-0.5 text-xs text-zinc-400"
            htmlFor="workspace-name"
          >
            Workspace name
          </Label>
          <Input
            autoComplete="organization"
            autoFocus
            className="h-10 rounded-md border border-white/[0.08] bg-white/[0.02] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-white/40 focus-visible:ring-1 focus-visible:ring-white/15"
            id="workspace-name"
            maxLength={64}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Intelligence"
            required
            value={name}
          />
          <p className="ml-0.5 text-[11px] text-zinc-600">
            Usually your company or team name.
          </p>
        </div>
      </form>
    </OnboardingLayout>
  )
}

function WorkspacePreview({ name }: { name: string }) {
  const display = name.trim() || "Your workspace"
  const initial = display.trim()[0]?.toUpperCase() ?? "W"

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.06] bg-zinc-950/80 p-5 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.08] bg-gradient-to-br from-zinc-800 to-zinc-900 font-medium text-sm text-zinc-200">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm text-zinc-100">
              {display}
            </p>
            <p className="text-[11px] text-zinc-500">Customer intelligence</p>
          </div>
          <div className="flex size-6 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02]">
            <LayoutGridIcon className="size-3 text-zinc-500" />
          </div>
        </div>

        <div className="mt-5 h-px bg-white/[0.04]" />

        <div className="mt-4 grid grid-cols-2 gap-2">
          {["Signals", "Alerts", "Pipelines"].map((label) => (
            <div
              className="flex items-center gap-2 rounded-md border border-white/[0.04] bg-white/[0.015] px-2.5 py-1.5"
              key={label}
            >
              <div className="size-1.5 rounded-full bg-zinc-600" />
              <span className="text-[11px] text-zinc-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="px-1 text-center text-[11px] text-zinc-600">
        Live preview — updates as you type.
      </p>
    </div>
  )
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${suffix}`
}
