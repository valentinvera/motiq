import { resolveMx } from "node:dns/promises"
import { redis } from "@motiq/cache"
import { db } from "@motiq/db"
import {
  account,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from "@motiq/db/schema/auth"
import { env } from "@motiq/env/api"
import { sendReactEmail } from "@motiq/mail/resend"
import { ChangeEmail } from "@motiq/mail/templates/change-email"
import { DeleteAccount } from "@motiq/mail/templates/delete-account"
import { InviteMember } from "@motiq/mail/templates/invite-member"
import { ResetPassword } from "@motiq/mail/templates/reset-password"
import { VerifyEmail } from "@motiq/mail/templates/verify-email"
import { checkout, polar, portal, usage } from "@polar-sh/better-auth"
import { APIError, type BetterAuthOptions, betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  lastLoginMethod,
  organization as organizationPlugin,
} from "better-auth/plugins"
import { and, eq } from "drizzle-orm"
import { polarClient } from "./lib/payments"
import { ac, roles } from "./permissions"

interface InvitationEmailPayload {
  id: string
  role: string
  email: string
  organization: { id: string; name: string; slug: string }
  inviter: { user: { name?: string | null; email: string } }
}

async function sendInvitationEmail(
  data: InvitationEmailPayload
): Promise<void> {
  const inviterName = data.inviter.user.name?.trim() || data.inviter.user.email
  await sendReactEmail({
    to: data.email,
    subject: `${inviterName} invited you to ${data.organization.name} on Motiq`,
    react: InviteMember({
      orgName: data.organization.name,
      inviterName,
      role: data.role,
      url: `${env.CORS_ORIGIN}/accept-invitation/${data.id}`,
    }),
  })
}

const isProduction = env.BETTER_AUTH_URL.startsWith("https://")
const MAX_EMAIL_LENGTH = 254
const mailDomainCache = new Map<string, boolean>()

function getCrossSubdomainCookieDomain() {
  if (!isProduction) {
    return null
  }

  const authHost = new URL(env.BETTER_AUTH_URL).hostname
  const appHost = new URL(env.CORS_ORIGIN).hostname

  if (authHost === appHost) {
    return null
  }

  if (authHost.endsWith(`.${appHost}`)) {
    return appHost
  }

  return null
}

const crossSubdomainCookieDomain = getCrossSubdomainCookieDomain()

function hasRole(role: string, targetRole: string) {
  return role
    .split(",")
    .map((value) => value.trim())
    .includes(targetRole)
}

async function domainCanReceiveMail(domain: string) {
  const cached = mailDomainCache.get(domain)
  if (cached !== undefined) {
    return cached
  }

  try {
    const records = await resolveMx(domain)
    const canReceive = records.some((record) => record.exchange.length > 0)
    mailDomainCache.set(domain, canReceive)
    return canReceive
  } catch {
    mailDomainCache.set(domain, false)
    return false
  }
}

async function assertInvitationEmailCanReceiveMail(email: string) {
  const normalized = email.trim().toLowerCase()
  const domain = normalized.split("@").at(-1)

  if (!(domain && normalized.length <= MAX_EMAIL_LENGTH)) {
    throw new APIError("BAD_REQUEST", {
      message: "Enter a valid email address.",
    })
  }

  if (!(await domainCanReceiveMail(domain))) {
    throw new APIError("BAD_REQUEST", {
      message: "Enter an email domain that can receive invitations.",
    })
  }
}

async function ensureUserCanDeleteAccount(userId: string) {
  const ownedMemberships = await db.query.member.findMany({
    columns: {
      organizationId: true,
      role: true,
    },
    where: (members, { eq }) => eq(members.userId, userId),
  })

  const ownedOrganizationIds = ownedMemberships
    .filter((membership) => hasRole(membership.role, "owner"))
    .map((membership) => membership.organizationId)

  for (const organizationId of ownedOrganizationIds) {
    const otherOwners = await db.query.member.findMany({
      columns: {
        id: true,
        role: true,
      },
      where: (members, { and, eq, ne }) =>
        and(
          eq(members.organizationId, organizationId),
          ne(members.userId, userId)
        ),
    })

    if (!otherOwners.some((membership) => hasRole(membership.role, "owner"))) {
      throw new APIError("BAD_REQUEST", {
        message:
          "Transfer ownership or delete the workspace before deleting your account.",
      })
    }
  }
}

async function getInvitationFallbackUserId({
  organizationId,
  deletingUserId,
}: {
  organizationId: string
  deletingUserId: string
}): Promise<string | null> {
  const remainingMembers = await db.query.member.findMany({
    columns: {
      userId: true,
      role: true,
    },
    where: (members, { and, eq, ne }) =>
      and(
        eq(members.organizationId, organizationId),
        ne(members.userId, deletingUserId)
      ),
  })

  const members = remainingMembers
    .map((membership) => {
      if (
        typeof membership.userId !== "string" ||
        typeof membership.role !== "string"
      ) {
        return null
      }

      return {
        role: membership.role,
        userId: membership.userId,
      }
    })
    .filter((membership): membership is { role: string; userId: string } => {
      return membership !== null
    })

  return (
    members.find((membership) => hasRole(membership.role, "owner"))?.userId ??
    members.find((membership) => hasRole(membership.role, "admin"))?.userId ??
    members[0]?.userId ??
    null
  )
}

async function cancelPendingInvitationsCreatedByUser(userId: string) {
  const pendingInvitations = await db.query.invitation.findMany({
    columns: {
      organizationId: true,
    },
    where: (invitations, { and, eq }) =>
      and(eq(invitations.inviterId, userId), eq(invitations.status, "pending")),
  })

  const organizationIdSet = new Set<string>()
  for (const invitationRecord of pendingInvitations) {
    if (typeof invitationRecord.organizationId === "string") {
      organizationIdSet.add(invitationRecord.organizationId)
    }
  }

  const organizationIds = [...organizationIdSet]

  for (const organizationId of organizationIds) {
    const fallbackUserId = await getInvitationFallbackUserId({
      organizationId,
      deletingUserId: userId,
    })

    if (!fallbackUserId) {
      continue
    }

    await db
      .update(invitation)
      .set({
        status: "canceled",
        inviterId: fallbackUserId,
      })
      .where(
        and(
          eq(invitation.inviterId, userId),
          eq(invitation.organizationId, organizationId),
          eq(invitation.status, "pending")
        )
      )
  }
}

async function getInvitationRoleForInviter({
  inviterId,
  organizationId,
  requestedRole,
}: {
  inviterId: string
  organizationId: string
  requestedRole: string
}) {
  const inviterMembers = await db.query.member.findMany({
    columns: { role: true },
    limit: 1,
    where: (members, { and, eq }) =>
      and(
        eq(members.userId, inviterId),
        eq(members.organizationId, organizationId)
      ),
  })
  const inviterRole = inviterMembers[0]?.role

  if (inviterRole === "owner") {
    return requestedRole
  }

  const requestedRoles = requestedRole
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean)

  if (requestedRoles.includes("admin")) {
    return "member"
  }

  return requestedRole
}

