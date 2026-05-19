---
id: TASK-2026-05-19-001
title: Finalize production on-prem Den worker deployment runbook
complexity: standard
track: implementation
slice: foundation
status: done
owner: developer
created: 2026-05-19
target_repo: D:\openwork
out_of_scope_repos:
  - D:\openwork\.codenomad\worktrees\Pagec_tree
  - D:\tauri
  - D:\opencode
scr_status: approved_by_po_chat
---

# Task: Finalize production on-prem Den worker deployment runbook

## Target Repo Intake

1. Target repo: `D:\openwork`
2. Out of scope repos: `D:\openwork\.codenomad\worktrees\Pagec_tree`, `D:\tauri`, `D:\opencode`, `apps/desktop/src-tauri/`
3. Planned output: Make the existing Den static/on-prem worker mode usable for a real LAN deployment by documenting and wiring a production worker container/compose path, then commit and push.

## Background / Problem Context

`TASK-2026-05-18-001` added Den `PROVISIONER_MODE=static`, where Den assigns a pre-running LAN worker URL from `DEN_STATIC_WORKER_URLS`. That unblocks Den control-plane semantics, but the Product Owner now needs enough packaging and documentation for another agent to launch a real enterprise/on-prem deployment, not just the `static-worker-smoke` health-only simulation.

The repository already has an OpenWork host Docker surface in `packaging/docker/Dockerfile` and `packaging/docker/docker-compose.yml`, but it appears pinned to an older orchestrator version and is not clearly connected to Den static mode documentation.

## Objective

Finalize the practical on-prem deployment path by ensuring the docs and Docker examples explain how to run:

- Den control plane on the LAN.
- One or more real OpenWork host/worker containers on the LAN.
- Den static mode pointing to those worker URLs.
- Validation commands an external agent can follow.

## Scope

In scope:

- Update worker Docker compose/docs so a real OpenWork worker container path is clear and version-aligned where appropriate.
- Add a complete operator runbook for enterprise/on-prem LAN deployment.
- Include commands for single worker and multiple workers.
- Include validation, restart, stop, and troubleshooting steps.
- Keep Den `static-worker-smoke` documented as simulation only.
- Run config/build/test checks feasible in this environment.

Out of scope:

- New dynamic scheduler/provisioner.
- Kubernetes/Proxmox automation.
- Secrets management integration beyond documenting required env vars/tokens.
- Editing out-of-scope repos or untracked `apps/desktop/src-tauri/`.

## Acceptance Criteria

- AC-1: A real on-prem OpenWork worker container deployment path is documented and uses the current OpenWork orchestrator version or explains how to override it.
- AC-2: Den static mode docs show exactly how to point `DEN_STATIC_WORKER_URLS` to one or more real LAN workers.
- AC-3: The runbook includes startup, validation, adding a shared workspace, stopping/restarting, and troubleshooting commands.
- AC-4: The docs clearly distinguish `static-worker-smoke` from a real OpenWork runtime worker.
- AC-5: Feasible config/test checks pass and are recorded.
- AC-6: Existing Den OAuth and static provisioning behavior remains unchanged.

## Evidence Expectations

- Changed files summary.
- Commands run and results.
- Any blockers or unverified production assumptions.
- AC-by-AC verification mapping.

## Decisions Taken On PO Behalf

- Prioritize a static LAN worker pool runbook over dynamic container orchestration because static mode already exists and is the fastest safe path for enterprise LAN use.

## Discussion Record

- PO asked if everything is ready for a real enterprise deployment.
- PMA clarified Den static mode is ready as a control plane but the real worker packaging/runbook needs finalization.
- PO requested finalizing quickly, pushing all changes, and providing complete docs for another agent to launch.

# Post Implementation Task Updates

Agents must append concise evidence and expectations here.

## Developer: Post Implementation Expectations

