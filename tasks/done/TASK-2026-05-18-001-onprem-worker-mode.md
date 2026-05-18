---
id: TASK-2026-05-18-001
title: Add on-prem local worker provisioning mode and usage guide
complexity: complex
track: implementation
slice: foundation
status: done
owner: workflow_runner
created: 2026-05-18
target_repo: D:\openwork
out_of_scope_repos:
  - D:\openwork\.codenomad\worktrees\Pagec_tree
  - D:\tauri
  - D:\opencode
scr_status: approved_by_po_chat
---

# Task: Add on-prem local worker provisioning mode and usage guide

## Target Repo Intake

1. Target repo: `D:\openwork`
2. Out of scope repos: `D:\openwork\.codenomad\worktrees\Pagec_tree`, `D:\tauri`, `D:\opencode`
3. Planned output: Add a self-hosted/on-prem worker provisioning path for Den local deployment, include Docker/local usage documentation, and verify the flow with targeted tests/commands.

## Background / Problem Context

The current Den local Docker stack starts MySQL, Den API, Den web, and worker proxy, but it uses `DEN_PROVISIONER_MODE=stub` by default. In stub mode, `provisionWorker()` returns a synthetic URL and `status: "provisioning"`, so newly created cloud/shared workers remain stuck on `Starting` forever.

The Product Owner clarified the intended deployment scenario:

- A company of ~20 people wants centralized management on its local network.
- Hosting should remain on the company LAN/on-prem infrastructure.
- Den should be the centralized control plane for users/orgs/providers/skills/workspaces.
- Workers should be real LAN-hosted OpenWork worker runtimes, not Render/Daytona cloud workers.
- It should be possible to deploy Den and at least a sample worker together for local/on-prem simulation.

The prior conversation also increased the local org worker limit to 20 in the dev database for manual testing; that DB tweak is not a productized solution.

## Objective

Add a practical on-prem/local-network worker mode so the Docker/self-hosted Den stack can create or attach to real local worker runtime URLs and mark them healthy instead of remaining in `provisioning` forever.

## Proposed Product Direction

Prefer a minimal, maintainable first slice that supports an on-prem/static worker pool:

- Introduce a provisioner mode such as `static`, `local_static`, or similarly clear naming.
- It should consume one or more preconfigured LAN worker URLs from env/config.
- On worker creation, Den should assign an available static worker URL, verify `/health` when possible, create a `worker_instance`, and mark the worker `healthy` when the endpoint is reachable.
- The local Docker docs/compose should show how to run Den plus at least one worker-like endpoint together for testing.

If the repository already has a suitable OpenWork server/orchestrator Docker surface, use that for the sample worker. If not, implement the smallest honest simulation that exercises Den’s provisioning and connect flow without pretending to launch a full production worker. Document any limitation explicitly.

Avoid overbuilding dynamic Docker orchestration unless the repository already has a clear pattern for it. A static on-prem worker pool is acceptable for this task if it unblocks LAN deployment semantics and avoids `Starting` forever.

## Scope

In scope:

- Den API provisioning logic for an on-prem/static worker mode.
- Environment variables/config parsing for static local worker URLs.
- Health/status behavior so workers do not remain stuck on `Starting` when the configured LAN endpoint is healthy.
- Docker/self-hosted documentation or compose updates needed to demonstrate the mode.
- Clear usage guide for running the stack and creating a worker.
- Targeted tests/builds for modified packages.

Out of scope:

- Render/Daytona production credential setup.
- A full Kubernetes/Proxmox/Nomad scheduler.
- Billing or payment changes.
- Multiple-team enterprise RBAC redesign.
- Any edits to `D:\tauri`, `D:\opencode`, `.codenomad/`, or untracked `apps/desktop/src-tauri/` unless PMA explicitly expands scope.

## Acceptance Criteria

- AC-1: Den supports a documented on-prem/static worker provisioner mode via environment configuration.
- AC-2: In that mode, creating a cloud/shared worker assigns a configured LAN/local worker URL and records a `worker_instance` row.
- AC-3: If the configured worker URL passes the expected health check, the worker status becomes `healthy` rather than staying `provisioning`.
- AC-4: If no configured worker URL is available or the endpoint is unhealthy, Den reports/records a clear failure state instead of silently hanging.
- AC-5: The local Docker/self-host instructions explain how to run Den with the on-prem/static worker mode, including required env vars and validation commands.
- AC-6: Existing Render/Daytona/stub behavior is not broken.
- AC-7: Verification evidence includes targeted build/test commands and, where possible, a local health/provisioning check.

