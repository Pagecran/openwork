import { eq } from "@openwork-ee/den-db/drizzle"
import { WorkerTable, WorkerTokenTable } from "@openwork-ee/den-db/schema"
import { createDenTypeId } from "@openwork-ee/utils/typeid"
import { db } from "../db.js"
import { env } from "../env.js"
import { continueCloudProvisioning, token, withStaticAssignmentLock } from "../routes/workers/shared.js"

type WorkerRow = typeof WorkerTable.$inferSelect
type OrgId = WorkerRow["org_id"]
type UserId = NonNullable<WorkerRow["created_by_user_id"]>
type FirstStaticWorkerDb = Pick<typeof db, "insert" | "select">

export function canAutoCreateFirstStaticWorker() {
  if (env.provisionerMode !== "static") {
    return false
  }

  if (env.staticWorkers.urls.length === 0) {
    console.error("[workers] static first-worker auto-create skipped: STATIC_WORKER_URLS is empty")
    return false
  }

  return true
}

export async function ensureFirstStaticWorkerForOrganization(input: {
  organizationId: OrgId
  userId: UserId
  name?: string
}, deps: {
  data?: FirstStaticWorkerDb
  lock?: <T>(run: (tx: FirstStaticWorkerDb) => Promise<T>) => Promise<T>
  continueProvisioning?: typeof continueCloudProvisioning
  canCreate?: () => boolean
} = {}) {
  const canCreate = deps.canCreate ?? canAutoCreateFirstStaticWorker
  if (!canCreate()) {
    return { created: false as const }
  }

  const data = deps.data ?? db
  const lock = deps.lock ?? (deps.data ? (run) => run(data) : (run) => withStaticAssignmentLock(run))
  const continueProvisioning = deps.continueProvisioning ?? continueCloudProvisioning
  const workerId = createDenTypeId("worker")
  const hostToken = token()
  const clientToken = token()
  const activityToken = token()
  const name = input.name?.trim() || "Default static worker"

  const created = await lock(async (tx) => {
    const existingWorkers = await tx
      .select({ id: WorkerTable.id })
      .from(WorkerTable)
      .where(eq(WorkerTable.org_id, input.organizationId))
      .limit(1)

    if (existingWorkers.length > 0) {
      return false
    }

    await tx.insert(WorkerTable).values({
      id: workerId,
      org_id: input.organizationId,
      created_by_user_id: input.userId,
      name,
      description: "Automatically attached static worker for this organization.",
      destination: "cloud",
      status: "provisioning",
      image_version: null,
      workspace_path: null,
      sandbox_backend: "static",
    })

    await tx.insert(WorkerTokenTable).values([
      {
        id: createDenTypeId("workerToken"),
        worker_id: workerId,
        scope: "host",
        token: hostToken,
      },
      {
        id: createDenTypeId("workerToken"),
        worker_id: workerId,
        scope: "client",
        token: clientToken,
      },
      {
        id: createDenTypeId("workerToken"),
        worker_id: workerId,
        scope: "activity",
        token: activityToken,
      },
    ])

    return true
  })

  if (!created) {
    return { created: false as const }
  }

  await continueProvisioning({
    workerId,
    name,
    hostToken,
    clientToken,
    activityToken,
  })

  return { created: true as const, workerId }
}
