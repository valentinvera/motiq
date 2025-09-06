import * as Sentry from "@sentry/tanstackstart-react"
import { createMiddleware, registerGlobalMiddleware } from "@tanstack/react-start"
import { env } from "@/env/server"

if (import.meta.env.SSR) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  })
}

registerGlobalMiddleware({
  middleware: [
    createMiddleware({ type: "function" }).server(Sentry.sentryGlobalServerMiddlewareHandler()),
  ],
})
