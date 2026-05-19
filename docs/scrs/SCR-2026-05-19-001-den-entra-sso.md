# SCR-2026-05-19-001: Den On-Prem Microsoft Entra ID SSO

## Status
Implemented

## Date
2026-05-19

## Owner
Product Manager Agent

## Related Task
- `tasks/todo/TASK-2026-05-19-002-den-entra-sso.md`

## Context
OpenWork Den now supports a LAN/on-prem static worker pool. Enterprise deployments also need internal identity integration so employees can sign in with Microsoft Entra ID / Azure AD while preserving an administrator fallback for break-glass access.

Target deployment model remains internal LAN/on-prem, not public Internet exposure. The expected callback pattern is `http://den.company.local/api/auth/callback/<provider>`.

## Problem Statement
Operators need a documented and configurable way to enable Den SSO with Microsoft Entra ID, automatically place SSO users into the intended Den organization, and map Entra groups to Den organization roles without removing the existing email/password admin fallback.

## Proposed Scope
- Add Den API configuration for Microsoft Entra ID / Azure AD SSO.
- Preserve existing email/password sign-in as an admin fallback.
- Support automatic SSO user membership in a configured Den organization.
- Support configurable Entra group-to-Den role mapping for `admin` and `member` roles.
- Document Entra app registration, internal callback URL, Den environment variables, fallback admin flow, and operational validation steps for on-prem static worker deployments.

## Non-Goals
- No public Internet deployment hardening beyond documenting internal/LAN assumptions.
- No new hosted identity provider beyond Microsoft Entra ID / Azure AD.
- No billing, workspace-plan, or cloud launch changes.
- No changes under `apps/desktop/src-tauri/`.
- No custom role model beyond the existing Den organization roles unless technical review determines existing hooks cannot satisfy group mapping.

## Acceptance Criteria
- **AC-1:** Den can be configured to expose Microsoft Entra ID / Azure AD as a social/OIDC sign-in option using environment variables.
- **AC-2:** Existing email/password authentication remains enabled for fallback admin access.
- **AC-3:** Users authenticated by Entra SSO are automatically added to the configured Den organization when auto-join is enabled.
- **AC-4:** Configured Entra group identifiers map SSO users to the intended Den organization role (`admin` or `member`) without allowing SSO to assign `owner`.
- **AC-5:** The internal callback URL format `http://den.company.local/api/auth/callback/<provider>` is documented with Entra app registration steps.
- **AC-6:** On-prem/static deployment documentation includes required environment variables, validation steps, fallback admin guidance, and troubleshooting notes.
- **AC-7:** Targeted automated tests or equivalent executable verification cover env parsing, group-role mapping, and auto-join behavior where repository seams allow it.

## Constraints And Assumptions
- Target repo: `D:\openwork` on branch `Pagec_electron`.
- Out of scope: `D:\openwork\.codenomad\worktrees\Pagec_tree`, `D:\tauri`, `D:\opencode`, and `apps/desktop/src-tauri/` unless explicitly approved.
- Better Auth is already used for Den auth and organization membership.
- Current Den auth supports GitHub and Google social providers plus email/password.
- Existing Den organization static roles are `owner`, `admin`, and `member`; SSO group mapping must not grant `owner`.
- Previous local build blocker may persist for `@openwork-ee/den-api build` due to local `@openwork/email`/`tsup` dependency state; evidence must state exact verification alternatives if unresolved.

## Open Questions
- Resolved 2026-05-19 by PO confirmation.

## Approved Decisions
1. Auto-join organization selector uses organization ID as canonical; slug may be supported only as an optional operator convenience with unambiguous resolution.
2. Default SSO auto-join role is `member` when no configured Entra group mapping matches.
3. If a user belongs to both configured admin and member groups, `admin` wins.
4. This SCR supports Entra groups present in the token `groups` claim only. Microsoft Graph group-overage resolution is out of scope.
5. Fallback admin access uses the existing email/password flow; explicit bootstrap-admin environment variables are out of scope.
6. On-prem Entra SSO requires a fixed Microsoft tenant ID; `common`/multi-tenant authority is out of scope.
7. If Entra does not provide an email claim, Den may fall back to `preferred_username`/UPN for the user identity surface where Better Auth allows it.

## Impact Surface
- `ee/apps/den-api/src/auth.ts`
- `ee/apps/den-api/src/env.ts`
- `ee/apps/den-api/src/orgs.ts`
- `ee/apps/den-api/src/organization-access.ts`
- `packaging/docker/ONPREM_DEN_STATIC_RUNBOOK.md`
- Den API tests under `ee/apps/den-api/test/`
- Relevant CodeMap files if new auth/org wiring entrypoints are introduced.

## Evidence Expectations
- Pre-flight `git status --short --branch` recorded.
- Targeted tests for added auth/SSO helpers and env parsing.
- Relevant build/typecheck commands attempted or documented with exact blockers.
- Documentation diff reviewed and linked to acceptance criteria.

## Decisions Taken On PO Behalf
None.

## Approval
Approved by Product Owner in chat on 2026-05-19.

## Implementation
- Implemented by `TASK-2026-05-19-002`.
- Final commit: this commit.
- Verification: targeted Den API Entra SSO and static provisioner tests passed; full build/typecheck blocked by documented pre-existing dependency/type issues.
