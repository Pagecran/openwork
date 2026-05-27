# Completed Tasks (Registry)

| Date | Task ID | SCR ID | Commit | Summary |
| :--- | :--- | :--- | :--- | :--- |
| 2026-05-27 | TASK-2026-05-26-021 | None | this commit | Redeployed only the VM158 worker, discovered the live provider-list used a `providers` payload shape, patched the worker-side filter for live/runtime shapes, reredeployed only the worker, and verified OpenAI now returns only `gpt-5.4` and `gpt-5.5` while NVIDIA remains at 4 models. |
| 2026-05-27 | TASK-2026-05-26-018 | None | this commit | Redeployed only the VM158 worker from the task-017 sanitizer source, re-ran Den managed-provider sync, and verified OpenCode/session recovery with sanitized `nvidia` + `openai` runtime config. |
| 2026-05-27 | TASK-2026-05-26-016 | None | this commit | Rebuilt and recreated only the VM158 worker runtime, restored `POST /managed-providers/sync`, and verified sanitized `nvidia` provider sync with 4 models available. |
| 2026-05-26 | TASK-2026-05-26-015 | None | this commit | Rebuilt, packaged, and silently reinstalled the Windows desktop client from the branch containing the managed provider sync fix, then verified managed bootstrap still targets VM158 without launching the app. |
| 2026-05-26 | TASK-2026-05-26-012 | None | this commit | Rebuilt, packaged, and silently reinstalled the Windows desktop client from the branch containing the confirmed sidebar fix, then verified managed bootstrap still targets VM158 without launching the app. |
| 2026-05-26 | TASK-2026-05-26-011 | None | this commit | Rebuilt, packaged, and silently reinstalled the Windows desktop client from the dedupe-fix branch, then verified managed bootstrap still targets VM158 without launching the app. |
