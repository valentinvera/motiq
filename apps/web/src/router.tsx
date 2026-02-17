import "@/styles/globals.css"
import type { AppRouter } from "@motiq/trpc/routers"
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import { toast } from "sonner"
import superjson from "superjson"
import { routeTree } from "./routeTree.gen"
import { TRPCProvider } from "./utils/trpc"

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: query.invalidate,
        },
      })
    },
  }),
  defaultOptions: {
    queries: { staleTime: 60 * 1000 },
  },
})

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: `${import.meta.env.VITE_API_URL}/api/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        })
      },
    }),
  ],
})

const trpcProxy = createTRPCOptionsProxy({
  client: trpcClient,
  queryClient,
})

export const getRouter = () => {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    context: { trpc: trpcProxy, queryClient, auth: null },
    defaultNotFoundComponent: () => <div>Not Found</div>,
    Wrap: (props: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
          {props.children}
        </TRPCProvider>
      </QueryClientProvider>
    ),
  })
  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
