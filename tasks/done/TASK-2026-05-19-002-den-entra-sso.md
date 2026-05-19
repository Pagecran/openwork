---
id: TASK-2026-05-19-002
title: Den on-prem Microsoft Entra ID SSO
complexity: complex
track: implementation
slice: foundation
status: done
scr: SCR-2026-05-19-001-den-entra-sso
created: 2026-05-19
target_repo: D:\openwork
---

# Task: Den on-prem Microsoft Entra ID SSO

## Target Repository
- Target repo: `D:\openwork`
- Out of scope repos: `D:\openwork\.codenomad\worktrees\Pagec_tree`, `D:\tauri`, `D:\opencode`, `apps/desktop/src-tauri/` unless explicitly instructed
- Planned output: implement approved Den Entra ID SSO, tests/evidence, documentation, finalization, and closure handoff

## Objective
Prepare and, after approval, deliver Den on-prem Microsoft Entra ID / Azure AD SSO for internal LAN deployments with fallback admin email/password, organization auto-join, and Entra group-to-Den role mapping.

## User / Problem Context
The Product Owner wants Den to operate as an enterprise internal control plane with real static LAN workers and company SSO. The deployment should stay internal to the enterprise network and avoid public exposure assumptions.

## Classification
- Complexity: `complex`
- Track: `implementation`
- Slice: `foundation` primary, with `core`, `docs`, and `qa` follow-up slices expected if approved
- Required pre-sync specialists: Business Analyst, Technical Architect, Tech Lead

## Related SCR
- `docs/scrs/SCR-2026-05-19-001-den-entra-sso.md`
- SCR status: Approved by Product Owner in chat on 2026-05-19

## Acceptance Criteria
- **AC-1:** Den can be configured to expose Microsoft Entra ID / Azure AD as a social/OIDC sign-in option using environment variables.
- **AC-2:** Existing email/password authentication remains enabled for fallback admin access.
- **AC-3:** Users authenticated by Entra SSO are automatically added to the configured Den organization when auto-join is enabled.
- **AC-4:** Configured Entra group identifiers map SSO users to the intended Den organization role (`admin` or `member`) without allowing SSO to assign `owner`.
- **AC-5:** The internal callback URL format `http://den.company.local/api/auth/callback/<provider>` is documented with Entra app registration steps.
- **AC-6:** On-prem/static deployment documentation includes required environment variables, validation steps, fallback admin guidance, and troubleshooting notes.
- **AC-7:** Targeted automated tests or equivalent executable verification cover env parsing, group-role mapping, and auto-join behavior where repository seams allow it.

## Scope Boundaries And Non-Goals
- No public Internet deployment hardening beyond internal/LAN notes.
- No identity providers beyond Microsoft Entra ID / Azure AD.
- No billing, plan, or hosted cloud launch changes.
- No changes under `apps/desktop/src-tauri/`.
- No owner assignment through SSO group mapping.

## Known Constraints, Dependencies, Assumptions, And Blockers
- Better Auth is the existing Den authentication framework.
- Current Den auth includes email/password, GitHub, Google, Better Auth organization plugin, MCP OAuth provider, and API keys.
- Local `pnpm --filter @openwork-ee/den-api build` may be blocked by a pre-existing `@openwork/email` / `tsup` issue; implementation evidence must record exact commands and outcomes.
- The repository currently has untracked operational folders/files (`.codenomad/`, `.nomadworks/`, `apps/desktop/src-tauri/`, `docs/scrs/`) that must be preserved.

## Discussion Record
- Prior discussion selected Microsoft Entra ID / Azure AD as the target enterprise SSO provider.
- Desired behavior: SSO + fallback admin email/password, auto-join org for all SSO users, Entra groups mapped to Den roles, internal callback `http://den.company.local/api/auth/callback/<provider>`.
- Existing Den static worker work is complete and pushed through commit `c262c2eac`.

## Decisions Taken On PO Behalf
None. Product Owner directly confirmed the implementation defaults below.

