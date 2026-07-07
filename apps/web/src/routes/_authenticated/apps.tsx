import { Button } from "@motiq/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@motiq/ui/components/dialog"
import { Input } from "@motiq/ui/components/input"
import { Skeleton } from "@motiq/ui/components/skeleton"
import { DiscordIcon } from "@motiq/ui/icons/discord"
import { GmailIcon } from "@motiq/ui/icons/gmail"
import { JiraIcon } from "@motiq/ui/icons/jira"
import { LinearIcon } from "@motiq/ui/icons/linear"
import { NotionIcon } from "@motiq/ui/icons/notion"
import { PolarIcon } from "@motiq/ui/icons/polar"
import { SlackIcon } from "@motiq/ui/icons/slack"
import { TelegramIcon } from "@motiq/ui/icons/telegram"
import { ZendeskIcon } from "@motiq/ui/icons/zendesk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { CheckIcon, SearchIcon } from "lucide-react"
import { motion } from "motion/react"
import { type ReactNode, useState } from "react"
import { toast } from "sonner"
import { AppConnectDialog } from "@/components/app/app-connect-dialog"
import { usePermission } from "@/lib/permissions"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/apps")({
  head: () => ({
    meta: [{ title: "Apps | Motiq" }],
  }),
  component: AppsPage,
})

type AppType =
  | "telegram"
  | "gmail"
  | "polar"
  | "notion"
  | "discord"
  | "slack"
  | "zendesk"
  | "jira"
  | "linear"