## Evidence Expectations

Required final evidence:

- Files changed summary.
- Commands run and results.
- Any manual/local validation steps performed.
- Explicit note if a full OpenWork runtime worker could not be launched in Docker and what was simulated instead.
- AC-by-AC verification mapping.

## Documentation Expectations

Update the most appropriate docs. Candidate locations include:

- `packaging/docker/docker-compose.den-dev.yml` comments/env docs.
- A new or existing self-host/on-prem Den guide if present.
- Root or infrastructure docs only if the steady-state deployment truth changes.

## Decisions Taken On PO Behalf

- Choose the smallest maintainable on-prem implementation path that supports LAN/static worker URLs first, unless repository investigation shows a dynamic Docker worker provisioner is already straightforward and low-risk.
- Keep Render/Daytona as production cloud provisioners and treat on-prem as self-hosted/LAN infrastructure.
- Workflow Runner used the standard full-team complex implementation sequence because this is `complex + implementation` and touches provisioning behavior plus docs.

## Discussion Record

- PO asked whether all services could be deployed together for local enterprise use.
- PMA explained the current compose only launches Den services and worker proxy; it does not launch a true OpenWork worker runtime.
- PO clarified the target is centralized management for a company of ~20 people, with all hosting on the local network.
- PO requested adding this mode and a usage guide.

## Workflow Execution Plan

| Step | Assigned Agent | Purpose | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `business_analyst` | Validate requirements and acceptance criteria | Readiness notes | completed |
| 2 | `technical_architect` | Confirm technical approach and impact surface | Impact and design notes | completed |
| 3 | `developer` | Implement code and tests | Changed files and test notes | completed |
| 4 | `qa_engineer` | Verify behavior and regression coverage | Evidence and test results | completed |
| 5 | `tech_lead` | Final technical signoff | Approval or bounce-back | completed |
| 6 | `workflow_runner` | Finalize lifecycle | Registries, SCR/archive updates, commit, final report | completed_without_commit |

# Post Implementation Task Updates

Agents must append their updates here using:

## <Agent Name>: Post Implementation Expectations

- Observable outcome / expected behavior.

## Developer: Post Implementation Expectations

- Den API accepts `PROVISIONER_MODE=static` with `STATIC_WORKER_URLS` and static worker health-check settings.
- Static worker provisioning selects a configured URL that is not already assigned to an active static `worker_instance`; if no URL remains, the worker is marked `failed` by existing provisioning failure handling and a clear error is logged.
- A healthy static worker endpoint causes provisioning to return provider `static`, region `on-prem`, and status `healthy`, which records a `worker_instance` and prevents the cloud worker from staying in `provisioning`.
- Docker docs and compose comments describe on-prem/static worker mode, required env vars, validation commands, and the limitation that `static-worker-smoke` is health-only and not a production OpenWork runtime.
- Verification run: `bun test "ee/apps/den-api/test/provisioner-static.test.ts"` passed (5 pass, 0 fail).
- Verification attempted: `pnpm --filter @openwork-ee/den-api build` failed because the local dependency/tooling install is incomplete (`tsup` not found in `@openwork/email` build step); direct Den API typecheck also fails on missing package/type dependencies plus pre-existing TypeScript errors.
- CodeMap validation attempted with `nomadworks_validate`; it failed on repository-wide missing CodeMap coverage, including many pre-existing app/package directories outside this task scope.

## Developer: Post Implementation Expectations

- Den API accepts `PROVISIONER_MODE=static` with `STATIC_WORKER_URLS` configured by Docker as `DEN_STATIC_WORKER_URLS`.
- Cloud/shared worker provisioning in static mode selects a configured URL, checks `/health`, inserts a `worker_instance` with provider `static`, and marks the worker `healthy` when reachable.
- Missing static URLs or failed health checks throw clear provisioning errors; the existing background provisioning handler records the worker as `failed` instead of leaving it in `provisioning`.
- Existing `stub`, `render`, and `daytona` branches remain unchanged.
- Docker docs and compose comments describe static mode, and compose includes a profile-gated `static-worker-smoke` health-only simulation for local validation.
- Verification expectation: run `pnpm --filter @openwork-ee/den-api exec bun test test/provisioner-static.test.ts`; Den DB build should pass, while Den API build may still be blocked by existing unresolved package/type issues unrelated to this change.

## QA Engineer: Post Implementation Expectations

