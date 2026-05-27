# TASK-2026-05-26-018 — Redeploy VM158 worker after model config sanitizer

---
complexity: standard
track: implementation
slice: foundation
status: implemented
owner: product_manager
scr_required: false
---

## Objective

Rebuild/redeploy only the VM158 worker runtime with the Den-to-OpenCode model config sanitizer fix and validate that managed provider sync applies `nvidia` without breaking OpenCode.

## Context

Sanitizer fix committed and pushed:

- `acf01192d` — `fix: TASK-2026-05-26-017 sanitize managed provider model config`

VM158 currently has:

- Den Web: `http://192.168.1.51:3005`
- Den API: `http://192.168.1.51:8788`
- Worker: `http://192.168.1.51:8787`

The worker previously applied `nvidia` provider config but OpenCode reload failed because object-valued catalog `experimental` was copied into OpenCode config.

## Acceptance Criteria

- **AC-1:** Rebuild/redeploy only the VM158 worker runtime/container from a checkout containing `acf01192d`.
- **AC-2:** Do not redeploy/reset Den Web/API/MySQL, desktop, users/orgs/workers, or provider credentials.
- **AC-3:** Verify worker health after redeploy.
- **AC-4:** Trigger/apply managed-provider sync for existing Den `nvidia` provider without exposing credentials.
- **AC-5:** Confirm sync returns success and OpenCode reload does not fail with `ConfigInvalidError`.
- **AC-6:** Confirm sanitized worker/OpenCode provider state shows `nvidia` with four models and no object-valued `experimental` in runtime config.
- **AC-7:** Confirm remote workspace/session endpoints recover enough to load tasks/sessions, sanitized.

## Non-goals

- Do not rebuild/reinstall desktop.
- Do not create or reveal provider credentials/API keys.
- Do not reset VM158 DB or volumes.
- Do not drive desktop UI.

## Discussion Record

- Product Owner instructed PMA to continue through commit, deploy, and validation without stopping.

# Post Implementation Task Updates

## Workflow Runner: Post Implementation Expectations

- Changed artifacts:
  - `evidences/TASK-2026-05-26-018-redeploy-vm158-worker-after-model-config-sanitizer/SUMMARY.md`
  - `evidences/TASK-2026-05-26-018-redeploy-vm158-worker-after-model-config-sanitizer/logs/01-worker-redeploy.log`
  - `evidences/TASK-2026-05-26-018-redeploy-vm158-worker-after-model-config-sanitizer/logs/02-sync-health.log`
  - `evidences/TASK-2026-05-26-018-redeploy-vm158-worker-after-model-config-sanitizer/logs/03-runtime-session-state.log`
- Operational outcome:
  - VM158 worker checkout was still on `63196ada` and lacked the task-017 sanitizer fix at task start.
  - The worker checkout fetched `origin/dev-0.13.13-integration` at `acf01192d` and restored only `apps/server/src/server.ts` plus `apps/server/src/managed-provider-sync.e2e.test.ts` into the worker build context so the required sanitizer fix could be deployed without touching Den containers or VM data.
  - Only `openwork-worker-158_openwork-host_1` was rebuilt and recreated.
  - Post-redeploy Den managed-provider sync for the existing worker returned `applied` with two providers, and the worker-side sync route returned `200`.
  - Authenticated worker endpoints recovered: `/workspaces`, `/workspace/ws_c52ddf65534b/sessions`, `/workspace/ws_c52ddf65534b/opencode/config/providers`, and `/opencode/app` all returned `200` after sync.
  - Sanitized runtime config shows `nvidia` with 4 models and no object-valued `experimental`; parsed `opencode.jsonc` also shows the `openai` provider models no longer contain object-valued `experimental`.
- AC coverage:
  - AC-1: Covered by fetching `origin/dev-0.13.13-integration` at `acf01192d`, restoring the task-017 worker server files into `/srv/openwork`, and rebuilding only the worker container from that updated checkout.
  - AC-2: Covered by leaving `openwork-den-static-158_web_1`, `openwork-den-static-158_den_1`, and `openwork-den-static-158_mysql_1` running and untouched.
  - AC-3: Covered by post-redeploy `/health` returning `200` and the worker container returning to healthy state.
  - AC-4: Covered by invoking the existing Den `POST /v1/workers/:id/managed-providers/sync` path with sanitized bearer usage only.
  - AC-5: Covered by Den `200 applied`, worker `POST /managed-providers/sync 200`, successful post-sync endpoint reads, and no observed `ConfigInvalidError` in the checked log window.
  - AC-6: Covered by sanitized provider/runtime state showing `nvidia` with 4 models plus parsed `opencode.jsonc` checks proving object-valued `experimental` is absent.
  - AC-7: Covered by successful authenticated workspace/session/OpenCode endpoint responses after sync.
- Documentation impact:
  - No steady-state product or architecture docs changed; this was a VM-specific worker redeploy and validation task.
- Open risks:
  - VM158 still depends on an uncommitted worker-only `packaging/docker/Dockerfile` override from TASK-016 to force the repo-local `openwork-server` entrypoint.
  - The worker checkout remains on an older base commit with the task-017 server files restored from `origin/dev-0.13.13-integration`; this was the minimal worker-only deployment path that avoided disturbing the Den stack or local deployment files.
  - `nomadworks_validate` remains blocked by broad pre-existing repo CodeMap/link issues unrelated to this deployment task.

## Tech Lead: Post Implementation Review

- Decision: Approved.
- Reviewed the task file and all TASK-018 evidence artifacts.
- Verified the worker-only scope was preserved and the VM158 worker source was updated from `origin/dev-0.13.13-integration` at `acf01192d` before the worker rebuild.
- Verified only the worker container was rebuilt/recreated and Den web/API/MySQL remained untouched.
- Verified the Den managed-provider sync path returned `200 applied`, the worker-side sync route returned `200`, and post-sync worker/OpenCode endpoints recovered to `200`.
- Verified the runtime evidence shows `nvidia` with 4 models and no object-valued `experimental` in parsed `opencode.jsonc`.
- Open risk retained: VM158 deployment still depends on the pre-existing local Dockerfile/entrypoint override and minimal file-restore deployment state.

## QA Engineer: Verification Review

- Result: PASS.
- Reviewed AC traceability across the task file and evidence packet.
- Verified worker `/health`, Den sync success, worker sync success, session recovery, provider config recovery, and `opencode/app` recovery after redeploy.
- Verified sanitized runtime parsing showed `HAS_OBJECT_EXPERIMENTAL=false`, `nvidia` remained at 4 models, and no real credentials were printed in evidence.
- Minor caution only: the no-`ConfigInvalidError` claim is based on successful runtime recovery plus absence in the inspected post-sync log window rather than a full historical log sweep.

## Workflow Runner: Finalization

- Delegated finalization completed for TASK-018.
- Task archived to `tasks/done/`.
- Registry updates completed in `tasks/current.md` and `tasks/done.md`.
- No SCR file updates were required because `scr_required: false` and no active SCR tracked this deployment task.
- `nomadworks_validate` was re-run and failed only on pre-existing repo-wide CodeMap/link validation gaps outside TASK-018 scope.
