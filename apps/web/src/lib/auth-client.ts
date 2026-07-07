import { ac, roles } from "@motiq/auth/permissions"
import { polarClient } from "@polar-sh/better-auth"
import {
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins"
import type { AccessControl } from "better-auth/plugins/access"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  plugins: [
    organizationClient({ ac: ac as unknown as AccessControl, roles }),
    polarClient(),
    lastLoginMethodClient({}),
  ],
})