- Updated `packaging/docker/Dockerfile` and `packaging/docker/docker-compose.yml` so the real OpenWork Host worker container defaults to `openwork-orchestrator@0.13.8`, exposes configurable LAN host/port/workspace/data mounts, and includes a `/health` healthcheck.
- Added `packaging/docker/ONPREM_DEN_STATIC_RUNBOOK.md` with PowerShell and Bash runbook steps for one or more real LAN workers, Den `DEN_PROVISIONER_MODE=static`, `DEN_STATIC_WORKER_URLS`, validation, UI expectations, restart/stop, logs, and troubleshooting.
- Updated `packaging/docker/README.md` to link the runbook, identify the production worker path, document version override semantics, and clearly distinguish `static-worker-smoke` as health-only simulation.
- Added local CodeMaps for `packaging/`, `packaging/docker/`, and `packaging/aur/` so the changed packaging area is indexed.
- Verification evidence:
  - PASS: `docker compose -p openwork-worker-1 config` from `packaging/docker` rendered worker compose with build arg `OPENWORK_ORCHESTRATOR_VERSION: 0.13.8`, configurable host port, workspace/data mounts, and healthcheck.
  - PASS: Den static config render with `DEN_PROVISIONER_MODE=static`, `DEN_STATIC_WORKER_URLS=http://192.168.1.50:8787,http://192.168.1.51:8787`, health path `/health`, and timeout `10000` rendered `PROVISIONER_MODE: static` and `STATIC_WORKER_URLS` correctly.
  - PASS: `docker compose --profile static-worker-smoke -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml config` rendered the smoke profile with `STATIC_WORKER_URLS=http://static-worker-smoke:8787`.
  - PASS: `git grep -n "0\.11\.22\|OPENWORK_ORCHESTRATOR_VERSION\|static-worker-smoke" -- packaging/docker apps/orchestrator/package.json` found no remaining `0.11.22` packaging pin and confirmed expected version/smoke references.
  - PASS: `npm view openwork-orchestrator@0.13.8 version` returned `0.13.8`, confirming the documented worker package pin is published/installable.
  - FAIL/PRE-EXISTING: `nomadworks_validate` still fails on broad repository CodeMap gaps outside this task scope (for example missing CodeMaps under `apps/`, `ee/`, `packages/`, `scripts/`, etc.); packaging-local CodeMap errors introduced by this task were resolved.
  - TOOLING NOTE: An initial `rg ...` check failed because `rg` is not installed in this Windows environment; replaced with passing `git grep` check.
- Expected runtime outcome: an enterprise/LAN operator can start real worker containers, validate each `/health`, set Den static URLs, and create shared/cloud workers in Den that transition from provisioning to healthy against the configured static worker pool.

## Tech Lead: Technical Review Notes

- Target repo: `D:\openwork`; out-of-scope repos respected: `D:\openwork\.codenomad\worktrees\Pagec_tree`, `D:\tauri`, `D:\opencode`, and untracked `apps/desktop/src-tauri/`.
- Reviewed `packaging/docker/Dockerfile`, `packaging/docker/docker-compose.yml`, `packaging/docker/README.md`, `packaging/docker/ONPREM_DEN_STATIC_RUNBOOK.md`, packaging CodeMaps, Den static provisioner/env code, and task evidence.
- Approved for enterprise LAN static worker deployment guidance: the worker image now defaults to `openwork-orchestrator@0.13.8`, matching `apps/orchestrator/package.json`, and `npm view openwork-orchestrator@0.13.8 version` confirmed the published package exists.
- Docker Compose review: worker compose renders the expected build arg, host-port mapping, workspace/data bind mounts, environment-driven tokens/connect host/CORS/approval settings, and `/health` healthcheck. Den compose remains `stub` by default and renders `PROVISIONER_MODE=static` plus `STATIC_WORKER_URLS` only when those env vars are supplied.
- Security review: docs warn operators to set stable bearer tokens and avoid committed secrets. The template still uses local `change-me` defaults and `OPENWORK_CORS_ORIGINS=*`, so it is acceptable as a LAN packaging template but must not be treated as hardened Internet-facing deployment guidance without stronger secret/CORS/TLS/network policy.
- Operator usability review: runbook covers one worker, multiple workers, Den static wiring, UI expectations, validation, smoke-only simulation, restart/stop/logs, and troubleshooting. For multiple workers on one host, operators should use the externally published host ports in `DEN_STATIC_WORKER_URLS`; the current orchestrator connect URL uses the internal OpenWork port, so same-host non-8787 workers may need manual URL/token entry using the published port.
- Regression review: no Den OAuth/static provisioner source behavior was changed in this task. Existing static provisioner tests pass, and the Den compose defaults still preserve prior stub/local behavior unless static env vars are explicitly set.
- Verification evidence added by Tech Lead:
  - PASS: `docker compose -p openwork-worker-1 config` from `packaging/docker` rendered `OPENWORK_ORCHESTRATOR_VERSION: 0.13.8`, port `8787:8787`, workspace/data mounts, env defaults, and healthcheck.
  - PASS: `DEN_PROVISIONER_MODE=static DEN_STATIC_WORKER_URLS=http://192.168.1.50:8787,http://192.168.1.51:8787 DEN_STATIC_WORKER_HEALTH_PATH=/health DEN_STATIC_WORKER_HEALTHCHECK_TIMEOUT_MS=10000 docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml config` rendered `PROVISIONER_MODE: static` and the expected static worker URLs/health settings.
  - PASS: `docker compose --profile static-worker-smoke -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml config` rendered the smoke-only worker profile without making it part of the default stack.
  - PASS: `pnpm --filter @openwork-ee/den-api exec bun test test/provisioner-static.test.ts` returned 6 pass / 0 fail.
  - PASS: `git diff --check` reported no whitespace errors, only existing CRLF conversion warnings.
  - PASS: `git grep -n "0\\.11\\.22\\|OPENWORK_ORCHESTRATOR_VERSION\\|static-worker-smoke" -- packaging/docker apps/orchestrator/package.json` found expected `0.13.8`/override/smoke references and no remaining `0.11.22` packaging pin.
  - FAIL/PRE-EXISTING: `nomadworks_validate` still fails on broad repository CodeMap gaps outside this task scope; the new packaging-local CodeMaps are present and were reviewed.
