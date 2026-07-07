import { Button } from "@motiq/ui/components/button"
import { Input } from "@motiq/ui/components/input"
import { Label } from "@motiq/ui/components/label"
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router"
import { ChevronDownIcon, MailIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AuthLayout } from "@/components/app/auth-layout"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.auth) {
      throw redirect({ to: "/overview" })
    }
  },
  head: () => ({
    meta: [{ title: "Login | Motiq" }],
  }),
  component: LoginPage,
})

type Provider = "google" | "github"

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resending, setResending] = useState(false)
  const [lastMethod, setLastMethod] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    const method = authClient.getLastUsedLoginMethod()
    if (method) {
      setLastMethod(method)
      if (method === "email") {
        setShowOptions(true)
      }
    }
  }, [])

  const primary: Provider = lastMethod === "github" ? "github" : "google"
  const secondary: Provider = primary === "google" ? "github" : "google"

  async function handleSocial(provider: Provider) {
    if (provider === "google") {
      setGoogleLoading(true)
    } else {
      setGithubLoading(true)
    }
    await authClient.signIn.social({
      provider,
      callbackURL: `${window.location.origin}/overview`,
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setNeedsVerification(false)

    const { error } = await authClient.signIn.email({ email, password })

    if (error) {
      const msg = error.message?.toLowerCase() ?? ""
      if (
        msg.includes("email is not verified") ||
        error.code === "EMAIL_NOT_VERIFIED"
      ) {
        setNeedsVerification(true)
        setLoading(false)
        return
      }
      toast.error(error.message ?? "Failed to sign in")
      setLoading(false)
      return
    }

    navigate({ to: "/overview" })
  }

  async function handleResendVerification() {
    setResending(true)
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/overview",
    })
    if (error) {
      toast.error(error.message ?? "Failed to resend email")
    } else {
      toast.success("Verification email sent")
    }
    setResending(false)
  }

  const isPrimaryLoading = primary === "google" ? googleLoading : githubLoading
  const isSecondaryLoading =
    secondary === "google" ? googleLoading : githubLoading

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl text-white tracking-tighter lg:text-[32px]">
            Welcome to Motiq
          </h1>
          <p className="text-sm text-zinc-500">
            Sign in or create an account to continue
          </p>
        </div>

        {needsVerification && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3.5"
            initial={{ opacity: 0, y: -8 }}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/[0.06]">
              <MailIcon className="size-4 text-amber-300" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div>
                <p className="font-medium text-sm text-zinc-100">
                  Verify your email
                </p>
                <p className="text-xs text-zinc-500">
                  Check your inbox for the verification link.
                </p>
              </div>
              <button
                className="font-medium text-amber-300 text-xs underline-offset-4 hover:underline disabled:opacity-50"
                disabled={resending}
                onClick={handleResendVerification}
                type="button"
              >
                {resending ? "Sending..." : "Resend email →"}
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          <PrimaryOAuthButton
            isLastUsed={lastMethod === primary}
            loading={isPrimaryLoading}
            onClick={() => handleSocial(primary)}
            provider={primary}
          />
          <SecondaryOAuthButton
            isLastUsed={lastMethod === secondary}
            loading={isSecondaryLoading}
            onClick={() => handleSocial(secondary)}
            provider={secondary}
          />
        </div>

        <div className="relative flex items-center">
          <div className="flex-1 border-white/[0.06] border-t" />
          <span
            className={
              showOptions
                ? "mx-3 font-medium text-[10px] text-zinc-600 uppercase tracking-[0.2em]"
                : "mx-3 text-xs text-zinc-600"
            }
          >
            {showOptions ? "Or with email" : "or"}
          </span>
          <div className="flex-1 border-white/[0.06] border-t" />
        </div>

        <button
          className="group flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] font-medium text-sm text-zinc-300 transition-all hover:bg-white/[0.06] hover:text-white active:scale-[0.98]"
          onClick={() => setShowOptions((v) => !v)}
          type="button"
        >
          {showOptions ? "Hide other options" : "Show other options"}
          <ChevronDownIcon
            className={`size-3.5 transition-transform ${showOptions ? "rotate-180" : "group-hover:translate-y-0.5"}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {showOptions && (
            <motion.div
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-5 overflow-hidden"
              exit={{ opacity: 0, height: 0 }}
              initial={{ opacity: 0, height: 0 }}
              key="options"
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <form className="space-y-3.5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label
                    className="ml-0.5 text-xs text-zinc-400"
                    htmlFor="email"
                  >
                    Email address
                  </Label>
                  <Input
                    autoComplete="email"
                    className="h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-100 placeholder:text-zinc-600 focus:border-white/40 focus:ring-1 focus:ring-white/10"
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      className="ml-0.5 text-xs text-zinc-400"
                      htmlFor="password"
                    >
                      Password
                    </Label>
                    <button
                      className="cursor-pointer text-[11px] text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline"
                      onClick={() =>
                        toast("Password reset coming soon", {
                          description:
                            "Reach out to support@motiq.com for now.",
                        })
                      }
                      type="button"
                    >
                      Forgot?
                    </button>
                  </div>
                  <Input
                    autoComplete="current-password"
                    className="h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-100 placeholder:text-zinc-600 focus:border-white/40 focus:ring-1 focus:ring-white/10"
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    type="password"
                    value={password}
                  />
                </div>
                <Button
                  className="h-11 w-full cursor-pointer rounded-lg bg-white font-medium text-black text-sm transition-all hover:bg-white/90 active:scale-[0.98]"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Signing in..." : "Sign in with email"}
                </Button>
              </form>

              <p className="text-center text-xs text-zinc-500">
                Don't have an account?{" "}
                <Link
                  className="font-medium text-white underline-offset-4 transition-opacity hover:underline hover:opacity-90"
                  to="/signup"
                >
                  Create one
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  )
}

function PrimaryOAuthButton({
  provider,
  loading,
  isLastUsed,
  onClick,
}: {
  provider: Provider
  loading: boolean
  isLastUsed: boolean
  onClick: () => void
}) {
  const label = provider === "google" ? "Google" : "GitHub"
  return (
    <button
      className="group relative flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-white/[0.1] bg-white/[0.04] text-sm text-white transition-all hover:bg-white/[0.07] active:scale-[0.99] disabled:opacity-50"
      disabled={loading}
      onClick={onClick}
      type="button"
    >
      {provider === "google" ? <GoogleIcon /> : <GitHubIcon />}
      <span className="font-medium">
        {loading ? "Redirecting..." : `Continue with ${label}`}
      </span>
      {isLastUsed && !loading && (
        <span className="absolute right-3 text-[11px] text-zinc-500">
          Last used
        </span>
      )}
    </button>
  )
}

function SecondaryOAuthButton({
  provider,
  loading,
  isLastUsed,
  onClick,
}: {
  provider: Provider
  loading: boolean
  isLastUsed: boolean
  onClick: () => void
}) {
  const label = provider === "google" ? "Google" : "GitHub"
  return (
    <button
      className="group relative flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-white/[0.1] bg-white/[0.04] text-sm text-white transition-all hover:bg-white/[0.07] active:scale-[0.99] disabled:opacity-50"
      disabled={loading}
      onClick={onClick}
      type="button"
    >
      {provider === "google" ? <GoogleIcon /> : <GitHubIcon />}
      <span className="font-medium">
        {loading ? "Redirecting..." : `Continue with ${label}`}
      </span>
      {isLastUsed && !loading && (
        <span className="absolute right-3 text-[11px] text-zinc-500">
          Last used
        </span>
      )}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <title>Google</title>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <title>GitHub</title>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}
