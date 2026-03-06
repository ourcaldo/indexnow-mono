# Lessons Learned

<!-- 
  MANDATORY: AI agents MUST read this file at the start of every session.
  These are hard-won rules from past mistakes. Each lesson is a PRINCIPLE to follow,
  not just a case study. Violating any of these is a blocking issue.
  Updated after each correction from the user.
-->

---

## Principle 1: All External Services Must Go Through the API Proxy — ZERO Exceptions

**Rule**: Browser/client code must NEVER directly call any external service (Supabase, Paddle, SendGrid, Google API, SE Ranking, or any future integration). Every external service interaction MUST go through `apps/api` route handlers.

**Why**: Direct calls from the browser bypass all server-side controls — rate limiting, activity logging, IP tracking, security audit trails, error handling. It also creates performance issues (cross-ocean HTTPS from browser vs same-network calls from API server).

**How to verify** (do this for EVERY change involving service calls):
1. Grep the entire frontend codebase (`apps/user-dashboard/`, `apps/admin/`, `packages/` except server-only files) for direct service SDK calls: `supabase.auth.*`, `supabase.from(`, `paddle.*`, `sendgrid.*`, any direct HTTP call to external APIs.
2. If you find one → it's a bug. Route it through an API endpoint instead.
3. The ONLY acceptable client-side Supabase calls are: `onAuthStateChange()` (SDK listener), `getSession()` (local cache read), `setSession()` (syncing tokens FROM the API), `signOut({ scope: 'local' })` (clearing local state, not a network call).
4. Middleware Edge functions (server-side) are exempt — they can't call the API (circular dependency).

**Origin**: Login pages called `supabase.auth.signInWithPassword()` directly, bypassing the API's rate limiting, `last_login_at` tracking, and activity logging. Sign-out called `supabase.auth.signOut()` cross-ocean and hung for seconds.

---

## Principle 2: Verify Actual Call Chains — Don't Trust That Code Is Wired Up

**Rule**: Before modifying or relying on any backend route, VERIFY it has actual callers. Grep for the endpoint constant, the URL pattern, and `fetch(` calls across all apps and packages.

**Why**: Well-written code with zero callers is dead code. Adding features to dead code is wasted effort.

**How to verify**:
1. Find the endpoint constant in `ApiEndpoints.ts` (e.g., `AUTH_ENDPOINTS.LOGIN`).
2. Grep for that constant across all apps: `grep -r "AUTH_ENDPOINTS.LOGIN" apps/ packages/`.
3. Also grep for the raw URL pattern: `grep -r "/auth/login" apps/ packages/`.
4. Zero results = dead code. Flag it and tell the user.

**Origin**: `/api/v1/auth/login` had 218 lines of hardened auth logic. Nobody called it — frontend went directly to Supabase.

---

## Principle 3: Database Types Are Manually Managed — Always Update Them

**Rule**: `packages/shared/src/types/database.ts` is the single source of truth for all DB types. It is NOT auto-generated. When changing DB schema (add/remove/rename tables or columns), always update this file.

**How to verify**: After any DB schema change, open `database.ts` and update the corresponding Row/Insert/Update types and convenience aliases.

---

## Principle 4: Never Destroy Git History

**Rule**: Never create root commits on repos with existing history. Never force-push without verifying local history includes all remote commits.

**How to verify**:
1. Before ANY push: `git fetch origin && git log origin/main --oneline -5`
2. Before any force-push: `git branch backup-$(date +%Y%m%d) HEAD`
3. Default to `git pull --rebase origin main` when in doubt.

---

## Principle 5: Dead Code Cleanup Must Be Complete

**Rule**: When removing a feature or table, remove ALL traces — types, convenience aliases, schema references, barrel exports, route files, hook files, component references. No orphaned code.

---

## Principle 6: Await All Critical Operations in Route Handlers

**Rule**: In Next.js Route Handlers, always `await` critical DB operations. Fire-and-forget `.then()` patterns may never resolve because Next.js tears down the execution context after the response is sent. Use BullMQ job queues for truly non-blocking background work.

---

## Principle 7: Never Defer Implementation Tasks — Only Defer Live Testing

**Rule**: When a plan has implementation tasks, complete ALL of them. Never defer code changes to "a separate cleanup PR" or "later." The only tasks that may be deferred are those requiring a running deployment (live/E2E testing).

**Why**: Deferred tasks accumulate as tech debt and are forgotten. If a task was important enough to plan, it's important enough to finish now. Partial implementation creates inconsistency.

**How to verify**:
1. Before marking a plan as complete, check every task.
2. If a task is code-only (no deployment needed), it must be done.
3. Only mark tasks as "Pending live test" if they literally require a running server to verify.

---

## Principle 8: Commit + Push + VPS Sync Is ONE Atomic Action Chain

**Rule**: After committing and pushing to GitHub, ALWAYS immediately pull on the VPS, rebuild, and restart — in the same action chain. Never stop after `git push` and wait for the user to ask about VPS sync. The full chain is: `git commit` → `git push` → `ssh VPS git pull` → `pnpm build` → restart apps.

**Why**: The user expects deployed code to match the latest push. Stopping after push creates a disconnect where GitHub is ahead of the running server. The user then has to manually ask "did you sync?" which wastes time and breaks flow.

