import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  ActivityIcon,
  CheckIcon,
  LightbulbIcon,
  RadioIcon,
  SparklesIcon,
  TrendingDownIcon,
} from "lucide-react"
import {
  OnboardingLayout,
  OnboardingNextButton,
  OnboardingPreviousLink,
} from "@/components/app/onboarding-layout"
import { endOnboardingFlow } from "@/lib/onboarding-flow"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/onboarding/ready")({
  head: () => ({
    meta: [{ title: "Ready | Motiq" }],
  }),
  component: ReadyStep,
})

const TOTAL_STEPS = 4

function ReadyStep() {
  const { auth } = Route.useRouteContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const list = useQuery(trpc.apps.list.queryOptions())

  const connectedCount =
    list.data?.filter((i) => i.status === "active").length ?? 0

  async function handleFinish() {
    endOnboardingFlow()
    await queryClient.invalidateQueries({
      queryKey: trpc.workspace.getActive.queryOptions().queryKey,
    })
    navigate({ to: "/overview" })
  }

  return (
    <OnboardingLayout
      description={
        connectedCount > 0
          ? "Your sources are syncing. The first 90 days of history are scanning in the background."
          : "You can connect sources anytime from Apps. Until then, Motiq is ready and waiting."
      }
      nextSlot={
        <OnboardingNextButton label="Go to overview" onClick={handleFinish} />
      }
      preview={<ReadyPreview connectedCount={connectedCount} />}
      previousSlot={<OnboardingPreviousLink to="/onboarding/apps" />}
      step={4}
      title="You're all set"
      totalSteps={TOTAL_STEPS}
      user={auth.user}
    >
      <div className="space-y-2.5">
        {[
          {
            Icon: RadioIcon,
            title: "Triage agent online",
            body: "Every signal is classified, scored and routed in real time.",
          },
          {
            Icon: SparklesIcon,
            title: "Pattern agent ready",
            body: "Detects spikes and clusters across the last 24 hours of signals.",
          },
          {
            Icon: TrendingDownIcon,
            title: "Risk agent watching",
            body: "Flags churn risks per customer over the last 7 days.",
          },
          {
            Icon: LightbulbIcon,
            title: "Intelligence agent active",
            body: "Synthesizes signals into product gaps, threats and opportunities.",
          },
        ].map((row) => (
          <div
            className="flex items-start gap-3 rounded-lg border border-white/6 bg-white/1.5 p-3"
            key={row.title}
          >
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-white/6 bg-zinc-950">
              <row.Icon className="size-3.5 text-zinc-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-zinc-100">{row.title}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {row.body}
              </p>
            </div>
            <CheckIcon className="mt-1 size-4 shrink-0 text-emerald-400" />
          </div>
        ))}
      </div>
    </OnboardingLayout>
  )
}

function ReadyPreview({ connectedCount }: { connectedCount: number }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/6 bg-zinc-950/80 p-5 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm text-zinc-200">Overview</p>
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/6 px-1.5 py-0.5 font-medium text-[10px] text-emerald-400">
            <span className="size-1 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Signals", value: "—" },
            { label: "Sources", value: connectedCount.toString() },
            { label: "Alerts", value: "0" },
          ].map((stat) => (
            <div
              className="rounded-md border border-white/4 bg-white/1.5 p-2.5"
              key={stat.label}
            >
              <p className="text-[10px] text-zinc-600 uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="mt-0.5 font-medium text-lg text-zinc-100 tabular-nums">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 h-px bg-white/4" />

        <div className="mt-3 space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div className="flex items-center gap-2" key={i}>
              <ActivityIcon className="size-3 text-zinc-600" />
              <div className="h-1.5 flex-1 rounded-full bg-white/4">
                <div
                  className="h-full rounded-full bg-white/15"
                  style={{ width: `${100 - i * 22}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="px-1 text-center text-[11px] text-zinc-600">
        Motiq comes to you — no dashboard to babysit.
      </p>
    </div>
  )
}