## PO-Confirmed Decisions
1. Auto-join organization selector uses organization ID as canonical; slug may be supported only as an optional operator convenience with unambiguous resolution.
2. Default SSO auto-join role is `member` when no configured Entra group mapping matches.
3. If a user belongs to both configured admin and member groups, `admin` wins.
4. This task supports Entra groups present in the token `groups` claim only. Microsoft Graph group-overage resolution is out of scope.
5. Fallback admin access uses the existing email/password flow; explicit bootstrap-admin environment variables are out of scope.
6. On-prem Entra SSO requires a fixed Microsoft tenant ID; `common`/multi-tenant authority is out of scope.
7. If Entra does not provide an email claim, Den may fall back to `preferred_username`/UPN for the user identity surface where Better Auth allows it.

## Readiness Checklist
- [x] BA validates product requirements, acceptance criteria, and SCR clarity.
- [x] Technical Architect validates Better Auth/Entra integration path and implementation decomposition.
- [x] Tech Lead validates risk, verification plan, and whether implementation can proceed directly or should use Workflow Runner.
- [x] PO approves SCR before implementation.

## Evidence And Testing Expectations
- Record pre-flight branch/status.
- Provide targeted tests for new env parsing and SSO role-mapping logic.
- Attempt relevant build/typecheck commands; document any pre-existing blockers exactly.
- Update on-prem/static worker runbook or dedicated SSO documentation.

# Post Implementation Task Updates

## Product Manager: Closure Summary
- Terminal state: DONE.
- SCR `SCR-2026-05-19-001-den-entra-sso` implemented and marked Implemented.
- QA reverification passed after developer bounce fix.
- Tech Lead approved finalization and commit, with `ee/apps/den-api/src/generated/app-version.ts` excluded from this task commit as pre-existing modified state.
- Final commit: this commit.
- Decisions Taken On PO Behalf: None.

## Product Manager: Initial Task Expectations
- SCR and task are scaffolded for specialist review.
- Implementation is intentionally gated until SCR approval/readiness is complete.

## Product Manager: Readiness Sync Results
- Business Analyst review task session: `ses_1c08b293effef4ACID73EYnZUr`.
- Technical Architect review task session: `ses_1c08b2918ffer3yUzfxy2CoNSo`.
- Tech Lead review task session: `ses_1c08b28ffffelG9LhWomB0l2nu`.
- Result: implementation is blocked pending Product Owner decisions and SCR approval.
- Architecture finding: `better-auth@^1.5.6` appears to expose a built-in Microsoft provider backed by Microsoft Entra ID; no new OAuth dependency is expected if that path is confirmed during implementation.
- Delivery recommendation: keep as `complex`; use Workflow Runner after SCR approval because the change crosses auth provider config, env parsing, org membership mutation, role mapping, docs, and tests.

## Blocking Product Owner Decisions
Resolved by PO confirmation on 2026-05-19; see `PO-Confirmed Decisions`.

## Workflow Runner: Execution Plan

Pre-flight recorded 2026-05-19 on branch `Pagec_electron` with `git status --short --branch` showing existing modified `ee/apps/den-api/src/generated/app-version.ts`, `tasks/current.md`, and untracked operational/workflow paths `.codenomad/`, `.nomadworks/`, `apps/desktop/src-tauri/`, `docs/scrs/`, and `tasks/todo/`; these must be preserved unless explicitly in scope.

| Step | Assigned Agent | Purpose | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `business_analyst` | Validate requirements and acceptance criteria | Readiness notes | blocked: delegation CLI failed before specialist could run |
| 2 | `technical_architect` | Confirm technical approach and impact surface | Impact and design notes | pending |
| 3 | `developer` | Implement code and tests | Changed files and test notes | pending |
| 4 | `qa_engineer` | Verify behavior and regression coverage | Evidence and test results | pending |
| 5 | `tech_lead` | Final technical signoff | Approval or bounce-back | pending |
| 6 | `workflow_runner` | Finalize lifecycle | Registries, SCR/archive updates, commit, final report | pending |

## Workflow Runner: Post Implementation Expectations

