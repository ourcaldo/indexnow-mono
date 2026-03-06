# IndexNow Project — Current State

> Last updated: March 6, 2026 | HEAD: `eb19444` | Branch: `main`

---

## Quick Reference

| Item | Value |
|------|-------|
| **VPS** | `165.245.145.20` (Ubuntu), apps running via Turbopack |
| **GitHub** | `https://github.com/ourcaldo/indexnow-mono.git`, branch `main` |
| **Supabase** | `alrmyqikzhzgvzxvujpq.supabase.co` |
| **Ports** | user-dashboard: 3000, api: 3001, admin: 3002 |
| **Package Manager** | pnpm 10.28.2 |
| **Framework** | Next.js 16.1.4 + React 19.2.3 |
| **Bundler (dev)** | Turbopack (restored — was on webpack temporarily) |
| **Sentry** | @sentry/nextjs 8.55.0 |
| **Node** | >=18.0.0 |

---

## Architecture

pnpm workspace monorepo with Turborepo: 3 Next.js 16 apps + 10 shared packages.

```
indexnow-dev/
├── apps/
│   ├── api/              → Port 3001, all business logic as Route Handlers
│   ├── admin/            → Port 3002, role-gated (admin/super_admin)
│   └── user-dashboard/   → Port 3000, auth-gated user frontend
├── packages/
│   ├── shared/           → Zod schemas, DB types (source of truth), constants, utils
│   ├── database/         → Supabase client factories, security wrappers
│   ├── ui/               → shadcn components, shared Tailwind config
│   ├── auth/             → Server auth, admin auth, encryption
│   ├── analytics/        → Sentry (split: client + server entry), PostHog
│   ├── mail/             → SMTP email
│   ├── services/         → Business services
│   ├── supabase-client/  → Browser/server Supabase factories
│   ├── api-middleware/    → API middleware
│   ├── eslint-config/    → Shared ESLint 9 config
│   └── tsconfig/         → Shared tsconfig presets
```

Frontends call `apps/api` via `fetch()` with Supabase JWT Bearer tokens. No tRPC/GraphQL.

---

## Recent Commit History (newest first)

```
eb19444 chore: add .claude skills/tasks and copilot-instructions for CLI usage
08bdd88 chore: add SENTRY_SUPPRESS_TURBOPACK_WARNING to turbo globalEnv
c1e4f70 perf(analytics): split client/server entry points, restore Turbopack
a381152 fix(analytics): guard against multiple Sentry replay initializations
30a9b1d fix(csp): add unsafe-eval to script-src for webpack dev mode
bc3bbaf fix(apps): add --webpack flag to user-dashboard and admin dev scripts
05efb06 style(overview): horizontal scroll table, constrain keyword width, show root domain in URL
da272c6 style(overview): use colored text without card backgrounds for KD and Intent
49d938f style(overview): replace badge/card components with plain text values
885e3f2 docs(schema): rename keyword_bank columns to match live DB
c520c79 feat(overview): add enrichment data columns and rename DB fields
aae7cf8 fix(user-dashboard): fix mojibake symbol encoding across 9 files
414ae29 fix(api): use --webpack flag instead of --no-turbopack
5271e15 fix(api): disable turbopack for dev server fixes instrumentation hang
7fe42f4 style(ui): replace hardcoded blue/indigo with orange accent colors
f6bf34e fix(ui): remove all dark: class variants light-only theme
adffc9a style(ui): update color scheme to Firecrawl-inspired orange palette
d4eeb10 feat(api): derive language_code from country ISO2 code
5075b04 fix(api): use uppercase ISO2 code for country UUID resolution
864c6e7 fix(api): resolve country ISO2 codes to UUIDs in KeywordBankService
```

---

## What Was Done Recently (Session Summary)

### Completed
1. **Mojibake fix** — Fixed corrupted UTF-8 symbols across 9 files (317 replacements)
2. **DB column renames** — `volume` → `search_volume`, `difficulty` → `keyword_difficulty`, `competition` → `keyword_competition` in types + schema
3. **Overview enrichment** — Added Volume, Intent, KD, Competition, CPC columns with colored text (no card backgrounds), horizontal scroll, root domain URL display
4. **Color scheme** — Full migration from blue/indigo to Firecrawl orange palette, dark mode removed
5. **CSP fix** — Added `unsafe-eval` to script-src in all 3 apps for webpack dev sourcemaps
6. **Sentry replay guard** — Added `sentryInitialized` flag to prevent double-init during HMR
7. **Turbopack restored** — Split `@indexnow/analytics` into client (10.8KB) + server (3.4KB) entry points. Root cause: single-entry bundle inlined 457KB @sentry/browser, Turbopack hung compiling browser code in Node.js instrumentation context.

### Known Issues (Not Yet Fixed)
1. **Type error in keyword-enrichment-worker.ts** — Lines 273, 308, 336 reference `result.data?.volume` but DB type has `search_volume`. Fix: change `volume` to `search_volume` in those 3 locations.

---

## Key Technical Decisions

### Analytics Package Split (c1e4f70)
- `@indexnow/analytics` main barrel (`index.ts`) exports client-only code (Sentry browser, PostHog)
- `@indexnow/analytics/server` exports server-only code (`initializeServerSentry`, `trackServerError`)
- `@sentry/browser` is in tsup externals — never bundled into the package
- All `instrumentation.ts` and `sentry.server.config.ts` files import from `@indexnow/analytics/server`
- All apps use Turbopack (no `--webpack` flags)

