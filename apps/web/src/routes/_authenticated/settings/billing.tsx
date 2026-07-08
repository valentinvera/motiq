import { billingPlans, type CheckoutPlanSlug } from "@motiq/auth/plans"
import { Button } from "@motiq/ui/components/button"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { CheckIcon, CreditCardIcon, MailIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { SettingsCard } from "@/components/app/settings-card"
import { getPayment } from "@/functions/get-payment"
import { authClient } from "@/lib/auth-client"
import { formatBillingDate, getActiveBillingPlan } from "@/lib/billing"
import { usePermission } from "@/lib/permissions"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/settings/billing")({
  head: () => ({
    meta: [{ title: "Billing | Motiq" }],
  }),
  component: BillingTab,
})

function BillingTab() {
  const trpc = useTRPC()
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const canManageBilling = usePermission("billing", "manage")
  const activeWorkspace = useQuery(trpc.workspace.getActive.queryOptions())
  const payment = useQuery({
    queryFn: () => getPayment(),
    queryKey: ["payment-state"],
  })
  const activePlan = getActiveBillingPlan(payment.data)
  const loading = pendingAction !== null

  async function handleOpenPortal() {
    setPendingAction("portal")
    try {
      const result = await authClient.customer.portal()
      if (result.data?.url) {
        window.open(result.data.url, "_blank")
      } else {
        toast.error("Unable to open billing portal")
      }
    } catch {
      toast.error("Failed to open billing portal")
    } finally {
      setPendingAction(null)
    }
  }

  async function handleCheckout(slug: CheckoutPlanSlug) {
    if (!activeWorkspace.data?.id) {
      toast.error("Select a workspace before starting checkout")
      return
    }

    setPendingAction(slug)
    try {
      await authClient.checkout({
        slug,
        referenceId: activeWorkspace.data.id,
        metadata: {
          organizationId: activeWorkspace.data.id,
          plan: slug,
        },
      })
    } catch {
      toast.error("Failed to start checkout")
      setPendingAction(null)
    }
  }

  function handleContactSales() {
    window.location.href =
      "mailto:hello@motiq.app?subject=Enterprise%20plan%20for%20Motiq"
  }

  function getCheckoutButtonLabel(plan: { name: string; slug: string }) {
    if (pendingAction === plan.slug) {
      return "Starting checkout..."
    }

    if (activePlan?.plan.slug === plan.slug) {
      return "Current plan"
    }

    return `Choose ${plan.name}`
  }

  if (!canManageBilling) {
    return (
      <SettingsCard
        description="Only workspace owners and admins can manage billing, payment methods, and invoices."
        footerNote="Ask an owner or admin if you need billing access."
        title="Subscription & Billing"
      />
    )
  }

  return (
    <SettingsCard
      description="Choose the Motiq plan that matches your Slack signal volume and response workflow."
      footerAction={
        <div className="flex items-center gap-2">
          <Button
            className="h-8 cursor-pointer rounded-md border-white/[0.08] bg-white/[0.04] px-3 font-medium text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
            disabled={loading}
            onClick={handleOpenPortal}
            size="sm"
            variant="outline"
          >
            <CreditCardIcon className="mr-1.5 size-3.5" />
            Manage
          </Button>
        </div>
      }
      footerNote="Checkout and subscription management are powered by Polar."
      title="Subscription & Billing"
    >
      <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-sm text-zinc-100">
              Current plan: {activePlan?.plan.name ?? "No active plan"}
            </p>
            <p className="mt-1 text-[12px] text-zinc-500">
              {activePlan
                ? `Renews ${formatBillingDate(activePlan.subscription.currentPeriodEnd)}`
                : "Choose a plan to activate billing for this workspace."}
            </p>
          </div>
          <span
            className={`w-fit rounded-full border px-2 py-1 font-medium text-[11px] ${
              activePlan
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-white/[0.08] bg-white/[0.04] text-zinc-500"
            }`}
          >
            {activePlan ? "Active" : "Free"}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {billingPlans.map((plan) => (
          <div
            className={`flex min-h-[360px] flex-col rounded-lg border p-4 ${
              plan.recommended
                ? "border-white/20 bg-white/[0.05]"
                : "border-white/[0.08] bg-white/[0.02]"
            }`}
            key={plan.slug}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-sm text-zinc-100">{plan.name}</p>
                <p className="mt-1 min-h-10 text-[12px] text-zinc-500 leading-relaxed">
                  {plan.description}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-end gap-1">
              <span className="font-medium text-3xl text-white tracking-tight">
                {plan.price}
              </span>
              {plan.period ? (
                <span className="pb-1 text-[12px] text-zinc-500">
                  {plan.period}
                </span>
              ) : null}
            </div>

            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li
                  className="flex items-start gap-2 text-[12px] text-zinc-300"
                  key={feature}
                >
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/8 text-zinc-400">
                    <CheckIcon className="size-2.5" />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {plan.checkout ? (
              <Button
                className={`mt-5 h-9 cursor-pointer rounded-md font-medium text-xs ${
                  plan.recommended
                    ? "bg-white text-black hover:bg-white/90"
                    : "border-white/[0.08] bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
                }`}
                disabled={loading || activePlan?.plan.slug === plan.slug}
                onClick={() => handleCheckout(plan.slug)}
                size="sm"
                variant={plan.recommended ? "default" : "outline"}
              >
                {getCheckoutButtonLabel(plan)}
              </Button>
            ) : (
              <Button
                className="mt-5 h-9 cursor-pointer rounded-md border-white/[0.08] bg-white/[0.04] font-medium text-xs text-zinc-200 hover:bg-white/[0.08]"
                disabled={loading}
                onClick={handleContactSales}
                size="sm"
                variant="outline"
              >
                <MailIcon className="mr-1.5 size-3.5" />
                Contact sales
              </Button>
            )}
          </div>
        ))}
      </div>
    </SettingsCard>
  )
}