- Terminal state: `HARD BLOCKER` before implementation.
- Readiness validation: task path, objective, complexity/track/slice, lifecycle owner, AC IDs, approved SCR link, constraints/dependencies/assumptions, evidence expectations, documentation expectations, commit/finalization expectations, and PO-proxy boundaries are present.
- Blocking issue: required specialist delegation could not be started because `opencode run` fails immediately with `Error: Session not found`, including with `--agent business_analyst` and `--pure` smoke tests.
- Commands attempted:
  - `git status --short --branch && git log --oneline -10` succeeded; branch `Pagec_electron`; pre-existing/untracked operational paths preserved.
  - `opencode --help` and `opencode agent list` succeeded; required agents are configured.
  - `opencode run "ping" --agent business_analyst --format default` failed with `Error: Session not found`.
  - `opencode run "ping" --pure --format default` failed with `Error: Session not found`.
- Acceptance criteria coverage: AC-1 through AC-7 are not implemented or verified in this run because implementation delegation could not begin.
- Documentation impact: no product/on-prem/static documentation changes were made beyond workflow task notes.
- Decisions Taken On PO Behalf: None.

## Developer: Post Implementation Expectations

- Observable outcomes:
  - Den API can expose Better Auth's built-in `microsoft` provider when `DEN_ENTRA_TENANT_ID`, `DEN_ENTRA_CLIENT_ID`, and `DEN_ENTRA_CLIENT_SECRET` are configured with a fixed tenant ID.
  - Existing email/password auth remains enabled as the fallback administrator path.
  - Microsoft SSO users are auto-joined to the configured organization when `DEN_ENTRA_AUTO_JOIN_ENABLED=true` and an org ID or unambiguous slug is configured.
  - Entra token `groups` claim values map to Den roles with `admin` precedence over `member`; unmapped users default to `member`; SSO never assigns `owner` and preserves existing owner memberships.
  - Entra profile mapping falls back to `preferred_username`, UPN, or a reserved local placeholder when `email` is absent.
- Files changed:
  - `ee/apps/den-api/src/auth.ts`
  - `ee/apps/den-api/src/env.ts`
  - `ee/apps/den-api/src/entra-sso.ts`
  - `ee/apps/den-api/src/orgs.ts`
  - `ee/apps/den-api/test/entra-sso.test.ts`
  - `packaging/docker/ONPREM_DEN_STATIC_RUNBOOK.md`
  - `packaging/docker/docker-compose.den-dev.yml`
- Tests/commands/results:
  - `git status --short --branch` recorded branch `Pagec_electron`; pre-existing modified/untracked operational paths preserved, including `ee/apps/den-api/src/generated/app-version.ts` not intentionally edited.
  - `pnpm --filter @openwork-ee/den-api exec bun test test/entra-sso.test.ts` — passed, 5 tests / 13 expects.
  - `pnpm --filter @openwork-ee/den-api exec bun test test/entra-sso.test.ts test/provisioner-static.test.ts` — passed, 11 tests / 21 expects.
  - `pnpm --filter @openwork-ee/den-api build` — failed with exit status 1 in `scripts/build.mjs` before detailed child output was surfaced.
  - `pnpm --filter @openwork-ee/den-api exec tsc -p tsconfig.json --noEmit` — failed on pre-existing dependency/type issues such as missing `@better-auth/oauth-provider`, missing `@modelcontextprotocol/sdk`, missing `@hono/mcp`, missing `@openwork/email`, existing implicit anys in OAuth provider callbacks, and existing Better Auth session type augmentation errors. New Entra-specific type errors observed during first attempt were fixed before handoff.
  - `git diff --check` — passed with line-ending warnings only.
  - `nomadworks_validate` — failed on broad pre-existing Missing CodeMap errors across many repository source directories, including existing `apps`, `ee`, `packages`, and `scripts` trees.
- AC coverage:
  - AC-1 satisfied by `env.entra` parsing/validation and Better Auth `socialProviders.microsoft` wiring.
  - AC-2 satisfied; `emailAndPassword.enabled` remains `true` and unchanged.
  - AC-3 satisfied by `ensureEntraSsoMembershipForAccount` invoked from Microsoft account hooks and session creation.
  - AC-4 satisfied by group claim extraction and `admin`/`member` mapping helpers; `owner` assignment is normalized away and existing owners are preserved.
  - AC-5 satisfied in `packaging/docker/ONPREM_DEN_STATIC_RUNBOOK.md` with `http://den.company.local/api/auth/callback/microsoft` app registration guidance.
  - AC-6 satisfied by runbook env vars, validation steps, fallback admin guidance, and troubleshooting notes.
  - AC-7 satisfied by targeted `entra-sso.test.ts` coverage for env parsing, group-role mapping, token group extraction, no-owner assignment, and email fallback seams.
