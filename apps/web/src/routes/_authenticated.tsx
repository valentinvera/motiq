import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { CommandPalette } from "@/components/app/command-palette"
import { AppSidebar } from "@/components/app/sidebar"
import { Topbar } from "@/components/app/topbar"
import { authClient } from "@/lib/auth-client"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    if (!context.auth) {
      throw redirect({ to: "/login" })
    }
    return { auth: context.auth }
  },
  component: AuthenticatedLayout,
})

const PENDING_INVITATION_KEY = "motiq:pendingInvitation"
const GO_TO_ROUTES: Record<string, string> = {
  a: "/alerts",
  c: "/chat",
  d: "/overview",
  i: "/apps",
  p: "/pipelines",
  s: "/signals",
  v: "/activity",
}

function isEditableKeyboardTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null
  return (
    element?.tagName === "INPUT" ||
    element?.tagName === "TEXTAREA" ||
    Boolean(element?.isContentEditable)
  )
}

function isPlainKey(event: KeyboardEvent, key: string) {
  return event.key === key && !(event.metaKey || event.ctrlKey)
}

function isModKey(event: KeyboardEvent, key: string) {
  return (event.metaKey || event.ctrlKey) && event.key === key
}

function AuthenticatedLayout() {
  const { auth } = Route.useRouteContext()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const isOverviewRoute = location.pathname === "/overview"
  const org = useQuery(trpc.workspace.getActive.queryOptions())
  const pendingInvitation = useQuery({
    ...trpc.workspace.getPendingInvitationForMe.queryOptions(),
    enabled: org.data === null && !org.isLoading,
  })
  const workspaces = useQuery({
    ...trpc.workspace.list.queryOptions(),
    enabled:
      org.data === null &&
      !org.isLoading &&
      !pendingInvitation.isLoading &&
      !pendingInvitation.data,
  })
  const [cmdOpen, setCmdOpen] = useState(false)
  const gPending = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const pending = window.sessionStorage.getItem(PENDING_INVITATION_KEY)
    if (!pending) {
      return
    }
    window.sessionStorage.removeItem(PENDING_INVITATION_KEY)
    navigate({ to: "/accept-invitation/$id", params: { id: pending } })
  }, [navigate])

  useEffect(() => {
    if (org.data !== null || org.isLoading) {
      return
    }
    if (pendingInvitation.isLoading) {
      return
    }
    if (pendingInvitation.data) {
      navigate({
        to: "/accept-invitation/$id",
        params: { id: pendingInvitation.data.id },
        replace: true,
      })
      return
    }
    if (workspaces.isLoading) {
      return
    }
    const firstWorkspace = workspaces.data?.[0]
    if (firstWorkspace) {
      authClient.organization
        .setActive({ organizationId: firstWorkspace.id })
        .then(() => window.location.reload())
    } else {
      navigate({ to: "/onboarding" })
    }
  }, [
    org.data,
    org.isLoading,
    pendingInvitation.data,
    pendingInvitation.isLoading,
    workspaces.data,
    workspaces.isLoading,
    navigate,
  ])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isEditableKeyboardTarget(e.target)) {
        return
      }

      if (isModKey(e, "k")) {
        if (isOverviewRoute) {
          return
        }
        e.preventDefault()
        setCmdOpen((prev) => !prev)
        return
      }

      if (isModKey(e, "j")) {
        e.preventDefault()
        navigate({ to: "/chat" })
        return
      }

      if (isPlainKey(e, "g")) {
        gPending.current = true
        setTimeout(() => {
          gPending.current = false
        }, 500)
        return
      }

      if (gPending.current) {
        gPending.current = false
        const target = GO_TO_ROUTES[e.key]
        if (target) {
          e.preventDefault()
          navigate({ to: target })
        }
      }
    },
    [isOverviewRoute, navigate]
  )

  useEffect(() => {
    if (isOverviewRoute) {
      setCmdOpen(false)
    }
  }, [isOverviewRoute])

  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse`,
      {
        withCredentials: true,
      }
    )

    const handleWorkspaceDeleted = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        organizationId: string
        deletedByUserId: string
      }

      if (payload.deletedByUserId === auth.user.id) {
        return
      }

      queryClient.invalidateQueries({
        queryKey: trpc.workspace.getActive.queryKey(),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.list.queryKey(),
      })

      queryClient
        .fetchQuery(trpc.workspace.list.queryOptions())
        .then((workspaces) => {
          const nextWorkspace = workspaces.find(
            (workspace) => workspace.id !== payload.organizationId
          )

          if (nextWorkspace) {
            return authClient.organization
              .setActive({ organizationId: nextWorkspace.id })
              .then(() => window.location.reload())
          }

          navigate({ to: "/onboarding", replace: true })
        })
        .catch(() => {
          navigate({ to: "/onboarding", replace: true })
        })
    }

    eventSource.addEventListener("workspace:deleted", handleWorkspaceDeleted)

    return () => eventSource.close()
  }, [auth.user.id, navigate, queryClient, trpc])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex min-h-dvh w-full">
      <AppSidebar organization={org.data ?? null} />
      <main className="relative ml-14 flex flex-1 flex-col bg-black">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 4% 0%, rgba(6,182,212,0.04) 0%, transparent 30%), radial-gradient(circle at 100% 100%, rgba(20,184,166,0.03) 0%, transparent 32%)",
            }}
          />
        </div>
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.015]" />
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.008]" />
        <Topbar
          onOpenCommandPalette={
            isOverviewRoute ? undefined : () => setCmdOpen(true)
          }
          organization={org.data ?? null}
          user={{
            name: auth.user.name,
            email: auth.user.email,
            image: auth.user.image,
          }}
        />
        <div
          className="relative z-10 flex-1 animate-fade-in overflow-auto p-6 md:p-10"
          key={location.pathname}
        >
          <Outlet />
        </div>
      </main>
      {!isOverviewRoute && (
        <CommandPalette onOpenChange={setCmdOpen} open={cmdOpen} />
      )}
    </div>
  )
}
