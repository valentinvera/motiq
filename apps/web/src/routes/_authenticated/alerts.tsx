import { Button } from "@motiq/ui/components/button"
import { Skeleton } from "@motiq/ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@motiq/ui/components/tabs"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  BellIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  RadioIcon,
  SendIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect } from "react"
import { toast } from "sonner"
import { SeverityBadge } from "@/components/app/badges"
import { EmptyState } from "@/components/app/empty-state"
import { MentionDialog } from "@/components/app/mention-dialog"
import { useTRPC, useTRPCClient } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [{ title: "Alerts | Motiq" }],
  }),
  validateSearch: (search): { id?: string } =>
    typeof search.id === "string" ? { id: search.id } : {},
  component: AlertsPage,
})

interface AlertData {
  id: string
  type: string
  severity: string
  title: string
  description: string | null
  acknowledged: boolean
  signalId: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

interface ResolutionMetadata {
  status?: "reviewed" | "ignored" | "escalated"
  label?: string
  decidedAt?: string
}

function AlertsPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { id: selectedAlertId } = Route.useSearch()
  const alerts = useQuery({
    ...trpc.alert.list.queryOptions(),
  })

  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse`,
      {
        withCredentials: true,
      }
    )

    const invalidateAlerts = () => {
      queryClient.invalidateQueries({ queryKey: trpc.alert.list.queryKey() })
      queryClient.invalidateQueries({
        queryKey: trpc.alert.getUnacknowledgedCount.queryKey(),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.autonomy.getActionQueue.queryKey(),
      })
    }

    eventSource.addEventListener("alert:created", invalidateAlerts)
    eventSource.addEventListener("alert:updated", invalidateAlerts)

    return () => eventSource.close()
  }, [queryClient, trpc])

  useEffect(() => {
    if (!selectedAlertId || alerts.isLoading) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(`alert-${selectedAlertId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [selectedAlertId, alerts.isLoading])

  const unacknowledged =
    alerts.data?.filter((a: AlertData) => !a.acknowledged) ?? []
  const acknowledged =
    alerts.data?.filter((a: AlertData) => a.acknowledged) ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <header className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl text-white tracking-tighter">
          Alerts
        </h1>
        <p className="text-sm text-zinc-500">
          Pattern detection and risk assessment
        </p>
      </header>

