import { Skeleton } from "@motiq/ui/components/skeleton"
import { DiscordIcon } from "@motiq/ui/icons/discord"
import { GmailIcon } from "@motiq/ui/icons/gmail"
import { SlackIcon } from "@motiq/ui/icons/slack"
import { TelegramIcon } from "@motiq/ui/icons/telegram"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
  BellIcon,
  LinkIcon,
  NetworkIcon,
  PlugIcon,
  ShieldCheckIcon,
  SignalIcon,
  SparklesIcon,
} from "lucide-react"
import type { ComponentType } from "react"
import { useState } from "react"
import { toast } from "sonner"
import { ChatComposer } from "@/components/app/chat-composer"
import { createChat } from "@/lib/chat"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/overview")({
  head: () => ({
    meta: [{ title: "Overview | Motiq" }],
  }),
  component: OverviewPage,
})

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) {
    return "Good morning"
  }
  if (hour < 18) {
    return "Good afternoon"
  }
  return "Good evening"
}

function getStatusMessage(
  allCaughtUp: boolean,
  openAlerts: number,
  pendingActions: number
) {
  if (allCaughtUp) {
    return "You're all caught up. Nothing needs your attention right now."
  }
  const alertWord = openAlerts === 1 ? "alert" : "alerts"
  const actionWord = pendingActions === 1 ? "action" : "actions"
  if (pendingActions > 0) {
    return `You have ${openAlerts} open ${alertWord} and ${pendingActions} pending ${actionWord} to review.`
  }
  return `You have ${openAlerts} open ${alertWord} to review.`
}

function getOpenAlertsSub(criticalAlerts: number, openAlerts: number) {
  if (criticalAlerts > 0) {
    return `${criticalAlerts} critical`
  }
  if (openAlerts === 0) {
    return "All clear"
  }
  return "Unacknowledged"
}

function OverviewPage() {
  const trpc = useTRPC()
  const { auth } = Route.useRouteContext()
  const overview = useQuery(trpc.overview.getOverview.queryOptions())

  const firstName = auth.user.name.split(" ")[0]
  const data = overview.data
  const loading = overview.isLoading

  const criticalAlerts =
    data?.alerts.items.filter((a) => a.severity === "critical").length ?? 0
  const openAlerts = data?.alerts.unacknowledged ?? 0
  const signalsLast7d = data?.signals.inRange ?? 0
  const pipelinesRunning = data?.pipelines.running ?? 0
  const pipelinesCompleted = data?.pipelines.completed ?? 0
  const connectedSources = data?.apps.active ?? 0
  const pendingActions = data?.autonomy.pendingActions ?? 0

  const allCaughtUp =
    !loading && openAlerts === 0 && pendingActions === 0 && criticalAlerts === 0

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col items-center px-6 pt-24 pb-24">
      <div className="text-center">
        <h1 className="font-light text-3xl text-zinc-100 tracking-tight md:text-4xl">
          {getGreeting()}, <span className="text-zinc-500/70">{firstName}</span>
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          {getStatusMessage(allCaughtUp, openAlerts, pendingActions)}
        </p>
      </div>

      <ChatInput />

      <QuickActions />

      <div className="mt-12 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <StatCard
          href="/signals"
          label="Signal volume"
          loading={loading}
          sub="Last 7 days"
          value={signalsLast7d.toLocaleString()}
        />
        <StatCard
          critical={criticalAlerts > 0}
          href="/alerts"
          label="Open alerts"
          loading={loading}
          sub={getOpenAlertsSub(criticalAlerts, openAlerts)}
          value={openAlerts.toString()}
        />
        <StatCard
          href="/pipelines"
          label="Pipeline runs"
          loading={loading}
          sub={
            pipelinesRunning > 0
              ? `${pipelinesRunning} running`
              : "Idle this week"
          }
          value={pipelinesCompleted.toString()}
        />
        <StatCard
          href="/apps"
          label="Connected sources"
          loading={loading}
          sub={connectedSources === 0 ? "Connect to start" : "Syncing live"}
          value={connectedSources.toString()}
        />
        <StatCard
          href="/autonomy"
          label="Pending actions"
          loading={loading}
          sub={pendingActions === 0 ? "Up to date" : "Awaiting review"}
          value={pendingActions.toString()}
        />
      </div>
    </div>
  )
}