### API Route Wrappers
Three wrappers in `apps/api/src/lib/core/api-response-middleware.ts`:
- `publicApiWrapper` — no auth (login, register, health, webhooks)
- `authenticatedApiWrapper` — requires Bearer token, injects `auth.userId` + RLS-scoped Supabase client
- `adminApiWrapper` — requires `super_admin` role, auto-logs security events

`RouteContext = { params: Promise<Record<string, string | string[]>> }` — Next.js 16 async params.

### Response Shape
```json
{ "success": true, "data": {...}, "timestamp": "...", "requestId": "..." }
{ "success": false, "error": { "id": "uuid", "type": "VALIDATION_ERROR", "message": "...", "severity": "LOW", "statusCode": 400 } }
```

### DB Access
- All writes go through `SecureServiceRoleWrapper` (enforces user validation + audit logging)
- `executeWithUserSession()` — validates user session, RLS-scoped
- `executeSecureOperation()` — admin/system operations, sanitizes table/column names
- Audit trail in `indb_security_audit_logs`

---

## Database

29 tables, all prefixed `indb_`. Source of truth: `packages/shared/src/types/database.ts` (2136 lines, manually maintained).

| Domain | Tables |
|--------|--------|
| Auth | `indb_auth_user_profiles`, `indb_auth_user_settings` |
| Payments | `indb_payment_gateways`, `indb_payment_packages`, `indb_payment_transactions`, `indb_payment_subscriptions` |
| Paddle | `indb_paddle_transactions`, `indb_paddle_webhook_events` |
| Keywords | `indb_keyword_bank`, `indb_keyword_countries`, `indb_keyword_domains`, `indb_keyword_rankings`, `indb_rank_keywords` |
| SeRanking | `indb_seranking_usage_logs`, `indb_seranking_metrics_raw`, `indb_seranking_metrics_aggregated`, `indb_seranking_quota_usage`, `indb_seranking_health_checks` |
| Admin | `indb_admin_activity_logs`, `indb_admin_user_summary` |
| Security | `indb_security_activity_logs`, `indb_security_audit_logs` |
| System | `indb_system_error_logs`, `indb_system_activity_logs`, `indb_site_settings`, `indb_site_integration` |
| Notifications | `indb_notifications_dashboard` |
| Jobs | `indb_enrichment_jobs` |

---

## External Services

| Service | Purpose | Proxy Rule |
|---------|---------|-----------|
| Supabase | Auth + PostgreSQL + Storage | Client: only `getSession()`, `onAuthStateChange()`, `signOut({scope:'local'})` allowed. Everything else through API. |
| Paddle | Payments | Through API only |
| SendGrid/SMTP | Email | Through API only |
| SeRanking | Rank tracking | Through API only |
| Sentry | Error monitoring | Direct (monitoring, no data) |
| PostHog | Product analytics | Direct (analytics, no data) |
| Google API | Indexing | Through API only (service accounts in DB) |

---

## VPS Operations

### Restart Procedure
```bash
cd /root/indexnow-dev
killall -9 node; sleep 3; fuser -k 3000/tcp 3001/tcp 3002/tcp; sleep 2
nohup pnpm dev --concurrency 15 > /tmp/turbo-dev.log 2>&1 &
# Wait ~60-70s for Turbopack to compile
tail -f /tmp/turbo-dev.log | grep -E 'Ready|Error'
```

### Deploy Procedure (commit → VPS)
```bash
# Local
cd indexnow-dev
git add <files>
git commit --no-verify -m "type(scope): description"
git push --no-verify

# VPS
ssh root@165.245.145.20 "cd /root/indexnow-dev && git pull origin main"
# If packages changed:
ssh root@165.245.145.20 "cd /root/indexnow-dev && pnpm --filter @indexnow/shared build && pnpm --filter @indexnow/database build && pnpm --filter @indexnow/analytics build"
# Restart if needed (see above)
```

### Verify Ports
```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000  # 307 = redirect to login
curl -s -o /dev/null -w '%{http_code}' http://localhost:3001  # 404 = no GET on API root
curl -s -o /dev/null -w '%{http_code}' http://localhost:3002  # 307 = redirect to login
```

---

## Build Commands

```bash
pnpm install                                    # Install all workspace deps
pnpm build                                      # Turborepo: packages first, then apps
pnpm dev                                        # All apps in parallel
pnpm --filter @indexnow/shared build            # Build single package
pnpm type-check                                 # TypeScript noEmit across all
pnpm test                                       # Vitest
```

Build order enforced by Turborepo (`^build`): packages build via tsup first, then apps via `next build`.

---

## Environment Variables

### API (apps/api/.env)
Core: `NODE_ENV`, `PORT=3001`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `ALLOWED_ORIGINS`
Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
Security: `ENCRYPTION_KEY` (32-char), `ENCRYPTION_MASTER_KEY` (64-char hex), `SYSTEM_API_KEY`, `JWT_SECRET`
Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_URL`, `ENABLE_BULLMQ=true`
SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
Paddle: `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `NEXT_PUBLIC_PADDLE_ENV`
Monitoring: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG_AUTH_TOKEN`, `NEXT_PUBLIC_POSTHOG_KEY`

### User Dashboard & Admin (apps/*/. env)
Client-side only: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_BASE_URL`, Sentry/PostHog keys.
`SENTRY_SUPPRESS_TURBOPACK_WARNING=1` (suppresses dev warning)
