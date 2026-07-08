import { Button } from "@motiq/ui/components/button"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { clearCachedAuthSession } from "@/lib/auth-session"
import { useTRPC } from "@/utils/trpc"

export const PENDING_INVITATION_KEY = "motiq:pendingInvitation"

export const Route = createFileRoute("/accept-invitation/$id")({
  head: () => ({
    meta: [{ title: "Accept invitation | Motiq" }],
  }),
  component: AcceptInvitationPage,
})

function rememberInvitation(id: string): void {
  if (typeof window === "undefined") {
    return
  }
  window.sessionStorage.setItem(PENDING_INVITATION_KEY, id)
}

function AcceptInvitationPage() {
  const { id } = Route.useParams()
  const { auth } = Route.useRouteContext()
  const trpc = useTRPC()
  const invitation = useQuery(trpc.workspace.getInvitation.queryOptions({ id }))

  if (invitation.isLoading) {
    return <CenteredStatus icon="spinner" message="Loading invitation…" />
  }

  if (!invitation.data) {
    return (
      <Centered>
        <Title>Invitation not found</Title>
        <Subtitle>
          This invitation link is invalid or no longer exists.
        </Subtitle>
      </Centered>
    )
  }

  const inv = invitation.data
  const expired = new Date(inv.expiresAt).getTime() < Date.now()
  const inviterName = inv.inviterName?.trim() || inv.inviterEmail

  if (inv.status === "accepted") {
    return (
      <Centered>
        <Title>Already accepted</Title>
        <Subtitle>This invitation has already been used.</Subtitle>
        <PrimaryLink to="/overview">Go to overview</PrimaryLink>
      </Centered>
    )
  }

  if (inv.status === "rejected" || inv.status === "canceled") {
    return (
      <Centered>
        <Title>Invitation unavailable</Title>
        <Subtitle>
          This invitation was {inv.status}. Ask {inviterName} for a new one.
        </Subtitle>
      </Centered>
    )
  }

  if (expired) {
    return (
      <Centered>
        <Title>Invitation expired</Title>
        <Subtitle>
          Ask {inviterName} to send you a new invitation to{" "}
          {inv.organizationName}.
        </Subtitle>
      </Centered>
    )
  }

  if (!auth) {
    return (
      <UnauthenticatedView
        email={inv.email}
        invitationId={id}
        inviterName={inviterName}
        orgName={inv.organizationName}
        role={inv.role}
      />
    )
  }

  if (auth.user.email.toLowerCase() !== inv.email.toLowerCase()) {
    return (
      <WrongAccountView
        currentEmail={auth.user.email}
        invitationId={id}
        invitedEmail={inv.email}
      />
    )
  }

  return (
    <AcceptView
      invitationId={id}
      inviterName={inviterName}
      organizationId={inv.organizationId}
      orgName={inv.organizationName}
      role={inv.role}
    />
  )
}

function UnauthenticatedView({
  orgName,
  inviterName,
  role,
  email,
  invitationId,
}: {
  orgName: string
  inviterName: string
  role: string
  email: string
  invitationId: string
}) {
  return (
    <Centered>
      <Title>You're invited to {orgName}</Title>
      <Subtitle>
        {inviterName} invited <strong className="text-zinc-300">{email}</strong>{" "}
        to join {orgName} as a <strong className="text-zinc-300">{role}</strong>
        . Sign in or create an account with that email to accept.
      </Subtitle>
      <div className="flex items-center gap-2">
        <Link
          className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-white px-4 font-medium text-black text-sm transition-colors hover:bg-white/90"
          onClick={() => rememberInvitation(invitationId)}
          to="/signup"
        >
          Create account
        </Link>
        <Link
          className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] px-4 font-medium text-sm text-zinc-200 transition-colors hover:border-white/15 hover:bg-white/[0.08]"
          onClick={() => rememberInvitation(invitationId)}
          to="/login"
        >
          Sign in
        </Link>
      </div>
    </Centered>
  )
}

function WrongAccountView({
  invitedEmail,
  currentEmail,
  invitationId,
}: {
  invitedEmail: string
  currentEmail: string
  invitationId: string
}) {
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    rememberInvitation(invitationId)
    await authClient.signOut()
    clearCachedAuthSession()
    window.location.assign("/login")
  }

  return (
    <Centered>
      <Title>Signed in as the wrong account</Title>
      <Subtitle>
        This invitation is for{" "}
        <strong className="text-zinc-300">{invitedEmail}</strong>, but you're
        signed in as <strong className="text-zinc-300">{currentEmail}</strong>.
        Sign out and sign back in with the right account.
      </Subtitle>
      <Button
        className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-white px-4 font-medium text-black text-sm transition-colors hover:bg-white/90 disabled:opacity-50"
        disabled={signingOut}
        onClick={handleSignOut}
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
    </Centered>
  )
}

function AcceptView({
  orgName,
  inviterName,
  role,
  invitationId,
  organizationId,
}: {
  orgName: string
  inviterName: string
  role: string
  invitationId: string
  organizationId: string
}) {
  const navigate = useNavigate()
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setAccepting(true)
    setError(null)
    const { error: acceptError } =
      await authClient.organization.acceptInvitation({
        invitationId,
      })
    if (acceptError) {
      setError(acceptError.message ?? "Could not accept the invitation.")
      setAccepting(false)
      return
    }
    await authClient.organization.setActive({ organizationId })
    toast.success(`Joined ${orgName}`)
    window.location.assign("/overview")
  }

  return (
    <Centered>
      <Title>Join {orgName}</Title>
      <Subtitle>
        {inviterName} invited you to join {orgName} as a{" "}
        <strong className="text-zinc-300">{role}</strong>.
      </Subtitle>
      {error ? (
        <p className="text-center text-[12px] text-red-400">{error}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <Button
          className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-white px-4 font-medium text-black text-sm transition-colors hover:bg-white/90 disabled:opacity-50"
          disabled={accepting}
          onClick={handleAccept}
        >
          {accepting ? "Accepting…" : "Accept and join"}
        </Button>
        <Button
          className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] px-4 font-medium text-sm text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.08]"
          disabled={accepting}
          onClick={() => navigate({ to: "/overview" })}
        >
          Not now
        </Button>
      </div>
    </Centered>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-black px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        {children}
      </div>
    </div>
  )
}

function CenteredStatus({
  icon,
  message,
}: {
  icon: "spinner"
  message: string
}) {
  return (
    <Centered>
      {icon === "spinner" ? (
        <Loader2Icon className="size-5 animate-spin text-zinc-500" />
      ) : null}
      <p className="text-xs text-zinc-500">{message}</p>
    </Centered>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-medium text-2xl text-zinc-100 tracking-tight">
      {children}
    </h1>
  )
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-500 leading-relaxed">{children}</p>
}

function PrimaryLink({
  children,
  to,
}: {
  children: React.ReactNode
  to: "/overview"
}) {
  return (
    <Link
      className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-white px-4 font-medium text-black text-sm transition-colors hover:bg-white/90"
      to={to}
    >
      {children}
    </Link>
  )
}
