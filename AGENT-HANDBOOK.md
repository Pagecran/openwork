# Agent Handbook

Operational companion to `AGENTS.md` for coding agents working in `D:\openwork`.

## Repo Purpose
OpenWork is a local-first desktop app and server surface for agents, skills, MCP, and remote workers.
- The app is the UI/control layer.
- The server is the execution and filesystem API layer.
- Workers are runtime destinations.
- Prefer OpenCode-native primitives over new abstractions.

## Read First
- `ARCHITECTURE.md` - authoritative runtime and ownership rules.
- `PRODUCT.md` - user flows and requirements.
- `PRINCIPLES.md` and `VISION.md` - product intent.
- `INFRASTRUCTURE.md` - deployment and control-plane details.
- `DESIGN-LANGUAGE.md` - UI direction.
- `packages/docs/orbita-layout-style.mdx` - session surface details.
- If you change architecture-level behavior, update `ARCHITECTURE.md` in the same task.

## Required First Task Update
In your first task update, always include:
1. `Target repo: <path>`
2. `Out of scope repos: <list>`
3. `Planned output: <what will be changed/tested>`
- If a request mentions multiple repos and the edit target is ambiguous, stop after discovery and ask for one target repo.

## Repo Boundaries
- `apps/app` - SolidJS frontend.
- `apps/desktop` - Tauri shell.
- `apps/desktop/src-tauri` - Rust desktop backend.
- `apps/server` - Bun/TypeScript OpenWork server.
- `apps/orchestrator` - Bun/TypeScript host CLI.
- `apps/share` - Next.js share app.
- `.opencode/skills` - local skills and references.
- `vendor/opencode` - gitignored mirror for inspection only; treat it as out of scope unless explicitly targeted.

## External Rule Files
Repo scan results:
- No `.cursorrules` file found.
- No `.cursor/rules/` directory found.
- No `.github/copilot-instructions.md` file found.

## Core Guardrails
- Prefer server-owned workspace writes over Tauri-only filesystem mutations.
- Treat Tauri filesystem writes as host-mode fallback, not the default product path.
- Keep parity with OpenCode primitives: folders, `.opencode`, `opencode.json`, skills, plugins, agents, commands.
- Preserve approvals, auditability, and user-visible status for sensitive actions.
- Keep the repo portable; never commit secrets or machine-local credentials.
- Optimize for clarity and safety for non-technical users.

## Tooling Summary
- Package manager: `pnpm@10.27.0` workspace.
- Common runtimes: `pnpm`, `bun`, `node --test`, `playwright`, `cargo`.
- There is no repo-wide lint script at the root.
- There is no checked-in global Prettier, Biome, or ESLint config.

## Common Commands
From the repo root:
- Setup: `pnpm install --frozen-lockfile`
- Main dev: `pnpm dev`, `pnpm dev:windows`, `pnpm dev:ui`, `pnpm dev:story`
- Build/typecheck: `pnpm build`, `pnpm typecheck`
- Main checks: `pnpm test:e2e`, `pnpm test:orchestrator`

Useful root aliases for app scenario checks:
- `pnpm test:health`, `pnpm test:sessions`, `pnpm test:events`, `pnpm test:todos`
- `pnpm test:permissions`, `pnpm test:session-scope`, `pnpm test:session-switch`, `pnpm test:fs-engine`

Package-level commands:
- `apps/app`: `pnpm --filter @openwork/app dev`, `build`, `typecheck`
- `apps/server`: `pnpm --filter openwork-server dev`, `build`, `typecheck`, `test`, `build:bin`
- `apps/orchestrator`: `pnpm --filter openwork-orchestrator build`, `typecheck`, `test:router`, `test:files`, `build:bin`
- `apps/share`: `pnpm --filter @openwork/share dev`, `build`, `test`, `test:e2e`
- `apps/desktop`: `pnpm --filter @openwork/desktop dev`, `build`; CI also uses `pnpm -C apps/desktop prepare:sidecar`
- EE lint-only apps: `pnpm --filter @openwork-ee/landing lint`, `pnpm --filter @openwork-ee/den-web lint`

