import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@motiq/ui/components/dropdown-menu"
import { Skeleton } from "@motiq/ui/components/skeleton"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ActivityIcon,
  AlertTriangleIcon,
  BellIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  NetworkIcon,
  PlugIcon,
  RadioIcon,
  SignalIcon,
  SparklesIcon,
  Volume2Icon,
  XIcon,
  ZapIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useTRPC } from "@/utils/trpc"

type RangeDays = 1 | 7 | 14 | 30 | 90
type Mode = "reports" | "metrics"

const RANGE_OPTIONS: { value: RangeDays; label: string }[] = [
  { value: 1, label: "24 hours" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
]

function rangeLabel(days: RangeDays): string {
  return RANGE_OPTIONS.find((o) => o.value === days)?.label ?? `${days} days`
}

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [{ title: "Reports | Motiq" }],
  }),
  component: ReportsPage,
})

function ReportsPage() {
  const trpc = useTRPC()
  const [range, setRange] = useState<RangeDays>(7)
  const [mode, setMode] = useState<Mode>("reports")
  const overview = useQuery(
    trpc.overview.getOverview.queryOptions({ days: range })
  )

  const data = overview.data
  const loading = overview.isLoading

  return (
    <div className="mx-auto w-full max-w-[1500px] px-8 pt-12 pb-24">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-light text-3xl text-zinc-100 tracking-tight md:text-4xl">
            Reports
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            here's a quick look at how things are going.
          </p>
        </div>

        <ReportsToolbar
          mode={mode}
          onModeChange={setMode}
          onRangeChange={setRange}
          range={range}
        />
      </div>

      {mode === "reports" ? (
        <ReportsGrid data={data ?? null} loading={loading} range={range} />
      ) : (
        <MetricsView data={data ?? null} loading={loading} range={range} />
      )}
    </div>
  )
}

function ReportsGrid({
  data,
  loading,
  range,
}: {
  data: ReportsGridData | null
  loading: boolean
  range: RangeDays
}) {
  const [summaryDismissed, setSummaryDismissed] = useState(false)

  const criticalAlerts =
    data?.alerts.items.filter((a) => a.severity === "critical").length ?? 0
  const cardGridClass =
    "mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"

  return (
    <>
      <div className={cardGridClass}>
        {!summaryDismissed && (
          <WeeklySummaryCard
            alerts={data?.alerts.unacknowledged ?? 0}
            criticalAlerts={criticalAlerts}
            loading={loading}
            onDismiss={() => setSummaryDismissed(true)}
            range={range}
            signals={data?.signals.inRange ?? 0}
          />
        )}

        <SignalVolumeCard
          data={data?.signalsPerDay ?? []}
          days={range}
          loading={loading}
          total={data?.signals.inRange ?? 0}
        />

        <TopRiskCard
          customer={data?.topRiskCustomer ?? null}
          loading={loading}
        />

        <PendingAlertsCard
          critical={criticalAlerts}
          loading={loading}
          total={data?.alerts.unacknowledged ?? 0}
        />

        <PendingActionsCard
          loading={loading}
          total={data?.autonomy.pendingActions ?? 0}
        />

        <AppsCard
          lastSyncAt={data?.apps.lastSyncAt ?? null}
          loading={loading}
          total={data?.apps.active ?? 0}
        />

        <PipelinesCard
          completed={data?.pipelines.completed ?? 0}
          loading={loading}
          range={range}
          running={data?.pipelines.running ?? 0}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ActivityFeedCard
          activity={data?.recentActivity ?? []}
          loading={loading}
        />
        <LatestSignalsCard
          loading={loading}
          signals={data?.latestSignals ?? []}
        />
      </div>
    </>
  )
}

