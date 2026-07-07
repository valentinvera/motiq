import { DiscordIcon } from "@motiq/ui/icons/discord"
import { GmailIcon } from "@motiq/ui/icons/gmail"
import { JiraIcon } from "@motiq/ui/icons/jira"
import { LinearIcon } from "@motiq/ui/icons/linear"
import { NotionIcon } from "@motiq/ui/icons/notion"
import { PolarIcon } from "@motiq/ui/icons/polar"
import { SlackIcon } from "@motiq/ui/icons/slack"
import { TelegramIcon } from "@motiq/ui/icons/telegram"
import type { IconProps } from "@motiq/ui/icons/types"
import { ZendeskIcon } from "@motiq/ui/icons/zendesk"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { CheckIcon, PlugIcon, SearchIcon } from "lucide-react"
import { type ComponentType, type ReactNode, useState } from "react"
import { toast } from "sonner"
import {
  OnboardingLayout,
  OnboardingNextButton,
  OnboardingPreviousLink,
  OnboardingSkipLink,
} from "@/components/app/onboarding-layout"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/onboarding/apps")({
  head: () => ({
    meta: [{ title: "Apps | Motiq" }],
  }),
  component: AppsStep,
})

const TOTAL_STEPS = 4

type AppType =
  | "telegram"
  | "gmail"
  | "polar"
  | "notion"
  | "discord"
  | "slack"
  | "zendesk"
  | "jira"
  | "linear"

interface AppDef {
  type: AppType
  name: string
  description: string
  Icon: ComponentType<IconProps>
  accent: string
  available: boolean
  beta?: boolean
}

const APPS: AppDef[] = [
  {
    type: "slack",
    name: "Slack",
    description: "Capture feedback from selected channels.",
    Icon: SlackIcon,
    accent: "",
    available: true,
    beta: true,
  },
  {
    type: "telegram",
    name: "Telegram",
    description: "Pull customer messages from groups and DMs.",
    Icon: TelegramIcon,
    accent: "",
    available: false,
  },
  {
    type: "gmail",
    name: "Gmail",
    description: "Forward feedback emails into Motiq.",
    Icon: GmailIcon,
    accent: "",
    available: false,
  },
  {
    type: "polar",
    name: "Polar",
    description: "Tie revenue and customer tier to signals.",
    Icon: PolarIcon,
    accent: "text-white",
    available: false,
  },
  {
    type: "notion",
    name: "Notion",
    description: "Sync product docs and feedback databases.",
    Icon: NotionIcon,
    accent: "text-zinc-200",
    available: false,
  },
  {
    type: "discord",
    name: "Discord",
    description: "Listen to community channels for signals.",
    Icon: DiscordIcon,
    accent: "text-[#5865F2]",
    available: false,
  },
  {
    type: "zendesk",
    name: "Zendesk",
    description: "Pull tickets and customer conversations.",
    Icon: ZendeskIcon,
    accent: "text-white",
    available: false,
  },
  {
    type: "jira",
    name: "Jira",
    description: "Connect issues to product signals.",
    Icon: JiraIcon,
    accent: "",
    available: false,
  },
  {
    type: "linear",
    name: "Linear",
    description: "Sync issues, projects, and triage state.",
    Icon: LinearIcon,
    accent: "",
    available: false,
  },
]

type Tab = "all" | "installed"

