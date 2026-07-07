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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  ChevronDownIcon,
  MailIcon,
  SendIcon,
  TrashIcon,
  UserPlusIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { getMediaUrl } from "@/lib/media"
import { usePermission } from "@/lib/permissions"
import { useTRPC } from "@/utils/trpc"

function MemberAvatar({ image, name }: { image: string | null; name: string }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const initial = name.charAt(0).toUpperCase()
  const imageUrl = getMediaUrl(image)
  const showImage = Boolean(imageUrl && imageUrl !== failedImageUrl)

  if (showImage) {
    return (
      // biome-ignore lint/a11y/noNoninteractiveElementInteractions: image load failure swaps to initials fallback
      <img
        alt=""
        className="size-8 rounded-md border border-white/[0.08] object-cover"
        height={32}
        onError={() => setFailedImageUrl(imageUrl ?? null)}
        src={imageUrl}
        width={32}
      />
    )
  }

  return (
    <div className="flex size-8 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] font-medium text-sm text-zinc-400">
      {initial}
    </div>
  )
}

export const Route = createFileRoute("/_authenticated/settings/members")({
  head: () => ({
    meta: [{ title: "Members | Motiq" }],
  }),
  component: MembersTab,
})

function MembersTab() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { auth } = Route.useRouteContext()
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member")
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string
    name: string
    email: string
    role: string
  } | null>(null)
  const canInvite = usePermission("invitation", "create")
  const canCancelInvitations = usePermission("invitation", "cancel")
  const canRemove = usePermission("member", "delete")
  const canEditRoles = usePermission("member", "update")
  const inviteRoleOptions: Array<"member" | "admin"> = canEditRoles
    ? ["member", "admin"]
    : ["member"]

  useEffect(() => {
    if (!(canEditRoles || inviteRole === "member")) {
      setInviteRole("member")
    }
  }, [canEditRoles, inviteRole])

  const members = useQuery(trpc.workspace.getMembers.queryOptions())
  const invitations = useQuery(
    trpc.workspace.getPendingInvitations.queryOptions()
  )

  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse`,
      {
        withCredentials: true,
      }
    )

    const refreshMembers = () => {
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.getMembers.queryKey(),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.getPendingInvitations.queryKey(),
      })
    }

    eventSource.addEventListener("workspace:members_updated", refreshMembers)

    return () => eventSource.close()
  }, [queryClient, trpc])

  const updateMemberRole = useMutation(
    trpc.workspace.updateMemberRole.mutationOptions({
      onSuccess: () => {
        toast.success("Role updated")
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.getMembers.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to update role")
      },
    })
  )

  const removeMember = useMutation(
    trpc.workspace.removeMember.mutationOptions({
      onSuccess: () => {
        setMemberToRemove(null)
        toast.success("Member removed")
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.getMembers.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to remove member")
      },
    })
  )

  const cancelInvitation = useMutation(
    trpc.workspace.cancelPendingInvitation.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation canceled")
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.getPendingInvitations.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to cancel invitation")
      },
    })
  )

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      return
    }

    const role = canEditRoles ? inviteRole : "member"

    try {
      const { error } = await authClient.organization.inviteMember({
        email: inviteEmail.trim(),
        role,
      })
      if (error) {
        throw new Error(error.message ?? "Failed to send invitation")
      }
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail("")
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.getPendingInvitations.queryKey(),
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation"
      )
    }
  }

  const memberList = members.data ?? []
  const invitationList = invitations.data ?? []
  const isLoading = members.isLoading

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <div className="p-6">
          <h3 className="font-medium text-[15px] text-zinc-100">
            Team members
          </h3>
          <p className="mt-1.5 text-[13px] text-zinc-500 leading-relaxed">
            {canInvite
              ? "Invite teammates to collaborate inside this workspace."
              : "Only owners and admins can invite or remove members."}
          </p>
        </div>
        {canInvite ? (
          <form
            className="flex flex-col gap-3 border-white/[0.06] border-t border-b bg-white/[0.01] p-4 sm:flex-row sm:items-center"
            onSubmit={handleInvite}
          >
            <div className="flex flex-1 items-center gap-2">
              <UserPlusIcon className="hidden size-4 text-zinc-500 sm:block" />
              <Input
                className="flex-1 rounded-md border-white/[0.08] bg-white/[0.03] text-zinc-100 placeholder:text-zinc-600 focus:border-white/30 focus:ring-1 focus:ring-white/10"
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                type="email"
                value={inviteEmail}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  className="h-9 min-w-[108px] cursor-pointer appearance-none rounded-md border border-white/[0.08] bg-white/[0.04] pr-8 pl-3 font-medium text-xs text-zinc-400 focus:border-white/30 focus:ring-1 focus:ring-white/10"
                  onChange={(e) =>
                    setInviteRole(e.target.value as "member" | "admin")
                  }
                  value={inviteRole}
                >
                  {inviteRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role === "admin" ? "Admin" : "Member"}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-zinc-500" />
              </div>
              <Button
                className="h-9 cursor-pointer rounded-md bg-white px-3 font-medium text-black text-xs hover:bg-white/90"
                disabled={!inviteEmail.trim()}
                size="sm"
                type="submit"
              >
                <SendIcon className="mr-1 size-3" />
                Invite
              </Button>
            </div>
          </form>
        ) : null}

        <div className="divide-y divide-white/[0.06]">
          {isLoading && (
            <>
              <div className="flex items-center gap-3 p-4">
                <Skeleton className="size-8 rounded-md opacity-20" />
                <Skeleton className="h-4 w-32 opacity-20" />
                <Skeleton className="ml-auto h-4 w-16 opacity-10" />
              </div>
              <div className="flex items-center gap-3 p-4">
                <Skeleton className="size-8 rounded-md opacity-20" />
                <Skeleton className="h-4 w-24 opacity-20" />
                <Skeleton className="ml-auto h-4 w-16 opacity-10" />
              </div>
            </>
          )}
          {memberList.map((m) => {
            const canChangeThisRole = canEditRoles && m.role !== "owner"
            const isUpdatingThisRole =
              updateMemberRole.isPending &&
              updateMemberRole.variables?.memberId === m.id

            return (
              <div
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
                key={m.id}
              >
                <MemberAvatar image={m.userImage} name={m.userName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm text-zinc-200">
                    {m.userName}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500">
                    {m.userEmail}
                  </p>
                </div>
                {canChangeThisRole ? (
                  <div className="relative">
                    <select
                      className="h-8 min-w-[96px] cursor-pointer appearance-none rounded-md border border-white/[0.08] bg-white/[0.04] pr-8 pl-3 font-medium text-[11px] text-zinc-400 capitalize focus:border-white/30 focus:ring-1 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isUpdatingThisRole}
                      onChange={(e) =>
                        updateMemberRole.mutate({
                          memberId: m.id,
                          role: e.target.value as "member" | "admin",
                        })
                      }
                      value={m.role === "admin" ? "admin" : "member"}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-zinc-500" />
                  </div>
                ) : (
                  <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-medium text-[10px] text-zinc-500 capitalize">
                    {m.role}
                  </span>
                )}
                {canRemove &&
                  m.userId !== auth.user.id &&
                  m.role !== "owner" && (
                    <Button
                      className="cursor-pointer text-zinc-600 hover:text-red-400"
                      disabled={removeMember.isPending}
                      onClick={() =>
                        setMemberToRemove({
                          id: m.id,
                          name: m.userName,
                          email: m.userEmail,
                          role: m.role,
                        })
                      }
                      size="icon"
                      variant="ghost"
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  )}
              </div>
            )
          })}

          {invitationList.map((inv) => (
            <div
              className="flex items-center gap-4 px-5 py-4 opacity-60"
              key={inv.id}
            >
              <div className="flex size-8 items-center justify-center rounded-md border border-zinc-600 border-dashed bg-white/[0.03]">
                <MailIcon className="size-3.5 text-zinc-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm text-zinc-400">
                  {inv.email}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">Pending</p>
              </div>
              <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 font-medium text-[10px] text-zinc-600 capitalize">
                {inv.role}
              </span>
              {canCancelInvitations ? (
                <Button
                  className="cursor-pointer text-zinc-600 hover:text-red-400"
                  disabled={cancelInvitation.isPending}
                  onClick={() =>
                    cancelInvitation.mutate({ invitationId: inv.id })
                  }
                  size="icon"
                  title="Cancel invitation"
                  type="button"
                  variant="ghost"
                >
                  <TrashIcon className="size-3.5" />
                </Button>
              ) : null}
            </div>
          ))}

          {!isLoading && memberList.length === 0 && (
            <p className="p-6 text-center text-sm text-zinc-600">
              No team members found.
            </p>
          )}
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (!(open || removeMember.isPending)) {
            setMemberToRemove(null)
          }
        }}
        open={!!memberToRemove}
      >
        <DialogContent className="rounded-xl border border-white/[0.08] bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-medium text-lg text-white tracking-tight">
              Remove member?
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              This removes {memberToRemove?.name} from the workspace. They will
              lose access to this workspace immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
            <p className="font-medium text-sm text-zinc-200">
              {memberToRemove?.name}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {memberToRemove?.email} · {memberToRemove?.role}
            </p>
          </div>
          <DialogFooter className="pt-4">
            <Button
              className="cursor-pointer rounded-sm font-medium text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
              disabled={removeMember.isPending}
              onClick={() => setMemberToRemove(null)}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer rounded-sm border border-red-500/25 bg-red-500/[0.1] font-medium text-red-300 text-sm transition-colors hover:bg-red-500/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={removeMember.isPending || !memberToRemove}
              onClick={() => {
                if (memberToRemove) {
                  removeMember.mutate({ memberId: memberToRemove.id })
                }
              }}
              variant="outline"
            >
              {removeMember.isPending ? "Removing..." : "Remove member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
