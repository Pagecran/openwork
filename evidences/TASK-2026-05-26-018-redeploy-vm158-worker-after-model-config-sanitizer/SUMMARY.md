## TASK-2026-05-26-018 Evidence Summary

- Scope: update the VM158 worker checkout to the sanitizer fix from `origin/dev-0.13.13-integration` at `acf01192d`, rebuild/recreate only the worker container, trigger Den managed-provider sync, and verify OpenCode recovers without `ConfigInvalidError`.
- AC-1: VM158 `/srv/openwork` initially lacked the sanitizer fix in the checked-out worker source; the task fetched `origin/dev-0.13.13-integration` at `acf01192d` and restored only `apps/server/src/server.ts` and `apps/server/src/managed-provider-sync.e2e.test.ts` into the worker build context before rebuilding only `openwork-worker-158_openwork-host_1`.
- AC-2: Den web/API/MySQL containers remained running and were not rebuilt or restarted; no volumes, DB, desktop, users, orgs, workers, or provider credentials were reset or modified.
- AC-3: Worker `/health` returned `200` after redeploy and the worker container returned to healthy state.
- AC-4: Existing Den managed-provider sync was triggered through `POST /api/den/v1/workers/:id/managed-providers/sync` with sanitized bearer usage only.
- AC-5: Den sync returned `200 applied`; worker logs showed `POST /managed-providers/sync 200`; worker session/provider/OpenCode endpoints returned `200`; no `ConfigInvalidError` appeared in the checked sync/runtime logs.
- AC-6: Sanitized runtime state showed Den-managed providers applied from `source=den`; `nvidia` remained present with 4 models; parsed `opencode.jsonc` showed no object-valued `experimental` for either `nvidia` or `openai` provider models.
- AC-7: Remote workspace/session recovery was proven through successful authenticated worker endpoints: `/workspaces`, `/workspace/ws_c52ddf65534b/sessions`, `/workspace/ws_c52ddf65534b/opencode/config/providers`, and `/opencode/app`.

### Evidence Files

- `logs/01-worker-redeploy.log` — VM158 checkout state, fetched branch/commit, worker-only source update, rebuild/recreate commands, and affected containers.
- `logs/02-sync-health.log` — post-redeploy health checks plus Den-managed provider sync success and sanitized Den/worker sync log confirmation.
- `logs/03-runtime-session-state.log` — sanitized runtime config, provider/session endpoint recovery, managed-provider revision markers, and object-`experimental` absence checks.

### Important Implementation Note

- VM158 was not actually running source containing `acf01192d` at the start of this task. The worker checkout was still on `63196ada` and raw-spread `model.config` into OpenCode config. The minimal safe fix was to fetch `origin/dev-0.13.13-integration`, restore only the task-017 server files into the worker checkout, preserve the pre-existing TASK-016 Dockerfile override that forces the repo-local server entrypoint, and then rebuild only the worker container.
- `nomadworks_validate` was re-run in the local repo after evidence/registry updates and still failed due broad pre-existing CodeMap/link gaps unrelated to TASK-018.
