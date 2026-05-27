# TASK-2026-05-26-016 — Redeploy VM158 worker managed-provider sync route

---
complexity: standard
track: implementation
slice: foundation
 status: implemented
owner: product_manager
scr_required: false
---

## Objective

Rebuild/redeploy only the VM158 worker runtime so it includes the worker-side `POST /managed-providers/sync` route required by Den managed-provider sync.

## Context

Live read-only diagnostic in `TASK-2026-05-26-014` confirmed:

- Den org provider `nvidia` exists with credentials and four models.
- Installed desktop contains managed-provider sync client code from `01e846d02`.
- Desktop/Den did call managed-provider sync.
- Den returned `502` because VM158 worker returned `404` for `POST /managed-providers/sync`.
- VM158 worker runtime therefore lacks the route needed to apply provider config.

Product Owner approved a worker-only redeploy.

VM158:

- Den Web: `http://192.168.1.51:3005`
- Den API: `http://192.168.1.51:8788`
- Worker: `http://192.168.1.51:8787`

## Acceptance Criteria

- **AC-1:** Rebuild/redeploy only the VM158 worker runtime/container so it includes `POST /managed-providers/sync`.
- **AC-2:** Do not redeploy/reset Den Web/API/MySQL unless unavoidable and explicitly approved.
- **AC-3:** Do not create/delete/modify users, orgs, workers, or provider credentials.
- **AC-4:** Verify worker health after redeploy.
- **AC-5:** Verify `POST /managed-providers/sync` no longer returns `404`; use sanitized/non-secret validation only.
- **AC-6:** Trigger or verify managed-provider sync for existing Den `nvidia` provider without exposing credentials.
- **AC-7:** Confirm worker/provider/model state shows `nvidia`/4 models available, sanitized.

## Non-goals

- Do not rebuild/reinstall desktop.
- Do not create or reveal provider credentials/API keys.
- Do not reset VM158 DB or volumes.
- Do not submit unrelated UI actions.

## Discussion Record

- Product Owner approved worker-only redeploy after root cause was confirmed as worker runtime missing `POST /managed-providers/sync`.

# Post Implementation Task Updates

## Workflow Runner: Post Implementation Expectations

- Changed artifacts:
  - `evidences/TASK-2026-05-26-016-redeploy-vm158-worker-managed-provider-sync-route/SUMMARY.md`
  - `evidences/TASK-2026-05-26-016-redeploy-vm158-worker-managed-provider-sync-route/logs/01-worker-redeploy.log`
  - `evidences/TASK-2026-05-26-016-redeploy-vm158-worker-managed-provider-sync-route/logs/02-route-health.log`
  - `evidences/TASK-2026-05-26-016-redeploy-vm158-worker-managed-provider-sync-route/logs/03-provider-state.log`
- Operational outcome:
  - VM158 worker container `openwork-worker-158_openwork-host_1` was rebuilt/recreated without redeploying Den web, Den API, or MySQL.
  - The worker runtime now serves `POST /managed-providers/sync` and no longer returns `404` when called through the host-token worker path.
  - Existing Den `nvidia` managed-provider data was applied to the worker through the supported worker sync route using sanitized evidence only.
  - Worker state now records Den-managed provider application metadata and exposes the `nvidia` provider config with 4 models available.
- AC coverage:
  - AC-1: Satisfied by worker-only rebuild/recreate of `openwork-worker-158_openwork-host_1`.
  - AC-2: Satisfied; Den web/API/MySQL containers were not rebuilt or restarted.
  - AC-3: Satisfied; no users, orgs, workers, or provider credentials were created/deleted/edited.
  - AC-4: Satisfied by post-redeploy worker `/health` checks.
  - AC-5: Satisfied by sanitized `POST /managed-providers/sync` validation moving from `404` to `200`.
  - AC-6: Satisfied by applying the existing Den `nvidia` provider payload through the supported worker sync route sourced from existing Den state.
  - AC-7: Satisfied by sanitized worker config/state evidence showing `nvidia` plus 4 models.
- Documentation impact:
  - No product or architecture truth docs changed for this VM-specific redeploy.
- Open risks:
  - VM158 deployment was using a worker runtime path that still resolved an older bundled/downloaded `openwork-server` sidecar; the worker-only redeploy required forcing the worker container to use the repo-local `openwork-server` entrypoint so the route present in source was actually served.
