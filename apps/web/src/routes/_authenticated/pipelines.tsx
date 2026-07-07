import { Button } from "@motiq/ui/components/button"
import { Skeleton } from "@motiq/ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@motiq/ui/components/tabs"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  BrainCircuitIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  Loader2Icon,
  NetworkIcon,
  XCircleIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"
import { AgentTypeBadge, PipelineStatusBadge } from "@/components/app/badges"
import { EmptyState } from "@/components/app/empty-state"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/pipelines")({
  head: () => ({
    meta: [{ title: "Pipelines | Motiq" }],
  }),
  component: PipelinesPage,
})

type PipelineStatus = "pending" | "running" | "completed" | "failed"

interface PipelineRunItem {
  id: string
  triggeredBy: string
  triggerSignalId: string | null
  status: string
  stepsCompleted: number
  totalSteps: number
  startedAt: Date | null
  completedAt: Date | null
  error: string | null
  createdAt: Date
}

interface AgentRunItem {
  id: string
  agentType: string
  pipelineStep: number | null
  status: string
  input: Record<string, unknown> | null
  output: Record<string, unknown> | null
  startedAt: Date | null
  completedAt: Date | null
  error: string | null
}

function PipelinesPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<PipelineStatus | undefined>()

  const pipelines = useQuery(
    trpc.pipeline.list.queryOptions({
      status: statusFilter,
      limit: 50,
    })
  )

  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse`,
      {
        withCredentials: true,
      }
    )

    const invalidatePipelines = () => {
      queryClient.invalidateQueries({
        queryKey: trpc.pipeline.list.queryKey(),
      })
    }

    eventSource.addEventListener("pipeline:created", invalidatePipelines)
    eventSource.addEventListener("pipeline:updated", invalidatePipelines)

    return () => eventSource.close()
  }, [queryClient, trpc])

  const allRuns = pipelines.data?.items ?? []
  const running = allRuns.filter((r) => r.status === "running")
  const completed = allRuns.filter((r) => r.status === "completed")
  const failed = allRuns.filter((r) => r.status === "failed")

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <header className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl text-white tracking-tighter">
          Pipelines
        </h1>
        <p className="text-sm text-zinc-500">
          Monitor AI agent pipeline runs and execution steps
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          count={running.length}
          icon={
            running.length > 0 ? (
              <Loader2Icon className="size-4 animate-spin text-blue-400" />
            ) : (
              <ClockIcon className="size-4 text-blue-400/60" />
            )
          }
          label="Running"
        />
        <StatCard
          count={completed.length}
          icon={<CheckCircleIcon className="size-4 text-green-400" />}
          label="Completed"
        />
        <StatCard
          count={failed.length}
          icon={<XCircleIcon className="size-4 text-red-400" />}
          label="Failed"
        />
      </div>

      <Tabs
        className="w-full"
        defaultValue="all"
        onValueChange={(v) => {
          setStatusFilter(v === "all" ? undefined : (v as PipelineStatus))
        }}
      >
        <TabsList className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
          <TabsTrigger
            className="data-[state=active]:!bg-zinc-800 data-[state=active]:!border-white/10 !text-zinc-400 hover:!text-white dark:!text-zinc-400 dark:hover:!text-white data-[state=active]:!text-white cursor-pointer rounded-lg px-4 font-medium text-xs transition-all"
            value="all"
          >
            All
            {pipelines.data && (
              <span className="ml-2 opacity-40">{pipelines.data.total}</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            className="data-[state=active]:!bg-zinc-800 data-[state=active]:!border-white/10 !text-zinc-400 hover:!text-white dark:!text-zinc-400 dark:hover:!text-white data-[state=active]:!text-blue-400 cursor-pointer rounded-lg px-4 font-medium text-xs transition-all"
            value="running"
          >
            Running
            {running.length > 0 && (
              <span className="ml-2 text-blue-400/60">{running.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            className="data-[state=active]:!bg-zinc-800 data-[state=active]:!border-white/10 !text-zinc-400 hover:!text-white dark:!text-zinc-400 dark:hover:!text-white data-[state=active]:!text-green-400 cursor-pointer rounded-lg px-4 font-medium text-xs transition-all"
            value="completed"
          >
            Completed
          </TabsTrigger>
          <TabsTrigger
            className="data-[state=active]:!bg-zinc-800 data-[state=active]:!border-white/10 !text-zinc-400 hover:!text-white dark:!text-zinc-400 dark:hover:!text-white data-[state=active]:!text-red-400 cursor-pointer rounded-lg px-4 font-medium text-xs transition-all"
            value="failed"
          >
            Failed
            {failed.length > 0 && (
              <span className="ml-2 text-red-400/60">{failed.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {pipelines.isLoading ? (
          <div className="mt-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                className="flex gap-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
                key={i}
              >
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-2/3 opacity-20" />
                  <Skeleton className="h-4 w-full opacity-10" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <TabsContent className="mt-6 outline-none" value="all">
              <PipelineList runs={allRuns} />
            </TabsContent>
            <TabsContent className="mt-6 outline-none" value="running">
              <PipelineList runs={running} />
            </TabsContent>
            <TabsContent className="mt-6 outline-none" value="completed">
              <PipelineList runs={completed} />
            </TabsContent>
            <TabsContent className="mt-6 outline-none" value="failed">
              <PipelineList runs={failed} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}

function StatCard({
  label,
  count,
  icon,
}: {
  label: string
  count: number
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-xl backdrop-blur-sm">
      <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
        {icon}
      </div>
      <div>
        <p className="font-medium text-2xl text-white tabular-nums tracking-tight">
          {count}
        </p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </div>
  )
}

function PipelineList({ runs }: { runs: PipelineRunItem[] }) {
  if (!runs.length) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-20 shadow-2xl backdrop-blur-sm">
        <EmptyState icon={NetworkIcon} message="No pipeline runs to show." />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {runs.map((run, i) => (
          <PipelineRunCard index={i} key={run.id} run={run} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function PipelineRunCard({
  run,
  index,
}: {
  run: PipelineRunItem
  index: number
}) {
  const [expanded, setExpanded] = useState(false)

  const triggerLabel = getTriggerLabel(run.triggeredBy)
  const duration = formatDuration(run.startedAt, run.completedAt)

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-xl border border-white/[0.08] bg-white/[0.03] shadow-2xl backdrop-blur-md transition-all hover:border-white/[0.12]"
      exit={{ opacity: 0, scale: 0.95 }}
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: index * 0.03 }}
    >
      <button
        className="flex w-full cursor-pointer items-center gap-5 p-5 text-left"
        onClick={() => setExpanded((e) => !e)}
        type="button"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
          <PipelineStatusIcon status={run.status} />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-3">
            <p className="font-medium text-sm text-zinc-200 transition-colors group-hover:text-white">
              Pipeline Run
            </p>
            <PipelineStatusBadge status={run.status} />
            <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-medium text-[10px] text-zinc-400">
              {triggerLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="font-mono text-[10px] text-zinc-600">
              {run.id.slice(0, 8)}
            </span>
            <span className="size-0.5 rounded-full bg-zinc-700" />
            <span>
              {run.stepsCompleted}/{run.totalSteps} steps
            </span>
            {duration && (
              <>
                <span className="size-0.5 rounded-full bg-zinc-700" />
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3 opacity-40" />
                  {duration}
                </span>
              </>
            )}
            <span className="size-0.5 rounded-full bg-zinc-700" />
            <span>
              {new Date(run.createdAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <ProgressBar
            completed={run.stepsCompleted}
            status={run.status}
            total={run.totalSteps}
          />
          <div className="text-zinc-500 transition-transform">
            {expanded ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-white/[0.06] border-t px-5 pt-4 pb-5">
              {run.error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="font-medium text-[11px] text-red-400 uppercase tracking-wider">
                    Error
                  </p>
                  <p className="mt-1 font-mono text-red-300 text-xs">
                    {run.error}
                  </p>
                </div>
              )}
              <AgentSteps pipelineRunId={run.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AgentSteps({ pipelineRunId }: { pipelineRunId: string }) {
  const trpc = useTRPC()
  const steps = useQuery(trpc.pipeline.getSteps.queryOptions({ pipelineRunId }))

  if (steps.isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div className="flex items-center gap-4" key={i}>
            <Skeleton className="size-7 rounded-lg opacity-20" />
            <Skeleton className="h-4 w-40 opacity-15" />
          </div>
        ))}
      </div>
    )
  }

  if (!steps.data?.length) {
    return (
      <div className="flex items-center gap-3 py-4 text-sm text-zinc-500">
        <BrainCircuitIcon className="size-4 opacity-40" />
        No agent steps recorded for this run.
      </div>
    )
  }

  return (
    <div className="relative ml-3 space-y-0 border-white/[0.08] border-l">
      {steps.data.map((step) => (
        <AgentStepItem key={step.id} step={step} />
      ))}
    </div>
  )
}

function AgentStepItem({ step }: { step: AgentRunItem }) {
  const [showOutput, setShowOutput] = useState(false)
  const duration = formatDuration(step.startedAt, step.completedAt)

  return (
    <div className="group relative py-3 pl-8">
      <div className="absolute top-4 -left-[7px] flex size-3.5 items-center justify-center">
        <AgentStepStatusDot status={step.status} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <AgentTypeBadge type={step.agentType} />
          {step.pipelineStep && (
            <span className="font-medium text-[10px] text-zinc-600">
              Step {step.pipelineStep}
            </span>
          )}
          {duration && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
              <ClockIcon className="size-3 opacity-40" />
              {duration}
            </span>
          )}
        </div>

        {step.error && (
          <p className="font-mono text-red-400 text-xs">{step.error}</p>
        )}

        {step.output && (
          <div>
            <Button
              className="h-6 gap-1 px-2 font-medium text-[10px] text-zinc-500 hover:text-zinc-300"
              onClick={() => setShowOutput((s) => !s)}
              size="sm"
              variant="ghost"
            >
              {showOutput ? (
                <ChevronDownIcon className="size-3" />
              ) : (
                <ChevronRightIcon className="size-3" />
              )}
              Output
            </Button>
            <AnimatePresence>
              {showOutput && (
                <motion.div
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                  style={{ overflow: "hidden" }}
                  transition={{ duration: 0.15 }}
                >
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 font-mono text-[11px] text-zinc-400 leading-relaxed">
                    {JSON.stringify(step.output, null, 2)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressBar({
  completed,
  total,
  status,
}: {
  completed: number
  total: number
  status: string
}) {
  const pct = total > 0 ? (completed / total) * 100 : 0
  const barColor = getProgressBarColor(status)

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[10px] text-zinc-500">
        {completed}/{total}
      </span>
    </div>
  )
}

function formatDuration(start: Date | null, end: Date | null): string | null {
  if (!start) {
    return null
  }
  const endTime = end ? new Date(end).getTime() : Date.now()
  const ms = endTime - new Date(start).getTime()
  if (ms < 1000) {
    return `${ms}ms`
  }
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  const mins = Math.floor(ms / 60_000)
  const secs = Math.round((ms % 60_000) / 1000)
  return `${mins}m ${secs}s`
}

function getTriggerLabel(triggeredBy: string) {
  if (triggeredBy === "new_signal") {
    return "New Signal"
  }
  if (triggeredBy === "scheduled") {
    return "Scheduled"
  }
  if (triggeredBy === "manual") {
    return "Manual"
  }
  return "Retroactive"
}

function PipelineStatusIcon({ status }: { status: string }) {
  if (status === "running") {
    return <Loader2Icon className="size-4 animate-spin text-blue-400" />
  }
  if (status === "completed") {
    return <CheckCircleIcon className="size-4 text-green-400" />
  }
  if (status === "failed") {
    return <XCircleIcon className="size-4 text-red-400" />
  }
  return <ClockIcon className="size-4 text-zinc-500" />
}

function AgentStepStatusDot({ status }: { status: string }) {
  if (status === "running") {
    return (
      <div className="size-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
    )
  }
  if (status === "completed") {
    return (
      <div className="size-3 rounded-full bg-green-500 shadow-[0_0_8px_var(--color-green-500)]" />
    )
  }
  if (status === "failed") {
    return (
      <div className="size-3 rounded-full bg-red-500 shadow-[0_0_8px_var(--color-red-500)]" />
    )
  }
  return <div className="size-3 rounded-full bg-zinc-700" />
}

function getProgressBarColor(status: string) {
  if (status === "failed") {
    return "bg-red-500"
  }
  if (status === "completed") {
    return "bg-green-500"
  }
  return "bg-blue-500"
}