interface AppDef {
  type: AppType
  name: string
  description: string
  comingSoon?: boolean
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

function AppDetailsDialog({
  app,
  connected,
  onClose,
}: {
  app: AppDef | null
  connected: boolean
  onClose: () => void
}) {
  const Icon = app?.icon

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={!!app}>
      <DialogContent className="rounded-xl border border-white/[0.08] bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-2xl sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            {Icon ? (
              <div className="flex size-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <Icon className={`size-4.5 ${app?.iconColor ?? ""}`} />
              </div>
            ) : null}
            <div>
              <DialogTitle className="font-medium text-lg text-white tracking-tight">
                {app?.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-500">
                Feedback source integration
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-zinc-400 leading-relaxed">
            {app?.description}
          </p>
          <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            <span className="font-medium text-xs text-zinc-500">Status</span>
            <span
              className={`rounded-md border px-2 py-1 font-medium text-[10px] ${
                connected
                  ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400"
                  : "border-white/[0.08] bg-white/[0.04] text-zinc-500"
              }`}
            >
              {connected ? "Connected" : "Not connected"}
            </span>
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button
            className="cursor-pointer rounded-sm bg-white font-medium text-black text-sm transition-all hover:bg-white/90 active:scale-[0.98]"
            onClick={onClose}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AppCard({
  app,
  canInstallApps,
  canUninstallApps,
  connectedApp,
  index,
  isUninstalling,
  onConnect,
  onDetails,
  onUninstall,
  uninstalling,
}: {
  app: AppDef
  canInstallApps: boolean
  canUninstallApps: boolean
  connectedApp?: { id: string } | null
  index: number
  isUninstalling: boolean
  onConnect: (app: AppDef) => void
  onDetails: (app: AppDef) => void
  onUninstall: (id: string) => void
  uninstalling: boolean
}) {
  const isConnected = Boolean(connectedApp)
  const comingSoon = Boolean(app.comingSoon)
  const showSecondaryAction = isConnected || canInstallApps
  const Icon = app.icon

  let action: ReactNode = null
  if (isConnected && canUninstallApps) {
    action = (
      <Button
        className="h-8 cursor-pointer rounded-lg border-red-500/20 bg-red-500/[0.08] font-medium text-red-400 text-xs transition-colors hover:bg-red-500/[0.14] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={uninstalling || !connectedApp}
        onClick={() => connectedApp && onUninstall(connectedApp.id)}
        size="sm"
        variant="outline"
      >
        {isUninstalling ? "Uninstalling..." : "Uninstall"}
      </Button>
    )
  } else if (isConnected) {
    action = (
      <span className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] font-medium text-[11px] text-emerald-400">
        <CheckIcon className="size-3" />
        Connected
      </span>
    )
  } else if (canInstallApps) {
    action = (
      <Button
        className="h-8 cursor-pointer rounded-lg bg-white font-medium text-xs text-zinc-950 transition-all hover:bg-white/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
        disabled={comingSoon}
        onClick={() => !comingSoon && onConnect(app)}
        size="sm"
      >
        {comingSoon ? "Soon" : "Install"}
      </Button>
    )
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 transition-colors ${
        comingSoon
          ? "opacity-50"
          : "hover:border-white/[0.1] hover:bg-white/[0.025]"
      }`}
      initial={{ opacity: 0, y: 8 }}
      key={app.type}
      transition={{ delay: index * 0.04 }}
    >
      <div className="mb-5 flex size-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] transition-colors group-hover:border-white/[0.12] group-hover:bg-white/[0.05]">
        <Icon className={`size-4.5 transition-colors ${app.iconColor}`} />
      </div>

      <div className="mb-2 flex items-center gap-2">
        <span className="font-medium text-sm text-zinc-200">{app.name}</span>
      </div>

      <p className="mb-6 min-h-[48px] flex-1 text-xs text-zinc-500 leading-relaxed">
        {app.description}
      </p>

      <div
        className={`mt-auto grid gap-2 ${
          showSecondaryAction ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        <Button
          className="h-8 cursor-pointer rounded-lg border-white/[0.08] bg-white/[0.04] font-medium text-xs text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={comingSoon}
          onClick={() => onDetails(app)}
          size="sm"
          variant="outline"
        >
          Details
        </Button>
        {action}
      </div>
    </motion.div>
  )
}

const availableApps: AppDef[] = [
  {
    type: "slack",
    name: "Slack",
    description:
      "Capture critical signals from channels and establish team alerts in real-time.",
    icon: SlackIcon,
    iconColor: "text-violet-400",
  },
  {
    type: "discord",
    name: "Discord",
    description:
      "Listen to community channels and surface emerging customer themes in real-time.",
    comingSoon: true,
    icon: DiscordIcon,
    iconColor: "text-indigo-500",
  },
  {
    type: "telegram",
    name: "Telegram",
    description:
      "Stream signals from Telegram groups and chats directly into your feedback pipeline.",
    comingSoon: true,
    icon: TelegramIcon,
    iconColor: "text-sky-400",
  },
  {
    type: "gmail",
    name: "Gmail",
    description:
      "Monitor inbound feedback emails and classify them through AI-powered sensors.",
    comingSoon: true,
    icon: GmailIcon,
    iconColor: "text-red-400",
  },
  {
    type: "notion",
    name: "Notion",
    description:
      "Pipe customer feedback docs and structured pages into the signal layer.",
    comingSoon: true,
    icon: NotionIcon,
    iconColor: "text-zinc-300",
  },
  {
    type: "linear",
    name: "Linear",
    description:
      "Link customer issues to Linear tickets and close the feedback loop end-to-end.",
    comingSoon: true,
    icon: LinearIcon,
    iconColor: "text-violet-300",
  },
  {
    type: "jira",
    name: "Jira",
    description:
      "Connect bug reports and feature requests to upstream customer feedback signals.",
    comingSoon: true,
    icon: JiraIcon,
    iconColor: "text-blue-400",
  },
  {
    type: "zendesk",
    name: "Zendesk",
    description:
      "High-fidelity sync of support tickets and customer interactions into the signal layer.",
    comingSoon: true,
    icon: ZendeskIcon,
    iconColor: "text-white",
  },
  {
    type: "polar",
    name: "Polar",
    description:
      "Sync subscription events and billing signals to map customer health and churn risk.",
    comingSoon: true,
    icon: PolarIcon,
    iconColor: "text-blue-300",
  },
]

function AppsPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const apps = useQuery(trpc.apps.list.queryOptions())
  const [connectTarget, setConnectTarget] = useState<{
    type: string
    name: string
  } | null>(null)
  const [tab, setTab] = useState<"all" | "installed">("all")
  const [search, setSearch] = useState("")
  const [detailTarget, setDetailTarget] = useState<AppDef | null>(null)
  const canInstallApps = usePermission("app", "create")
  const canUninstallApps = usePermission("app", "delete")

  const uninstallApp = useMutation(
    trpc.apps.delete.mutationOptions({
      onSuccess: () => {
        toast.success("App uninstalled")
        queryClient.invalidateQueries({
          queryKey: trpc.apps.list.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to uninstall app")
      },
    })
  )

  const connectedAppByType = new Map(
    (apps.data ?? [])
      .filter((item) => item.status === "active" && !!item.credentials)
      .map((item) => [item.type, item])
  )
  const connectedTypes = new Set(connectedAppByType.keys())

  const filtered = availableApps.filter((i) => {
    const matchesSearch =
      !search || i.name.toLowerCase().includes(search.toLowerCase())
    const matchesTab = tab === "all" || connectedTypes.has(i.type)
    return matchesSearch && matchesTab
  })

  let gridContent = (
    <div className="py-20 text-center text-sm text-zinc-600">No apps found</div>
  )

  if (apps.isLoading) {
    gridContent = (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5"
            key={i}
          >
            <Skeleton className="mb-5 size-10 rounded-xl opacity-20" />
            <Skeleton className="mb-3 h-4 w-2/5 opacity-20" />
            <Skeleton className="mb-1.5 h-3 w-full opacity-10" />
            <Skeleton className="h-3 w-3/4 opacity-10" />
          </div>
        ))}
      </div>
    )
  } else if (filtered.length > 0) {
    gridContent = (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((app, idx) => {
          const connectedApp = connectedAppByType.get(app.type)
          const isUninstalling =
            uninstallApp.isPending &&
            uninstallApp.variables?.id === connectedApp?.id

          return (
            <AppCard
              app={app}
              canInstallApps={canInstallApps}
              canUninstallApps={canUninstallApps}
              connectedApp={connectedApp}
              index={idx}
              isUninstalling={isUninstalling}
              key={app.type}
              onConnect={(target) =>
                setConnectTarget({ name: target.name, type: target.type })
              }
              onDetails={setDetailTarget}
              onUninstall={(id) => uninstallApp.mutate({ id })}
              uninstalling={uninstallApp.isPending}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <header className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl text-white tracking-tighter">
          Apps
        </h1>
        <p className="text-sm text-zinc-500">
          Connect your feedback sources and data pipelines
        </p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex h-9 items-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 text-xs">
          <button
            className={`rounded-[5px] px-3 py-1 font-medium transition-colors ${
              tab === "all"
                ? "bg-white/[0.06] text-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            onClick={() => setTab("all")}
            type="button"
          >
            All
          </button>
          <button
            className={`flex items-center gap-1.5 rounded-[5px] px-3 py-1 font-medium transition-colors ${
              tab === "installed"
                ? "bg-white/[0.06] text-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            onClick={() => setTab("installed")}
            type="button"
          >
            Installed
            {connectedTypes.size > 0 && (
              <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] px-1 text-center text-[10px] text-zinc-500 tabular-nums leading-none">
                {connectedTypes.size}
              </span>
            )}
          </button>
        </div>

        <div className="group relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-zinc-300" />
          <Input
            className="h-9 w-52 rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/[0.03]"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apps..."
            value={search}
          />
        </div>
      </div>

      {/* Grid */}
      {gridContent}

      <AppDetailsDialog
        app={detailTarget}
        connected={detailTarget ? connectedTypes.has(detailTarget.type) : false}
        onClose={() => setDetailTarget(null)}
      />

      <AppConnectDialog
        app={connectTarget}
        onClose={() => setConnectTarget(null)}
      />
    </div>
  )
}
