# TASK-2026-05-26-011 Evidence Summary

## Scope

Rebuilt, packaged, and locally installed the OpenWork desktop client from the branch containing commit `f0f8ce62254a0826e1825a5e93d8974b2d2be420` without launching the desktop.

## Acceptance Criteria Coverage

- **AC-1:** Verified the local checkout contains commit `f0f8ce62254a0826e1825a5e93d8974b2d2be420` at `HEAD`.
- **AC-2:** Packaged the desktop client with `pnpm --filter @openwork/desktop package:electron`.
- **AC-3:** Installed the packaged NSIS desktop client locally with a silent `/S` installer invocation and verified installed file presence.
- **AC-4:** Confirmed `%ProgramData%\OpenWork\desktop-bootstrap.json` still points to VM158 Den `http://192.168.1.51:3005` and does not reference VM155/VM156/VM157 hosts.
- **AC-5:** No desktop launch, CDP connection, or UI verification was performed.
- **AC-6:** Evidence logs below are sanitized and contain no tokens, cookies, passwords, or codes.

## Evidence Files

- `logs/01-commit-ancestry.log` — git branch/status snapshot and ancestry confirmation.
- `logs/02-package-build.log` — package command and resulting Windows NSIS artifact lines.
- `logs/03-install.log` — silent installer invocation and installed executable metadata.
- `logs/04-bootstrap.log` — managed bootstrap file contents and VM158 target checks.
- `logs/05-nomadworks-validate.log` — repository validation result showing pre-existing baseline CodeMap/docs failures unrelated to this packaging/install task.

## Notes

- Installer artifact: `D:\openwork\apps\desktop\dist-electron\openwork-win-x64-0.13.12.exe`
- Installed executable: `C:\Users\Admin\AppData\Local\Programs\@openworkdesktop\OpenWork.exe`
- No screenshots were captured because the task explicitly prohibited launching or driving the desktop UI.
