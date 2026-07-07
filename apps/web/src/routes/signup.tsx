import { Button } from "@motiq/ui/components/button"
import { Input } from "@motiq/ui/components/input"
import { Label } from "@motiq/ui/components/label"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { CheckIcon, ChevronDownIcon, MailIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { toast } from "sonner"
import { AuthLayout } from "@/components/app/auth-layout"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/signup")({
  beforeLoad: ({ context }) => {
    if (context.auth) {
      throw redirect({ to: "/overview" })
    }
  },
  head: () => ({
    meta: [{ title: "Sign Up | Motiq" }],
  }),
  component: SignupPage,
})

type Provider = "google" | "github"

function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)
  const [resending, setResending] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

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

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    })

    if (error) {
      toast.error(error.message ?? "Failed to create account")
      setLoading(false)
      return
    }

    setLoading(false)
    setCheckEmail(true)
  }

  async function handleResend() {
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

  if (checkEmail) {
    return (
      <AuthLayout>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-7"
          initial={{ opacity: 0, y: 8 }}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative flex size-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05]">
              <MailIcon className="size-6 text-emerald-300" />
              <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border border-emerald-400/30 bg-zinc-950">
                <CheckIcon className="size-3 text-emerald-300" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="font-medium text-2xl text-white tracking-tighter">
                Check your inbox
              </h1>
              <p className="text-sm text-zinc-500">
                Almost there — one more step to verify
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              Verification sent to
            </p>
            <p className="break-all font-medium text-sm text-white">{email}</p>
            <div className="border-white/[0.04] border-t pt-3">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Click the link in the email to verify your account. You'll be
                signed in and routed automatically.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-zinc-300 transition-all hover:bg-white/[0.06] hover:text-white"
              disabled={resending}
              onClick={handleResend}
              variant="outline"
            >
              {resending ? "Sending..." : "Resend verification email"}
            </Button>
            <p className="text-center text-xs text-zinc-600">
              Didn't receive it? Check spam or{" "}
              <button
                className="text-zinc-400 underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-zinc-200"
                onClick={() => setCheckEmail(false)}
                type="button"
              >
                try a different email
              </button>
            </p>
          </div>
        </motion.div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl text-white tracking-tighter lg:text-[32px]">
            Create your workspace
          </h1>
          <p className="text-sm text-zinc-500">
            Start triaging customer signals in minutes
          </p>
        </div>

        <div className="space-y-3">
          <PrimaryOAuthButton
            loading={googleLoading}
            onClick={() => handleSocial("google")}
            provider="google"
          />
          <SecondaryOAuthButton
            loading={githubLoading}
            onClick={() => handleSocial("github")}
            provider="github"
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
                    htmlFor="name"
                  >
                    Full name
                  </Label>
                  <Input
                    autoComplete="name"
                    className="h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-100 placeholder:text-zinc-600 focus:border-white/40 focus:ring-1 focus:ring-white/10"
                    id="name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    type="text"
                    value={name}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    className="ml-0.5 text-xs text-zinc-400"
                    htmlFor="email"
                  >
                    Work email
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
                  <Label
                    className="ml-0.5 text-xs text-zinc-400"
                    htmlFor="password"
                  >
                    Password
                  </Label>
                  <Input
                    autoComplete="new-password"
                    className="h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-100 placeholder:text-zinc-600 focus:border-white/40 focus:ring-1 focus:ring-white/10"
                    id="password"
                    minLength={8}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
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
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <p className="text-center text-xs text-zinc-500">
                Already have an account?{" "}
                <Link
                  className="font-medium text-white underline-offset-4 transition-opacity hover:underline hover:opacity-90"
                  to="/login"
                >
                  Sign in
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
  onClick,
}: {
  provider: Provider
  loading: boolean
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
    </button>
  )
}

function SecondaryOAuthButton({
  provider,
  loading,
  onClick,
}: {
  provider: Provider
  loading: boolean
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
