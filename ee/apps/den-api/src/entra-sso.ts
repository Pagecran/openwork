export type DenSsoOrganizationRole = "admin" | "member"

export type EntraSsoConfig = {
  clientId?: string
  clientSecret?: string
  tenantId?: string
  autoJoinEnabled: boolean
  autoJoinOrganizationId?: string
  autoJoinOrganizationSlug?: string
  adminGroupIds: string[]
  memberGroupIds: string[]
}

export type EntraProfile = {
  email?: string | null
  name?: string | null
  oid?: string | null
  preferred_username?: string | null
  sub?: string | null
  tid?: string | null
  upn?: string | null
}

export type EntraTokenClaims = {
  groups?: unknown
}

export type EntraSsoMembershipRecord = {
  id: string
  role: string
}

export type EnsureEntraSsoMembershipDeps<TMember extends EntraSsoMembershipRecord> = {
  resolveOrganizationId: (input: { organizationId?: string; organizationSlug?: string }) => Promise<string | null>
  getExistingMember: (input: { organizationId: string; userId: string }) => Promise<TMember | null>
  createMember: (input: { organizationId: string; userId: string; role: DenSsoOrganizationRole }) => Promise<TMember>
  updateMemberRole: (input: { memberId: string; role: DenSsoOrganizationRole }) => Promise<TMember>
  ensureDefaultRoles: (organizationId: string) => Promise<void>
  isOwnerRole: (role: string) => boolean
}

function optionalString(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function splitCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function parseEntraSsoEnv(input: {
  DEN_ENTRA_TENANT_ID?: string
  DEN_ENTRA_CLIENT_ID?: string
  DEN_ENTRA_CLIENT_SECRET?: string
  DEN_ENTRA_AUTO_JOIN_ENABLED?: string
  DEN_ENTRA_AUTO_JOIN_ORG_ID?: string
  DEN_ENTRA_AUTO_JOIN_ORG_SLUG?: string
  DEN_ENTRA_ADMIN_GROUP_IDS?: string
  DEN_ENTRA_MEMBER_GROUP_IDS?: string
}): EntraSsoConfig {
  return {
    tenantId: normalizeEntraTenantId(input.DEN_ENTRA_TENANT_ID),
    clientId: optionalString(input.DEN_ENTRA_CLIENT_ID),
    clientSecret: optionalString(input.DEN_ENTRA_CLIENT_SECRET),
    autoJoinEnabled: (input.DEN_ENTRA_AUTO_JOIN_ENABLED ?? "false").toLowerCase() === "true",
    autoJoinOrganizationId: optionalString(input.DEN_ENTRA_AUTO_JOIN_ORG_ID),
    autoJoinOrganizationSlug: optionalString(input.DEN_ENTRA_AUTO_JOIN_ORG_SLUG),
    adminGroupIds: splitCsv(input.DEN_ENTRA_ADMIN_GROUP_IDS),
    memberGroupIds: splitCsv(input.DEN_ENTRA_MEMBER_GROUP_IDS),
  }
}

export function isEntraSsoEnabled(config: Pick<EntraSsoConfig, "clientId" | "clientSecret" | "tenantId">) {
  return Boolean(config.clientId && config.clientSecret && config.tenantId)
}

export function normalizeEntraTenantId(value: string | undefined) {
  const tenantId = value?.trim()
  if (!tenantId || tenantId.toLowerCase() === "common") {
    return undefined
  }
  return tenantId
}

export function mapEntraProfileToUser(profile: EntraProfile) {
  const email = profile.email?.trim()
    || profile.preferred_username?.trim()
    || profile.upn?.trim()
    || (profile.oid?.trim() ? `${profile.oid.trim()}@entra.local` : undefined)
    || (profile.sub?.trim() ? `${profile.sub.trim()}@entra.local` : undefined)

  return {
    email,
    emailVerified: Boolean(email),
    name: profile.name?.trim() || email || "Microsoft Entra user",
  }
}

function decodeJwtPayload(token: string) {
  const payload = token.split(".")[1]
  if (!payload) {
    return null
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<string, unknown>
  } catch {
    return null
  }
}

export function extractEntraGroupsFromClaims(claims: EntraTokenClaims | null | undefined) {
  if (!Array.isArray(claims?.groups)) {
    return []
  }

  return claims.groups
    .filter((group): group is string => typeof group === "string")
    .map((group) => group.trim())
    .filter(Boolean)
}

export function extractEntraGroupsFromIdToken(idToken: string | null | undefined) {
  if (!idToken) {
    return []
  }

  return extractEntraGroupsFromClaims(decodeJwtPayload(idToken))
}

export function resolveEntraSsoRole(input: {
  groups: readonly string[]
  adminGroupIds: readonly string[]
  memberGroupIds: readonly string[]
}): DenSsoOrganizationRole {
  const groups = new Set(input.groups.map((group) => group.trim()).filter(Boolean))

  if (input.adminGroupIds.some((groupId) => groups.has(groupId))) {
    return "admin"
  }

  if (input.memberGroupIds.some((groupId) => groups.has(groupId))) {
    return "member"
  }

  return "member"
}

export function normalizeSsoAssignableRole(role: string): DenSsoOrganizationRole {
  return role === "admin" ? "admin" : "member"
}

export async function ensureEntraSsoMembership<TMember extends EntraSsoMembershipRecord>(input: {
  userId: string
  providerId?: string | null
  idToken?: string | null
  config: Pick<EntraSsoConfig, "autoJoinEnabled" | "autoJoinOrganizationId" | "autoJoinOrganizationSlug" | "adminGroupIds" | "memberGroupIds">
  deps: EnsureEntraSsoMembershipDeps<TMember>
}) {
  if (input.providerId !== "microsoft") {
    return { status: "provider_not_microsoft" as const }
  }

  if (!input.config.autoJoinEnabled) {
    return { status: "disabled" as const }
  }

  const organizationId = await input.deps.resolveOrganizationId({
    organizationId: input.config.autoJoinOrganizationId,
    organizationSlug: input.config.autoJoinOrganizationSlug,
  })
  if (!organizationId) {
    return { status: "organization_not_found" as const }
  }

  const groups = extractEntraGroupsFromIdToken(input.idToken)
  const role = normalizeSsoAssignableRole(resolveEntraSsoRole({
    groups,
    adminGroupIds: input.config.adminGroupIds,
    memberGroupIds: input.config.memberGroupIds,
  }))

  const existingMember = await input.deps.getExistingMember({
    organizationId,
    userId: input.userId,
  })

  if (!existingMember) {
    const member = await input.deps.createMember({
      organizationId,
      userId: input.userId,
      role,
    })
    await input.deps.ensureDefaultRoles(organizationId)
    return { status: "created" as const, member, role }
  }

  if (input.deps.isOwnerRole(existingMember.role)) {
    await input.deps.ensureDefaultRoles(organizationId)
    return { status: "owner_preserved" as const, member: existingMember, role: existingMember.role }
  }

  if (existingMember.role !== role) {
    const member = await input.deps.updateMemberRole({
      memberId: existingMember.id,
      role,
    })
    await input.deps.ensureDefaultRoles(organizationId)
    return { status: "updated" as const, member, role }
  }

  await input.deps.ensureDefaultRoles(organizationId)
  return { status: "unchanged" as const, member: existingMember, role }
}