function AppsStep() {
  const { auth } = Route.useRouteContext()
  const navigate = useNavigate()
  const trpc = useTRPC()
  const [tab, setTab] = useState<Tab>("all")
  const [query, setQuery] = useState("")
  const [pendingType, setPendingType] = useState<AppType | null>(null)

  const list = useQuery(trpc.apps.list.queryOptions())
  const connectedTypes = new Set(
    (list.data ?? [])
      .filter((i) => i.status === "active")
      .map((i) => i.type as AppType)
  )

  const startOAuth = useMutation(
    trpc.apps.getOAuthUrl.mutationOptions({
      onSuccess: (data) => {
        window.location.href = data.url
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to start connection")
        setPendingType(null)
      },
    })
  )

  function handleConnect(def: AppDef) {
    if (!def.available) {
      toast.info(`${def.name} — coming soon`)
      return
    }
    if (def.type === "slack") {
      setPendingType("slack")
      startOAuth.mutate({ type: "slack", from: "onboarding" })
    }
  }

  const filtered = APPS.filter((def) => {
    if (tab === "installed" && !connectedTypes.has(def.type)) {
      return false
    }
    const q = query.trim().toLowerCase()
    if (
      q &&
      !def.name.toLowerCase().includes(q) &&
      !def.description.toLowerCase().includes(q)
    ) {
      return false
    }
    return true
  })

  return (
    <OnboardingLayout
      description="Motiq listens to wherever your customers talk. You can connect more later."
      nextSlot={
        <OnboardingNextButton
          disabled={connectedTypes.size === 0}
          label="Continue"
          onClick={() => navigate({ to: "/onboarding/ready" })}
        />
      }
      preview={<AppsPreview connected={connectedTypes} />}
      previousSlot={<OnboardingPreviousLink to="/onboarding/team" />}
      skipSlot={<OnboardingSkipLink to="/onboarding/ready" />}
      step={3}
      title="Connect your sources"
      totalSteps={TOTAL_STEPS}
      user={auth.user}
    >
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-white/[0.06] bg-white/[0.015] p-0.5">
            <TabButton active={tab === "all"} onClick={() => setTab("all")}>
              All
            </TabButton>
            <TabButton
              active={tab === "installed"}
              onClick={() => setTab("installed")}
            >
              Installed
            </TabButton>
          </div>
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              className="h-8 w-full rounded-md border border-white/[0.06] bg-white/[0.015] pr-2.5 pl-8 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-white/15 focus:bg-white/[0.03] focus:outline-none"
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${APPS.length} apps`}
              type="text"
              value={query}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-white/[0.04] border-dashed bg-white/[0.01] py-8 text-center text-xs text-zinc-500">
            No apps match your search.
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04] overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.015]">
            {filtered.map((def) => (
              <AppRow
                connected={connectedTypes.has(def.type)}
                def={def}
                key={def.type}
                loading={pendingType === def.type && startOAuth.isPending}
                onConnect={() => handleConnect(def)}
              />
            ))}
          </ul>
        )}
      </div>
    </OnboardingLayout>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      className={`inline-flex h-7 cursor-pointer items-center rounded-[5px] px-2.5 font-medium text-[11px] transition-colors ${
        active
          ? "bg-white/[0.06] text-zinc-100"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function StatusBadge({ def, connected }: { def: AppDef; connected: boolean }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-500/20 bg-emerald-500/[0.06] px-1.5 py-0.5 font-medium text-[9px] text-emerald-400 uppercase tracking-wide">
        <CheckIcon className="size-2.5" />
        On
      </span>
    )
  }
  if (def.beta) {
    return (
      <span className="rounded-sm border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 font-medium text-[9px] text-zinc-400 uppercase tracking-wide">
        Beta
      </span>
    )
  }
  if (!def.available) {
    return (
      <span className="rounded-sm border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 font-medium text-[9px] text-zinc-500 uppercase tracking-wide">
        Soon
      </span>
    )
  }
  return null
}

function ConnectButtonContent({
  connected,
  loading,
}: {
  connected: boolean
  loading: boolean
}) {
  if (connected) {
    return (
      <>
        <CheckIcon className="size-3" />
        Connected
      </>
    )
  }
  if (loading) {
    return "..."
  }
  return "Connect"
}

function AppRow({
  def,
  connected,
  loading,
  onConnect,
}: {
  def: AppDef
  connected: boolean
  loading: boolean
  onConnect: () => void
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.02]">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-zinc-950">
        <def.Icon className={`size-3.5 ${def.accent}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-[13px] text-zinc-100">
            {def.name}
          </span>
          <StatusBadge connected={connected} def={def} />
        </div>
        <p className="truncate text-[11px] text-zinc-500">{def.description}</p>
      </div>
      <button
        className="inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 font-medium text-[11px] text-zinc-200 transition-colors hover:border-white/15 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/[0.08] disabled:hover:bg-white/[0.04]"
        disabled={connected || !def.available || loading}
        onClick={onConnect}
        type="button"
      >
        <ConnectButtonContent connected={connected} loading={loading} />
      </button>
    </li>
  )
}

function AppsPreview({ connected }: { connected: Set<AppType> }) {
  const connectedCount = connected.size

  return (
    <div className="rounded-xl border border-white/[0.06] bg-zinc-950/80 p-5 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlugIcon className="size-3.5 text-zinc-500" />
          <p className="font-medium text-sm text-zinc-200">Sources</p>
        </div>
        <span className="text-[11px] text-zinc-600">
          {connectedCount} of {APPS.length} connected
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {APPS.map((def) => {
          const isOn = connected.has(def.type)
          return (
            <div
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 transition-colors ${
                isOn
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : "border-white/[0.04] bg-white/[0.015]"
              }`}
              key={def.type}
            >
              <div
                className={`flex size-5 shrink-0 items-center justify-center rounded-sm bg-zinc-950 ${
                  isOn ? "" : "opacity-50"
                }`}
              >
                <def.Icon className={`size-2.5 ${def.accent}`} />
              </div>
              <span
                className={`flex-1 truncate text-[10px] ${
                  isOn ? "text-zinc-200" : "text-zinc-600"
                }`}
              >
                {def.name}
              </span>
              {isOn ? (
                <CheckIcon className="size-2.5 shrink-0 text-emerald-400" />
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-4 h-px bg-white/[0.04]" />
      <p className="mt-3 text-[10px] text-zinc-600">
        90-day backfill begins after first connection.
      </p>
    </div>
  )
}