- Reviewed the task file, changed provisioning/env/shared route files, Docker compose/docs, infrastructure docs, root CodeMap, and static provisioner tests for AC-1 through AC-7 coverage.
- Verified static worker behavior with `pnpm --filter @openwork-ee/den-api exec bun test test/provisioner-static.test.ts` (5 pass, 0 fail), covering healthy assignment, active URL exclusion, exhausted URL failure, missing URL failure, and health-check failure.
- Verified Docker static mode wiring with `docker compose --profile static-worker-smoke -f packaging/docker/docker-compose.den-dev.yml config`; rendered config includes `PROVISIONER_MODE=static`, `STATIC_WORKER_URLS=http://static-worker-smoke:8787`, static health-check env vars, and the profile-gated `static-worker-smoke` service.
- Verified Den DB dependency build with `pnpm --filter @openwork-ee/den-db build` (passed).
- Attempted `pnpm --filter @openwork-ee/den-api build`; it failed before Den API typecheck because `@openwork/email` cannot find `tsup` in the current local install (`node_modules` incomplete). Direct `pnpm --filter @openwork-ee/den-api exec tsc -p tsconfig.json` also remains blocked by missing package/type dependencies and pre-existing TypeScript errors outside the static provisioner diff.
- Ran `nomadworks_validate`; it failed on broad pre-existing missing CodeMap coverage across many repository directories, including out-of-scope app/desktop paths. The root `codemap.yml` does include this task's Den static provisioner test command and infrastructure summary.
- Full Docker stack launch and UI worker creation were not run in this QA pass; validation used the targeted Bun provisioner tests plus Docker Compose config rendering and code inspection.

## QA Engineer: Post Implementation Expectations

- QA Engineer verified the static provisioner implementation against AC-1 through AC-7 by inspecting `env.ts`, `provisioner.ts`, worker shared route provisioning, Docker compose, Docker README, and infrastructure documentation.
- Targeted static provisioner tests passed: `bun test "ee/apps/den-api/test/provisioner-static.test.ts"` returned 5 pass / 0 fail; `pnpm --filter @openwork-ee/den-api exec bun test test/provisioner-static.test.ts` returned 5 pass / 0 fail.
- Broader Den API test directory is currently blocked by an environment/dependency issue outside the static provisioner path: `bun test "ee/apps/den-api/test"` returned 24 pass / 1 fail because `@openwork/email` could not be resolved from `src/utils/email/send-email.ts`.
- Build verification remains blocked by local dependency/tooling state: `pnpm --filter @openwork-ee/den-api build` fails during `build:email`; direct `pnpm --filter @openwork-ee/den-api run build:email` reports `tsup` is not recognized for `@openwork/email` and warns `node_modules` is missing. Direct Den API `tsc --noEmit` is also blocked by missing packages/types plus pre-existing TypeScript errors outside the changed static provisioner files.
- Den DB build passed: `pnpm --filter @openwork-ee/den-db build` completed successfully.
- Regression review found existing `stub`, `render`, and `daytona` branch behavior preserved at code-inspection level; static mode is added as a new branch and static URL exclusion is only queried when `env.provisionerMode === "static"`.
- `nomadworks_validate` still fails on broad pre-existing missing CodeMap coverage across repository directories; the root `codemap.yml` now references the Den static provisioner test command and infrastructure source of truth, but validation cannot pass until repository-wide CodeMap coverage is remediated.
- Recommendation: approve with blockers documented. Static implementation ACs are covered by targeted tests and inspection; full Den API build/all-test gates remain blocked by repo/environment dependency issues not introduced by this task.

## Tech Lead: Post Implementation Expectations

