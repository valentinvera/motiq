import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanstackDevtools } from "@tanstack/react-devtools"
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools"
import type { QueryClient } from "@tanstack/react-query"
import type { AppRouter } from "@/integrations/trpc/routers/app"
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query"
import appCss from "@/styles/globals.css?url"
import { seo } from "@/lib/seo"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { NotFound } from "@/components/not-found"

interface MyRouterContext {
  queryClient: QueryClient
  trpc: TRPCOptionsProxy<AppRouter>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "Motiq",
        description: "AI-Powered Forms",
      }),
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        {import.meta.env.DEV ? (
          <TanstackDevtools
            config={{
              position: "bottom-left",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
