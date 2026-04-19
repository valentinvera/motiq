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
import {
  ORGANIZATION_JSONLD,
  SEO,
  SOFTWARE_APPLICATION_JSONLD,
  WEBSITE_JSONLD,
} from "@/lib/seo"
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

const ogImageUrl = `${SEO.siteUrl}${SEO.ogImage}`

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SEO.title },
      { name: "description", content: SEO.description },
      { name: "keywords", content: SEO.keywords.join(", ") },
      { name: "author", content: SEO.author },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "theme-color", content: SEO.themeColor },
      { name: "color-scheme", content: "dark" },
      { name: "application-name", content: SEO.siteName },
      { name: "apple-mobile-web-app-title", content: SEO.siteName },
      { name: "format-detection", content: "telephone=no" },

      { property: "og:type", content: "website" },
      { property: "og:url", content: SEO.siteUrl },
      { property: "og:title", content: SEO.title },
      { property: "og:description", content: SEO.description },
      { property: "og:image", content: ogImageUrl },
      {
        property: "og:image:alt",
        content: "Motiq — Autonomous Customer Intelligence for B2B SaaS",
      },
      { property: "og:image:width", content: String(SEO.ogImageWidth) },
      { property: "og:image:height", content: String(SEO.ogImageHeight) },
      { property: "og:site_name", content: SEO.siteName },
      { property: "og:locale", content: SEO.locale },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: SEO.twitterHandle },
      { name: "twitter:creator", content: SEO.twitterHandle },
      { name: "twitter:title", content: SEO.title },
      { name: "twitter:description", content: SEO.description },
      { name: "twitter:image", content: ogImageUrl },
      {
        name: "twitter:image:alt",
        content: "Motiq — Autonomous Customer Intelligence for B2B SaaS",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: SEO.siteUrl },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(ORGANIZATION_JSONLD),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(WEBSITE_JSONLD),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(SOFTWARE_APPLICATION_JSONLD),
      },
    ],
  }),

  component: RootDocument,
})

function RootDocument() {
  return (
    <html className="dark" lang={SEO.lang}>
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
