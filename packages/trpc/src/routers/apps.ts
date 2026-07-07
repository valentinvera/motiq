import { db } from "@motiq/db"
import { app } from "@motiq/db/schema/apps"
import { env } from "@motiq/env/api"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { orgProcedure, requirePermission, router } from "../index"

const oauthAppSchema = z.enum(["slack"])

type OAuthAppType = z.infer<typeof oauthAppSchema>

const redirectUri = (provider: string) =>
  `${getPublicApiUrl()}/api/apps/${provider}/oauth/callback`

const getPublicApiUrl = () => process.env.PUBLIC_API_URL ?? env.BETTER_AUTH_URL

const SLACK_ALREADY_DISCONNECTED_ERRORS = new Set([
  "account_inactive",
  "invalid_auth",
  "token_expired",
  "token_revoked",
])

const SLACK_UNINSTALL_FALLBACK_ERRORS = new Set([
  "no_permission",
  "not_allowed_token_type",
])

interface SlackApiResponse {
  ok: boolean
  error?: string
  revoked?: boolean
}

const OAUTH_CONFIGS: Record<
  OAuthAppType,
  {
    envKey: "SLACK_CLIENT_ID"
    buildUrl: (clientId: string, state: string) => string
  }
> = {
  slack: {
    envKey: "SLACK_CLIENT_ID",
    buildUrl: (clientId, state) => {
      const params = new URLSearchParams({
        client_id: clientId,
        scope:
          "chat:write,channels:read,channels:history,channels:join,incoming-webhook",
        redirect_uri: redirectUri("slack"),
        state,
      })
      return `https://slack.com/oauth/v2/authorize?${params.toString()}`
    },
  },
}

export const appsRouter = router({
  getOAuthUrl: requirePermission("app", "create")
    .input(
      z.object({
        type: oauthAppSchema,
        from: z.enum(["onboarding", "app"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const config = OAUTH_CONFIGS[input.type]
      const clientId = env[config.envKey]
      if (!clientId) {
        throw new Error(`${input.type} is not configured`)
      }

      const id = crypto.randomUUID()
      await db.insert(app).values({
        id,
        organizationId: ctx.organizationId,
        type: input.type,
        status: "paused",
      })

      const state = Buffer.from(
        JSON.stringify({
          organizationId: ctx.organizationId,
          appId: id,
          from: input.from ?? "app",
        })
      ).toString("base64url")

      return { url: config.buildUrl(clientId, state) }
    }),

  list: orgProcedure.query(async ({ ctx }) => {
    const apps = await db
      .select()
      .from(app)
      .where(eq(app.organizationId, ctx.organizationId))
    return apps
  }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [result] = await db
        .select()
        .from(app)
        .where(
          and(eq(app.id, input.id), eq(app.organizationId, ctx.organizationId))
        )
        .limit(1)
      return result ?? null
    }),

  update: requirePermission("app", "update")
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["active", "paused", "error"]).optional(),
        config: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() }
      if (input.status) {
        updates.status = input.status
      }
      if (input.config) {
        updates.config = input.config
      }

      await db
        .update(app)
        .set(updates)
        .where(
          and(eq(app.id, input.id), eq(app.organizationId, ctx.organizationId))
        )
      const [updated] = await db
        .select()
        .from(app)
        .where(eq(app.id, input.id))
        .limit(1)
      return updated
    }),

  delete: requirePermission("app", "delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select()
        .from(app)
        .where(
          and(eq(app.id, input.id), eq(app.organizationId, ctx.organizationId))
        )
        .limit(1)

      if (!existing) {
        return { success: true }
      }

      if (existing.type === "slack") {
        await disconnectSlackApp(existing)
      }

      await db
        .delete(app)
        .where(
          and(eq(app.id, input.id), eq(app.organizationId, ctx.organizationId))
        )
      return { success: true }
    }),
})

async function disconnectSlackApp(record: {
  credentials: Record<string, unknown> | null
}) {
  const accessToken = record.credentials?.accessToken

  if (typeof accessToken !== "string" || accessToken.length === 0) {
    return
  }

  if (env.SLACK_CLIENT_ID && env.SLACK_CLIENT_SECRET) {
    const uninstall = await callSlackApi("apps.uninstall", accessToken, {
      client_id: env.SLACK_CLIENT_ID,
      client_secret: env.SLACK_CLIENT_SECRET,
    })

    if (uninstall.ok || isSlackAlreadyDisconnected(uninstall.error)) {
      return
    }

    if (!SLACK_UNINSTALL_FALLBACK_ERRORS.has(uninstall.error ?? "")) {
      throw new Error(
        `Failed to uninstall Slack app: ${uninstall.error ?? "unknown_error"}`
      )
    }
  }

  const revoke = await callSlackApi("auth.revoke", accessToken)

  if (revoke.ok || isSlackAlreadyDisconnected(revoke.error)) {
    return
  }

  throw new Error(
    `Failed to revoke Slack token: ${revoke.error ?? "unknown_error"}`
  )
}

async function callSlackApi(
  method: "apps.uninstall" | "auth.revoke",
  accessToken: string,
  body?: Record<string, string>
) {
  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body ?? {}),
  })

  return (await response.json()) as SlackApiResponse
}

function isSlackAlreadyDisconnected(error?: string) {
  return !!error && SLACK_ALREADY_DISCONNECTED_ERRORS.has(error)
}
