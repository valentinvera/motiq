import { UserIcon } from "@heroicons/react/24/outline"
import { Button } from "@motiq/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@motiq/ui/components/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@motiq/ui/components/popover"
import { DiscordIcon } from "@motiq/ui/icons/discord"
import { GmailIcon } from "@motiq/ui/icons/gmail"
import { SlackIcon } from "@motiq/ui/icons/slack"
import { TelegramIcon } from "@motiq/ui/icons/telegram"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import {
  BellIcon,
  CheckIcon,
  LayoutGridIcon,
  LifeBuoyIcon,
  LogOutIcon,
  SearchIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { getMediaUrl } from "@/lib/media"
import { useTRPC } from "@/utils/trpc"

interface TopbarProps {
  organization?: { name: string; slug: string } | null
  user?: { name: string; email: string; image?: string | null }
  onOpenCommandPalette?: () => void
}

const severityStyles: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 ring-red-500/20",
  high: "bg-orange-500/15 text-orange-400 ring-orange-500/20",
  medium: "bg-yellow-500/15 text-yellow-400 ring-yellow-500/20",
  low: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/20",
}

interface ResolutionMetadata {
  status?: string
  label?: string
}

const resolutionStyles: Record<string, string> = {
  reviewed: "text-blue-300",
  ignored: "text-red-300",
  escalated: "text-emerald-300",
}

function getAlertResolution(item: {
  metadata?: Record<string, unknown> | null
}) {
  const resolution = (item.metadata?.resolution ??
    {}) as ResolutionMetadata | null

  if (resolution?.label) {
    return resolution
  }

  return { status: "reviewed", label: "Handled" } satisfies ResolutionMetadata
}

