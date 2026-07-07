import { Skeleton } from "@motiq/ui/components/skeleton"
import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router"
import { usePermission } from "@/lib/permissions"

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{ title: "Settings | Motiq" }],
  }),
  component: SettingsLayout,
})

const TABS = [
  { path: "/settings/account", label: "Account" },
  { path: "/settings/workspace", label: "Workspace" },
  { path: "/settings/billing", label: "Billing" },
  { path: "/settings/apps", label: "Apps" },
  { path: "/settings/members", label: "Members" },
  { path: "/settings/notifications", label: "Notifications" },
  { path: "/settings/developer", label: "Developer" },
] as const

function SettingsLayout() {
  const location = useLocation()
  const canManageBilling = usePermission("billing", "manage")
  const visibleTabs = TABS.filter(
    (tab) => tab.path !== "/settings/billing" || canManageBilling
  )

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <nav className="flex items-center gap-6 overflow-x-auto border-white/[0.06] border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleTabs.map((tab) => {
          const active =
            location.pathname === tab.path ||
            location.pathname.startsWith(`${tab.path}/`)
          return (
            <Link
              className={`relative -mb-px shrink-0 pb-3 text-sm transition-colors ${
                active ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
              key={tab.path}
              to={tab.path}
            >
              {tab.label}
              {active ? (
                <span className="absolute right-0 bottom-0 left-0 h-px bg-zinc-100" />
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-6 pt-8">
        <Outlet />
      </div>
    </div>
  )
}

export function SettingsTabSkeleton() {
  return (
    <>
      <Skeleton className="h-32 w-full rounded-xl opacity-10" />
      <Skeleton className="h-32 w-full rounded-xl opacity-10" />
    </>
  )
}
