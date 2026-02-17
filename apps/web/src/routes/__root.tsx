import type { AppRouter } from "@motiq/trpc/routers"
import { Toaster } from "@motiq/ui/components/sonner"
import type { QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query"
import appCss from "@/styles/globals.css?url"

export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>
  queryClient: QueryClient
  auth: {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
    }
    session: {
      id: string
      expiresAt: Date
      token: string
      ipAddress?: string | null
      userAgent?: string | null
      userId: string
    }
  } | null
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Motiq — Autonomous Customer Intelligence",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
    ],
  }),

  component: RootDocument,
})

function RootDocument() {
  return (
    <html className="dark" lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="grid h-svh grid-rows-[auto_1fr]">
          <Outlet />
        </div>
        <Toaster richColors />
        {/* biome-ignore lint/nursery/noUndeclaredEnvVars: DEV is a Vite built-in variable */}
        {import.meta.env.DEV && (
          <>
            <TanStackRouterDevtools position="bottom-left" />
            <ReactQueryDevtools
              buttonPosition="bottom-right"
              position="bottom"
            />
          </>
        )}
        <Scripts />
      </body>
    </html>
  )
}
