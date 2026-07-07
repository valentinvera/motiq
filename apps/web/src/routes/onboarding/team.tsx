import { Button } from "@motiq/ui/components/button"
import { Input } from "@motiq/ui/components/input"
import { Label } from "@motiq/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@motiq/ui/components/select"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { PlusIcon, XIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  OnboardingLayout,
  OnboardingNextButton,
  OnboardingPreviousLink,
  OnboardingSkipLink,
} from "@/components/app/onboarding-layout"
import { authClient } from "@/lib/auth-client"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/onboarding/team")({
  head: () => ({
    meta: [{ title: "Team | Motiq" }],
  }),
  component: TeamStep,
})

const TOTAL_STEPS = 4
type Role = "admin" | "member"
interface InviteRow {
  id: string
  email: string
  role: Role
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function makeRow(): InviteRow {
  return {
    id: crypto.randomUUID(),
    email: "",
    role: "member",
  }
}

function normalizeRole(role: string): Role {
  return role === "admin" ? "admin" : "member"
}

function TeamStep() {
  const { auth } = Route.useRouteContext()
  const navigate = useNavigate()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const pending = useQuery(trpc.workspace.getPendingInvitations.queryOptions())
  const [rows, setRows] = useState<InviteRow[]>(() => [makeRow()])
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hydrated || pending.isLoading) {
      return
    }
    if (pending.data && pending.data.length > 0) {
      setRows(
        pending.data.map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: normalizeRole(inv.role),
        }))
      )
    }
    setHydrated(true)
  }, [pending.data, pending.isLoading, hydrated])

  const existingEmails = useMemo(
    () =>
      new Set(
        (pending.data ?? []).map((inv) => inv.email.trim().toLowerCase())
      ),
    [pending.data]
  )

  const validRows = rows.filter((r) => isValidEmail(r.email))
  const newRows = validRows.filter(
    (r) => !existingEmails.has(r.email.trim().toLowerCase())
  )
  const hasNew = newRows.length > 0

  function updateRow(id: string, patch: Partial<InviteRow>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    )
  }

  function removeRow(id: string) {
    setRows((prev) =>
      prev.length === 1 ? [makeRow()] : prev.filter((r) => r.id !== id)
    )
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()])
  }

  async function handleContinue() {
    if (!hasNew) {
      return
    }

    setLoading(true)

    async function sendInvite(row: InviteRow) {
      const { error } = await authClient.organization.inviteMember({
        email: row.email.trim(),
        role: row.role,
      })

      if (error) {
        throw new Error(error.message ?? "Invitation failed")
      }
    }

    const results = await Promise.allSettled(
      newRows.map((row) => sendInvite(row))
    )

    const failed = results.filter((r) => r.status === "rejected").length
    const sent = results.length - failed

    if (sent > 0) {
      toast.success(`Sent ${sent} invitation${sent === 1 ? "" : "s"}`)
    }
    if (failed > 0) {
      toast.error(`${failed} invitation${failed === 1 ? "" : "s"} failed`)
    }

    await queryClient.invalidateQueries({
      queryKey: trpc.workspace.getPendingInvitations.queryKey(),
    })
    await queryClient.invalidateQueries({
      queryKey: trpc.workspace.getMembers.queryKey(),
    })

    setLoading(false)
    navigate({ to: "/onboarding/apps" })
  }

  return (
    <OnboardingLayout
      description="Add teammates so signals reach the right people. They'll get an email to join."
      nextSlot={
        <OnboardingNextButton
          disabled={!hasNew}
          label="Send invites"
          loading={loading}
          loadingLabel="Sending invites..."
          onClick={handleContinue}
        />
      }
      preview={<TeamPreview invites={validRows} owner={auth.user} />}
      previousSlot={<OnboardingPreviousLink to="/onboarding/workspace" />}
      skipSlot={<OnboardingSkipLink to="/onboarding/apps" />}
      step={2}
      title="Invite your team"
      totalSteps={TOTAL_STEPS}
      user={auth.user}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-zinc-400">Invitations</Label>
          <span className="text-[11px] text-zinc-600">Optional</span>
        </div>

        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div className="flex items-center gap-2" key={row.id}>
              <Input
                aria-label={`Email ${idx + 1}`}
                autoComplete="email"
                className="h-10 flex-1 rounded-md border border-white/[0.08] bg-white/[0.02] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-white/40 focus-visible:ring-1 focus-visible:ring-white/15"
                onChange={(e) => updateRow(row.id, { email: e.target.value })}
                placeholder="name@company.com"
                type="email"
                value={row.email}
              />
              <Select
                onValueChange={(v) => updateRow(row.id, { role: v as Role })}
                value={row.role}
              >
                <SelectTrigger className="h-10 w-[110px] rounded-md border border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:bg-white/[0.04] focus:ring-1 focus:ring-white/15">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/[0.08] bg-zinc-950 text-zinc-300">
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <button
                aria-label="Remove"
                className="flex size-10 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
                onClick={() => removeRow(row.id)}
                type="button"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <Button
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.06] border-dashed bg-transparent px-2.5 font-medium text-xs text-zinc-500 transition-colors hover:border-white/15 hover:bg-white/[0.02] hover:text-zinc-300"
          onClick={addRow}
          type="button"
        >
          <PlusIcon className="size-3.5" />
          Add another
        </Button>
      </div>
    </OnboardingLayout>
  )
}

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}

function TeamPreview({
  owner,
  invites,
}: {
  owner: { name?: string | null; email?: string | null; image?: string | null }
  invites: InviteRow[]
}) {
  const ownerName = owner.name?.trim() || owner.email?.split("@")[0] || "You"
  const ownerInitial = ownerName[0]?.toUpperCase() ?? "?"

  return (
    <div className="rounded-xl border border-white/[0.06] bg-zinc-950/80 p-5 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm text-zinc-200">Team</p>
        <span className="text-[11px] text-zinc-600">
          {1 + invites.length} member{invites.length === 0 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center gap-3 rounded-md bg-white/[0.02] px-2.5 py-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 font-medium text-[11px] text-zinc-200">
            {ownerInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-zinc-200">{ownerName}</p>
            <p className="truncate text-[10px] text-zinc-600">{owner.email}</p>
          </div>
          <span className="rounded-sm border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-400">
            Owner
          </span>
        </div>

        {invites.map((row) => (
          <div
            className="flex items-center gap-3 rounded-md px-2.5 py-2"
            key={row.id}
          >
            <div className="flex size-7 items-center justify-center rounded-full border border-white/[0.06] border-dashed bg-white/[0.01] font-medium text-[11px] text-zinc-500">
              {row.email[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-zinc-400">{row.email}</p>
              <p className="text-[10px] text-zinc-600">Pending invitation</p>
            </div>
            <span className="rounded-sm border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[10px] text-zinc-500 capitalize">
              {row.role}
            </span>
          </div>
        ))}

        {invites.length === 0 ? (
          <div className="flex items-center justify-center rounded-md border border-white/[0.04] border-dashed px-2.5 py-3">
            <p className="text-[11px] text-zinc-600">
              Add emails to preview invites
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
