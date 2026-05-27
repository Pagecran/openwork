# TASK-2026-05-26-021 Evidence Summary

- `01-worker-redeploy.log` proves the first worker-only VM158 redeploy was built from source containing `fe786b640` and recreated only `openwork-worker-158_openwork-host_1`.
- `02-sync-health.log` proves worker health and Den-managed sync stayed healthy after the first redeploy.
- `03-runtime-provider-state.log` captures the live discrepancy discovered during validation: VM158 returned a `default/providers` response shape and still exposed 54 OpenAI models while `opencode.jsonc` contained only 2 selected models.
- `04-focused-server-test.log` and `05-server-typecheck.log` prove the same-scope correction was implemented and verified locally with focused automated coverage.
- `06-nomadworks-validate.log` records the expected pre-existing repository-wide CodeMap/link validation failures, with no task-specific validation regression identified.
- `07-worker-reredeploy-after-live-shape-fix.log` proves only the VM158 worker container was rebuilt/recreated again after the live-shape correction was copied into the worker source.
- `08-runtime-provider-state-after-live-shape-fix.log` proves the final VM158 state: worker health `200`, managed-provider sync `applied`, sessions/app endpoints still load, NVIDIA remains 4 selected models, and OpenAI is reduced to exactly `gpt-5.4` and `gpt-5.5`.

## Acceptance Criteria Traceability

- **AC-1:** `01-worker-redeploy.log`, `07-worker-reredeploy-after-live-shape-fix.log`
- **AC-2:** `01-worker-redeploy.log`, `07-worker-reredeploy-after-live-shape-fix.log`
- **AC-3:** `02-sync-health.log`, `08-runtime-provider-state-after-live-shape-fix.log`
- **AC-4:** `02-sync-health.log`, `08-runtime-provider-state-after-live-shape-fix.log`
- **AC-5:** `03-runtime-provider-state.log`, `04-focused-server-test.log`, `08-runtime-provider-state-after-live-shape-fix.log`
- **AC-6:** `04-focused-server-test.log`, `08-runtime-provider-state-after-live-shape-fix.log`
- **AC-7:** all logs are sanitized; no secrets, bearer tokens, cookies, passwords, or provider credentials are included.
