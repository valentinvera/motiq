import { useQuery } from "@tanstack/react-query"
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"
import { useEffect, useState } from "react"
import { useOnboardingFlowActive } from "@/lib/onboarding-flow"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/onboarding")({
  beforeLoad: ({ context }) => {
    if (!context.auth) {
      throw redirect({ to: "/login" })
    }
    return { auth: context.auth }
  },
  component: OnboardingLayoutRoute,
})

const PENDING_INVITATION_KEY = "motiq:pendingInvitation"

function getPendingInvitationId(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  return window.sessionStorage.getItem(PENDING_INVITATION_KEY)
}

function OnboardingLayoutRoute() {
  const trpc = useTRPC()
  const navigate = useNavigate()
  const activeOrg = useQuery(trpc.workspace.getActive.queryOptions())
  const inFlow = useOnboardingFlowActive()
  const [pendingInvitationId] = useState(getPendingInvitationId)
  const pendingInvitation = useQuery({
    ...trpc.workspace.getPendingInvitationForMe.queryOptions(),
    enabled:
      !pendingInvitationId && activeOrg.data === null && !activeOrg.isLoading,
  })

  const hasOrg = Boolean(activeOrg.data)
  const shouldRedirect =
    !(pendingInvitationId || activeOrg.isLoading) && hasOrg && !inFlow

  useEffect(() => {
    if (!pendingInvitationId) {
      return
    }

    window.sessionStorage.removeItem(PENDING_INVITATION_KEY)
    navigate({
      to: "/accept-invitation/$id",
      params: { id: pendingInvitationId },
      replace: true,
    })
  }, [pendingInvitationId, navigate])

  useEffect(() => {
    if (!pendingInvitation.data) {
      return
    }

    navigate({
      to: "/accept-invitation/$id",
      params: { id: pendingInvitation.data.id },
      replace: true,
    })
  }, [pendingInvitation.data, navigate])

  useEffect(() => {
    if (shouldRedirect) {
      navigate({ to: "/overview", replace: true })
    }
  }, [shouldRedirect, navigate])

  if (
    pendingInvitationId ||
    activeOrg.isLoading ||
    pendingInvitation.isLoading ||
    pendingInvitation.data ||
    shouldRedirect
  ) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black">
        <Loader2Icon className="size-5 animate-spin text-zinc-500" />
      </div>
    )
  }

  return <Outlet />
}
