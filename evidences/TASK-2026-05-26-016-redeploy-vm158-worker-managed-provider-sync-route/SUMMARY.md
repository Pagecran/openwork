## TASK-2026-05-26-016 Evidence Summary

- Scope: redeploy only VM158 worker runtime/container and verify managed-provider sync availability without exposing secrets.
- AC-1: Rebuilt/recreated only `openwork-worker-158_openwork-host_1` on VM158.
- AC-2: Den containers `openwork-den-static-158_web_1`, `openwork-den-static-158_den_1`, and `openwork-den-static-158_mysql_1` were left running and untouched.
- AC-3: No users, orgs, workers, or provider credentials were created, deleted, or edited.
- AC-4: Worker `/health` returned `200` after redeploy.
- AC-5: `POST /managed-providers/sync` moved from sanitized `404 not_found` to sanitized `200 applied`.
- AC-6: Existing Den `nvidia` provider state was applied through the supported worker sync route using existing Den-backed provider data with no credential values recorded.
- AC-7: Worker state now shows Den-managed provider metadata plus `nvidia` with 4 available models.

### Evidence Files

- `logs/01-worker-redeploy.log` — VM158 deployment layout, worker-only rebuild/recreate commands, and affected container state.
- `logs/02-route-health.log` — pre/post worker `/health` and `/managed-providers/sync` sanitized results.
- `logs/03-provider-state.log` — sanitized provider sync result plus worker state proving `nvidia` and 4 models are available.

### Important Implementation Note

- The repo checkout on VM158 already contained the route in source, but the worker process was still resolving an older bundled/downloaded `openwork-server` sidecar. The successful redeploy forced the worker container to use the repo-local `openwork-server` entrypoint so the current source route was actually served.
