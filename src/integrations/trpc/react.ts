import { createTRPCContext } from "@trpc/tanstack-react-query"
import type { AppRouter } from "@/integrations/trpc/routers/app"

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>()
