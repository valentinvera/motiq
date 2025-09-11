import { createServerFileRoute } from "@tanstack/react-start/server"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@/integrations/trpc/routers/app"
import { createTRPCContext } from "@/integrations/trpc/init"

const handler = ({ request }: { request: Request }) => {
  return fetchRequestHandler({
    req: request,
    router: appRouter,
    endpoint: "/api/trpc",
    createContext: createTRPCContext,
  })
}

export const ServerRoute = createServerFileRoute("/api/trpc/$").methods({
  GET: handler,
  POST: handler,
})