## Running A Single Test
Use the package's native runner instead of inventing a new one.
- `apps/app` uses bespoke scenario scripts: `pnpm --filter @openwork/app exec node scripts/health.mjs`, `pnpm --filter @openwork/app exec node scripts/events.mjs`, `pnpm --filter @openwork/app exec bun scripts/session-scope.ts`
- `apps/server` Bun single file: `pnpm --filter openwork-server exec bun test src/utils.test.ts`
- `apps/server` Bun by name: `pnpm --filter openwork-server exec bun test src/utils.test.ts --test-name-pattern "returns consistent hash"`
- `apps/share` Node single file: `pnpm --filter @openwork/share exec node --test server/_lib/share-utils.test.ts`
- `apps/share` Node by name: `pnpm --filter @openwork/share exec node --test server/_lib/share-utils.test.ts --test-name-pattern "slugifies shared skill filenames"`
- `apps/share` Playwright single spec: `pnpm --filter @openwork/share exec playwright test e2e/bundle-share-page.spec.ts`
- `apps/share` Playwright single case: `pnpm --filter @openwork/share exec playwright test e2e/bundle-share-page.spec.ts -g "shows a read-only shared skill page"`
- Desktop Rust full crate: `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml`
- Desktop Rust exact test: `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml normalize_local_workspace_path_expands_home_prefix -- --exact`

## CI-Parity Checks
Useful commands reflected in GitHub workflows:
- `pnpm --filter @openwork-ee/den-web build`
- `pnpm --filter @openwork-ee/den-controller build`
- `pnpm --filter openwork-orchestrator typecheck`
- `pnpm --filter openwork-orchestrator build:bin`
- `pnpm --filter @openwork/app test:e2e`
- `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml --locked`

## Rebuild Rule
- If you change `apps/server/src`, rebuild the compiled server binary with `pnpm --filter openwork-server build:bin`.
- OpenWork and the orchestrator use the compiled server binary, not the raw TypeScript source.

## Code Style And Conventions

### Formatting
- Preserve the surrounding style of the package and file you touch.
- Do not mass-reformat unrelated code.
- Follow the local quote style, semicolon usage, and wrapping already present.

### Imports
- Group imports as Node builtins, external packages, then local modules.
- Use `node:` prefixes for Node builtins in server/share code.
- Prefer `import type` for type-only imports.
- Keep runtime-specific import extensions intact: server/share often use `.js` or `.ts`, app code is usually extensionless.

### Types
- TypeScript is `strict` in the main app, server, and orchestrator packages.
- Avoid `any`, loose casts, and unchecked nullable access.
- Prefer narrow unions, explicit aliases, and typed helper inputs/outputs.
- Add explicit return types when they clarify public helpers or non-trivial logic.

### Naming
- Use `PascalCase` for components, classes, and exported types.
- Use `camelCase` for functions, locals, signals, memos, and helpers.
- Use `UPPER_SNAKE_CASE` for true constants.
- Most filenames are kebab-case; preserve that pattern.
- Keep user-facing identifiers aligned with existing validators and slug rules.

### Error Handling
- Fail loudly for invalid input, missing context, and invariants.
- In server code, prefer structured errors such as `ApiError`.
- For best-effort client behavior, follow existing patterns like `safeAsync`, `safeSync`, and `fireAndForget`.
- If an error is intentionally ignored, make that clear with a short comment or obvious fallback.

### Comments
- Keep comments sparse and purposeful.
- Explain intent, policy, platform quirks, or architectural constraints.
- Do not restate obvious code.

### Testing
- Add focused tests close to the code you changed.
- Follow existing runners instead of introducing a new test framework.
- Use descriptive, behavior-first test names.
- If you fix a regression, add a test that would have failed before the fix.

## Package-Specific Notes
- `apps/app`: SolidJS app with fine-grained reactivity. When editing `apps/app/src/**/*.tsx`, consult `.opencode/skills/solidjs-patterns/SKILL.md`. Prefer scoped async state over global busy flags. Keep mobile behavior and premium visual polish intact.
- `apps/server`: Owns filesystem-backed API behavior and workspace mutations. Validate input early, keep path handling explicit, and preserve audit/reload semantics. Keep server-owned writes aligned with `ARCHITECTURE.md`.
- `apps/share`: Next.js app with React frontend and typed server helpers under `server/**`. Preserve local formatting rather than importing style rules from the Solid app. Keep OG image behavior, request parsing, and bundle semantics covered by tests.
- `apps/desktop/src-tauri`: Prefer desktop changes only when behavior truly belongs at the shell boundary. Focus native code on OS affordances, windowing, updater behavior, and process supervision. Add Rust unit tests close to the touched module.

## New Feature Workflow
For user-facing features, the preferred workflow is:
1. Sync repos/submodules to current remotes.
2. Create a worktree.
3. Implement the feature.
4. Start the Docker dev stack with `packaging/docker/dev-up.sh`.
5. Test the real flow with `.opencode/skills/openwork-docker-chrome-mcp/SKILL.md`.
6. Capture screenshots in the repo when relevant.
- If Docker, Chrome MCP, or credentials block end-to-end verification, say exactly what you could not run, why, what you verified instead, and the exact commands the user should run next.

## Final Reporting
When you finish, report:
- what changed
- what you tested
- which commands you ran
- what you could not verify
- any follow-up the user should run locally