- Documentation impact:
  - Updated on-prem/static runbook and Compose env comments/environment passthrough for Entra SSO.
  - No CodeMap files were changed because this repository currently lacks the Den API CodeMap chain and `nomadworks_validate` reports broad pre-existing missing CodeMaps outside this task's safe scope.
- Risks:
  - Full build/typecheck remains blocked by pre-existing dependency/type-resolution issues unrelated to the Entra SSO changes.
  - End-to-end Microsoft Entra sign-in was not run because no tenant/app credentials or browser flow were provided in this environment.
  - Auto-join organization slug support intentionally resolves only when exactly one org matches; org ID remains canonical.
- Decisions Taken On PO Behalf: None.

## QA Engineer: Post Implementation Expectations

- QA introduction: QA Engineer verified the Entra SSO implementation against AC-1 through AC-7 using code inspection, targeted tests, diff hygiene, and build/typecheck attempts.
- Target repo confirmed: `D:\openwork`; out of scope preserved: `.codenomad/`, `.nomadworks/`, `apps/desktop/src-tauri/`, and external repos. No product code changes were made by QA.
- Commands run by QA:
  - `pnpm --filter @openwork-ee/den-api exec bun test test/entra-sso.test.ts` — passed, 5 tests / 13 expects.
  - `pnpm --filter @openwork-ee/den-api exec bun test test/entra-sso.test.ts test/provisioner-static.test.ts` — passed, 11 tests / 21 expects.
  - `git diff --check` — no whitespace errors; Git reported LF-to-CRLF warnings for changed files.
  - `pnpm --filter @openwork-ee/den-api exec tsc -p tsconfig.json --noEmit` — failed on existing dependency/type blockers (`@better-auth/oauth-provider`, MCP packages, `@openwork/email`, existing implicit anys/unknown handling); no new Entra-specific type errors were isolated in the output.
  - `pnpm --filter @openwork-ee/den-api build` — failed in `scripts/build.mjs` with exit status 1 before detailed child output, consistent with the known build blocker recorded in the task.
- Coverage confirmed by inspection/tests: env parsing, fixed-tenant/common rejection seam, provider enablement helper, token `groups`-only extraction, admin-over-member precedence, default `member`, no `owner` assignment helper, email fallback, runbook callback URL, Entra app registration, env vars, fallback-admin guidance, and troubleshooting docs.
- QA blocking finding: `auth.ts` invokes `ensureEntraSsoMembershipForAccount` from the generic session-create hook for every session. When `DEN_ENTRA_AUTO_JOIN_ENABLED=true`, `ensureEntraSsoMembershipForAccount` will create/update membership even if no Microsoft account/id token exists, because missing groups resolve to default `member`. This can auto-join email/password or other non-Entra users, which does not satisfy the AC-3 scope of “Users authenticated by Entra SSO” and may weaken the fallback-admin separation expected by AC-2.
- QA coverage gap: automated tests do not exercise `ensureEntraSsoMembershipForAccount` auto-join behavior against mocked/stubbed DB seams, including the non-Microsoft session case above, organization-not-found behavior, existing owner preservation, and created/updated membership paths. AC-7 is therefore only partially satisfied.
- E2E limitation: live Microsoft Entra sign-in was not executed because no tenant/app credentials are available in this environment.
- QA recommendation: fail/bounce back to Developer for the auto-join guard and additional executable auto-join tests before Tech Lead signoff.

## Developer: QA Bounce Fix Expectations

- Observable outcomes:
  - Removed the generic session-create auto-join path so email/password and unrelated provider sessions cannot auto-join when Entra auto-join is enabled.
  - Added a provider guard in the executable auto-join seam; only `providerId: "microsoft"` can resolve/create/update organization membership.
  - Microsoft account create/update hooks still invoke Entra auto-join with the account provider ID and token.
  - Existing owner membership remains preserved and is never downgraded by SSO role mapping.