function withCallbackURL(url: string, path: string): string {
  const u = new URL(url)
  u.searchParams.set("callbackURL", `${env.CORS_ORIGIN}${path}`)
  return u.toString()
}

function getCheckoutProducts() {
  return [
    {
      productId: env.POLAR_STARTER_PRODUCT_ID,
      slug: "starter",
    },
    {
      productId: env.POLAR_GROWTH_PRODUCT_ID || env.POLAR_PRODUCT_ID,
      slug: "growth",
    },
  ]
}

export const auth = betterAuth<BetterAuthOptions>({
  appName: env.APP_NAME,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      account,
      session,
      user,
      verification,
      organization,
      member,
      invitation,
    },
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user: u, url }) => {
      await sendReactEmail({
        to: u.email,
        subject: "Reset your password — Motiq",
        react: ResetPassword({
          name: u.name,
          url: withCallbackURL(url, "/login"),
        }),
      })
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  secondaryStorage: {
    get: async (key: string) => {
      const value = await redis.get<string>(key)
      if (value === null || value === undefined) {
        return null
      }
      if (typeof value === "string") {
        return value
      }
      return JSON.stringify(value)
    },
    set: async (key: string, value: string, ttl?: number) => {
      if (ttl) {
        await redis.set(key, value, { ex: ttl })
      } else {
        await redis.set(key, value)
      }
    },
    delete: async (key: string) => {
      await redis.del(key)
    },
  },
  session: {
    freshAge: 300,
    expiresIn: 604_800,
    updateAge: 86_400,
    storeSessionInDatabase: true,
    preserveSessionInDatabase: true,
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },
  account: {
    accountLinking: {
      trustedProviders: ["google", "github"],
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    customRules: {
      "/sign-in/*": { window: 60, max: 10 },
      "/sign-up/*": { window: 60, max: 5 },
    },
    storage: "secondary-storage",
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-client-ip", "x-forwarded-for"],
      disableIpTracking: false,
    },
    useSecureCookies: isProduction,
    disableCSRFCheck: false,
    crossSubDomainCookies: crossSubdomainCookieDomain
      ? {
          enabled: true,
          domain: crossSubdomainCookieDomain,
        }
      : undefined,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user: u, url }) => {
      await sendReactEmail({
        to: u.email,
        subject: "Verify your email — Motiq",
        react: VerifyEmail({
          name: u.name,
          url: withCallbackURL(url, "/overview"),
        }),
      })
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user: u, newEmail, url }) => {
        await sendReactEmail({
          to: newEmail,
          subject: "Confirm your new email — Motiq",
          react: ChangeEmail({
            name: u.name,
            newEmail,
            url: withCallbackURL(url, "/overview"),
          }),
        })
      },
    },
    deleteUser: {
      enabled: true,
      beforeDelete: async (u) => {
        await ensureUserCanDeleteAccount(u.id)
        await cancelPendingInvitationsCreatedByUser(u.id)
      },
      sendDeleteAccountVerification: async ({ user: u, url }) => {
        await sendReactEmail({
          to: u.email,
          subject: "Confirm account deletion — Motiq",
          react: DeleteAccount({
            name: u.name,
            url: withCallbackURL(url, "/login"),
          }),
        })
      },
    },
  },
  plugins: [
    organizationPlugin({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      requireEmailVerificationOnInvitation: true,
      sendInvitationEmail,
      ac,
      roles,
      organizationHooks: {
        beforeCreateInvitation: async ({ invitation, inviter }) => {
          await assertInvitationEmailCanReceiveMail(invitation.email)

          const role = await getInvitationRoleForInviter({
            inviterId: inviter.id,
            organizationId: invitation.organizationId,
            requestedRole: invitation.role,
          })

          return { data: { role } }
        },
      },
    }),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      enableCustomerPortal: true,
      use: [
        checkout({
          products: getCheckoutProducts(),
          successUrl: env.POLAR_SUCCESS_URL,
          authenticatedUsersOnly: true,
          theme: "dark",
        }),
        portal(),
        usage(),
      ],
    }),
    lastLoginMethod({
      storeInDatabase: true,
    }),
  ],
  onAPIError: {
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error("[auth]", message)
    },
  },
})