interface ReportsGridData {
  alerts: {
    unacknowledged: number
    items: { severity: string; type?: string | null }[]
  }
  signals: {
    inRange: number
  }
  signalsPerDay: { day: string; count: number }[]
  topRiskCustomer: {
    name: string | null
    company: string | null
    riskScore: number | null
  } | null
  autonomy: { pendingActions: number }
  apps: { active: number; lastSyncAt: Date | string | null }
  pipelines: { running: number; completed: number }
  recentActivity: {
    id: string
    activityType: string | null
    title: string | null
    description: string | null
    createdAt: Date | string | null
  }[]
  latestSignals: {
    id: string
    title: string | null
    type: string | null
    priority: string | null
    customerName: string | null
    createdAt: Date | string | null
  }[]
}

function ReportsToolbar({
  mode,
  range,
  onModeChange,
  onRangeChange,
}: {
  mode: Mode
  range: RangeDays
  onModeChange: (next: Mode) => void
  onRangeChange: (next: RangeDays) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 text-xs text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-200"
            type="button"
          >
            <span>{rangeLabel(range)}</span>
            <ChevronDownIcon className="size-3 text-zinc-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="glass-high w-40"
          sideOffset={6}
        >
          {RANGE_OPTIONS.map((opt) => (
            <DropdownMenuItem
              className="cursor-pointer gap-2 px-2.5 py-2 text-[13px] text-zinc-200 focus:bg-white/10 focus:text-white"
              key={opt.value}
              onSelect={() => onRangeChange(opt.value)}
            >
              <span className="flex-1">{opt.label}</span>
              {opt.value === range && (
                <CheckIcon className="size-3.5 text-zinc-400" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="inline-flex h-8 items-center rounded-md border border-white/[0.06] bg-white/[0.02] p-0.5 text-xs">
        <ModeButton
          active={mode === "reports"}
          label="Reports"
          onClick={() => onModeChange("reports")}
        />
        <ModeButton
          active={mode === "metrics"}
          label="Metrics"
          onClick={() => onModeChange("metrics")}
        />
      </div>
    </div>
  )
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={`cursor-pointer rounded-[5px] px-3 py-1 transition-colors ${
        active
          ? "bg-white/[0.06] text-zinc-200"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

function CardShell({
  children,
  href,
  footer,
  className = "",
}: {
  children: React.ReactNode
  href?: string
  footer?: React.ReactNode
  className?: string
}) {
  const inner = (
    <div className="flex h-full flex-col p-5">
      <div className="flex-1">{children}</div>
      {footer && (
        <div className="mt-4 border-white/[0.04] border-t pt-3 text-[11px] text-zinc-500 transition-colors group-hover:text-zinc-300">
          {footer}
        </div>
      )}
    </div>
  )

  const base =
    "group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015] transition-colors hover:border-white/[0.1] hover:bg-white/[0.025]"

  if (href) {
    return (
      <Link className={`${base} ${className}`} to={href}>
        {inner}
      </Link>
    )
  }
  return <div className={`${base} ${className}`}>{inner}</div>
}

function CardHeader({
  icon: Icon,
  label,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-zinc-500">
        <Icon className="size-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      {badge}
    </div>
  )
}

function WeeklySummaryCard({
  signals,
  alerts,
  criticalAlerts,
  loading,
  range,
  onDismiss,
}: {
  signals: number
  alerts: number
  criticalAlerts: number
  loading: boolean
  range: RangeDays
  onDismiss: () => void
}) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-white/[0.005] transition-colors hover:border-white/[0.12]">
      <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-zinc-500/10 blur-3xl" />
      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <SparklesIcon className="size-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-300">
              {range === 7 ? "Weekly Summary" : `Last ${rangeLabel(range)}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500">Just now</span>
            <button
              aria-label="Dismiss summary"
              className="flex size-5 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
              onClick={onDismiss}
              type="button"
            >
              <XIcon className="size-3" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex-1">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full opacity-20" />
              <Skeleton className="h-4 w-5/6 opacity-20" />
              <Skeleton className="h-4 w-2/3 opacity-20" />
            </div>
          ) : (
            <p className="text-sm text-zinc-300 leading-relaxed">
              <span className="font-medium text-white">{signals} signals</span>{" "}
              processed,{" "}
              <span className="font-medium text-white">{alerts} alerts</span>{" "}
              opened.{" "}
              {criticalAlerts > 0 && (
                <span className="text-red-400">
                  {criticalAlerts} critical needs your attention.
                </span>
              )}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-white/[0.04] border-t pt-3 text-[11px]">
          <button
            className="inline-flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-zinc-200"
            type="button"
          >
            <Volume2Icon className="size-3" />
            Listen to breakdown
          </button>
          <button
            className="text-zinc-500 transition-colors hover:text-zinc-300"
            onClick={onDismiss}
            type="button"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

function SignalVolumeCard({
  data,
  days,
  loading,
  total,
}: {
  data: { day: string; count: number }[]
  days: RangeDays
  loading: boolean
  total: number
}) {
  const buckets = useMemo(() => {
    const out: { day: string; count: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().slice(0, 10)
      const found = data.find((d) => d.day.startsWith(key))
      out.push({ day: key, count: found?.count ?? 0 })
    }
    return out
  }, [data, days])
  const max = Math.max(1, ...buckets.map((d) => d.count))

  return (
    <CardShell footer="See volume trend" href="/signals">
      <CardHeader icon={SignalIcon} label="Signal volume" />
      {loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-5 w-3/4 opacity-20" />
          <Skeleton className="h-12 w-full opacity-15" />
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
            Last {rangeLabel(days)} you got{" "}
            <span className="text-white">{total.toLocaleString()} signals</span>
          </p>
          <div className="mt-4 flex h-14 items-end gap-1.5">
            {buckets.map((d, i) => {
              const pct = (d.count / max) * 100
              const isToday = i === buckets.length - 1
              return (
                <div
                  className="group/bar flex flex-1 flex-col items-center gap-1"
                  key={d.day}
                >
                  <div
                    className={`w-full rounded-sm transition-colors ${
                      isToday
                        ? "bg-zinc-200 group-hover/bar:bg-white"
                        : "bg-white/15 group-hover/bar:bg-white/25"
                    }`}
                    style={{ height: `${Math.max(6, pct)}%` }}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}
    </CardShell>
  )
}

function TopRiskCard({
  customer,
  loading,
}: {
  customer: {
    name: string | null
    company: string | null
    riskScore: number | null
  } | null
  loading: boolean
}) {
  const display = customer?.company ?? customer?.name ?? "—"
  const score = customer?.riskScore ?? 0
  const isHigh = score >= 70

  return (
    <CardShell
      className={
        isHigh
          ? "border-red-500/15 bg-gradient-to-br from-red-500/[0.05] via-white/[0.01] to-transparent hover:border-red-500/25"
          : ""
      }
      footer="View customer"
      href="/signals"
    >
      {isHigh && (
        <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-red-500/15 blur-3xl" />
      )}
      <div className="relative">
        <CardHeader
          badge={
            isHigh ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/[0.06] px-1.5 py-0.5 font-medium text-[10px] text-red-400">
                <span className="size-1 animate-pulse rounded-full bg-red-400" />
                high
              </span>
            ) : null
          }
          icon={AlertTriangleIcon}
          label="Top risk"
        />
        {loading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-full opacity-20" />
            <Skeleton className="h-10 w-24 opacity-20" />
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
              Your highest risk customer is{" "}
              <span className="text-white">{display}</span> with a score of
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span
                className={`font-light text-4xl tracking-tight ${
                  isHigh ? "text-red-300" : "text-white"
                }`}
              >
                {Math.round(score)}
              </span>
              <span className="text-xs text-zinc-600">/ 100</span>
            </div>
          </>
        )}
      </div>
    </CardShell>
  )
}

function PendingAlertsCard({
  total,
  critical,
  loading,
}: {
  total: number
  critical: number
  loading: boolean
}) {
  const hasCritical = critical > 0

  return (
    <CardShell
      className={
        hasCritical
          ? "border-red-500/15 bg-gradient-to-br from-red-500/[0.05] via-white/[0.01] to-transparent hover:border-red-500/25"
          : ""
      }
      footer="Review alerts"
      href="/alerts"
    >
      {hasCritical && (
        <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-red-500/15 blur-3xl" />
      )}
      <div className="relative">
        <CardHeader
          badge={
            hasCritical ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/[0.06] px-1.5 py-0.5 font-medium text-[10px] text-red-400">
                <span className="size-1 animate-pulse rounded-full bg-red-400" />
                critical
              </span>
            ) : null
          }
          icon={BellIcon}
          label="Pending alerts"
        />
        {loading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-full opacity-20" />
            <Skeleton className="h-10 w-16 opacity-20" />
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
              You currently have{" "}
              <span className="text-white">
                {total} unacknowledged{total === 1 ? " alert" : " alerts"}
              </span>{" "}
              {critical > 0
                ? `and ${critical} critical needing attention`
                : "across active apps"}
            </p>
            <p
              className={`mt-4 font-light text-3xl tracking-tight ${
                hasCritical ? "text-red-300" : "text-white"
              }`}
            >
              {total}
            </p>
          </>
        )}
      </div>
    </CardShell>
  )
}

function PendingActionsCard({
  total,
  loading,
}: {
  total: number
  loading: boolean
}) {
  return (
    <CardShell footer="Review queue" href="/autonomy">
      <CardHeader icon={CheckCircleIcon} label="Pending actions" />
      {loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-full opacity-20" />
          <Skeleton className="h-10 w-16 opacity-20" />
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
            <span className="text-white">{total} actions</span> awaiting your
            review across slack, email and jira
          </p>
          <p className="mt-4 font-light text-3xl text-white tracking-tight">
            {total}
          </p>
        </>
      )}
    </CardShell>
  )
}

function AppsCard({
  total,
  lastSyncAt,
  loading,
}: {
  total: number
  lastSyncAt: Date | string | null
  loading: boolean
}) {
  const minutesSinceSync = useMemo(() => {
    const date = lastSyncAt ? new Date(lastSyncAt) : null
    return date
      ? Math.max(1, Math.round((Date.now() - date.getTime()) / 60_000))
      : null
  }, [lastSyncAt])

  return (
    <CardShell footer="Manage apps" href="/apps">
      <CardHeader
        badge={
          total > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-1.5 py-0.5 font-medium text-[10px] text-emerald-400">
              <span className="size-1 animate-pulse rounded-full bg-emerald-400" />
              live
            </span>
          ) : null
        }
        icon={PlugIcon}
        label="Apps"
      />
      {loading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full opacity-20" />
          <Skeleton className="h-4 w-3/4 opacity-20" />
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
          <span className="text-white">{total} connected sources</span> syncing
          continuously
          {minutesSinceSync !== null && (
            <>
              ,{" "}
              <span className="text-zinc-500">
                last sync {minutesSinceSync}m ago
              </span>
            </>
          )}
          .
        </p>
      )}
    </CardShell>
  )
}

function PipelinesCard({
  running,
  completed,
  loading,
  range,
}: {
  running: number
  completed: number
  loading: boolean
  range: RangeDays
}) {
  const sparkPoints = useMemo(() => {
    const total = Math.max(8, completed)
    const seed = [0.4, 0.6, 0.5, 0.75, 0.65, 0.85, 0.7, 0.95]
    return seed.map((s, i) => ({
      x: (i / (seed.length - 1)) * 100,
      y: 100 - s * 100,
      val: Math.round(total * s),
    }))
  }, [completed])

  const path = useMemo(() => {
    if (sparkPoints.length === 0) {
      return ""
    }
    return sparkPoints
      .map(
        (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
      )
      .join(" ")
  }, [sparkPoints])

  const area = useMemo(() => {
    if (sparkPoints.length === 0) {
      return ""
    }
    return `${path} L 100 100 L 0 100 Z`
  }, [path, sparkPoints])

  return (
    <CardShell footer="See pipeline activity" href="/pipelines">
      <CardHeader
        badge={
          running > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-1.5 py-0.5 font-medium text-[10px] text-emerald-400">
              <span className="size-1 animate-pulse rounded-full bg-emerald-400" />
              {running} running
            </span>
          ) : null
        }
        icon={NetworkIcon}
        label="Pipelines"
      />
      {loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-3/4 opacity-20" />
          <Skeleton className="h-12 w-full opacity-15" />
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
            Your pipelines completed{" "}
            <span className="text-white">{completed} runs</span> in the last{" "}
            {rangeLabel(range)}
          </p>
          <svg
            className="mt-4 h-12 w-full text-emerald-400/70"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <title>Pipeline runs sparkline</title>
            <defs>
              <linearGradient id="pipeline-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#pipeline-area)" />
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </>
      )}
    </CardShell>
  )
}

const ACTIVITY_META: Record<
  string,
  { icon: typeof RadioIcon; color: string; dot: string }
> = {
  signal_received: {
    icon: RadioIcon,
    color: "text-blue-300",
    dot: "bg-blue-400",
  },
  signal_processing_started: {
    icon: ActivityIcon,
    color: "text-violet-300",
    dot: "bg-violet-400",
  },
  signal_processing_completed: {
    icon: CheckCircleIcon,
    color: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  signal_processing_failed: {
    icon: AlertTriangleIcon,
    color: "text-red-300",
    dot: "bg-red-400",
  },
  signal_skipped: {
    icon: RadioIcon,
    color: "text-zinc-400",
    dot: "bg-zinc-500",
  },
  agent_run_started: {
    icon: ActivityIcon,
    color: "text-violet-300",
    dot: "bg-violet-400",
  },
  agent_run_completed: {
    icon: CheckCircleIcon,
    color: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  agent_run_failed: {
    icon: AlertTriangleIcon,
    color: "text-red-300",
    dot: "bg-red-400",
  },
  customer_created: {
    icon: RadioIcon,
    color: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  customer_updated: {
    icon: RadioIcon,
    color: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  alert_created: {
    icon: AlertTriangleIcon,
    color: "text-red-300",
    dot: "bg-red-400",
  },
  alert_deduped: {
    icon: CheckCircleIcon,
    color: "text-zinc-300",
    dot: "bg-zinc-400",
  },
  alert_skipped: {
    icon: RadioIcon,
    color: "text-zinc-400",
    dot: "bg-zinc-500",
  },
  signal_classified: {
    icon: RadioIcon,
    color: "text-zinc-300",
    dot: "bg-zinc-400",
  },
  pattern_detected: {
    icon: ZapIcon,
    color: "text-violet-300",
    dot: "bg-violet-400",
  },
  risk_flagged: {
    icon: AlertTriangleIcon,
    color: "text-red-300",
    dot: "bg-red-400",
  },
  action_proposed: {
    icon: CheckCircleIcon,
    color: "text-blue-300",
    dot: "bg-blue-400",
  },
  action_executed: {
    icon: CheckCircleIcon,
    color: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  action_failed: {
    icon: AlertTriangleIcon,
    color: "text-red-300",
    dot: "bg-red-400",
  },
  action_undone: {
    icon: CheckCircleIcon,
    color: "text-zinc-300",
    dot: "bg-zinc-400",
  },
  autonomy_changed: {
    icon: ActivityIcon,
    color: "text-zinc-300",
    dot: "bg-zinc-400",
  },
}

function timeAgo(date: Date | string | null) {
  if (!date) {
    return ""
  }
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) {
    return "just now"
  }
  if (m < 60) {
    return `${m}m`
  }
  const h = Math.floor(m / 60)
  if (h < 24) {
    return `${h}h`
  }
  return `${Math.floor(h / 24)}d`
}

function ActivityFeedCard({
  activity,
  loading,
}: {
  activity: {
    id: string
    activityType: string | null
    title: string | null
    description: string | null
    createdAt: Date | string | null
  }[]
  loading: boolean
}) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015] lg:col-span-2">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-1.5 text-zinc-500">
          <ActivityIcon className="size-3.5" />
          <span className="text-xs">Live activity</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-1.5 py-0.5 font-medium text-[10px] text-emerald-400">
          <span className="size-1 animate-pulse rounded-full bg-emerald-400" />
          streaming
        </span>
      </div>

      <div className="flex-1 px-5 pb-5">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton className="h-10 w-full opacity-15" key={i} />
            ))}
          </div>
        )}
        {!loading && activity.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-600">
            Nothing recent. Connect a source to start streaming.
          </p>
        )}
        {!loading && activity.length > 0 && (
          <ol className="relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-white/[0.04]">
            {activity.slice(0, 7).map((a) => {
              const meta =
                ACTIVITY_META[a.activityType ?? ""] ??
                ACTIVITY_META.signal_classified
              if (!meta) {
                return null
              }
              return (
                <li className="relative flex items-start gap-3 pl-0" key={a.id}>
                  <span
                    className={`mt-1.5 size-3.5 shrink-0 rounded-full border border-white/[0.08] bg-zinc-950 ${
                      a.activityType === "risk_flagged"
                        ? "ring-2 ring-white/[0.04]"
                        : ""
                    }`}
                  >
                    <span
                      className={`absolute top-[8px] left-[4px] size-1.5 rounded-full ${meta.dot}`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-medium text-sm ${meta.color}`}>
                      {a.title ?? "Activity"}
                    </p>
                    {a.description && (
                      <p className="truncate text-[11px] text-zinc-600">
                        {a.description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] text-zinc-600 tabular-nums">
                    {timeAgo(a.createdAt)}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <Link
        className="border-white/[0.04] border-t px-5 py-3 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
        to="/activity"
      >
        See all activity →
      </Link>
    </div>
  )
}

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-400",
  high: "bg-amber-400",
  medium: "bg-blue-400",
  low: "bg-zinc-500",
}

function LatestSignalsCard({
  signals,
  loading,
}: {
  signals: {
    id: string
    title: string | null
    type: string | null
    priority: string | null
    customerName: string | null
    createdAt: Date | string | null
  }[]
  loading: boolean
}) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015]">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-1.5 text-zinc-500">
          <SignalIcon className="size-3.5" />
          <span className="text-xs">Latest signals</span>
        </div>
        <span className="text-[10px] text-zinc-600">
          {signals.length} most recent
        </span>
      </div>

      <div className="flex-1 px-2 pb-2">
        {loading && (
          <div className="space-y-2 px-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton className="h-10 w-full opacity-15" key={i} />
            ))}
          </div>
        )}
        {!loading && signals.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-600">
            No signals yet.
          </p>
        )}
        {!loading && signals.length > 0 && (
          <ul>
            {signals.map((s) => (
              <li key={s.id}>
                <Link
                  className="flex items-start gap-2.5 rounded-md px-3 py-2 transition-colors hover:bg-white/[0.025]"
                  search={{ id: s.id }}
                  to="/signals"
                >
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                      PRIORITY_DOT[s.priority ?? "low"]
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">
                      {s.title ?? "Untitled signal"}
                    </p>
                    <p className="truncate text-[11px] text-zinc-600">
                      {s.customerName ?? "Unknown"} · {s.type ?? "signal"} ·{" "}
                      {timeAgo(s.createdAt)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        className="border-white/[0.04] border-t px-5 py-3 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
        search={{ id: undefined }}
        to="/signals"
      >
        Open triage queue →
      </Link>
    </div>
  )
}

interface OverviewData {
  rangeDays: number
  signals: {
    total: number
    inRange: number
    byType: Record<string, number>
    byPriority: Record<string, number>
  }
  alerts: {
    unacknowledged: number
    items: { severity: string }[]
  }
  pipelines: { running: number; completed: number }
  apps: { active: number; lastSyncAt: Date | string | null }
  autonomy: { pendingActions: number }
}

function MetricsView({
  data,
  loading,
  range,
}: {
  data: OverviewData | null
  loading: boolean
  range: RangeDays
}) {
  if (loading) {
    return (
      <div className="mt-10 space-y-4">
        <Skeleton className="h-32 w-full opacity-15" />
        <Skeleton className="h-48 w-full opacity-15" />
        <Skeleton className="h-48 w-full opacity-15" />
      </div>
    )
  }

  if (!data) {
    return (
      <p className="mt-16 text-center text-sm text-zinc-600">
        No metrics available.
      </p>
    )
  }

  const signalsTotal = data.signals.total ?? 0
  const stats: { label: string; value: number; sub?: string }[] = [
    {
      label: "Signals",
      value: data.signals.inRange ?? 0,
      sub: `${signalsTotal.toLocaleString()} all-time`,
    },
    {
      label: "Unacknowledged alerts",
      value: data.alerts.unacknowledged ?? 0,
    },
    {
      label: "Pipeline runs",
      value: data.pipelines.completed ?? 0,
      sub: `${data.pipelines.running ?? 0} running now`,
    },
    {
      label: "Connected apps",
      value: data.apps.active ?? 0,
    },
    {
      label: "Pending actions",
      value: data.autonomy.pendingActions ?? 0,
    },
  ]

  const alertSeverity = (data.alerts.items ?? []).reduce<
    Record<string, number>
  >((acc, a) => {
    const key = a.severity ?? "unknown"
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="mt-10 space-y-6">
      <div>
        <h2 className="font-medium text-[13px] text-zinc-300 uppercase tracking-wider">
          Last {rangeLabel(range)}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] sm:grid-cols-3">
          {stats.map((s) => (
            <div className="bg-black/40 p-5" key={s.label}>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider">
                {s.label}
              </p>
              <p className="mt-2 font-light text-3xl text-white tabular-nums tracking-tight">
                {s.value.toLocaleString()}
              </p>
              {s.sub && (
                <p className="mt-1 text-[11px] text-zinc-600">{s.sub}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BreakdownTable
          empty="No signals classified yet."
          rows={data.signals.byType ?? {}}
          title="Signals by type"
        />
        <BreakdownTable
          empty="No prioritized signals yet."
          rows={data.signals.byPriority ?? {}}
          title="Signals by priority"
        />
        <BreakdownTable
          empty="No active alerts."
          rows={alertSeverity}
          title="Open alerts by severity"
        />
      </div>
    </div>
  )
}

function BreakdownTable({
  title,
  rows,
  empty,
}: {
  title: string
  rows: Record<string, number>
  empty: string
}) {
  const entries = Object.entries(rows).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((acc, [, v]) => acc + v, 0)

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015]">
      <div className="flex items-center justify-between border-white/[0.04] border-b px-5 py-3">
        <span className="font-medium text-[13px] text-zinc-300">{title}</span>
        <span className="text-[11px] text-zinc-600 tabular-nums">
          {total.toLocaleString()}
        </span>
      </div>
      {entries.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] text-zinc-600">
          {empty}
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {entries.map(([key, value]) => {
            const pct = total > 0 ? (value / total) * 100 : 0
            return (
              <li className="px-5 py-3" key={key}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-zinc-300 capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-zinc-500 tabular-nums">
                    {value.toLocaleString()}{" "}
                    <span className="text-zinc-700">({pct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full bg-white/30"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