- Decision: Approved with documented hardening caveats. Packaging/docs are sufficient to proceed with a controlled enterprise LAN static worker deployment run-through, but not sufficient to claim hardened public production exposure.

## QA Engineer: Post Implementation Expectations

- Reviewed the full task file, changed packaging docs/config, local packaging CodeMaps, and current diffs. Verified the runbook is sufficient for an external operator to launch real LAN OpenWork Host workers and point Den static mode at one or more worker URLs.
- AC-1 PASS: `packaging/docker/Dockerfile`, `docker-compose.yml`, `README.md`, and `ONPREM_DEN_STATIC_RUNBOOK.md` document/use `openwork-orchestrator@0.13.8`; `apps/orchestrator/package.json` is also `0.13.8`, and `npm view openwork-orchestrator@0.13.8 version` returned `0.13.8`.
- AC-2 PASS: Den static instructions include `DEN_PROVISIONER_MODE=static` and comma-separated `DEN_STATIC_WORKER_URLS` examples for one and multiple LAN workers.
- AC-3 PASS: Runbook includes startup, validation, UI/shared worker expectations, restart, stop, logs, reset, and troubleshooting commands.
- AC-4 PASS: `static-worker-smoke` is explicitly documented as health-check simulation only and not a production OpenWork runtime.
- AC-5 PASS with noted repository-wide CodeMap exception: worker compose config, Den static compose config, smoke compose config, grep/version checks, and Den static provisioner tests passed. `nomadworks_validate` still fails on pre-existing broad missing CodeMap coverage outside the packaging scope.
- AC-6 PASS: Den OAuth/static provisioning implementation files were not changed by this task, and `pnpm --filter @openwork-ee/den-api exec bun test test/provisioner-static.test.ts` passed 6/6 tests.
- QA verification commands run:
  - PASS: `docker compose -p openwork-worker-1 config` from `packaging/docker` rendered `OPENWORK_ORCHESTRATOR_VERSION: 0.13.8`, LAN connect host, token envs, workspace/data mounts, port `8787`, and `/health` healthcheck.
  - PASS: `docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml config` with real LAN URLs rendered `PROVISIONER_MODE: static`, `STATIC_WORKER_URLS: http://192.168.1.50:8787,http://192.168.1.51:8787`, health path `/health`, and timeout `10000`.
  - PASS: `docker compose --profile static-worker-smoke -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml config` rendered the smoke service and `STATIC_WORKER_URLS: http://static-worker-smoke:8787`.
  - PASS: `git grep -n "0\\.11\\.22\|OPENWORK_ORCHESTRATOR_VERSION\|static-worker-smoke\|DEN_STATIC_WORKER_URLS\|PROVISIONER_MODE" -- packaging/docker apps/orchestrator/package.json` confirmed expected updated version/static references and no `0.11.22` packaging pin.
  - PASS: `npm view openwork-orchestrator@0.13.8 version` returned `0.13.8`.
  - PASS: `pnpm --filter @openwork-ee/den-api exec bun test test/provisioner-static.test.ts` passed 6 tests, 0 failures.
  - PASS: `git diff --check` reported no whitespace errors; only existing LF-to-CRLF conversion warnings were printed for modified tracked files.
  - FAIL/PRE-EXISTING: `nomadworks_validate` reports missing CodeMaps across many existing source directories (`apps/`, `ee/`, `packages/`, `scripts/`, etc.); the packaging areas touched by this task now have local CodeMaps.
