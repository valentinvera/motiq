import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { authMiddleware } from "@/middleware/auth"

const SESSION_RETRY_DELAYS_MS = [150, 500]

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const getUser = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => context.session)

export const getOptionalUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest()
    const { authClient } = await import("@/lib/auth-client")

    for (
      let attempt = 0;
      attempt <= SESSION_RETRY_DELAYS_MS.length;
      attempt++
    ) {
      const { data, error } = await authClient.getSession({
        fetchOptions: {
          headers: request.headers,
        },
      })

      if (data) {
        return data
      }

      if (!error) {
        return null
      }

      const delay = SESSION_RETRY_DELAYS_MS[attempt]
      if (delay === undefined) {
        return null
      }

      await wait(delay)
    }

    return null
  }
)
