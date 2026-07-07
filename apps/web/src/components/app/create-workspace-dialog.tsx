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
import { Label } from "@motiq/ui/components/label"
import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${base || "workspace"}-${suffix}`
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(false)

  function reset() {
    setName("")
    setSlug("")
    setSlugTouched(false)
    setLoading(false)
  }

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) {
      setSlug(generateSlug(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
    )
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedSlug = slug.trim().replace(/^-|-$/g, "")
    if (!(trimmedName && trimmedSlug)) {
      return
    }

    setLoading(true)
    const { error, data } = await authClient.organization.create({
      name: trimmedName,
      slug: trimmedSlug,
    })

    if (error || !data) {
      toast.error(error?.message ?? "Failed to create workspace")
      setLoading(false)
      return
    }

    await authClient.organization.setActive({ organizationId: data.id })
    window.location.reload()
  }

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next) {
          reset()
        }
        onOpenChange(next)
      }}
      open={open}
    >
      <DialogContent className="rounded-xl border border-white/[0.08] bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medium text-lg text-white tracking-tight">
            Create workspace
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            Workspaces keep signals, alerts, and members separate. You can
            switch between them anytime.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          id="create-workspace-form"
          onSubmit={handleSubmit}
        >
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400" htmlFor="workspace-name">
              Workspace name
            </Label>
            <Input
              autoComplete="organization"
              autoFocus
              className="rounded-md border-white/[0.08] bg-white/[0.03] text-zinc-100 placeholder:text-zinc-600 focus:border-white/30 focus:ring-1 focus:ring-white/10"
              id="workspace-name"
              maxLength={64}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Intelligence"
              required
              value={name}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400" htmlFor="workspace-slug">
              Workspace URL
            </Label>
            <Input
              className="rounded-md border-white/[0.08] bg-white/[0.03] font-mono text-zinc-100 placeholder:text-zinc-600 focus:border-white/30 focus:ring-1 focus:ring-white/10"
              id="workspace-slug"
              maxLength={64}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="acme-intelligence"
              required
              value={slug}
            />
            <p className="text-[11px] text-zinc-600">
              Lowercase letters, numbers, and hyphens.
            </p>
          </div>
        </form>
        <DialogFooter>
          <Button
            className="cursor-pointer rounded-sm font-medium text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            className="cursor-pointer rounded-sm bg-white font-medium text-black text-sm transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading || !(name.trim() && slug.trim())}
            form="create-workspace-form"
            type="submit"
          >
            {loading ? "Creating..." : "Create workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
