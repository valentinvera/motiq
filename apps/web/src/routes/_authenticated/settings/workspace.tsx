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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2Icon, Trash2Icon } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { SettingsCard } from "@/components/app/settings-card"
import { authClient } from "@/lib/auth-client"
import { getMediaUrl } from "@/lib/media"
import { usePermission } from "@/lib/permissions"
import { SettingsTabSkeleton } from "@/routes/_authenticated/settings"
import { useTRPC } from "@/utils/trpc"

const ACCEPTED_LOGO_TYPES = "image/png,image/jpeg,image/webp,image/gif"
const MAX_LOGO_BYTES = 4 * 1024 * 1024

export const Route = createFileRoute("/_authenticated/settings/workspace")({
  head: () => ({
    meta: [{ title: "Workspace | Motiq" }],
  }),
  component: WorkspaceTab,
})

function WorkspaceTab() {
  const trpc = useTRPC()
  const org = useQuery(trpc.workspace.getActive.queryOptions())
  const canEdit = usePermission("organization", "update")
  const canDelete = usePermission("organization", "delete")

  if (org.isLoading || !org.data) {
    return <SettingsTabSkeleton />
  }

  return (
    <>
      {!canEdit && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3 text-[12px] text-zinc-500">
          You can view workspace settings but only owners and admins can change
          them.
        </div>
      )}
      <WorkspaceLogoCard
        canEdit={canEdit}
        logo={org.data.logo}
        name={org.data.name}
      />
      <WorkspaceNameCard
        canEdit={canEdit}
        initialName={org.data.name}
        initialSlug={org.data.slug}
      />
      <WorkspaceSlugCard
        canEdit={canEdit}
        initialName={org.data.name}
        initialSlug={org.data.slug}
      />
      {canDelete ? <DeleteWorkspaceCard name={org.data.name} /> : null}
    </>
  )
}