function ChatInput() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async ({ text: rawText }: { text?: string }) => {
    const text = rawText?.trim()
    if (!text || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      const chat = await createChat(text)
      navigate({ to: "/chat/$id", params: { id: chat.id } })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start chat"
      )
      setIsSubmitting(false)
    }
  }

  return (
    <ChatComposer
      className="mt-10"
      footer={
        <div className="mt-3 flex justify-end">
          <Link
            className="group inline-flex cursor-pointer items-center gap-2 text-[11px] text-zinc-500 transition-colors hover:text-zinc-200"
            to="/apps"
          >
            <span>Connect apps</span>
            <span className="text-zinc-300 transition-colors group-hover:text-white">
              ›
            </span>
            <span className="flex -space-x-1">
              <span className="flex size-4 items-center justify-center rounded-full border border-black bg-white/[0.06]">
                <SlackIcon className="size-2.5" />
              </span>
              <span className="flex size-4 items-center justify-center rounded-full border border-black bg-white/[0.06]">
                <DiscordIcon className="size-2.5 text-indigo-500" />
              </span>
              <span className="flex size-4 items-center justify-center rounded-full border border-black bg-white/[0.06]">
                <TelegramIcon className="size-2.5 text-sky-400" />
              </span>
              <span className="flex size-4 items-center justify-center rounded-full border border-black bg-white/[0.06]">
                <GmailIcon className="size-2.5" />
              </span>
            </span>
          </Link>
        </div>
      }
      onSubmit={handleSubmit}
      placeholder="Ask Motiq about customer signals, alerts, or churn risk..."
      status={isSubmitting ? "submitted" : "ready"}
    />
  )
}

const QUICK_ACTIONS: {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}[] = [
  { label: "Recent chats", href: "/chat", icon: SparklesIcon },
  { label: "View signals", href: "/signals", icon: SignalIcon },
  { label: "Review alerts", href: "/alerts", icon: BellIcon },
  { label: "Configure autonomy", href: "/autonomy", icon: ShieldCheckIcon },
  { label: "Connect sources", href: "/apps", icon: LinkIcon },
]

function QuickActions() {
  return (
    <div className="mt-6 flex w-full flex-wrap justify-center gap-2">
      {QUICK_ACTIONS.map((action) => (
        <Link
          className="inline-flex h-9 items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.015] px-3.5 text-xs text-zinc-300 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white"
          key={action.href}
          to={action.href}
        >
          <action.icon className="size-3.5 text-zinc-500" />
          {action.label}
        </Link>
      ))}
    </div>
  )
}

const STAT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "Signal volume": SignalIcon,
  "Open alerts": BellIcon,
  "Pipeline runs": NetworkIcon,
  "Connected sources": PlugIcon,
  "Pending actions": ShieldCheckIcon,
}

function StatCard({
  label,
  value,
  sub,
  href,
  loading,
  critical,
}: {
  label: string
  value: string
  sub: string
  href: string
  loading: boolean
  critical?: boolean
}) {
  const Icon = STAT_ICONS[label]

  return (
    <Link
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white/[0.015] p-5 transition-colors ${
        critical
          ? "border-red-500/15 bg-gradient-to-br from-red-500/[0.05] via-white/[0.01] to-transparent hover:border-red-500/25"
          : "border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.025]"
      }`}
      to={href}
    >
      <div className="flex items-center gap-1.5 text-zinc-500">
        {Icon && <Icon className="size-3.5" />}
        <span className="text-xs">{label}</span>
      </div>
      {loading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-7 w-16 opacity-20" />
          <Skeleton className="h-3 w-24 opacity-15" />
        </div>
      ) : (
        <>
          <p
            className={`mt-3 font-light text-3xl tracking-tight ${
              critical ? "text-red-300" : "text-white"
            }`}
          >
            {value}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">{sub}</p>
        </>
      )}
    </Link>
  )
}