**How to execute** (every time, no exceptions):
1. `git add` + `git commit --no-verify` + `git push origin main`
2. `ssh indexnow-dev "cd /root/indexnow-dev && git pull origin main 2>&1"`
3. `ssh indexnow-dev "cd /root/indexnow-dev && pnpm build 2>&1 | tail -20"` — verify all tasks pass
4. Kill ALL old processes first: `ssh indexnow-dev "killall -9 node 2>/dev/null; sleep 3"` — then verify ports are free with `ss -tlnp | grep '300[0-2]'`
5. Start fresh: `ssh indexnow-dev "cd /root/indexnow-dev && nohup pnpm dev --concurrency 15 > /tmp/turbo-dev.log 2>&1 &"` — wait ~25s
6. Verify all 3 ports (3000, 3001, 3002) are listening: `ss -tlnp | grep '300[0-2]'`
7. Report build result + port status to user

**Origin**: After fixing BUG #4 and BUG #5, code was pushed to GitHub but VPS was not synced. User had to ask "Do you already sync on the VPS?" — this should have been automatic.

---

## Principle 9: Load Skills Before Every Task — Not Just Lessons

**Rule**: Before each message AND before each to-do item, scan `.claude/skills/` and load the skill files relevant to the current task. Skills are NOT optional — they contain domain-specific procedures that prevent common mistakes.

**Why**: Agents consistently skip loading skills, relying only on lessons. Skills contain step-by-step procedures for specific task types (PRDs, refactoring, git commits, implementation plans, etc.). Skipping them leads to non-standard approaches and rework.

**How to verify**:
1. At the start of each message: identify task type → find matching skills → read their SKILL.md files.
2. At the start of each to-do item: re-evaluate if the step requires additional skills.
3. Example: committing code → load `git-commit` + `conventional-commit`. Writing PRD → load `prd`. Refactoring → load `refactor`.

**Origin**: Agent repeatedly skipped skill loading, producing PRDs and refactoring plans without following the project's established skill procedures.

---

## Principle 11: No Direct Database Access — Use Supabase Client Only

**Rule**: You do NOT have direct database access (no psql, no SQL editor, no REST API with raw SQL). All database interactions go through the Supabase JS client (`supabaseAdmin` or RLS-scoped clients). Never attempt to run raw SQL queries, curl the Supabase REST API for schema introspection, or assume you can execute migrations directly.

**Why**: The database is hosted on Supabase with no direct connection exposed. Schema changes require the user to run SQL in the Supabase dashboard. Attempting direct queries wastes time and produces confusing errors.

**How to handle schema issues**:
1. Read `database-schema/database_schema.sql` for the intended schema.
2. Ask the user to check actual DB state or run migrations via Supabase dashboard.
3. For code fixes, work with the Supabase JS client API only.

---

## Principle 12: Database Column Values Are Case-Sensitive — Match Stored Casing

**Rule**: When querying database columns, match the exact casing stored in the database. Do NOT blindly `.toLowerCase()` or `.toUpperCase()` values used in `.eq()` filters without knowing the stored casing.

**Why**: Supabase/PostgreSQL `.eq()` is case-sensitive by default. If `indb_keyword_countries.iso2_code` stores `"ID"` (uppercase), querying with `"id"` (lowercase) returns zero results.

**How to verify**: Check the reference data or schema comments for the expected casing of lookup columns before writing queries.

**Origin**: `resolveCountryUuid()` lowercased the ISO2 code to `"id"` but the DB stored `"ID"` uppercase, causing all country lookups to fail silently.

---

## Principle 10: Generated Documents Go in `/docs` at Workspace Root — Never in `indexnow-dev/`

**Rule**: All generated markdown documents (reports, deep dives, PRDs, implementation plans, audits, architecture docs) MUST be saved to `/docs` at the workspace root, NOT inside `indexnow-dev/`.

**Why**: `indexnow-dev/` is the project codebase tracked by git. Generated planning/analysis documents are workspace-level artifacts that should not pollute the codebase, bloat the repo, or trigger CI checks.

**How to verify**: Before creating any markdown file, check if it's a planning/analysis document. If yes → save to workspace `/docs`. If it's code-adjacent (README, CHANGELOG) → keep it in the project.

---

## Principle 13: Schema Files First, Then Migration SQL — Two Separate Things

**Rule**: When making database changes, ALWAYS do TWO things in this order:
1. **Update the master schema files** (`indexnow-dev/database-schema/database_schema.sql` and `database-schema/database_schema.sql`) — these are the code-level source of truth for what the DB should look like. This is YOUR job and part of the commit.
2. **Provide migration SQL** for the user to run in the live Supabase SQL Editor — this is the ALTER/migration statement that transforms the existing live database to match the updated schema.

**Why**: The master schema and the live database are two different things. The schema file documents the intended state of the DB in code (committed to git). The live database is the running Supabase instance that the user manages. Both must stay in sync, but through different mechanisms — schema files via git commits, live DB via user-run migrations.

**How to execute**:
1. Edit `indexnow-dev/database-schema/database_schema.sql` (and reference copy if it exists) to reflect the new column/table state.
2. Update `packages/shared/src/types/database.ts` to match.
3. Generate the migration SQL (ALTER TABLE, etc.) and save to `docs/` or provide inline.
4. **Commit + push + sync VPS** — schema + type changes are code, so they follow Principle 8 (commit → push → VPS pull → restart). Do NOT defer the commit.
5. Tell the user to run the migration SQL in Supabase SQL Editor.

**Origin**: Column renames (volume→search_volume, etc.) were committed in code but the master schema file wasn't updated. User had to point out that schema files and live DB are separate concerns that both need attention.