- Files changed in this bounce fix:
  - `ee/apps/den-api/src/auth.ts`
  - `ee/apps/den-api/src/entra-sso.ts`
  - `ee/apps/den-api/src/orgs.ts`
  - `ee/apps/den-api/test/entra-sso.test.ts`
  - `tasks/todo/TASK-2026-05-19-002-den-entra-sso.md`
- Tests/commands/results:
  - `pnpm --filter @openwork-ee/den-api exec bun test test/entra-sso.test.ts` — passed, 9 tests / 32 expects.
  - `pnpm --filter @openwork-ee/den-api exec bun test test/entra-sso.test.ts test/provisioner-static.test.ts` — passed, 15 tests / 40 expects.
  - `git diff --check` — passed with LF-to-CRLF warnings only.
  - `pnpm --filter @openwork-ee/den-api exec tsc -p tsconfig.json --noEmit` — failed on the same pre-existing dependency/type blockers (`@better-auth/oauth-provider`, MCP packages, `@openwork/email`, existing implicit anys/unknown handling); no new Entra-specific type errors were isolated.
  - `pnpm --filter @openwork-ee/den-api build` — failed in `scripts/build.mjs` with exit status 1 before detailed child output, matching previously recorded build blocker behavior.
- AC coverage:
  - AC-2 strengthened by preventing fallback email/password sessions from auto-joining through Entra configuration.
  - AC-3 corrected so auto-join applies only to Microsoft/Entra-authenticated account hooks, not every session.
  - AC-4 preserved; role mapping remains `admin`/`member` only with owner preservation.
  - AC-7 strengthened with executable auto-join seam tests for Microsoft create, Microsoft update, non-Microsoft/email-password no-op, and owner preservation.
- Documentation impact:
  - No product/runbook changes needed for the QA bounce; prior runbook documentation remains accurate.
- Remaining risks:
  - Live Microsoft Entra E2E remains unverified because no tenant/app credentials are available.
  - Full build/typecheck remains blocked by pre-existing dependency/type issues outside this same-scope QA fix.
- Decisions Taken On PO Behalf: None.

## QA Engineer: Reverification Expectations

- QA introduction: QA Engineer reverified the Developer QA bounce fix for Entra SSO auto-join scope, fallback auth separation, owner preservation, and targeted regression coverage.
- Target repo confirmed: `D:\openwork`; out of scope preserved: `.codenomad/`, `.nomadworks/`, `apps/desktop/src-tauri/`, and external repos. No product code changes were made by QA.
- Commands run by QA:
  - `git status --short --branch` — branch `Pagec_electron`; expected implementation/task changes plus pre-existing/untracked operational paths remain present.
  - `pnpm --filter @openwork-ee/den-api exec bun test test/entra-sso.test.ts` — passed, 9 tests / 32 expects.
  - `pnpm --filter @openwork-ee/den-api exec bun test test/entra-sso.test.ts test/provisioner-static.test.ts` — passed, 15 tests / 40 expects.
  - `git diff --check` — no whitespace errors; Git reported LF-to-CRLF warnings for changed files.
- Bounce fix verified by inspection:
  - The generic session-create hook no longer invokes Entra auto-join; it only sets initial active organization.
  - Microsoft account create/update hooks pass `providerId: "microsoft"` and `idToken` to `ensureEntraSsoMembershipForAccount`.
  - `ensureEntraSsoMembership` returns `provider_not_microsoft` before organization resolution or membership mutation for non-Microsoft and email/password/null-provider paths.
  - Existing owner memberships return `owner_preserved` and are not downgraded; SSO-created/updated roles remain normalized to `admin` or `member` only.
- Coverage confirmed by executable tests: Microsoft create, Microsoft update, non-Microsoft no-op, email/password/null-provider no-op, owner preservation/no downgrade, no owner assignment helper, admin precedence, default member role, groups-only token behavior, env parsing, provider enablement, common tenant rejection seam, and email fallback.
- E2E limitation: live Microsoft Entra sign-in remains unverified because no tenant/app credentials are available in this environment.
- QA recommendation: pass QA for the implemented scope and proceed to Tech Lead review, with known build/typecheck blockers remaining as previously documented pre-existing issues.

## Tech Lead: Post-Task Sync Expectations