export function Topbar({ user, onOpenCommandPalette }: TopbarProps) {
  const trpc = useTRPC()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [imageError, setImageError] = useState(false)
  const userImageUrl = getMediaUrl(user?.image)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const alertCount = useQuery(trpc.alert.getUnacknowledgedCount.queryOptions())
  const alertList = useQuery(trpc.alert.list.queryOptions())
  const mentionCount = useQuery(trpc.mention.getUnreadCount.queryOptions())
  const mentionList = useQuery(
    trpc.mention.listForMe.queryOptions({ limit: 10 })
  )
  const markMentionRead = useMutation(
    trpc.mention.markRead.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.mention.getUnreadCount.queryKey(),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.mention.listForMe.queryKey(),
        })
      },
    })
  )
  const mentions = mentionList.data ?? []
  const alerts = alertList.data ?? []
  const unread = (alertCount.data?.count ?? 0) + (mentionCount.data?.count ?? 0)
  const isNotificationsLoading = alertList.isLoading || mentionList.isLoading
  const hasNotifications = mentions.length > 0 || alerts.length > 0

  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse`,
      {
        withCredentials: true,
      }
    )

    const invalidateAlerts = () => {
      queryClient.invalidateQueries({
        queryKey: trpc.alert.getUnacknowledgedCount.queryKey(),
      })
      queryClient.invalidateQueries({ queryKey: trpc.alert.list.queryKey() })
    }

    const invalidateMentions = () => {
      queryClient.invalidateQueries({
        queryKey: trpc.mention.getUnreadCount.queryKey(),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.mention.listForMe.queryKey(),
      })
    }

    eventSource.addEventListener("alert:created", invalidateAlerts)
    eventSource.addEventListener("alert:updated", invalidateAlerts)
    eventSource.addEventListener("mention:created", invalidateMentions)
    eventSource.addEventListener("mention:updated", invalidateMentions)

    return () => eventSource.close()
  }, [queryClient, trpc])

  function openMentionTarget(item: {
    entityType: "signal" | "alert"
    entityId: string
  }) {
    setNotificationsOpen(false)
    if (item.entityType === "signal") {
      navigate({ to: "/signals", search: { id: item.entityId } })
      return
    }

    navigate({ to: "/alerts", search: { id: item.entityId } })
  }

  function openAlertTarget(id: string) {
    setNotificationsOpen(false)
    navigate({ to: "/alerts", search: { id } })
  }

  async function handleSignOut() {
    await authClient.signOut()
    navigate({ to: "/login" })
  }

  return (
    <header className="flex h-16 items-center gap-4 border-white/[0.06] border-b bg-black/40 px-6 backdrop-blur-xl">
      {onOpenCommandPalette && (
        <button
          className="flex h-9 w-full max-w-sm items-center gap-2.5 rounded-lg px-3.5 text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-400"
          onClick={onOpenCommandPalette}
          type="button"
        >
          <SearchIcon className="size-4 shrink-0" />
          <span className="text-[15px]">Find anything...</span>
        </button>
      )}

      <div className="ml-auto flex items-center gap-3">
        <Popover onOpenChange={setNotificationsOpen} open={notificationsOpen}>
          <PopoverTrigger asChild>
            <Button
              className="relative size-9 cursor-pointer rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-white"
              size="icon"
              variant="ghost"
            >
              <BellIcon className="size-[18px]" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 flex size-2 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="glass-high w-80 p-0"
            sideOffset={8}
          >
            <div className="flex items-center justify-between border-white/[0.06] border-b px-4 py-3">
              <span className="font-medium text-sm text-white">
                Notifications
              </span>
              {unread > 0 && (
                <span className="rounded-full bg-red-500/15 px-2 py-0.5 font-medium text-[11px] text-red-400 ring-1 ring-red-500/20">
                  {unread} new
                </span>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isNotificationsLoading && (
                <div className="py-8 text-center text-sm text-zinc-500">
                  Loading...
                </div>
              )}
              {!(isNotificationsLoading || hasNotifications) && (
                <div className="py-8 text-center text-sm text-zinc-500">
                  No notifications
                </div>
              )}
              {mentions.map((item) => (
                <div
                  className={`flex flex-col gap-1.5 border-white/[0.04] border-b px-4 py-3 ${item.readAt ? "" : "bg-sky-500/[0.04]"}`}
                  key={`mention-${item.id}`}
                >
                  <button
                    className="cursor-pointer text-left"
                    onClick={() => openMentionTarget(item)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-[13px] text-white leading-snug">
                        @{item.mentionedByUser?.name ?? "Someone"} mentioned you
                      </span>
                      <span className="shrink-0 rounded-full bg-sky-500/15 px-1.5 py-0.5 font-medium text-[10px] text-sky-300 ring-1 ring-sky-500/20">
                        {item.entityType}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12px] text-zinc-400 leading-snug">
                      {item.entityTitle}
                    </p>
                    {item.message && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-zinc-500 leading-snug">
                        {item.message}
                      </p>
                    )}
                  </button>
                  <div className="mt-0.5 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-zinc-600">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {!item.readAt && (
                      <button
                        className="flex cursor-pointer items-center gap-1 text-[11px] text-zinc-400 transition-colors hover:text-white"
                        onClick={() => markMentionRead.mutate({ id: item.id })}
                        type="button"
                      >
                        <CheckIcon className="size-3" />
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {alerts.map((item) => {
                const resolution = getAlertResolution(item)
                const resolutionClass =
                  resolutionStyles[resolution.status ?? "reviewed"] ??
                  "text-zinc-400"

                return (
                  <button
                    className={`flex cursor-pointer flex-col gap-1.5 border-white/[0.04] border-b px-4 py-3 last:border-0 ${item.acknowledged ? "" : "bg-white/[0.02]"}`}
                    key={`alert-${item.id}`}
                    onClick={() => openAlertTarget(item.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-left font-medium text-[13px] text-white leading-snug">
                        {item.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 font-medium text-[10px] ring-1 ${severityStyles[item.severity] ?? severityStyles.low}`}
                      >
                        {item.severity}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-left text-[12px] text-zinc-500 leading-snug">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-0.5 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-zinc-600">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {item.acknowledged && (
                        <span
                          className={`flex items-center gap-1 text-[11px] ${resolutionClass}`}
                        >
                          <CheckIcon className="size-3" />
                          {resolution.label}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="border-white/[0.06] border-t px-4 py-2.5">
              <Link
                className="text-[13px] text-zinc-400 transition-colors hover:text-zinc-200"
                search={{}}
                to="/alerts"
              >
                View all alerts →
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-opacity hover:opacity-80"
                type="button"
              >
                {userImageUrl && !imageError ? (
                  // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Image error swaps to the initials fallback.
                  <img
                    alt={user.name}
                    className="size-9 rounded-full border border-white/[0.08] object-cover"
                    height={36}
                    onError={() => setImageError(true)}
                    src={userImageUrl}
                    width={36}
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full bg-orange-500 font-semibold text-sm text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="glass-high w-60"
              side="bottom"
            >
              <div className="px-3 py-2.5">
                <p className="font-medium text-[15px] text-white">
                  {user.name}
                </p>
                <p className="text-[13px] text-zinc-500">{user.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem
                asChild
                className="cursor-pointer px-3 py-2.5 text-zinc-200 focus:bg-white/10 focus:text-white"
              >
                <Link to="/settings/account">
                  <UserIcon className="mr-2.5 size-[18px]" />
                  <span className="text-[15px]">Account</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="cursor-pointer px-3 py-2.5 text-zinc-200 focus:bg-white/10 focus:text-white"
              >
                <a href="mailto:support@motiq.com">
                  <LifeBuoyIcon className="mr-2.5 size-[18px]" />
                  <span className="text-[15px]">Support</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem
                asChild
                className="cursor-pointer px-3 py-2.5 text-zinc-200 focus:bg-white/10 focus:text-white"
              >
                <Link to="/apps">
                  <LayoutGridIcon className="mr-2.5 size-[18px]" />
                  <span className="text-[15px]">Apps</span>
                  <div className="ml-auto flex -space-x-1">
                    <span className="flex size-4 items-center justify-center rounded-full border border-zinc-900 bg-white/[0.06]">
                      <SlackIcon className="size-2.5" />
                    </span>
                    <span className="flex size-4 items-center justify-center rounded-full border border-zinc-900 bg-white/[0.06]">
                      <DiscordIcon className="size-2.5 text-indigo-500" />
                    </span>
                    <span className="flex size-4 items-center justify-center rounded-full border border-zinc-900 bg-white/[0.06]">
                      <TelegramIcon className="size-2.5 text-sky-400" />
                    </span>
                    <span className="flex size-4 items-center justify-center rounded-full border border-zinc-900 bg-white/[0.06]">
                      <GmailIcon className="size-2.5" />
                    </span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem
                className="cursor-pointer px-3 py-2.5 text-red-400 focus:bg-red-500/10 focus:text-red-400"
                onClick={handleSignOut}
              >
                <LogOutIcon className="mr-2.5 size-[18px]" />
                <span className="text-[15px]">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
