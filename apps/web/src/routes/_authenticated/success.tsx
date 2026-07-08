import { Button } from "@motiq/ui/components/button"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react"
import { getPayment } from "@/functions/get-payment"
import { formatBillingDate, getActiveBillingPlan } from "@/lib/billing"

export const Route = createFileRoute("/_authenticated/success")({
  head: () => ({
    meta: [{ title: "Plan confirmed | Motiq" }],
  }),
  validateSearch: (search): { checkout_id?: string } =>
    typeof search.checkout_id === "string"
      ? { checkout_id: search.checkout_id }
      : {},
  component: SuccessPage,
})

function SuccessPage() {
  const { checkout_id: checkoutId } = Route.useSearch()
  const payment = useQuery({
    queryFn: () => getPayment(),
    queryKey: ["payment-state", checkoutId],
    refetchInterval: (query) =>
      getActiveBillingPlan(query.state.data) ? false : 2500,
  })
  const activePlan = getActiveBillingPlan(payment.data)

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center px-6 py-10">
      <section className="w-full overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025] shadow-2xl shadow-black/40">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border-white/[0.06] border-b p-8 lg:border-r lg:border-b-0">
            <div className="flex size-11 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              {activePlan ? (
                <CheckCircle2Icon className="size-5" />
              ) : (
                <Loader2Icon className="size-5 animate-spin" />
              )}
            </div>

            <p className="mt-7 font-medium text-emerald-300 text-sm">
              {activePlan ? "Checkout confirmed" : "Finalizing checkout"}
            </p>
            <h1 className="mt-3 max-w-2xl font-medium text-3xl text-white tracking-tight md:text-4xl">
              {activePlan
                ? `${activePlan.plan.name} is active for your workspace.`
                : "Your payment is being confirmed."}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] text-zinc-400 leading-7">
              {activePlan
                ? "Motiq now reflects your subscription from Polar. You can return to your overview or manage billing from settings."
                : "Polar is still syncing the subscription state. This usually takes a few seconds; the page will refresh the plan automatically."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-10 cursor-pointer rounded-md bg-white px-4 font-medium text-black text-sm hover:bg-white/90"
              >
                <Link to="/overview">
                  Go to overview
                  <ArrowRightIcon className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="h-10 cursor-pointer rounded-md border-white/[0.08] bg-white/[0.04] px-4 font-medium text-sm text-zinc-200 hover:bg-white/[0.08]"
                variant="outline"
              >
                <Link to="/settings/billing">
                  <CreditCardIcon className="mr-2 size-4" />
                  Manage billing
                </Link>
              </Button>
            </div>
          </div>

          <aside className="bg-black/20 p-8">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <SparklesIcon className="size-3.5" />
              Subscription
            </div>

            <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/30 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-lg text-white">
                    {activePlan?.plan.name ?? "Processing"}
                  </p>
                  <p className="mt-1 text-[13px] text-zinc-500">
                    {activePlan?.plan.description ??
                      "Waiting for Polar to return your active plan."}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 font-medium text-[11px] text-emerald-300">
                  {activePlan ? "Active" : "Pending"}
                </span>
              </div>

              <div className="mt-6 grid gap-3 text-[13px]">
                <div className="flex items-center justify-between border-white/[0.06] border-t pt-3">
                  <span className="text-zinc-500">Price</span>
                  <span className="font-medium text-zinc-200">
                    {activePlan
                      ? `${activePlan.plan.price}${activePlan.plan.period}`
                      : "Syncing"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-white/[0.06] border-t pt-3">
                  <span className="text-zinc-500">Renews</span>
                  <span className="font-medium text-zinc-200">
                    {activePlan
                      ? formatBillingDate(
                          activePlan.subscription.currentPeriodEnd
                        )
                      : "Syncing"}
                  </span>
                </div>
                {checkoutId ? (
                  <div className="flex items-center justify-between border-white/[0.06] border-t pt-3">
                    <span className="text-zinc-500">Checkout</span>
                    <span className="max-w-40 truncate font-medium text-zinc-400">
                      {checkoutId}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="font-medium text-sm text-zinc-200">
                Your profile billing status now comes from Polar.
              </p>
              <p className="mt-1.5 text-[12px] text-zinc-500 leading-5">
                If you upgrade, cancel, or change payment details later, Motiq
                will read the latest active subscription from Polar.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
