import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements } from "better-auth/plugins/organization/access"

export const statement = {
  ...defaultStatements,
  app: ["create", "update", "delete"],
  autonomy: ["create", "update", "delete"],
  pipeline: ["create", "update", "delete"],
  billing: ["manage"],
  developer: ["manage"],
} as const

export const ac = createAccessControl(statement)

export const owner = ac.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  team: ["create", "update", "delete"],
  app: ["create", "update", "delete"],
  autonomy: ["create", "update", "delete"],
  pipeline: ["create", "update", "delete"],
  developer: ["manage"],
  billing: ["manage"],
})

export const admin = ac.newRole({
  organization: ["update"],
  member: ["create", "delete"],
  invitation: ["create", "cancel"],
  team: ["create", "update", "delete"],
  app: ["create", "update", "delete"],
  autonomy: ["create", "update", "delete"],
  pipeline: ["create", "update", "delete"],
  developer: ["manage"],
  billing: ["manage"],
})

export const member = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  app: [],
  autonomy: ["update"],
  pipeline: [],
  developer: [],
  billing: [],
})

export const roles = { owner, admin, member }

export type Role = keyof typeof roles
