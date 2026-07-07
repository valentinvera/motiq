import { Button } from "@motiq/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@motiq/ui/components/sheet"
import { Textarea } from "@motiq/ui/components/textarea"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  MessageSquareIcon,
  SendIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PriorityBadge, StatusBadge, TypeBadge } from "@/components/app/badges"
import { MentionDialog } from "@/components/app/mention-dialog"
import { getMediaUrl } from "@/lib/media"
import { useTRPC, useTRPCClient } from "@/utils/trpc"

interface SignalDetailPanelProps {
  signalId: string | null
  onClose: () => void
}

interface SignalCommentListItem {
  id: string
  content: string
  createdAt: string | Date
  author?: {
    name: string
    image?: string | null
  } | null
}

export function SignalDetailPanel({
  signalId,
  onClose,
}: SignalDetailPanelProps) {
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()
  const [comment, setComment] = useState("")
  const signal = useQuery({
    ...trpc.signal.getById.queryOptions({ id: signalId ?? "" }),
    enabled: !!signalId,
  })

  const comments = useQuery({
    ...trpc.signalComment.list.queryOptions({ signalId: signalId ?? "" }),
    enabled: !!signalId,
  })

  const invalidateSignals = () => {
    queryClient.invalidateQueries({ queryKey: trpc.signal.list.queryKey() })
    queryClient.invalidateQueries({
      queryKey: trpc.signal.getActionableCount.queryKey(),
    })
    if (signalId) {
      queryClient.invalidateQueries({
        queryKey: trpc.signal.getById.queryKey({ id: signalId }),
      })
    }
  }

  const createComment = useMutation({
    mutationFn: () =>
      trpcClient.signalComment.create.mutate({
        signalId: signalId ?? "",
        content: comment.trim(),
      }),
    onSuccess: () => {
      setComment("")
      if (signalId) {
        queryClient.invalidateQueries({
          queryKey: trpc.signalComment.list.queryKey({ signalId }),
        })
      }
      toast.success("Comment added")
    },
    onError: (error) => toast.error(error.message),
  })

  const createAlert = useMutation({
    mutationFn: () =>
      trpcClient.signal.createAlert.mutate({ id: signalId ?? "" }),
    onSuccess: () => {
      invalidateSignals()
      queryClient.invalidateQueries({ queryKey: trpc.alert.list.queryKey() })
      queryClient.invalidateQueries({
        queryKey: trpc.alert.getUnacknowledgedCount.queryKey(),
      })
      toast.success("Alert created")
    },
    onError: (error) => toast.error(error.message),
  })

  const isPending = createAlert.isPending
  const relatedAlert = signal.data?.relatedAlert ?? null
  const relatedResolution = (relatedAlert?.metadata?.resolution ?? null) as {
    label?: string
  } | null
  const hasRelatedAlert = Boolean(relatedAlert)
  const isRelatedAlertHandled = Boolean(relatedAlert?.acknowledged)
  const canAct =
    !!signal.data &&
    ["new", "triaged"].includes(signal.data.status) &&
    !hasRelatedAlert

  useEffect(() => {
    if (!signalId) {
      return
    }

    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse`,
      { withCredentials: true }
    )

    const handleCommentCreated = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { signalId?: string }
        if (payload.signalId !== signalId) {
          return
        }
        queryClient.invalidateQueries({
          queryKey: trpc.signalComment.list.queryKey({ signalId }),
        })
      } catch {
        queryClient.invalidateQueries({
          queryKey: trpc.signalComment.list.queryKey({ signalId }),
        })
      }
    }

    eventSource.addEventListener("signal-comment:created", handleCommentCreated)

    return () => eventSource.close()
  }, [queryClient, signalId, trpc])

  return (
    <Sheet onOpenChange={(open) => !open && onClose()} open={!!signalId}>
      <SheetContent
        className="w-full border-white/10 border-l bg-zinc-950/95 shadow-2xl backdrop-blur-2xl sm:max-w-lg"
        closeClassName="cursor-pointer text-zinc-400 !bg-transparent hover:!bg-white/[0.06] hover:text-white focus:!ring-0 focus:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 data-[state=open]:!bg-transparent"
      >
        <SheetHeader className="border-white/5 border-b pb-4">
          <SheetTitle className="font-medium text-xs text-zinc-500 uppercase tracking-wider">
            Signal Details
          </SheetTitle>
        </SheetHeader>

        {signal.isLoading && (
          <div className="space-y-4 p-6">
            <div className="h-6 w-3/4 animate-pulse rounded-lg bg-white/[0.04]" />
            <div className="h-4 w-1/2 animate-pulse rounded-lg bg-white/[0.04]" />
            <div className="h-24 w-full animate-pulse rounded-lg bg-white/[0.04]" />
          </div>
        )}

        {signal.data && (
          <div className="space-y-8 overflow-y-auto p-6">
            <div>
              <h3 className="font-medium text-2xl text-white tracking-tight">
                {signal.data.title}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {signal.data.type && <TypeBadge type={signal.data.type} />}
                {signal.data.priority && (
                  <PriorityBadge priority={signal.data.priority} />
                )}
                <StatusBadge status={signal.data.status} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-[11px] text-white uppercase tracking-wider">
                Content
              </p>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="whitespace-pre-wrap font-medium text-sm text-zinc-300 leading-relaxed">
                  {signal.data.content}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div>
                <p className="font-medium text-[11px] text-white uppercase tracking-wider">
                  Actions
                </p>
                {hasRelatedAlert ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 leading-relaxed">
                    <CheckCircleIcon className="size-3.5" />
                    Related alert already{" "}
                    {isRelatedAlertHandled
                      ? (relatedResolution?.label ?? "handled")
                      : "exists"}
                    .
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                    Create an alert when this signal needs team attention.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  className="h-9 cursor-pointer gap-2 rounded-lg bg-white font-medium text-black text-xs hover:bg-zinc-200 disabled:cursor-not-allowed"
                  disabled={!canAct || isPending}
                  onClick={() => createAlert.mutate()}
                  size="sm"
                >
                  <AlertTriangleIcon className="size-3.5" />
                  {createAlert.isPending ? "Creating..." : "Create alert"}
                </Button>
                <MentionDialog
                  entityId={signal.data.id}
                  entityTitle={signal.data.title}
                  entityType="signal"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-[11px] text-white uppercase tracking-wider">
                Details
              </p>
              <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
                <Detail label="Source" value={signal.data.source} />
                <Detail
                  label="Customer"
                  value={signal.data.customerName ?? "Unknown"}
                />
                <Detail
                  label="Timestamp"
                  value={new Date(signal.data.createdAt).toLocaleString()}
                />
                {signal.data.customerEmail && (
                  <Detail label="Email" value={signal.data.customerEmail} />
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-[11px] text-white uppercase tracking-wider">
                    Comments
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                    Leave context for your future self or the rest of the team.
                  </p>
                </div>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-500">
                  <MessageSquareIcon className="size-4" />
                </div>
              </div>

              <div className="space-y-2">
                <SignalCommentsList
                  comments={comments.data}
                  isLoading={comments.isLoading}
                />
              </div>

              <div className="space-y-2 pt-1">
                <Textarea
                  className="min-h-20 resize-none rounded-lg border-white/[0.08] bg-white/[0.03] text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:border-white/30 focus-visible:ring-white/10"
                  maxLength={2000}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add a note for the team..."
                  value={comment}
                />
                <div className="flex items-center justify-end">
                  <Button
                    className="h-9 cursor-pointer gap-2 rounded-lg bg-white font-medium text-black text-xs hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!comment.trim() || createComment.isPending}
                    onClick={() => createComment.mutate()}
                    size="sm"
                  >
                    <SendIcon className="size-3.5" />
                    {createComment.isPending ? "Posting..." : "Post comment"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function SignalCommentsList({
  comments,
  isLoading,
}: {
  comments?: SignalCommentListItem[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-4 text-center text-xs text-zinc-500">
        Loading comments...
      </div>
    )
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="rounded-lg border border-white/[0.08] border-dashed bg-black/20 px-3 py-4 text-center text-xs text-zinc-500">
        No comments yet
      </div>
    )
  }

  return comments.map((item) => {
    const authorImageUrl = getMediaUrl(item.author?.image)

    return (
      <div
        className="rounded-lg border border-white/[0.06] bg-black/20 p-3"
        key={item.id}
      >
        <div className="flex items-center gap-2">
          {authorImageUrl && item.author ? (
            <img
              alt={item.author.name}
              className="size-6 rounded-full object-cover"
              height={24}
              src={authorImageUrl}
              width={24}
            />
          ) : (
            <span className="flex size-6 items-center justify-center rounded-full bg-white/[0.08] font-medium text-[10px] text-zinc-300">
              {(item.author?.name ?? "U").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-xs text-zinc-300">
              {item.author?.name ?? "Unknown"}
            </p>
            <p className="text-[10px] text-zinc-600">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400 leading-relaxed">
          {item.content}
        </p>
      </div>
    )
  })
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4">
      <p className="font-medium text-[10px] text-zinc-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 text-xs text-zinc-300 capitalize">{value}</p>
    </div>
  )
}
