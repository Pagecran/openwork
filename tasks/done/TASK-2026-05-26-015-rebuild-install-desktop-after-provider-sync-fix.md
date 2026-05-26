# TASK-2026-05-26-015 — Rebuild and install desktop after provider sync fix

---
complexity: standard
track: implementation
slice: qa
status: implemented
owner: product_manager
scr_required: false
---

## Objective

Rebuild/package and install the OpenWork desktop client after the managed-provider sync fix, without launching or driving the desktop.

## Context

Managed-provider sync/import fix was committed and pushed:

- `01e846d02` — `fix: TASK-2026-05-26-014 sync managed providers to remote workers`

Server target remains VM158:

- Den Web: `http://192.168.1.51:3005`
- Den API: `http://192.168.1.51:8788`
- Worker: `http://192.168.1.51:8787`

No server redeploy is expected for this client-side fix.

## Acceptance Criteria

- **AC-1:** Confirm local checkout contains commit `01e846d02` or newer containing it.
- **AC-2:** Build/package the desktop client using `pnpm` from the fixed branch.
- **AC-3:** Install the packaged desktop client locally.
- **AC-4:** Ensure managed bootstrap/prefs still point to VM158 Den (`http://192.168.1.51:3005`).
- **AC-5:** Do not launch or drive the desktop after installation unless the Product Owner explicitly asks.
- **AC-6:** Capture sanitized evidence logs with no tokens/cookies/passwords/codes.

## Non-goals

- Do not redeploy Den or worker server.
- Do not create users/orgs/workers.
- Do not create, modify, or expose provider credentials.
- Do not launch the desktop or connect to CDP.
- Do not expose secrets/tokens/codes.

## Discussion Record

- Product Owner reported managed provider models remained unavailable and manual import failed.
- PMA had the provider sync fix implemented/committed and now needs a rebuilt installed desktop for PO validation.

# Post Implementation Task Updates

## Workflow Runner: Post Implementation Expectations

- The local checkout was confirmed to contain commit `01e846d027a18ee4cb2ed5db843d6bd10e2d41b0` at `HEAD` on branch `dev-0.13.13-integration`.
- The desktop client was packaged with `pnpm --filter @openwork/desktop package:electron` and produced `apps/desktop/dist-electron/openwork-win-x64-0.13.12.exe`.
- The packaged NSIS installer was installed locally with a silent `/S` invocation and verified by filesystem presence at `C:\Users\Admin\AppData\Local\Programs\@openworkdesktop\OpenWork.exe`.
- Managed bootstrap verification stayed file-only and confirmed `%ProgramData%\OpenWork\desktop-bootstrap.json` still targets VM158 Den `http://192.168.1.51:3005` with managed API target `http://192.168.1.51:3005/api/den`.
- No desktop launch, CDP connection, UI verification, server redeploy, user/org/worker creation, or provider credential modification was performed.
- Sanitized evidence was captured under `evidences/TASK-2026-05-26-015-rebuild-install-desktop-after-provider-sync-fix/`.
