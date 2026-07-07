import type { AppRouter } from "@motiq/trpc/routers"
import { Button } from "@motiq/ui/components/button"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server"
import { CheckIcon, ShieldCheckIcon, XIcon } from "lucide-react"
import { useEffect } from "react"
import { toast } from "sonner"
import { useTRPC, useTRPCClient } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/autonomy")({
  head: () => ({
    meta: [{ title: "Autonomy | Motiq" }],
  }),
  component: AutonomyPage,
})

type AutonomyLevel =
  inferRouterInputs<AppRouter>["autonomy"]["updateRule"]["autonomyLevel"]
type UpdateRuleInput = inferRouterInputs<AppRouter>["autonomy"]["updateRule"]
type ActionQueueItem =
  inferRouterOutputs<AppRouter>["autonomy"]["getActionQueue"][number]

const autonomyLevels = ["observe", "suggest", "auto"] satisfies AutonomyLevel[]

function AutonomyPage() {
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()

  const rules = useQuery(trpc.autonomy.getRules.queryOptions())
  const actions = useQuery(
    trpc.autonomy.getActionQueue.queryOptions({ limit: 50 })
  )

  const updateRule = useMutation({
    mutationFn: (data: UpdateRuleInput) =>
      trpcClient.autonomy.updateRule.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.autonomy.getRules.queryKey(),
      })
      toast.success("Autonomy rule updated")
    },
  })

  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse`,
      {
        withCredentials: true,
      }
    )

    const invalidateActions = () => {
      queryClient.invalidateQueries({
        queryKey: trpc.autonomy.getActionQueue.queryKey(),
      })
    }

    eventSource.addEventListener("action:proposed", invalidateActions)

    return () => eventSource.close()
  }, [queryClient, trpc])

  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-12">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-3 font-medium text-3xl text-white tracking-tighter">
          <ShieldCheckIcon className="size-6 text-white" />
          Autonomy
        </h1>
        <p className="text-sm text-zinc-500">
          Configure agent autonomy levels and approve pending actions
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-medium text-lg text-white tracking-tight">
          Action Queue
        </h2>
        {actions.data?.length ? (
          <div className="grid gap-4">
            {actions.data.map((action) => (
              <ActionCard action={action} key={action.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.08] border-dashed p-12 text-center">
            <p className="text-sm text-zinc-500">
              No pending actions to review
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-medium text-lg text-white tracking-tight">
          Autonomy Rules
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rules.data?.map((rule) => (
            <div
              className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"
              key={rule.id}
            >
              <h3 className="font-medium text-zinc-300 capitalize">
                {rule.actionType.replace("_", " ")}
              </h3>
              <div className="flex rounded-lg bg-white/[0.04] p-1">
                {autonomyLevels.map((level) => (
                  <button
                    className={`flex-1 cursor-pointer rounded-md py-1.5 font-medium text-xs capitalize transition-colors disabled:cursor-not-allowed ${
                      rule.autonomyLevel === level
                        ? "bg-white/10 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                    disabled={updateRule.isPending}
                    key={level}
                    onClick={() =>
                      updateRule.mutate({
                        id: rule.id,
                        autonomyLevel: level,
                      })
                    }
                    type="button"
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ActionCard({ action }: { action: ActionQueueItem }) {
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const approve = useMutation({
    mutationFn: () =>
      trpcClient.autonomy.approveAction.mutate({ id: action.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.autonomy.getActionQueue.queryKey(),
      })
      queryClient.invalidateQueries({ queryKey: trpc.alert.list.queryKey() })
      queryClient.invalidateQueries({
        queryKey: trpc.alert.getUnacknowledgedCount.queryKey(),
      })
      toast.success("Action approved")
    },
  })

  const reject = useMutation({
    mutationFn: () =>
      trpcClient.autonomy.rejectAction.mutate({ id: action.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.autonomy.getActionQueue.queryKey(),
      })
      queryClient.invalidateQueries({ queryKey: trpc.alert.list.queryKey() })
      queryClient.invalidateQueries({
        queryKey: trpc.alert.getUnacknowledgedCount.queryKey(),
      })
      toast.success("Action rejected")
    },
  })

  return (
    <div className="flex items-center justify-between gap-6 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-medium text-[10px] text-zinc-500 capitalize">
            {action.actionType}
          </span>
          <span className="font-medium text-sm text-zinc-200">
            {action.title ?? "Proposed Action"}
          </span>
        </div>
        <p className="text-sm text-zinc-400">
          {action.description ?? "Awaiting approval to execute"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          className="h-8 cursor-pointer gap-1.5 border-red-500/20 bg-red-500/[0.08] font-medium text-red-400 transition-colors hover:bg-red-500/[0.14] hover:text-red-300 disabled:cursor-not-allowed"
          disabled={reject.isPending || approve.isPending}
          onClick={() => reject.mutate()}
          size="sm"
          variant="outline"
        >
          <XIcon className="size-3.5" />
          Reject
        </Button>
        <Button
          className="h-8 cursor-pointer gap-1.5 bg-white font-medium text-black hover:bg-white/90 disabled:cursor-not-allowed"
          disabled={approve.isPending || reject.isPending}
          onClick={() => approve.mutate()}
          size="sm"
        >
          <CheckIcon className="size-3.5" />
          Approve
        </Button>
      </div>
    </div>
  )
}
