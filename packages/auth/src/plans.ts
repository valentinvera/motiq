export const billingPlans = [
  {
    slug: "starter",
    name: "Starter",
    description: "For small teams validating Slack-sourced customer signals.",
    price: "$299",
    period: "/mo",
    checkout: true,
    recommended: false,
    limits: {
      slackMessagesPerMonth: 10_000,
      slackWorkspaces: 1,
    },
    features: [
      "10k Slack messages analyzed per month",
      "1 Slack workspace",
      "Triage + risk detection agents",
      "Critical Slack alerts",
      "Weekly intelligence summary",
      "Email support",
    ],
  },
  {
    slug: "growth",
    name: "Growth",
    description: "For teams that need higher volume and coordinated response.",
    price: "$799",
    period: "/mo",
    checkout: true,
    recommended: true,
    limits: {
      slackMessagesPerMonth: 100_000,
      slackWorkspaces: 1,
    },
    features: [
      "100k Slack messages analyzed per month",
      "Multiple Slack channels",
      "All monitoring agents",
      "Custom alert rules",
      "Team mentions and routing",
      "Priority support",
    ],
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "For larger organizations with custom volume and controls.",
    price: "Custom",
    period: "",
    checkout: false,
    recommended: false,
    limits: {
      slackMessagesPerMonth: null,
      slackWorkspaces: null,
    },
    features: [
      "Custom message volume",
      "Multiple workspaces",
      "Custom detection rules",
      "Dedicated onboarding",
      "SLA and security review",
      "Success manager",
    ],
  },
] as const

export type BillingPlan = (typeof billingPlans)[number]
export type BillingPlanSlug = BillingPlan["slug"]
export type CheckoutPlanSlug = Extract<BillingPlan, { checkout: true }>["slug"]