- Tech Lead reviewed the static/on-prem provisioner implementation for maintainability and behavior isolation. The implementation adds `PROVISIONER_MODE=static`, static worker URL parsing, health-check based provisioning, active static URL exclusion, and failure propagation through the existing background provisioning handler.
- Existing `stub`, `render`, and `daytona` provisioning branches remain preserved by code inspection; static behavior is isolated to the new env mode and the static-only unavailable URL query.
- Documentation impact is sufficient for this slice: `packaging/docker/README.md`, `packaging/docker/docker-compose.den-dev.yml`, and `INFRASTRUCTURE.md` describe the mode, required env vars, smoke-test limitation, and validation flow.
- Verification rerun by Tech Lead: `pnpm --filter @openwork-ee/den-api exec bun test test/provisioner-static.test.ts` passed with 5 pass / 0 fail; `docker compose --profile static-worker-smoke -f packaging/docker/docker-compose.den-dev.yml config` rendered the static smoke service and static env wiring successfully; `pnpm --filter @openwork-ee/den-db build` passed.
- Required validation rerun by Tech Lead: `nomadworks_validate` failed on broad pre-existing missing CodeMap coverage across many repository directories, including app, enterprise, packages, packaging, scripts, and out-of-scope desktop paths.
- Broader Den API build remains blocked in this local environment: `pnpm --filter @openwork-ee/den-api build` exits non-zero during the build script path already documented by QA/developer environment findings.
- Non-blocking cleanup required before final commit: exclude or intentionally justify the unrelated generated `ee/apps/den-api/src/generated/app-version.ts` diff because it was produced by the build script and is not part of the on-prem/static worker feature behavior.
- Final technical recommendation: approve with documented environmental/repository blockers after the unrelated generated version diff is resolved or explicitly accepted by PMA as part of finalization; no functional bounce-back is required for the static provisioning implementation.
- Finalization cleanup follow-up: confirmed `ee/apps/den-api/src/generated/app-version.ts` only changed the generated desktop latest-version constant from `0.11.212` to `0.13.8`, which is unrelated to TASK-2026-05-18-001 static/on-prem worker provisioning; reverted only that file back to HEAD and left task-related changes untouched.

## Workflow Runner: Post Implementation Expectations

- Workflow Runner completed readiness review, specialist pre-sync, implementation delegation, QA verification, and Tech Lead signoff for TASK-2026-05-18-001.
- Final verification rerun by Workflow Runner: `pnpm --filter @openwork-ee/den-api exec bun test test/provisioner-static.test.ts` passed with 6 pass / 0 fail.
- Final verification rerun by Workflow Runner: `pnpm --filter @openwork-ee/den-db build` passed.
- Final verification rerun by Workflow Runner: `DEN_PROVISIONER_MODE=static DEN_STATIC_WORKER_URLS=http://static-worker-smoke:8787 docker compose --profile static-worker-smoke -f packaging/docker/docker-compose.den-dev.yml config` rendered static mode env wiring and the smoke worker service successfully.
- Final verification attempted by Workflow Runner: `pnpm --filter @openwork-ee/den-api build` failed because the local `@openwork/email` build step cannot find `tsup` and reports missing `node_modules`; this is documented as an environment/dependency blocker outside the static provisioner behavior.
- Full OpenWork runtime worker was not launched in Docker. The Docker validation used the documented `static-worker-smoke` health-only simulation plus targeted provisioner tests; documentation explicitly states this simulation is not a production OpenWork runtime.
- No final commit was created by Workflow Runner because PMA's handoff requested a final report and did not explicitly authorize commit/archival closure.

## Developer: Post Implementation Expectations

- Bounce-back fix added a per-request `AbortController` timeout to static worker health checks so `STATIC_WORKER_HEALTHCHECK_TIMEOUT_MS` is enforced even when a worker endpoint accepts a connection and never returns a response.
- Added a hanging health endpoint test (`/hang-health`) that verifies static provisioning rejects with the timeout error and completes well under the test guard threshold.
- Verification rerun: `pnpm --filter @openwork-ee/den-api exec bun test test/provisioner-static.test.ts` passed with 6 pass / 0 fail.
- Verification rerun: `docker compose --profile static-worker-smoke -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml config` with `DEN_PROVISIONER_MODE=static`, `DEN_STATIC_WORKER_URLS=http://static-worker-smoke:8787`, `DEN_STATIC_WORKER_HEALTH_PATH=/health`, and `DEN_STATIC_WORKER_HEALTHCHECK_TIMEOUT_MS=10000` rendered successfully with the expected static env wiring and `static-worker-smoke` service.
- Confirmed `ee/apps/den-api/src/generated/app-version.ts` has no diff and remains reverted/out of scope.

## Tech Lead: Post Implementation Expectations

