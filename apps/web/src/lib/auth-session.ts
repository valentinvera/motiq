import type { RouterAppContext } from "@/routes/__root"
import { authClient } from "./auth-client"

type AuthSession = NonNullable<RouterAppContext["auth"]>

const SESSION_CACHE_TTL_MS = 30_000
const STALE_SESSION_TTL_MS = 10 * 60_000
const CLIENT_SESSION_RETRY_DELAYS_MS = [150, 500]

let cachedSession: {
  auth: AuthSession
  updatedAt: number
} | null = null
let pendingSession: Promise<AuthSession | null> | null = null

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getErrorStatus(error: unknown) {
  if (!(error && typeof error === "object")) {
    return null
  }

  const candidate = error as {
    status?: unknown
    statusCode?: unknown
    code?: unknown
  }

  if (typeof candidate.status === "number") {
    return candidate.status
  }

  if (typeof candidate.statusCode === "number") {
    return candidate.statusCode
  }

  if (typeof candidate.code === "number") {
    return candidate.code
  }

  return null
}

function getCachedSession(maxAgeMs: number) {
  if (!cachedSession) {
    return null
  }

  if (Date.now() - cachedSession.updatedAt > maxAgeMs) {
    return null
  }

  return cachedSession.auth
}

export function setCachedAuthSession(auth: AuthSession) {
  cachedSession = { auth, updatedAt: Date.now() }
}

export function clearCachedAuthSession() {
  cachedSession = null
}

async function fetchClientSessionWithRetry(): Promise<AuthSession | null> {
  for (
    let attempt = 0;
    attempt <= CLIENT_SESSION_RETRY_DELAYS_MS.length;
    attempt++
  ) {
    const { data, error } = await authClient.getSession()

    if (data) {
      const auth = data as AuthSession
      setCachedAuthSession(auth)
      return auth
    }

    if (!error) {
      clearCachedAuthSession()
      return null
    }

    if (getErrorStatus(error) === 429) {
      return getCachedSession(STALE_SESSION_TTL_MS)
    }

    const delay = CLIENT_SESSION_RETRY_DELAYS_MS[attempt]
    if (delay === undefined) {
      return getCachedSession(STALE_SESSION_TTL_MS)
    }

    await wait(delay)
  }

  return getCachedSession(STALE_SESSION_TTL_MS)
}

export async function getClientSessionWithRetry(): Promise<AuthSession | null> {
  if (typeof window === "undefined") {
    return null
  }

  const cached = getCachedSession(SESSION_CACHE_TTL_MS)
  if (cached) {
    return cached
  }

  if (!pendingSession) {
    pendingSession = fetchClientSessionWithRetry().finally(() => {
      pendingSession = null
    })
  }

  return await pendingSession
}

export async function resolveAuthSession(
  auth: RouterAppContext["auth"]
): Promise<AuthSession | null> {
  if (auth) {
    setCachedAuthSession(auth)
    return auth
  }

  return await getClientSessionWithRetry()
}
