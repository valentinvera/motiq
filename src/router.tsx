import * as Sentry from "@sentry/tanstackstart-react"
import { createRouter as createTanstackRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import * as TanstackQuery from "./integrations/tanstack-query/root-provider"
import { routeTree } from "./routeTree.gen"
import { env } from "@/env/client"

Sentry.init({
  dsn: env.VITE_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

export const createRouter = () => {
  const rqContext = TanstackQuery.getContext()

  const router = createTanstackRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: "intent",
    Wrap: (props: { children: React.ReactNode }) => {
      return <TanstackQuery.Provider {...rqContext}>{props.children}</TanstackQuery.Provider>
    },
  })

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
