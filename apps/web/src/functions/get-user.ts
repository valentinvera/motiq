import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { authMiddleware } from "@/middleware/auth"

export const getUser = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => context.session)

export const getOptionalUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest()
    const { authClient } = await import("@/lib/auth-client")
    const { data, error } = await authClient.getSession({
      fetchOptions: {
        headers: request.headers,
      },
    })
    if (error || !data) {
      return null
    }
    return data
  }
)
