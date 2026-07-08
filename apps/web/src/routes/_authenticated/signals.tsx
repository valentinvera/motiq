import { Button } from "@motiq/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@motiq/ui/components/dropdown-menu"
import { Input } from "@motiq/ui/components/input"
import { Skeleton } from "@motiq/ui/components/skeleton"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  SearchIcon,
  SignalIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { PriorityBadge, StatusBadge, TypeBadge } from "@/components/app/badges"
import { EmptyState } from "@/components/app/empty-state"
import { SignalDetailPanel } from "@/components/app/signal-detail-panel"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/signals")({
  head: () => ({
    meta: [{ title: "Signals | Motiq" }],
  }),
  validateSearch: (search) => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: SignalsPage,
})

const typeOptions = [
  { value: undefined, label: "All types" },
  { value: "bug" as const, label: "Bug" },
  { value: "feature_request" as const, label: "Feature Request" },
  { value: "complaint" as const, label: "Complaint" },
  { value: "question" as const, label: "Question" },
  { value: "praise" as const, label: "Praise" },
  { value: "churn_risk" as const, label: "Churn Risk" },
] as const

const priorityOptions = [
  { value: undefined, label: "All priorities" },
  { value: "critical" as const, label: "Critical" },
  { value: "high" as const, label: "High" },
  { value: "medium" as const, label: "Medium" },
  { value: "low" as const, label: "Low" },
] as const

const statusOptions = [
  { value: undefined, label: "All Statuses" },
  { value: "new" as const, label: "New" },
  { value: "triaged" as const, label: "Triaged" },
  { value: "processed" as const, label: "Processed" },
  { value: "ignored" as const, label: "Ignored" },
] as const

type SignalType =
  | "bug"
  | "feature_request"
  | "complaint"
  | "question"
  | "praise"
  | "churn_risk"
  | "other"
type SignalPriority = "critical" | "high" | "medium" | "low"
type SignalStatus = "new" | "triaged" | "processed" | "ignored"

const PAGE_SIZE = 15

function SignalsPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { id } = Route.useSearch()
  const [search, setSearch] = useState("")
  const [type, setType] = useState<SignalType | undefined>()
  const [priority, setPriority] = useState<SignalPriority | undefined>()
  const [status, setStatus] = useState<SignalStatus | undefined>()
  const [page, setPage] = useState(0)
  const selectedId = id ?? null

  const debouncedSearch = useDebounce(search, 300)

  const signals = useQuery({
    ...trpc.signal.list.queryOptions({
      search: debouncedSearch || undefined,
      type,
      priority,
      status,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
  })

  const invalidateSignals = useCallback(() => {
    ;(async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.signal.list.queryKey(),
        }),
        selectedId
          ? queryClient.invalidateQueries({
              queryKey: trpc.signal.getById.queryKey({ id: selectedId }),
            })
          : Promise.resolve(),
      ])

      await queryClient.invalidateQueries({
        queryKey: trpc.signal.getActionableCount.queryKey(),
      })
    })().catch((error) => {
      console.error("Failed to invalidate signal queries:", error)
    })
  }, [queryClient, selectedId, trpc])

  const invalidateAlerts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: trpc.alert.list.queryKey() })
    queryClient.invalidateQueries({
      queryKey: trpc.alert.getUnacknowledgedCount.queryKey(),
    })
  }, [queryClient, trpc])

  const invalidateAlertsAndSignals = useCallback(() => {
    invalidateAlerts()
    invalidateSignals()
  }, [invalidateAlerts, invalidateSignals])

  const hasPendingSignals =
    signals.data?.items.some((item) => item.status === "new") ?? false

  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse`,
      {
        withCredentials: true,
      }
    )

    const invalidateAllRealtimeData = () => {
      invalidateAlerts()
      invalidateSignals()
    }

    eventSource.addEventListener("open", invalidateAllRealtimeData)
    eventSource.addEventListener("signal:created", invalidateSignals)
    eventSource.addEventListener("signal:updated", invalidateSignals)
    eventSource.addEventListener("alert:created", invalidateAlertsAndSignals)
    eventSource.addEventListener("alert:updated", invalidateAlertsAndSignals)

    return () => eventSource.close()
  }, [invalidateAlerts, invalidateAlertsAndSignals, invalidateSignals])

  useEffect(() => {
    if (!hasPendingSignals) {
      return
    }

    const interval = setInterval(invalidateSignals, 3000)
    return () => clearInterval(interval)
  }, [hasPendingSignals, invalidateSignals])

  const total = signals.data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-3xl text-white tracking-tighter">
            Signals
          </h1>
          <p className="text-sm text-zinc-500">{total} signals found</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="group relative min-w-[280px] flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-white" />
            <Input
              className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.03] pl-10 font-medium text-sm text-zinc-100 transition-all placeholder:text-zinc-600 focus:border-white/50 focus:bg-white/[0.04] focus:ring-1 focus:ring-white/20"
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              placeholder="Search signals..."
              value={search}
            />
          </div>
          <div className="flex items-center gap-2">
            <FilterDropdown
              label="Type"
              onChange={(v) => {
                setType(v as SignalType | undefined)
                setPage(0)
              }}
              options={typeOptions}
              value={type}
            />
            <FilterDropdown
              label="Priority"
              onChange={(v) => {
                setPriority(v as SignalPriority | undefined)
                setPage(0)
              }}
              options={priorityOptions}
              value={priority}
            />
            <FilterDropdown
              label="Status"
              onChange={(v) => {
                setStatus(v as SignalStatus | undefined)
                setPage(0)
              }}
              options={statusOptions}
              value={status}
            />
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] shadow-2xl backdrop-blur-sm">
        <SignalsListContent
          data={signals.data ?? null}
          isLoading={signals.isLoading}
          onSelect={(signalId) =>
            navigate({
              to: "/signals",
              search: { id: signalId },
            })
          }
        />
      </div>

      <footer className="flex items-center justify-between px-1">
        <p className="font-medium text-[11px] text-zinc-500 tracking-wider">
          {total > 0
            ? `Showing ${page * PAGE_SIZE + 1} — ${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}`
            : "No results"}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              className="h-8 w-24 cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] font-medium text-xs text-zinc-200 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-default disabled:border-white/[0.04] disabled:bg-white/[0.015] disabled:text-zinc-600 disabled:opacity-100"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              size="sm"
              variant="outline"
            >
              <ChevronLeftIcon className="mr-1 size-3.5" />
              Previous
            </Button>
            <div className="flex h-8 w-14 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] font-medium text-[11px] text-zinc-300">
              {page + 1} / {totalPages}
            </div>
            <Button
              className="h-8 w-24 cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] font-medium text-xs text-zinc-200 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-default disabled:border-white/[0.04] disabled:bg-white/[0.015] disabled:text-zinc-600 disabled:opacity-100"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              size="sm"
              variant="outline"
            >
              Next
              <ChevronRightIcon className="ml-1 size-3.5" />
            </Button>
          </div>
        )}
      </footer>

      <SignalDetailPanel
        onClose={() =>
          navigate({
            to: "/signals",
            search: { id: undefined },
          })
        }
        signalId={selectedId}
      />
    </div>
  )
}

function SignalsListContent({
  data,
  isLoading,
  onSelect,
}: {
  data: { items: SignalItem[]; total: number } | null
  isLoading: boolean
  onSelect: (id: string) => void
}) {
  if (isLoading) {
    return (
      <div className="divide-y divide-white/[0.06]">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div className="flex items-center gap-6 p-5" key={i}>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2 rounded-lg opacity-20" />
              <Skeleton className="h-3 w-1/3 rounded-lg opacity-10" />
            </div>
            <Skeleton className="h-5 w-20 rounded-lg opacity-15" />
            <Skeleton className="h-5 w-24 rounded-lg opacity-15" />
          </div>
        ))}
      </div>
    )
  }

  if (!data?.items.length) {
    return (
      <div className="p-20">
        <EmptyState
          icon={SignalIcon}
          message="No signals match these filters."
        />
      </div>
    )
  }

  return (
    <div className="divide-y divide-white/[0.06]">
      <AnimatePresence mode="popLayout">
        {data.items.map((signal, i) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="group flex cursor-pointer items-center gap-6 px-6 py-4 transition-colors hover:bg-white/[0.02]"
            exit={{ opacity: 0, scale: 0.98 }}
            initial={{ opacity: 0, y: 5 }}
            key={signal.id}
            onClick={() => onSelect(signal.id)}
            transition={{ delay: i * 0.02 }}
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <p className="truncate font-medium text-sm text-zinc-200 transition-colors group-hover:text-white">
                  {signal.title}
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  {signal.type && <TypeBadge type={signal.type} />}
                  {signal.priority && (
                    <PriorityBadge priority={signal.priority} />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-medium text-[10px] text-zinc-500 capitalize">
                  {signal.source}
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  {signal.customerName ?? "Anonymous"}
                </span>
                <span className="size-0.5 rounded-full bg-zinc-700" />
                <span className="line-clamp-1 italic opacity-60">
                  {signal.content}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-8">
              <StatusBadge status={signal.status} />
              <div className="flex w-28 items-center justify-end gap-2 text-[11px] text-zinc-500">
                <CalendarIcon className="size-3 opacity-40" />
                {new Date(signal.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "2-digit",
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>(null)
  useEffect(() => {
    timer.current = setTimeout(() => setDebounced(value), delay)
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    }
  }, [value, delay])
  return debounced
}

function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: ReadonlyArray<{ value: string | undefined; label: string }>
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const selected = options.find((o) => o.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={`h-10 rounded-lg border border-white/[0.08] bg-white/[0.03] font-medium text-xs transition-all hover:bg-white/[0.05] ${value ? "border-white/30 bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
          size="sm"
          variant="outline"
        >
          <FilterIcon className="mr-2 size-3 opacity-40" />
          {selected?.label ?? label}
          <ChevronDownIcon className="ml-2 size-3 opacity-30" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[160px] rounded-xl border-white/[0.08] bg-zinc-950/95 backdrop-blur-2xl">
        {options.map((option) => (
          <DropdownMenuItem
            className="cursor-pointer px-2.5 py-2 font-medium text-xs text-zinc-300 transition-colors focus:bg-white/[0.04] focus:text-white"
            key={option.label}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.value === value && (
              <div className="ml-auto size-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface SignalItem {
  id: string
  source: string
  type: string | null
  priority: string | null
  status: string
  title: string
  content: string
  customerName: string | null
  createdAt: Date
}