      <Tabs className="w-full" defaultValue="all">
        <div className="mb-6 flex items-center justify-between">
          <TabsList className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            <TabsTrigger
              className="data-[state=active]:!bg-zinc-800 data-[state=active]:!border-white/10 !text-zinc-400 hover:!text-white dark:!text-zinc-400 dark:hover:!text-white data-[state=active]:!text-white cursor-pointer rounded-lg px-4 font-medium text-xs transition-all"
              value="all"
            >
              All
              {alerts.data && (
                <span className="ml-2 opacity-40">{alerts.data.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:!bg-zinc-800 data-[state=active]:!border-white/10 !text-zinc-400 hover:!text-white dark:!text-zinc-400 dark:hover:!text-white data-[state=active]:!text-red-400 cursor-pointer rounded-lg px-4 font-medium text-xs transition-all"
              value="unacknowledged"
            >
              Unresolved
              {unacknowledged.length > 0 && (
                <span className="ml-2 text-red-400/60">
                  {unacknowledged.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:!bg-zinc-800 data-[state=active]:!border-white/10 !text-zinc-400 hover:!text-white dark:!text-zinc-400 dark:hover:!text-white data-[state=active]:!text-zinc-200 cursor-pointer rounded-lg px-4 font-medium text-xs transition-all"
              value="acknowledged"
            >
              History
              {acknowledged.length > 0 && (
                <span className="ml-2 opacity-40">{acknowledged.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="hidden items-center gap-2 font-medium text-[11px] text-zinc-500 sm:flex">
            <RadioIcon className="size-3 animate-pulse text-white" />
            Live monitoring
          </div>
        </div>

        {alerts.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                className="flex gap-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
                key={i}
              >
                <Skeleton className="size-3 rounded-full opacity-20" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-2/3 opacity-20" />
                  <Skeleton className="h-4 w-full opacity-10" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            <TabsContent className="mt-0 outline-none" value="all">
              <AlertTimeline
                alerts={alerts.data ?? []}
                selectedAlertId={selectedAlertId}
              />
            </TabsContent>
            <TabsContent className="mt-0 outline-none" value="unacknowledged">
              <AlertTimeline
                alerts={unacknowledged}
                selectedAlertId={selectedAlertId}
              />
            </TabsContent>
            <TabsContent className="mt-0 outline-none" value="acknowledged">
              <AlertTimeline
                alerts={acknowledged}
                selectedAlertId={selectedAlertId}
              />
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  )
}

function AlertTimeline({
  alerts,
  selectedAlertId,
}: {
  alerts: AlertData[]
  selectedAlertId?: string
}) {
  if (!alerts.length) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-20 shadow-2xl backdrop-blur-sm">
        <EmptyState icon={BellIcon} message="No alerts to show." />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute top-4 bottom-4 left-[23px] w-px bg-white/[0.08]" />
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert, i) => (
            <AlertTimelineItem
              alert={alert}
              index={i}
              key={alert.id}
              selected={alert.id === selectedAlertId}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

const severityDotColors: Record<string, string> = {
  critical: "bg-red-500 shadow-[0_0_12px_var(--color-red-500)]",
  high: "bg-orange-500 shadow-[0_0_12px_var(--color-orange-500)]",
  medium: "bg-amber-500 shadow-[0_0_12px_var(--color-amber-500)]",
  low: "bg-blue-500 shadow-[0_0_12px_var(--color-blue-500)]",
}

function AlertTimelineItem({
  alert,
  index,
  selected,
}: {
  alert: AlertData
  index: number
  selected: boolean
}) {
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const escalate = useMutation({
    mutationFn: () => trpcClient.alert.escalateToSlack.mutate({ id: alert.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.alert.list.queryKey() })
      queryClient.invalidateQueries({
        queryKey: trpc.alert.getUnacknowledgedCount.queryKey(),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.autonomy.getActionQueue.queryKey(),
      })
      toast.success("Alert escalated to Slack")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const isPending = escalate.isPending
  const recommendation = getAlertRecommendation(alert)
  const resolution = getAlertResolution(alert)
  let alertClassName =
    "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]"

  if (alert.acknowledged) {
    alertClassName = "border-white/[0.06] bg-white/[0.01]"
  }
  if (selected) {
    alertClassName = "border-white/25 bg-white/[0.06] ring-1 ring-white/15"
  }

  return (
    <motion.div
      animate={{ opacity: alert.acknowledged ? 0.6 : 1, x: 0 }}
      className={`group relative flex gap-6 rounded-xl border p-5 shadow-2xl backdrop-blur-md transition-all ${alertClassName}`}
      exit={{ opacity: 0, scale: 0.95 }}
      id={`alert-${alert.id}`}
      initial={{ opacity: 0, x: -10 }}
      style={{ scrollMarginTop: 96 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className="relative z-10 mt-1.5 flex-shrink-0">
        <div
          className={`size-2.5 rounded-full ring-4 ring-black transition-all group-hover:scale-125 ${
            severityDotColors[alert.severity] ?? "bg-zinc-600"
          }`}
        />
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-medium text-sm text-zinc-200 transition-colors group-hover:text-white">
            {alert.title}
          </p>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-medium text-[10px] text-zinc-400 capitalize">
              {alert.type.replace("_", " ")}
            </span>
          </div>
        </div>

        {alert.description && (
          <p className="max-w-2xl font-medium text-sm text-zinc-400 leading-relaxed">
            {alert.description}
          </p>
        )}

        <div className="max-w-2xl rounded-lg border border-white/[0.06] bg-white/[0.025] p-3">
          <p className="font-medium text-[11px] text-zinc-500 uppercase tracking-wide">
            Motiq recommendation
          </p>
          <p className="mt-1 text-sm text-zinc-300">{recommendation.title}</p>
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
            {recommendation.description}
          </p>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <p className="text-[11px] text-zinc-500">
            Detection:{" "}
            <span className="text-zinc-400">
              {new Date(alert.createdAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
          {alert.signalId && (
            <Link
              className="flex items-center gap-1.5 font-medium text-[11px] text-white/60 transition-colors hover:text-white"
              search={{ id: alert.signalId }}
              to="/signals"
            >
              <ExternalLinkIcon className="size-3" />
              View signal
            </Link>
          )}
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <MentionDialog
          buttonClassName="h-9 cursor-pointer gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] font-medium text-xs text-zinc-200 hover:bg-white/[0.06] hover:text-white"
          entityId={alert.id}
          entityTitle={alert.title}
          entityType="alert"
        />
        {alert.acknowledged ? (
          <div className="flex items-center gap-2 font-medium text-[11px] text-zinc-500">
            <CheckCircleIcon className="size-4" />
            {resolution.label}
          </div>
        ) : (
          <Button
            className="h-9 cursor-pointer gap-2 rounded-lg bg-white font-medium text-black text-xs transition-colors hover:bg-zinc-200"
            disabled={isPending}
            onClick={() => escalate.mutate()}
            size="sm"
          >
            <SendIcon className="size-3.5" />
            {escalate.isPending ? "Escalating..." : "Escalate"}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

function getAlertResolution(alert: AlertData) {
  const resolution = (alert.metadata?.resolution ??
    {}) as ResolutionMetadata | null

  if (resolution?.label) {
    return resolution
  }

  return { status: "reviewed", label: "Handled" } satisfies ResolutionMetadata
}

function getAlertRecommendation(alert: AlertData) {
  if (alert.severity === "critical" || alert.severity === "high") {
    return {
      title: "Escalate this alert and assign an owner.",
      description:
        "Motiq can push this context to Slack now. This routes the issue; it does not change product code or mark the underlying customer problem as fixed.",
    }
  }

  if (alert.type === "churn_risk") {
    return {
      title: "Escalate to the customer owner.",
      description:
        "Use this alert to trigger a human follow-up before the risk becomes a renewal or churn issue.",
    }
  }

  return {
    title: "Escalate if this needs team attention.",
    description:
      "If this does not need action right now, leave it open. Escalation is the only action that changes its state.",
  }
}
