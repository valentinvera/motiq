import { Button } from "@motiq/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@motiq/ui/components/dialog"
import { Input } from "@motiq/ui/components/input"
import { Textarea } from "@motiq/ui/components/textarea"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AtSignIcon, CheckIcon, SearchIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { getMediaUrl } from "@/lib/media"
import { useTRPC, useTRPCClient } from "@/utils/trpc"

type MentionEntityType = "signal" | "alert"

interface MentionDialogProps {
  entityType: MentionEntityType
  entityId: string
  entityTitle: string
  buttonClassName?: string
}

export function MentionDialog({
  entityType,
  entityId,
  entityTitle,
  buttonClassName,
}: MentionDialogProps) {
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()
  const session = authClient.useSession()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [listOpen, setListOpen] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const currentUserId = session.data?.user.id

  const members = useQuery({
    ...trpc.workspace.getMembers.queryOptions(),
    enabled: open,
  })

  const existingMentions = useQuery({
    ...trpc.mention.listForEntity.queryOptions({ entityType, entityId }),
    enabled: open,
  })

  const blockedMentionedUsers = useQuery({
    ...trpc.mention.getBlockedUserIds.queryOptions({ entityType, entityId }),
    enabled: open,
  })

  const mentionableMembers = useMemo(() => {
    const list = members.data ?? []

    if (!currentUserId) {
      return list
    }

    return list.filter((member) => member.userId !== currentUserId)
  }, [members.data, currentUserId])

  const blockedUserIds = useMemo(
    () => new Set(blockedMentionedUsers.data?.userIds ?? []),
    [blockedMentionedUsers.data]
  )

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return mentionableMembers
    }

    return mentionableMembers.filter((member) => {
      const haystack = `${member.userName} ${member.userEmail}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [mentionableMembers, search])

  const mention = useMutation({
    mutationFn: () =>
      trpcClient.mention.create.mutate({
        entityType,
        entityId,
        mentionedUserId: selectedUserId ?? "",
        message: message.trim() || undefined,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: trpc.mention.listForEntity.queryKey({ entityType, entityId }),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.mention.getBlockedUserIds.queryKey({
          entityType,
          entityId,
        }),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.mention.listForMe.queryKey(),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.mention.getUnreadCount.queryKey(),
      })
      toast.success(result.updated ? "Mention updated" : "Mention sent")
      setOpen(false)
      setSearch("")
      setListOpen(true)
      setSelectedUserId(null)
      setMessage("")
    },
    onError: (error) => toast.error(error.message),
  })

  const selectedMember = mentionableMembers.find(
    (member) => member.userId === selectedUserId
  )

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearch("")
      setListOpen(true)
      setSelectedUserId(null)
      setMessage("")
    }
  }

  const getMemberButtonClassName = (blocked: boolean, selected: boolean) => {
    if (blocked) {
      return "cursor-not-allowed text-zinc-600 opacity-60"
    }

    if (selected) {
      return "bg-white/[0.08] text-white"
    }

    return "cursor-pointer text-zinc-300 hover:bg-white/[0.05] hover:text-white"
  }

  const renderMemberListContent = () => {
    if (members.isLoading) {
      return (
        <div className="px-3 py-6 text-center text-sm text-zinc-500">
          Loading members...
        </div>
      )
    }

    if (filteredMembers.length === 0) {
      return (
        <div className="px-3 py-6 text-center text-sm text-zinc-500">
          No members found
        </div>
      )
    }

    return filteredMembers.map((member) => {
      const selected = selectedUserId === member.userId
      const blocked = blockedUserIds.has(member.userId)
      const memberImageUrl = getMediaUrl(member.userImage)

      return (
        <button
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${getMemberButtonClassName(
            blocked,
            selected
          )}`}
          disabled={blocked}
          key={member.userId}
          onClick={() => {
            if (blocked) {
              return
            }
            setSelectedUserId(member.userId)
            setSearch(member.userName)
            setListOpen(false)
          }}
          type="button"
        >
          {memberImageUrl ? (
            <img
              alt={member.userName}
              className="size-7 rounded-full object-cover"
              height={28}
              src={memberImageUrl}
              width={28}
            />
          ) : (
            <span className="flex size-7 items-center justify-center rounded-full bg-white/[0.08] font-medium text-[11px] text-zinc-300">
              {member.userName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-sm">
              {member.userName}
            </span>
            <span className="block truncate text-xs text-zinc-500">
              {blocked ? "Already mentioned on related item" : member.userEmail}
            </span>
          </span>
          {selected && <CheckIcon className="size-4 text-emerald-400" />}
        </button>
      )
    })
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button
          className={
            buttonClassName ??
            "h-9 cursor-pointer gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] font-medium text-xs text-zinc-200 hover:bg-white/[0.06] hover:text-white"
          }
          size="sm"
          type="button"
          variant="ghost"
        >
          <AtSignIcon className="size-3.5" />
          Mention
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xl border border-white/[0.08] bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medium text-lg text-white">
            Mention teammate
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            Ask someone in this workspace to review this {entityType}. This does
            not assign ownership.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2">
            <p className="font-medium text-[11px] text-zinc-500 uppercase tracking-wide">
              {entityType}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-300">
              {entityTitle}
            </p>
          </div>

          <div className="space-y-2">
            <label
              className="font-medium text-[11px] text-zinc-400 uppercase tracking-wide"
              htmlFor={`mention-search-${entityId}`}
            >
              Teammate
            </label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.03] pl-10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-white/30 focus:ring-1 focus:ring-white/10"
                id={`mention-search-${entityId}`}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setSelectedUserId(null)
                  setListOpen(true)
                }}
                onFocus={() => setListOpen(true)}
                placeholder="Search members..."
                value={search}
              />
            </div>
            <AnimatePresence initial={false}>
              {listOpen && (
                <motion.div
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  className="overflow-hidden"
                  exit={{ height: 0, opacity: 0, y: -4 }}
                  initial={{ height: 0, opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-white/[0.06] bg-black/30 p-1">
                    {renderMemberListContent()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <label
              className="font-medium text-[11px] text-zinc-400 uppercase tracking-wide"
              htmlFor={`mention-message-${entityId}`}
            >
              Note optional
            </label>
            <Textarea
              className="min-h-24 resize-none rounded-lg border-white/[0.08] bg-white/[0.03] text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:border-white/30 focus-visible:ring-white/10"
              id={`mention-message-${entityId}`}
              maxLength={1000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                selectedMember
                  ? `Tell ${selectedMember.userName} what to review...`
                  : "Add context for the teammate..."
              }
              value={message}
            />
          </div>

          {existingMentions.data && existingMentions.data.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-[11px] text-zinc-500 uppercase tracking-wide">
                Recent mentions
              </p>
              <div className="space-y-1.5">
                {existingMentions.data.slice(0, 3).map((item) => (
                  <div
                    className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
                    key={item.id}
                  >
                    <p className="text-xs text-zinc-300">
                      @{item.mentionedUser?.name ?? "Unknown"}
                    </p>
                    {item.message && (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                        {item.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            className="cursor-pointer rounded-lg border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06] hover:text-white"
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="cursor-pointer rounded-lg bg-white text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedUserId || mention.isPending}
            onClick={() => mention.mutate()}
            type="button"
          >
            {mention.isPending ? "Sending..." : "Send mention"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