- Tech Lead introduction: Tech Lead performed post-task technical review for AC-1 through AC-7, architecture safety, evidence sufficiency, documentation sufficiency, and git hygiene. No product code changes were made by Tech Lead.
- Review verdict: approved for PMA finalization/commit with documented environment limitations. The QA bounce-back finding was corrected; no remaining task-scope blocker was found in the reviewed code/tests/docs.
- Commands reviewed/run by Tech Lead:
  - `git status --short --branch && git diff --stat && git diff --name-status` — branch `Pagec_electron`; expected Entra SSO implementation/docs/test changes present; `ee/apps/den-api/src/generated/app-version.ts` remains modified but is pre-existing/out of task scope.
  - `git diff -- ee/apps/den-api/src/generated/app-version.ts tasks/current.md ee/apps/den-api/src/auth.ts ee/apps/den-api/src/env.ts ee/apps/den-api/src/orgs.ts packaging/docker/ONPREM_DEN_STATIC_RUNBOOK.md packaging/docker/docker-compose.den-dev.yml` — reviewed changed implementation, workflow, and doc diffs.
  - `pnpm --filter @openwork-ee/den-api exec bun test test/entra-sso.test.ts` — passed, 9 tests / 32 expects.
  - `pnpm --filter @openwork-ee/den-api exec bun test test/entra-sso.test.ts test/provisioner-static.test.ts` — passed, 15 tests / 40 expects.
  - `git diff --check` — passed with Git LF-to-CRLF warnings only.
  - `pnpm --filter @openwork-ee/den-api exec tsc -p tsconfig.json --noEmit` — failed on known/pre-existing dependency and type blockers (`@better-auth/oauth-provider`, MCP packages, `@openwork/email`, existing implicit-any/unknown handling); no Entra-specific type error was isolated.
  - `pnpm --filter @openwork-ee/den-api build` — failed in `scripts/build.mjs` with exit status 1 before detailed child output, matching the known blocker recorded in the task.
  - `nomadworks_validate` — failed on broad pre-existing missing CodeMap coverage across `apps`, `ee`, `packages`, `scripts`, and related source trees; this remains outside the safe scope of this task.
- AC traceability verified:
  - AC-1: satisfied by `env.entra` parsing/validation and conditional Better Auth `socialProviders.microsoft` wiring with fixed tenant config.
  - AC-2: satisfied; `emailAndPassword.enabled` remains true and the generic session auto-join path was removed.
  - AC-3: satisfied for Microsoft/Entra account create/update hooks only, guarded by `providerId === "microsoft"` and `DEN_ENTRA_AUTO_JOIN_ENABLED`.
  - AC-4: satisfied by token `groups` claim extraction, admin-over-member precedence, `admin`/`member` normalization, no SSO owner assignment, and owner preservation.
  - AC-5: satisfied by runbook callback guidance for `http://den.company.local/api/auth/callback/microsoft` and local Compose defaults.
  - AC-6: satisfied by runbook/Compose environment variables, validation steps, fallback admin guidance, and troubleshooting notes.
  - AC-7: satisfied by executable tests covering env parsing, fixed/common tenant seam, group-role mapping, token groups-only extraction, email fallback, auto-join create/update/no-op behavior, and owner preservation.
- Architecture safety verified: Better Auth Microsoft provider wiring is isolated behind complete provider env config; tenant `common` is rejected/disabled; group overage/Graph lookup is intentionally out of scope; non-Microsoft and email/password sessions cannot auto-join; SSO-created/updated membership roles are constrained to `admin` or `member`; existing owners are preserved.
- Documentation impact: on-prem/static runbook and Compose comments/passthrough are sufficient for internal callback, Entra app registration, required variables, fallback admin access, validation, and troubleshooting. No additional product docs were required for this foundation/on-prem runbook change.
- Git hygiene / commit recommendation: exclude `ee/apps/den-api/src/generated/app-version.ts` from this task commit unless PMA intentionally scopes the pre-existing generated version change. Include the Entra implementation/test/doc/task/current changes and the approved SCR/task artifacts as appropriate for workflow closure.
- Closure recommendation: proceed to Workflow Runner/PMA finalization and commit, preserving the known build/typecheck/CodeMap blockers as documented pre-existing risks and preserving untracked operational paths unless explicitly scoped.
