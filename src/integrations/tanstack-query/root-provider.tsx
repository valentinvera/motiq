import { QueryClient } from "@tanstack/react-query"
import { createTRPCClient, httpBatchStreamLink } from "@trpc/client"
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import superjson from "superjson"
import type { AppRouter } from "@/integrations/trpc/routers/app"
import { TRPCProvider } from "@/integrations/trpc/react"
import { env } from "@/env/server"

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return ""
    return `http://localhost:${env.PORT}`
  })()
  return `${base}/api/trpc`
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchStreamLink({
      transformer: superjson,
      url: getUrl(),
    }),
  ],
})

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
    },
  })

  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient: queryClient,
  })
  return {
    queryClient,
    trpc: serverHelpers,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  )
}
