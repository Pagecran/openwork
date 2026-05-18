import { afterAll, beforeAll, expect, test } from "bun:test"

function seedRequiredEnv() {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? "mysql://root:password@127.0.0.1:3306/openwork_test"
  process.env.DEN_DB_ENCRYPTION_KEY = process.env.DEN_DB_ENCRYPTION_KEY ?? "x".repeat(32)
  process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET ?? "y".repeat(32)
  process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:8790"
  process.env.CORS_ORIGINS = process.env.CORS_ORIGINS ?? "http://127.0.0.1:8790"
  process.env.PROVISIONER_MODE = "static"
}

let provisionerModule: typeof import("../src/workers/provisioner.js")
let server: ReturnType<typeof Bun.serve>
let staticWorkerUrl: string

beforeAll(async () => {
  seedRequiredEnv()
  server = Bun.serve({
    port: 0,
    fetch(request) {
      const url = new URL(request.url)
      if (url.pathname === "/health") {
        return Response.json({ ok: true })
      }
      if (url.pathname === "/hang-health") {
        return new Promise<Response>(() => {})
      }
      return new Response("not found", { status: 404 })
    },
  })
  staticWorkerUrl = `http://127.0.0.1:${server.port}`
  provisionerModule = await import("../src/workers/provisioner.js")
})

afterAll(() => {
  server.stop(true)
})

test("static provisioner assigns a configured healthy worker URL", async () => {
  const provisioned = await provisionerModule.provisionStaticWorker(
    {
      workerId: "worker_static_health_123",
      name: "Static Health",
      hostToken: "host-token",
      clientToken: "client-token",
      activityToken: "activity-token",
    },
    {
      urls: [staticWorkerUrl],
      healthPath: "/health",
      healthcheckTimeoutMs: 1000,
      healthcheckIntervalMs: 10,
    },
  )

  expect(provisioned).toEqual({
    provider: "static",
    region: "on-prem",
    status: "healthy",
    url: staticWorkerUrl,
  })
})

test("static provisioner skips URLs already assigned to active workers", async () => {
  const provisioned = await provisionerModule.provisionStaticWorker(
    {
      workerId: "worker_static_available_url_123",
      name: "Static Available URL",
      hostToken: "host-token",
      clientToken: "client-token",
      activityToken: "activity-token",
      unavailableStaticWorkerUrls: ["http://127.0.0.1:1/"],
    },
    {
      urls: ["http://127.0.0.1:1/", staticWorkerUrl],
      healthPath: "/health",
      healthcheckTimeoutMs: 1000,
      healthcheckIntervalMs: 10,
    },
  )

  expect(provisioned.url).toBe(staticWorkerUrl)
  expect(provisioned.status).toBe("healthy")
})

test("static provisioner fails clearly when every configured URL is already active", async () => {
  await expect(provisionerModule.provisionStaticWorker(
    {
      workerId: "worker_static_exhausted_123",
      name: "Static Exhausted",
      hostToken: "host-token",
      clientToken: "client-token",
      activityToken: "activity-token",
      unavailableStaticWorkerUrls: [staticWorkerUrl],
    },
    {
      urls: [staticWorkerUrl],
      healthPath: "/health",
      healthcheckTimeoutMs: 1000,
      healthcheckIntervalMs: 10,
    },
  )).rejects.toThrow("No available static worker URL remains")
})

test("static provisioner fails clearly when no worker URLs are configured", async () => {
  await expect(provisionerModule.provisionStaticWorker(
    {
      workerId: "worker_static_missing_url_123",
      name: "Static Missing URL",
      hostToken: "host-token",
      clientToken: "client-token",
      activityToken: "activity-token",
    },
    {
      urls: [],
      healthPath: "/health",
      healthcheckTimeoutMs: 1000,
      healthcheckIntervalMs: 10,
    },
  )).rejects.toThrow("STATIC_WORKER_URLS is required when PROVISIONER_MODE=static")
})

test("static provisioner fails clearly when health check does not pass", async () => {
  await expect(provisionerModule.provisionStaticWorker(
    {
      workerId: "worker_static_unhealthy_123",
      name: "Static Unhealthy",
      hostToken: "host-token",
      clientToken: "client-token",
      activityToken: "activity-token",
    },
    {
      urls: [`${staticWorkerUrl}/missing`],
      healthPath: "/health",
      healthcheckTimeoutMs: 50,
      healthcheckIntervalMs: 10,
    },
  )).rejects.toThrow("Timed out waiting for worker health endpoint")
})

test("static provisioner aborts a hanging health check within the configured timeout", async () => {
  const startedAt = performance.now()

  await expect(provisionerModule.provisionStaticWorker(
    {
      workerId: "worker_static_hanging_health_123",
      name: "Static Hanging Health",
      hostToken: "host-token",
      clientToken: "client-token",
      activityToken: "activity-token",
    },
    {
      urls: [staticWorkerUrl],
      healthPath: "/hang-health",
      healthcheckTimeoutMs: 75,
      healthcheckIntervalMs: 10,
    },
  )).rejects.toThrow("Timed out waiting for worker health endpoint")

  expect(performance.now() - startedAt).toBeLessThan(1000)
})
