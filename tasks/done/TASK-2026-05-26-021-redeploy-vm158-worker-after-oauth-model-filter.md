# TASK-2026-05-26-021 — Redeploy VM158 worker after OAuth model filter

---
complexity: standard
track: implementation
slice: foundation
status: implemented
owner: product_manager
scr_required: false
---

## Objective

Rebuild/redeploy only the VM158 worker runtime with the selected-model filtering fix for OAuth managed providers and validate OpenAI shows only Den-selected models.

## Context

Selected-model filtering fix committed and pushed:

- `fe786b640` — `fix: TASK-2026-05-26-020 filter managed OAuth models`

VM158:

- Den Web: `http://192.168.1.51:3005`
- Den API: `http://192.168.1.51:8788`
- Worker: `http://192.168.1.51:8787`

Known target state from `TASK-2026-05-26-019`:

- Den OpenAI selected models: `gpt-5.4`, `gpt-5.5`.
- Before fix, worker/OpenCode provider-list returned 54 OpenAI models.
- After fix, provider-list should return only the two selected OpenAI models while NVIDIA remains four models.

## Acceptance Criteria

- **AC-1:** Rebuild/redeploy only the VM158 worker runtime/container from a checkout containing `fe786b640`.
- **AC-2:** Do not redeploy/reset Den Web/API/MySQL, desktop, users/orgs/workers, or provider credentials.
- **AC-3:** Verify worker health after redeploy.
- **AC-4:** Verify managed provider sync still succeeds and OpenCode remains healthy.
- **AC-5:** Verify worker/OpenCode provider-list returns OpenAI with only `gpt-5.4` and `gpt-5.5`.
- **AC-6:** Verify NVIDIA still returns exactly the four Den-selected models.
- **AC-7:** Capture sanitized evidence with no secrets/tokens/cookies/passwords.

## Non-goals

- Do not rebuild/reinstall desktop.
- Do not create or reveal provider credentials/API keys.
- Do not reset VM158 DB or volumes.
- Do not drive desktop UI.

## Discussion Record

- Product Owner asked PMA to proceed through review, commit, deploy, and validation.

# Post Implementation Task Updates

## Workflow Runner: Post Implementation Expectations

- Changed files:
  - `apps/server/src/server.ts`
  - `apps/server/src/managed-provider-sync.e2e.test.ts`
  - `evidences/TASK-2026-05-26-021-redeploy-vm158-worker-after-oauth-model-filter/SUMMARY.md`
  - `evidences/TASK-2026-05-26-021-redeploy-vm158-worker-after-oauth-model-filter/logs/01-worker-redeploy.log`
  - `evidences/TASK-2026-05-26-021-redeploy-vm158-worker-after-oauth-model-filter/logs/02-sync-health.log`
  - `evidences/TASK-2026-05-26-021-redeploy-vm158-worker-after-oauth-model-filter/logs/03-runtime-provider-state.log`
  - `evidences/TASK-2026-05-26-021-redeploy-vm158-worker-after-oauth-model-filter/logs/04-focused-server-test.log`
  - `evidences/TASK-2026-05-26-021-redeploy-vm158-worker-after-oauth-model-filter/logs/05-server-typecheck.log`
  - `evidences/TASK-2026-05-26-021-redeploy-vm158-worker-after-oauth-model-filter/logs/06-nomadworks-validate.log`
  - `evidences/TASK-2026-05-26-021-redeploy-vm158-worker-after-oauth-model-filter/logs/07-worker-reredeploy-after-live-shape-fix.log`
  - `evidences/TASK-2026-05-26-021-redeploy-vm158-worker-after-oauth-model-filter/logs/08-runtime-provider-state-after-live-shape-fix.log`
- Operational outcome:
  - Initial VM158 worker-only redeploy from source containing `fe786b640` completed successfully and preserved Den web/API/MySQL.
  - Live validation exposed a same-scope production mismatch not covered by TASK-020's original regression shape: VM158 `/workspace/<id>/opencode/config/providers` returned a top-level `providers` payload, and `openai` still exposed 54 models despite `opencode.jsonc` containing only two selected models.
  - The worker-side provider-list filter was extended to handle `all`, `providers` array, and `providers` object response shapes, with focused regression coverage added for the live `providers` array shape plus the object shape.
  - After copying the corrected worker server files to VM158 and rebuilding only `openwork-worker-158_openwork-host_1`, live validation confirmed `openai` now returns exactly `gpt-5.4` and `gpt-5.5`, NVIDIA remains exactly four models, managed-provider sync still returns `applied`, and session/OpenCode endpoints continue to return `200`.
- Verification:
  - `pnpm --filter openwork-server test src/managed-provider-sync.e2e.test.ts` — passed, 6 tests / 59 assertions.
  - `pnpm --filter openwork-server typecheck` — passed.
  - `nomadworks_validate` — failed only on pre-existing repository-wide CodeMap/link validation gaps outside TASK-021 scope.
- AC coverage:
  - AC-1: Covered by worker-only redeploy evidence in `01` and corrected worker-only reredeploy evidence in `07`.
  - AC-2: Covered by both redeploy logs showing only `openwork-worker-158_openwork-host_1` recreated while Den web/API/MySQL remained running.
  - AC-3: Covered by `02` and `08` showing healthy container state plus `/health` `200`.
  - AC-4: Covered by `02` and `08` showing Den managed-provider sync `applied` and healthy session/OpenCode endpoints afterward.
  - AC-5: Covered by `03` documenting the discovered 54-model discrepancy, `04` proving corrected regression coverage, and `08` proving final live OpenAI output is exactly `gpt-5.4|gpt-5.5`.
  - AC-6: Covered by `04` and `08` proving NVIDIA remained exactly the four Den-selected models.
  - AC-7: Covered by the sanitized evidence packet; no secrets, tokens, cookies, passwords, or provider credentials were written to artifacts.
- Documentation impact:
  - No steady-state product or architecture docs changed; this task required code correction, VM158 worker redeploy, task updates, and evidence only.
- Open risks:
  - `nomadworks_validate` still reports pre-existing repository-wide CodeMap/link failures unrelated to this task.
  - VM158 deployment remains a minimal worker-source overlay/rebuild path rather than a normalized full deployment pipeline.

## Tech Lead: Post Implementation Review

- Decision: Approved.
- Reviewed `apps/server/src/server.ts`, `apps/server/src/managed-provider-sync.e2e.test.ts`, and the full TASK-021 evidence packet.
- Confirmed the same-scope correction broadened worker-side provider-list filtering to the live VM158 response shape without regressing the original `all` shape coverage.
- Confirmed final live validation now shows `openai MODEL_COUNT=2 MODELS=gpt-5.4|gpt-5.5` while NVIDIA remains four models and sync/health/session endpoints stay healthy.
- Remaining non-blocking risks are limited to the pre-existing repo-wide CodeMap validation failures and the VM's ad-hoc worker overlay deployment approach.

## QA Engineer: Verification Review

- Result: PASS.
- Reviewed the task file, evidence summary, and logs `01` through `08`.
- Confirmed the task captured the initial live discrepancy, the corrective server-side regression coverage, and the final successful VM158 redeploy/validation state.
- Confirmed AC-1 through AC-7 are satisfied with sanitized evidence and no secret leakage observed.

## Workflow Runner: Finalization

- Delegated finalization completed for TASK-021.
- Task archived to `tasks/done/`.
- Registry updates completed in `tasks/current.md` and `tasks/done.md`.
- No SCR file updates were required because `scr_required: false` and no active SCR tracked this deployment task.
