import { beforeAll, expect, test } from "bun:test"
import { createDenTypeId } from "@openwork-ee/utils/typeid"

function seedRequiredEnv() {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? "mysql://root:password@127.0.0.1:3306/openwork_test"
  process.env.DEN_DB_ENCRYPTION_KEY = process.env.DEN_DB_ENCRYPTION_KEY ?? "x".repeat(32)
  process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET ?? "y".repeat(32)
  process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:8790"
  process.env.CORS_ORIGINS = process.env.CORS_ORIGINS ?? "http://127.0.0.1:8790"
}

let orgsModule: typeof import("../src/orgs.js")

beforeAll(async () => {
  seedRequiredEnv()
  orgsModule = await import("../src/orgs.js")
})

test("organization context serialization keeps joined members active and pending invites pending", () => {
  const joinedAt = new Date("2026-05-25T09:00:00.000Z")
  const createdAt = new Date("2026-05-25T08:00:00.000Z")
  const ownerMemberId = createDenTypeId("member")
  const ownerUserId = createDenTypeId("user")
  const invitedMemberId = createDenTypeId("member")
  const pendingInvitationId = createDenTypeId("invitation")

  const members = orgsModule.serializeOrganizationContextMembers([
    {
      id: ownerMemberId,
      userId: ownerUserId,
      inviteId: null,
      role: "owner",
      createdAt,
      joinedAt,
      user: {
        id: ownerUserId,
        email: "owner@example.com",
        name: "Owner User",
        image: null,
      },
      invitation: {
        email: null,
      },
    },
    {
      id: invitedMemberId,
      userId: null,
      inviteId: pendingInvitationId,
      role: "member",
      createdAt,
      joinedAt: null,
      user: {
        id: null,
        email: null,
        name: null,
        image: null,
      },
      invitation: {
        email: "pending@example.com",
      },
    },
  ])

  expect(members).toHaveLength(2)
  expect(members[0]).toMatchObject({
    id: ownerMemberId,
    userId: ownerUserId,
    joinedAt,
    isOwner: true,
    user: {
      id: ownerUserId,
      email: "owner@example.com",
      name: "Owner User",
    },
  })
  expect(members[1]).toMatchObject({
    id: invitedMemberId,
    userId: null,
    inviteId: pendingInvitationId,
    joinedAt: null,
    isOwner: false,
    user: {
      id: null,
      email: "pending@example.com",
      name: "pending@example.com",
    },
  })
})