- Resumed final technical review after the Developer bounce-back and verified the AC-4 timeout issue is resolved: static worker health checks now pass an `AbortController` signal to `fetch()` and bound each request by the remaining configured health-check timeout.
- Reviewed the new hanging endpoint test and confirmed it exercises the formerly risky path where an endpoint accepts a request but never returns a response.
- Final verification rerun: `pnpm --filter @openwork-ee/den-api exec bun test test/provisioner-static.test.ts` passed with 6 pass / 0 fail, including healthy assignment, active URL exclusion, exhausted URL failure, missing URL failure, unhealthy endpoint failure, and hanging endpoint abort behavior.
- Final compose verification rerun: `docker compose --profile static-worker-smoke -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml config` with static env vars rendered `PROVISIONER_MODE=static`, `STATIC_WORKER_URLS=http://static-worker-smoke:8787`, static health-check env vars, and the `static-worker-smoke` service.
- Dependency build verification rerun: `pnpm --filter @openwork-ee/den-db build` passed.
- Broader Den API build remains blocked in the local environment with `pnpm --filter @openwork-ee/den-api build` exiting non-zero during the package build script; this is consistent with prior Developer/QA evidence and not introduced by the static provisioner diff.
- Required `nomadworks_validate` rerun still fails on broad pre-existing missing CodeMap coverage across repository directories; the root `codemap.yml` includes this task's static provisioner command and infrastructure source-of-truth pointer.
- Confirmed `ee/apps/den-api/src/generated/app-version.ts` no longer appears in `git status`, so the unrelated generated version diff has been removed from this task.
- Final technical decision: approved for workflow finalization with environmental/repository validation blockers documented; no further Developer bounce-back required.

## Tech Lead: Post Implementation Expectations

- Independent final technical review completed after PMA requested re-review of `TASK-2026-05-18-001`; reviewed the task file fully, inspected the static/on-prem provisioner diff, Docker/docs changes, root CodeMap update, and final working-tree scope.
- Verified the prior bounce-back fix remains correct: `waitForHealth()` now supplies an `AbortController` signal to `fetch()` and the static provisioner test suite includes the hanging `/hang-health` endpoint path.
- Verification rerun: `pnpm --filter @openwork-ee/den-api exec bun test test/provisioner-static.test.ts` passed with 6 pass / 0 fail.
- Verification rerun: `docker compose --profile static-worker-smoke -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml config` with static env vars rendered the static provisioner env wiring and the profile-gated `static-worker-smoke` service.
- Verification rerun: `pnpm --filter @openwork-ee/den-db build` passed.
- Verification attempted: `pnpm --filter @openwork-ee/den-api build` still fails before Den API compilation because `@openwork/email` cannot find `tsup` in the current local install; direct `pnpm --filter @openwork-ee/den-api run build:email` confirms the missing-tooling blocker.
- Required `nomadworks_validate` rerun still fails on broad repository-wide missing CodeMap coverage that predates and exceeds this static provisioner slice.
- Discrepancy resolved during review: the Den API build attempt regenerated `ee/apps/den-api/src/generated/app-version.ts` from the local desktop package version; restored the file back to HEAD so it no longer appears in `git status` and remains out of scope.
- Final technical decision: approved for PMA/workflow finalization with the documented environment/repository validation blockers; no functional bounce-back is required for the on-prem/static worker implementation.

## Tech Lead: Post Implementation Expectations

- Fresh final review completed against current worktree changes for TASK-2026-05-18-001. The static/on-prem provisioner remains behaviorally isolated to `PROVISIONER_MODE=static`; existing `stub`, `render`, and `daytona` branches are not modified beyond the shared health-check helper timeout support.
- Verified the bounce-back fix: static health checks use `AbortController` with the remaining configured timeout, so an endpoint that accepts the connection but never responds cannot hang provisioning indefinitely.
- Re-ran targeted provisioner coverage: `pnpm --filter @openwork-ee/den-api exec bun test test/provisioner-static.test.ts` passed with 6 pass / 0 fail, including the hanging `/hang-health` abort test.
- Re-ran compose config validation with static env vars: `docker compose --profile static-worker-smoke -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml config` rendered `PROVISIONER_MODE=static`, `STATIC_WORKER_URLS=http://static-worker-smoke:8787`, static health-check env vars, and the profile-gated `static-worker-smoke` service.
- Re-ran dependency package build: `pnpm --filter @openwork-ee/den-db build` passed.
- Re-ran required navigation validation: `nomadworks_validate` still fails on broad pre-existing missing CodeMap coverage across repository source directories; this remains outside the static provisioner behavior and should be handled as repository-maintenance follow-up.
- Found and corrected the recurring unrelated generated diff: `ee/apps/den-api/src/generated/app-version.ts` had reappeared as modified in `git status`; restored it to HEAD. Current status no longer shows that file.
- Final technical decision: approved for PMA/workflow finalization. No further Developer bounce-back is required for the static/on-prem worker mode implementation.
