import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  ActivityIcon,
  AlertTriangleIcon,
  BrainCircuitIcon,
  CheckCircleIcon,
  TagIcon,
  ZapIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useTRPC } from "@/utils/trpc"

interface ActivityEvent {
  id: string
  activityType: string
  title: string
  description: string | null
  createdAt: string | Date
}

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({
    meta: [{ title: "Activity | Motiq" }],
  }),
  component: ActivityPage,
})

function ActivityPage() {
  const trpc = useTRPC()
  const history = useQuery({
    ...trpc.activity.list.queryOptions({ limit: 50 }),
  })
  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([])

  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse`,
      {
        withCredentials: true,
      }
    )

    const handleEvent = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as Partial<ActivityEvent>
        setLiveEvents((prev) => [
          {
            id: crypto.randomUUID(),
            activityType: e.type.replace(":", "_"),
            title: `New ${e.type.split(":")[0]} event`,
            description: "Just now",
            createdAt: new Date().toISOString(),
            ...data,
          },
          ...prev,
        ])
      } catch (err) {
        console.error(err)
      }
    }

    eventSource.addEventListener("signal:created", handleEvent)
    eventSource.addEventListener("signal:updated", handleEvent)
    eventSource.addEventListener("alert:created", handleEvent)
    eventSource.addEventListener("alert:updated", handleEvent)
    eventSource.addEventListener("activity:created", handleEvent)
    eventSource.addEventListener("action:proposed", handleEvent)

    return () => {
      eventSource.close()
    }
  }, [])

  const allEvents: ActivityEvent[] = [
    ...liveEvents,
    ...((history.data?.items ?? []) as ActivityEvent[]),
  ]
  const uniqueEvents = Array.from(
    new Map(allEvents.map((e) => [e.id, e])).values()
  ).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-3 font-medium text-3xl text-white tracking-tighter">
          <ActivityIcon className="size-6 text-white" />
          Activity
        </h1>
        <p className="text-sm text-zinc-500">
          Real-time feed of agent activity
        </p>
      </header>

      <div className="relative ml-4 space-y-8 border-white/[0.08] border-l py-4">
        {uniqueEvents.map((event) => (
          <ActivityItem event={event} key={event.id} />
        ))}
        {history.isLoading && (
          <div className="animate-pulse pl-8 text-sm text-zinc-500">
            Loading history...
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityItem({ event }: { event: ActivityEvent }) {
  const getActivityIcon = (type: string) => {
    if (type.includes("failed")) {
      return <AlertTriangleIcon className="size-4 text-red-400" />
    }
    if (type.includes("received") || type.includes("classified")) {
      return <TagIcon className="size-4" />
    }
    if (type.includes("processing") || type.includes("agent_run")) {
      return <BrainCircuitIcon className="size-4 text-violet-300" />
    }
    if (type.includes("pattern")) {
      return <ZapIcon className="size-4" />
    }
    if (type.includes("risk") || type.includes("alert")) {
      return <AlertTriangleIcon className="size-4 text-red-400" />
    }
    if (type.includes("action")) {
      return <CheckCircleIcon className="size-4 text-blue-400" />
    }
    if (type.includes("customer")) {
      return <ActivityIcon className="size-4 text-emerald-300" />
    }
    return <BrainCircuitIcon className="size-4" />
  }

  return (
    <div className="group relative pl-8">
      <div className="absolute top-1 -left-3.5 flex size-7 items-center justify-center rounded-full border border-white/[0.08] bg-black text-zinc-400 transition-colors group-hover:border-white/20 group-hover:text-white">
        {getActivityIcon(event.activityType)}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-4">
          <h4 className="font-medium text-sm text-zinc-200">{event.title}</h4>
          <span className="shrink-0 text-[11px] text-zinc-500">
            {new Date(event.createdAt).toLocaleTimeString()}
          </span>
        </div>
        {event.description && (
          <p className="text-sm text-zinc-400">{event.description}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-medium text-[10px] text-zinc-500 capitalize">
            {event.activityType.replaceAll("_", " ")}
          </span>
        </div>
      </div>
    </div>
  )
}
