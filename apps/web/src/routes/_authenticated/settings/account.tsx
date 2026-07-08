import { Button } from "@motiq/ui/components/button"
import { Input } from "@motiq/ui/components/input"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import {
  CheckCircle2Icon,
  CreditCardIcon,
  Loader2Icon,
  LogOutIcon,
  Trash2Icon,
} from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { SettingsCard } from "@/components/app/settings-card"
import { getPayment } from "@/functions/get-payment"
import { authClient } from "@/lib/auth-client"
import { formatBillingDate, getActiveBillingPlan } from "@/lib/billing"
import { getMediaUrl, isBlobMediaUrl } from "@/lib/media"

const ACCEPTED_AVATAR_TYPES = "image/png,image/jpeg,image/webp,image/gif"
const MAX_AVATAR_BYTES = 4 * 1024 * 1024

export const Route = createFileRoute("/_authenticated/settings/account")({
  head: () => ({
    meta: [{ title: "Account | Motiq" }],
  }),
  component: AccountTab,
})

function AccountTab() {
  const { auth } = Route.useRouteContext()
  const user = auth.user

  return (
    <>
      <AvatarCard email={user.email} image={user.image ?? null} />
      <NameCard initialName={user.name} />
      <EmailCard email={user.email} />
      <PlanCard />
      <SignOutCard />
    </>
  )
}

function AvatarCard({ email, image }: { email: string; image: string | null }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const initial = email.charAt(0).toUpperCase()
  const imageUrl = getMediaUrl(image)
  const showImage = Boolean(imageUrl && imageUrl !== failedImageUrl)
  const canRemove = isBlobMediaUrl(image)
  const busy = uploading || removing

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) {
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 4MB or less")
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload/avatar`,
        { method: "POST", body: form, credentials: "include" }
      )
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(data?.error ?? "Upload failed")
      }
      const { url } = (await res.json()) as { url: string }
      await authClient.updateUser({ image: url })
      toast.success("Avatar updated")
      router.invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload")
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveAvatar() {
    if (!canRemove) {
      return
    }

    setRemoving(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload/avatar`,
        {
          method: "DELETE",
          body: JSON.stringify({ url: image }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      )
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(data?.error ?? "Failed to remove avatar")
      }
      const data = (await res.json()) as { image: string | null }
      await authClient.updateUser({ image: data.image })
      toast.success("Avatar removed")
      router.invalidate()
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
          <h3 className="font-medium text-[15px] text-zinc-100">Avatar</h3>
          <p className="mt-1.5 text-[13px] text-zinc-500 leading-relaxed">
            This is your avatar. Click on the avatar to upload a custom one from
            your files.
          </p>
        </div>
        <input
          accept={ACCEPTED_AVATAR_TYPES}
          className="hidden"
          onChange={handleFileChange}
          ref={inputRef}
          type="file"
        />
        <button
          aria-label="Upload avatar"
          className="relative flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-zinc-800 font-semibold text-lg text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {showImage ? (
            // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Image error swaps to the initials fallback.
            <img
              alt=""
              className="size-full object-cover"
              height={56}
              onError={() => setFailedImageUrl(imageUrl ?? null)}
              src={imageUrl}
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
          An avatar is optional but strongly recommended. PNG, JPG, WEBP or GIF,
          up to 4MB.
        </p>
        {canRemove ? (
          <Button
            className="h-7 shrink-0 cursor-pointer rounded-md border-red-500/20 bg-red-500/10 px-2.5 font-medium text-[11px] text-red-400 hover:bg-red-500/20 hover:text-red-300"
            disabled={busy}
            onClick={handleRemoveAvatar}
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

function NameCard({ initialName }: { initialName: string }) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)

  const trimmed = name.trim()
  const canSave =
    trimmed.length > 0 && trimmed.length <= 32 && trimmed !== initialName

  async function handleSave() {
    setSaving(true)
    try {
      await authClient.updateUser({ name: trimmed })
      toast.success("Name updated")
      router.invalidate()
    } catch {
      toast.error("Failed to update name")
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsCard
      description="This is the name that will be displayed across Motiq, on invitations and on your profile."
      footerAction={
        <Button
          className="h-8 rounded-md bg-white px-3 font-medium text-black text-xs hover:bg-white/90 disabled:opacity-50"
          disabled={!canSave || saving}
          onClick={handleSave}
          size="sm"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      }
      footerNote="Please use 32 characters at maximum."
      title="Full name"
    >
      <Input
        className="mt-4 max-w-sm rounded-md border-white/[0.08] bg-white/[0.03] text-zinc-100 placeholder:text-zinc-600 focus:border-white/30 focus:ring-1 focus:ring-white/10"
        maxLength={32}
        onChange={(e) => setName(e.target.value)}
        value={name}
      />
    </SettingsCard>
  )
}

function EmailCard({ email }: { email: string }) {
  return (
    <SettingsCard
      description="The email address linked to your account. Used for sign-in and notifications."
      footerNote="Contact support to change your email address."
      title="Email"
    >
      <div className="mt-4 flex max-w-sm items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2">
        <span className="flex-1 truncate text-sm text-zinc-300">{email}</span>
        <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
          <CheckCircle2Icon className="size-3" />
          Verified
        </span>
      </div>
    </SettingsCard>
  )
}

function PlanCard() {
  const payment = useQuery({
    queryFn: () => getPayment(),
    queryKey: ["payment-state"],
  })
  const activePlan = getActiveBillingPlan(payment.data)

  return (
    <SettingsCard
      description="The active workspace subscription attached to your account through Polar."
      footerNote={
        activePlan
          ? `Next renewal: ${formatBillingDate(activePlan.subscription.currentPeriodEnd)}`
          : "Plans are managed from workspace billing settings."
      }
      title="Plan"
    >
      <div className="mt-4 flex max-w-sm items-center justify-between gap-3 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] text-zinc-400">
            <CreditCardIcon className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-sm text-zinc-200">
              {activePlan?.plan.name ?? "Free"}
            </p>
            <p className="text-[11px] text-zinc-500">
              {activePlan
                ? `${activePlan.plan.price}${activePlan.plan.period}`
                : "No paid plan active"}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-sm px-1.5 py-0.5 font-medium text-[10px] ${
            activePlan
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-white/[0.04] text-zinc-500"
          }`}
        >
          {activePlan ? "Active" : "Free"}
        </span>
      </div>
    </SettingsCard>
  )
}

function SignOutCard() {
  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = "/login"
  }

  return (
    <SettingsCard
      description="End your current session on this device. You'll need to sign in again to access your workspace."
      footerAction={
        <Button
          className="h-8 cursor-pointer rounded-md border-red-500/20 bg-red-500/10 px-3 font-medium text-red-400 text-xs hover:bg-red-500/20 hover:text-red-300"
          onClick={handleSignOut}
          size="sm"
          variant="outline"
        >
          <LogOutIcon className="mr-1.5 size-3.5" />
          Sign out
        </Button>
      }
      footerNote="This won't delete your account."
      title="Sign out"
    />
  )
}
