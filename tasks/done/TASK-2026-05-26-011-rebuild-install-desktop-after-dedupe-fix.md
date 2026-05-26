# TASK-2026-05-26-011 — Rebuild and install desktop after remote workspace dedupe fix

---
complexity: standard
track: implementation
slice: qa
status: implemented
owner: product_manager
scr_required: false
---

## Objective

Rebuild/package and install the OpenWork desktop client from the committed `TASK-2026-05-26-010` fix, without launching or driving the desktop.

## Context

The Product Owner uninstalled the current desktop client while the client-side remote workspace dedupe fix was implemented.

Fix commit to install:

- `f0f8ce62254a0826e1825a5e93d8974b2d2be420`
- Branch: `origin/dev-0.13.13-integration`

Server target remains VM158:

- Den Web: `http://192.168.1.51:3005`
- Den API: `http://192.168.1.51:8788`
- Worker: `http://192.168.1.51:8787`

No server redeploy is expected for this task.

## Acceptance Criteria

- **AC-1:** Confirm the local checkout contains commit `f0f8ce62254a0826e1825a5e93d8974b2d2be420` or a newer commit containing it.
- **AC-2:** Build/package the desktop client using `pnpm` from the fixed branch.
- **AC-3:** Install the packaged desktop client locally.
- **AC-4:** Ensure managed bootstrap/prefs still point to VM158 Den (`http://192.168.1.51:3005`) and not VM155/VM156/VM157.
- **AC-5:** Do not launch or drive the desktop after installation unless the Product Owner explicitly asks.
- **AC-6:** Capture sanitized evidence logs with no tokens/cookies/passwords/codes.

## Non-goals

- Do not redeploy Den or worker server.
- Do not create users/orgs/workers.
- Do not submit the manual static attach form.
- Do not launch the desktop or connect to CDP.
- Do not expose secrets/tokens/codes.

## Discussion Record

- Product Owner approved rebuilding/reinstalling the client after confirming no server redeploy should be needed.

# Post Implementation Task Updates

## Workflow Runner: Post Implementation Expectations

- The local checkout was confirmed to contain commit `f0f8ce62254a0826e1825a5e93d8974b2d2be420` at `HEAD`.
- The desktop client was packaged with `pnpm --filter @openwork/desktop package:electron` and produced `apps/desktop/dist-electron/openwork-win-x64-0.13.12.exe`.
- The packaged NSIS installer was installed locally with a silent `/S` invocation and verified by filesystem presence at `C:\Users\Admin\AppData\Local\Programs\@openworkdesktop\OpenWork.exe`.
- Managed bootstrap verification stayed file-only and confirmed `%ProgramData%\OpenWork\desktop-bootstrap.json` still targets VM158 Den `http://192.168.1.51:3005`.
- No desktop launch, CDP connection, UI verification, server redeploy, user/org/worker creation, or manual static attach submission was performed.
- Sanitized evidence was captured under `evidences/TASK-2026-05-26-011-rebuild-install-desktop-after-dedupe-fix/`.