function WorkspaceLogoCard({
  name,
  logo,
  canEdit,
}: {
  name: string
  logo: string | null
  canEdit: boolean
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const initial = name.charAt(0).toUpperCase()
  const logoUrl = getMediaUrl(logo)
  const busy = uploading || removing

  const updateWorkspace = useMutation(
    trpc.workspace.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.getActive.queryKey(),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.list.queryKey(),
        })
      },
    })
  )

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) {
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Image must be 4MB or less")
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload/workspace-logo`,
        { method: "POST", body: form, credentials: "include" }
      )
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(data?.error ?? "Upload failed")
      }
      const { url } = (await res.json()) as { url: string }
      await updateWorkspace.mutateAsync({ logo: url })
      toast.success("Workspace logo updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload")
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveLogo() {
    if (!(canEdit && logo)) {
      return
    }

    setRemoving(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload/workspace-logo`,
        {
          method: "DELETE",
          body: JSON.stringify({ url: logo }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      )
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(data?.error ?? "Failed to remove workspace logo")
      }
      await updateWorkspace.mutateAsync({ logo: null })
      toast.success("Workspace logo removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-start justify-between gap-6 p-6">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[15px] text-zinc-100">
            Workspace logo
          </h3>
          <p className="mt-1.5 text-[13px] text-zinc-500 leading-relaxed">
            This is your workspace's logo. Click on the logo to upload a custom
            one from your files.
          </p>
        </div>
        <input
          accept={ACCEPTED_LOGO_TYPES}
          className="hidden"
          onChange={handleFileChange}
          ref={inputRef}
          type="file"
        />
        <button
          aria-label="Upload workspace logo"
          className="relative flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.04] font-semibold text-lg text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canEdit || busy}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {logo ? (
            <img
              alt={name}
              className="size-full object-cover"
              height={56}
              src={logoUrl}
              width={56}
            />
          ) : (
            initial
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2Icon className="size-5 animate-spin text-white" />
            </span>
          )}
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 border-white/[0.06] border-t bg-white/[0.01] px-6 py-3">
        <p className="text-[11px] text-zinc-500">
          A logo is optional but strongly recommended. PNG, JPG, WEBP or GIF, up
          to 4MB.
        </p>
        {canEdit && logo ? (
          <Button
            className="h-7 shrink-0 cursor-pointer rounded-md border-red-500/20 bg-red-500/10 px-2.5 font-medium text-[11px] text-red-400 hover:bg-red-500/20 hover:text-red-300"
            disabled={busy}
            onClick={handleRemoveLogo}
            size="sm"
            type="button"
            variant="outline"
          >
            <Trash2Icon className="mr-1 size-3" />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function WorkspaceNameCard({
  initialName,
  initialSlug,
  canEdit,
}: {
  initialName: string
  initialSlug: string
  canEdit: boolean
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [name, setName] = useState(initialName)

  const updateWorkspace = useMutation(
    trpc.workspace.update.mutationOptions({
      onSuccess: () => {
        toast.success("Workspace name updated")
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.getActive.queryKey(),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.list.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to update workspace")
      },
    })
  )

  const trimmed = name.trim()
  const canSave =
    canEdit &&
    trimmed.length > 0 &&
    trimmed.length <= 32 &&
    trimmed !== initialName

  return (
    <SettingsCard
      description="This is your workspace's visible name within Motiq. For example, the name of your company or department."
      footerAction={
        <Button
          className="h-8 cursor-pointer rounded-md bg-white px-3 font-medium text-black text-xs hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSave || updateWorkspace.isPending}
          onClick={() =>
            updateWorkspace.mutate({ name: trimmed, slug: initialSlug })
          }
          size="sm"
        >
          {updateWorkspace.isPending ? "Saving..." : "Save"}
        </Button>
      }
      footerNote="Please use 32 characters at maximum."
      title="Workspace name"
    >
      <Input
        className="mt-4 max-w-sm rounded-md border-white/[0.08] bg-white/[0.03] text-zinc-100 placeholder:text-zinc-600 focus:border-white/30 focus:ring-1 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!canEdit}
        maxLength={32}
        onChange={(e) => setName(e.target.value)}
        value={name}
      />
    </SettingsCard>
  )
}

function WorkspaceSlugCard({
  initialName,
  initialSlug,
  canEdit,
}: {
  initialName: string
  initialSlug: string
  canEdit: boolean
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [slug, setSlug] = useState(initialSlug)

  const updateWorkspace = useMutation(
    trpc.workspace.update.mutationOptions({
      onSuccess: () => {
        toast.success("Workspace URL updated")
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.getActive.queryKey(),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.list.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to update workspace")
      },
    })
  )

  const trimmed = slug.trim()
  const canSave = canEdit && trimmed.length > 0 && trimmed !== initialSlug

  return (
    <SettingsCard
      description="The unique URL slug for your workspace. Only lowercase letters, numbers, and hyphens."
      footerAction={
        <Button
          className="h-8 cursor-pointer rounded-md bg-white px-3 font-medium text-black text-xs hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSave || updateWorkspace.isPending}
          onClick={() =>
            updateWorkspace.mutate({ name: initialName, slug: trimmed })
          }
          size="sm"
        >
          {updateWorkspace.isPending ? "Saving..." : "Save"}
        </Button>
      }
      footerNote="Used in URLs across the workspace."
      title="Workspace URL"
    >
      <Input
        className="mt-4 max-w-sm rounded-md border-white/[0.08] bg-white/[0.03] font-mono text-zinc-100 placeholder:text-zinc-600 focus:border-white/30 focus:ring-1 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!canEdit}
        onChange={(e) =>
          setSlug(
            e.target.value
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, "-")
              .replace(/-+/g, "-")
          )
        }
        value={slug}
      />
    </SettingsCard>
  )
}

function DeleteWorkspaceCard({ name }: { name: string }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")

  const deleteWorkspace = useMutation(
    trpc.workspace.deleteActive.mutationOptions({
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete workspace")
      },
    })
  )

  const canConfirm = confirmation.trim() === name

  async function handleDelete() {
    if (!canConfirm || deleteWorkspace.isPending) {
      return
    }

    let result: Awaited<ReturnType<typeof deleteWorkspace.mutateAsync>>

    try {
      result = await deleteWorkspace.mutateAsync()
    } catch {
      return
    }

    toast.success("Workspace deleted")
    queryClient.invalidateQueries({
      queryKey: trpc.workspace.getActive.queryKey(),
    })
    queryClient.invalidateQueries({ queryKey: trpc.workspace.list.queryKey() })

    if (result.nextWorkspace) {
      await authClient.organization.setActive({
        organizationId: result.nextWorkspace.id,
      })
      window.location.href = "/overview"
      return
    }

    window.location.href = "/onboarding"
  }

  return (
    <>
      <SettingsCard
        description="Permanently delete this workspace, its members, invitations, connected apps, signals, alerts, chats, activity and pipeline history. This cannot be undone."
        footerAction={
          <Button
            className="h-8 cursor-pointer rounded-md border border-red-500/25 bg-red-500/10 px-3 font-medium text-red-300 text-xs hover:bg-red-500/15"
            onClick={() => setOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            Delete workspace
          </Button>
        }
        footerNote="Only the workspace owner can delete this workspace."
        title="Delete workspace"
      />
      <Dialog
        onOpenChange={(next) => {
          if (!deleteWorkspace.isPending) {
            setOpen(next)
            if (!next) {
              setConfirmation("")
            }
          }
        }}
        open={open}
      >
        <DialogContent className="rounded-xl border border-white/[0.08] bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-medium text-lg text-white tracking-tight">
              Delete workspace?
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              This will revoke access for every member and permanently delete
              all data in {name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-[12px] text-zinc-500">
              Type <span className="font-medium text-zinc-300">{name}</span> to
              confirm.
            </p>
            <Input
              autoFocus
              className="rounded-md border-white/[0.08] bg-white/[0.03] text-zinc-100 placeholder:text-zinc-600 focus:border-white/30 focus:ring-1 focus:ring-white/10"
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={name}
              value={confirmation}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              className="cursor-pointer rounded-sm font-medium text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
              disabled={deleteWorkspace.isPending}
              onClick={() => setOpen(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer rounded-sm border border-red-500/25 bg-red-500/[0.1] font-medium text-red-300 text-sm transition-colors hover:bg-red-500/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canConfirm || deleteWorkspace.isPending}
              onClick={handleDelete}
              type="button"
              variant="outline"
            >
              {deleteWorkspace.isPending ? "Deleting..." : "Delete workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
