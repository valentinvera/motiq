import type { RouterAppContext } from "@/routes/__root"
import { authClient } from "./auth-client"

type AuthSession = NonNullable<RouterAppContext["auth"]>

const CLIENT_SESSION_RETRY_DELAYS_MS = [150, 500]

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getClientSessionWithRetry(): Promise<AuthSession | null> {
  if (typeof window === "undefined") {
    return null
  }

  for (
    let attempt = 0;
    attempt <= CLIENT_SESSION_RETRY_DELAYS_MS.length;
    attempt++
  ) {
    const { data, error } = await authClient.getSession()

    if (data) {
      return data as AuthSession
    }

    if (!error) {
      return null
    }

    const delay = CLIENT_SESSION_RETRY_DELAYS_MS[attempt]
    if (delay === undefined) {
      return null
    }

    await wait(delay)
  }

  return null
}

export async function resolveAuthSession(
  auth: RouterAppContext["auth"]
): Promise<AuthSession | null> {
  if (auth) {
    return auth
  }

  return await getClientSessionWithRetry()
}
