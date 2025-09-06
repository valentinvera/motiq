import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { reactStartCookies } from "better-auth/react-start"
import { serverOnly } from "@tanstack/react-start"
import type { RateLimit } from "better-auth"
import { db } from "@/db/drizzle"
import { redis } from "@/lib/redis"
import { env } from "@/env/server"

const getAuthConfig = serverOnly(() =>
  betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      camelCase: true,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: Number(env.RESET_PASSWORD_TOKEN_EXPIRES_IN),
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        redirectURI: env.REDIRECT_URI,
      },
    },
    plugins: [reactStartCookies()],
    trustedOrigins: [env.TRUSTED_ORIGINS],
    secondaryStorage: {
      get: async (key: string) => {
        const rawValue = await redis.get(key)

        if (rawValue === null || typeof rawValue === "undefined") return null

        let stringValue: string

        if (typeof rawValue === "string") {
          stringValue = rawValue
        } else if (Buffer.isBuffer(rawValue)) {
          stringValue = rawValue.toString("utf8")
        } else {
          await redis.del(key)
          return null
        }

        if (stringValue === "[object Object]") {
          await redis.del(key)
          return null
        }

        return stringValue
      },
      set: async (key, value, ttl) => {
        const stringValue = typeof value === "string" ? value : JSON.stringify(value)
        if (ttl) await redis.set(key, stringValue, { ex: ttl })
        else await redis.set(key, stringValue)
      },
      delete: async key => {
        await redis.del(key)
      },
    },
    appName: "motiq",
    baseURL: env.VITE_BASE_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: Number(env.EMAIL_VERIFICATION_EXPIRES_IN),
    },
    session: {
      freshAge: Number(env.SESSION_FRESH_AGE),
      storeSessionInDatabase: true,
      preserveSessionInDatabase: true,
      cookieCache: {
        enabled: true,
      },
    },
    account: {
      accountLinking: {
        trustedProviders: ["google", "email-password"],
      },
    },
    rateLimit: {
      enabled: true,
      window: Number(env.RATE_LIMIT_WINDOW),
      max: Number(env.RATE_LIMIT_MAX),
      customRules: {
        "/auth/*": {
          window: Number(env.RATE_LIMIT_WINDOW_AUTH),
          max: Number(env.RATE_LIMIT_MAX_AUTH),
        },
      },
      customStorage: {
        get: async (key: string) => {
          const result = await redis.get(key)
          if (!result || typeof result !== "string") return undefined
          const parsed = JSON.parse(result) as RateLimit
          return parsed
        },
        set: async (key: string, value: RateLimit) => {
          await redis.set(key, JSON.stringify(value))
        },
      },
      storage: "secondary-storage",
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["x-client-ip", "x-forwarded-for"],
        disableIpTracking: false,
      },
      useSecureCookies: env.SECURE_COOKIES,
      disableCSRFCheck: false,
      cookies: {
        session_token: {
          name: env.COOKIE_SESSION_TOKEN_NAME,
          attributes: {
            httpOnly: true,
            expires: new Date(Date.now() + Number(env.COOKIE_SESSION_TOKEN_EXPIRES) * 1000),
            sameSite: "lax",
          },
        },
      },
      cookiePrefix: env.COOKIE_PREFIX,
    },
  }),
)

export const { api, handler } = getAuthConfig()
