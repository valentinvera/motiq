import "@/styles/globals.css"
import type { AppRouter } from "@motiq/trpc/routers"
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import {
  createRouter as createTanStackRouter,
  Link,
} from "@tanstack/react-router"
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
          onClick: () => {
            queryClient.invalidateQueries({ queryKey: query.queryKey })
          },
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
    defaultNotFoundComponent: () => (
      <div className="flex h-dvh flex-col items-center justify-center bg-surface-0 p-4 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <span className="font-bold font-mono text-primary text-xl">404</span>
        </div>
        <h1 className="mb-2 font-bold text-2xl text-zinc-100 tracking-tight">
          Spectrum Void
        </h1>
        <p className="mb-8 max-w-xs font-mono text-sm text-zinc-500 uppercase tracking-widest">
          The requested coordinate does not exist in the current monitoring
          field.
        </p>
        <Link
          className="rounded-full bg-primary px-6 py-2 font-bold text-primary-foreground text-xs uppercase tracking-widest shadow-lg shadow-primary/10 transition-transform hover:scale-105 active:scale-95"
          to="/overview"
        >
          Return to Command
        </Link>
      </div>
    ),
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
