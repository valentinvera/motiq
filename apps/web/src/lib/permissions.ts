import { type Role, roles } from "@motiq/auth/permissions"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/utils/trpc"

export function useCurrentRole(): Role | null {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.workspace.getCurrentRole.queryOptions())
  return (data?.role ?? null) as Role | null
}

export function hasPermission(
  role: Role | null,
  resource: string,
  action: string
): boolean {
  if (!role) {
    return false
  }
  const r = roles[role] as (typeof roles)["owner"] | undefined
  if (!r) {
    return false
  }
  const result = r.authorize({ [resource]: [action] } as never)
  return result.success
}

export function usePermission(resource: string, action: string): boolean {
  const role = useCurrentRole()
  return hasPermission(role, resource, action)
}
