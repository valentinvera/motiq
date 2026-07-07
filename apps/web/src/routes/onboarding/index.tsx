import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"
import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/onboarding/")({
  head: () => ({
    meta: [{ title: "Onboarding | Motiq" }],
  }),
  component: OnboardingIndex,
})

function OnboardingIndex() {
  const trpc = useTRPC()
  const navigate = useNavigate()

  const activeOrg = useQuery(trpc.workspace.getActive.queryOptions())
  const workspaces = useQuery({
    ...trpc.workspace.list.queryOptions(),
    enabled: activeOrg.data === null && !activeOrg.isLoading,
  })

  useEffect(() => {
    if (activeOrg.isLoading) {
      return
    }

    if (activeOrg.data) {
      navigate({ to: "/overview" })
      return
    }

    if (workspaces.isLoading) {
      return
    }

    const first = workspaces.data?.[0]
    if (first) {
      authClient.organization
        .setActive({ organizationId: first.id })
        .then(() => {
          navigate({ to: "/overview" })
        })
      return
    }

    navigate({ to: "/onboarding/workspace", replace: true })
  }, [
    activeOrg.data,
    activeOrg.isLoading,
    workspaces.data,
    workspaces.isLoading,
    navigate,
  ])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-black">
      <Loader2Icon className="size-5 animate-spin text-zinc-500" />
    </div>
  )
}
