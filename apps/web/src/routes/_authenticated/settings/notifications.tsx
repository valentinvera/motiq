import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
import { usePermission } from "@/lib/permissions"
import { SettingsTabSkeleton } from "@/routes/_authenticated/settings"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  head: () => ({
    meta: [{ title: "Notifications | Motiq" }],
  }),
  component: NotificationsTab,
})

const OPTIONS = [
  {
    key: "daily_digest",
    label: "Daily digest",
    description: "Receive a daily summary of activity.",
  },
  {
    key: "critical_alerts",
    label: "Critical alerts",
    description: "Get notified immediately for high-severity issues.",
  },
  {
    key: "new_patterns",
    label: "New patterns",
    description: "Get notified when new patterns are detected.",
  },
  {
    key: "churn_risk",
    label: "Churn risk",
    description: "Get notified when churn risk is identified.",
  },
]

function parseMetadata(metadata: string | null) {
  if (!metadata) {
    return {}
  }

  try {
    return JSON.parse(metadata) as Record<string, unknown>
  } catch {
    return {}
  }
}

function NotificationsTab() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const canManageNotifications = usePermission("organization", "update")
  const org = useQuery(trpc.workspace.getActive.queryOptions())

  const updateWorkspace = useMutation(
    trpc.workspace.update.mutationOptions({
      onSuccess: () => {
        toast.success("Notification preferences saved")
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.getActive.queryKey(),
        })
      },
      onError: () => {
        toast.error("Failed to save preferences")
      },
    })
  )

  if (org.isLoading || !org.data) {
    return <SettingsTabSkeleton />
  }

  const parsed = parseMetadata(org.data.metadata)
  const prefs = (parsed.notifications ?? {}) as Record<string, boolean>

  function togglePref(key: string) {
    if (!canManageNotifications) {
      return
    }

    const newPrefs = { ...prefs, [key]: !prefs[key] }
    const newMetadata = JSON.stringify({ ...parsed, notifications: newPrefs })
    updateWorkspace.mutate({ metadata: newMetadata })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="p-6">
        <h3 className="font-medium text-[15px] text-zinc-100">
          Notification preferences
        </h3>
        <p className="mt-1.5 text-[13px] text-zinc-500 leading-relaxed">
          {canManageNotifications
            ? "Choose which notifications your team receives."
            : "Workspace notification preferences are managed by owners and admins."}
        </p>
      </div>
      <div className="divide-y divide-white/[0.06] border-white/[0.06] border-t">
        {OPTIONS.map((opt) => (
          <div
            className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.02]"
            key={opt.key}
          >
            <div>
              <p className="font-medium text-sm text-zinc-200">{opt.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{opt.description}</p>
            </div>
            <button
              aria-checked={Boolean(prefs[opt.key])}
              aria-disabled={!canManageNotifications}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
                canManageNotifications
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-60"
              } ${prefs[opt.key] ? "bg-white" : "bg-zinc-800"}`}
              disabled={!canManageNotifications || updateWorkspace.isPending}
              onClick={() => togglePref(opt.key)}
              role="switch"
              title={
                canManageNotifications
                  ? undefined
                  : "Only owners and admins can change workspace notifications"
              }
              type="button"
            >
              <span
                className={`pointer-events-none inline-block size-4 rounded-full bg-black shadow transition-transform duration-200 ${
                  prefs[opt.key] ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
