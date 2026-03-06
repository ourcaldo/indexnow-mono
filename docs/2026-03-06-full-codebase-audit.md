# Full Codebase Audit Report

**Date:** 2026-03-06
**Scope:** All apps (`api`, `admin`, `user-dashboard`) + all packages (`shared`, `database`, `ui`, `auth`, `analytics`, `mail`, `services`, `supabase-client`, `api-middleware`) + configuration/infrastructure
**Auditor:** Copilot CLI (Claude Opus 4.6)
**Commit:** `1f49dae` (HEAD of `main`)

---

## Executive Summary

This audit performed a comprehensive code review across the entire IndexNow monorepo — 86 API route files, 2 frontend apps, 10 shared packages, and all configuration/infrastructure files.

**Total findings: 121**

| Severity | Count | Description |
|----------|-------|-------------|
| **C — Critical** | 5 | Security gaps, data integrity risks, CSP failures |
| **H — High** | 27 | Type safety violations, fire-and-forget patterns, dependency vulnerabilities, rate limiter bypasses |
| **M — Medium** | 40 | Dead code, memory leaks, inconsistent patterns, circuit breaker flaws |
| **L — Low** | 33 | Style issues, minor type assertions, convention mismatches |
| **E — Enhancement** | 16 | Deduplication, CI/CD improvements, performance optimizations |

### Key Risk Areas

1. **CSP provides zero XSS protection** — `unsafe-eval` + `unsafe-inline` in all apps (C-04, C-05)
2. **Rate limiter bypassable** — IP spoofing + race condition (H-17, H-18)
3. **30 npm vulnerabilities** including exploitable `next` DoS (H-10)
4. **Fire-and-forget patterns** — 4 routes have unawaited DB/email operations (C-02, H-04, H-05)
5. **PII sanitizer incomplete** — only checks keys, not string values (H-20)

### Clean Areas ✅

- No hardcoded secrets or credentials in source
- No SQL injection vectors
- No circular package dependencies — clean DAG
- DB schema ↔ TypeScript types in perfect sync (28/28 tables)
- All frontend auth flows properly proxy through API
- `.env` files not tracked in git

---

## Issue Tracker

| ID | Severity | Description | File Path | Status |
|----|----------|-------------|-----------|--------|
| C-01 | Critical | Sentry webhook raw handler — no wrapper, no audit trail | `apps/api/src/app/api/v1/webhooks/sentry/route.ts` | ✅ Fixed |
| C-02 | Critical | Fire-and-forget DB write — sentry_issue_id may never persist | `apps/api/src/app/api/v1/admin/errors/[id]/route.ts:66-70` | ✅ Fixed |
| C-03 | Critical | Non-atomic dual writes in subscription cancel — data integrity risk | `apps/api/src/app/api/v1/payments/paddle/subscription/cancel/route.ts` | ✅ Fixed |
| C-04 | Critical | CSP `unsafe-eval` in script-src across ALL 3 apps — XSS protection defeated | `apps/*/next.config.ts` | ✅ Fixed |
| C-05 | Critical | CSP `unsafe-inline` in script-src on frontend apps — zero XSS protection | `apps/admin/next.config.ts`, `apps/user-dashboard/next.config.ts` | ✅ Fixed |
| H-01 | High | `as any` in dashboard route — unchecked property access | `apps/api/src/app/api/v1/dashboard/route.ts:264,277` | ✅ Fixed |
| H-02 | High | `as never` in admin package update — bypasses type checker | `apps/api/src/app/api/v1/admin/settings/packages/[id]/route.ts:106` | ✅ Fixed |
| H-03 | High | `as any` abuse in admin payments page (8 instances) | `apps/admin/src/app/(dashboard)/settings/payments/page.tsx` | ✅ Fixed |
| H-04 | High | Fire-and-forget login notifications (login + session routes) | `apps/api/src/app/api/v1/auth/login/route.ts:196`, `auth/session/route.ts:174` | ✅ Fixed |
| H-05 | High | Fire-and-forget secureUpdate — swallowed error in reset-password | `apps/api/src/app/api/v1/admin/users/[id]/reset-password/route.ts:168` | ✅ Fixed |
| H-06 | High | Direct supabaseAdmin writes bypassing SecureServiceRoleWrapper | `apps/api/src/app/api/v1/auth/login/route.ts:180`, `webhooks/sentry/route.ts:65,96` | ✅ Fixed |
| H-07 | High | WorkerStartup is a non-functional stub — BullMQ jobs silently lost | `apps/api/src/lib/job-management/worker-startup.ts` | ✅ Fixed |
| H-08 | High | Broken cancel subscription call — no Bearer token, will 401 | `apps/user-dashboard/.../PlansBillingContent.tsx:216-220` | ✅ Fixed |
| H-09 | High | `as any` in admin order detail page | `apps/admin/src/app/(dashboard)/orders/[id]/page.tsx:60` | ✅ Fixed |
| H-10 | High | 30 npm vulnerabilities (1 critical, 16 high) incl. exploitable `next` DoS | `pnpm-lock.yaml` (transitive deps) | ✅ Fixed |
| H-11 | High | `as any` in admin error pages — missing type fields | `apps/admin/.../errors/page.tsx:241`, `errors/[id]/page.tsx:50` | ✅ Fixed |
| H-12 | High | `as unknown as` casts in user-dashboard (3 instances) | `apps/user-dashboard/.../PlansBillingContent.tsx:175`, `rank-history/page.tsx:653` | ✅ Fixed |
| H-13 | High | CI uses pnpm 9, project requires pnpm 10 — lockfile mismatch | `.github/workflows/ci.yml:15` | ✅ Fixed |
| H-14 | High | turbo.json globalEnv missing ~30 server-side env vars — stale cache risk | `turbo.json:3-26` | ✅ Fixed |
| H-15 | High | Docker Redis exposed on 0.0.0.0:6379 without auth | `docker-compose.yml:8` | ✅ Fixed |
| H-16 | High | No security audit step in CI pipeline | `.github/workflows/ci.yml` | ⏸️ Deferred |
| H-17 | High | IP spoofing bypasses rate limiter — trusts x-forwarded-for | `packages/shared/src/utils/rate-limiter.ts:143-146` | ✅ Fixed |
| H-18 | High | TOCTOU race in rate limiter — concurrent requests bypass MAX_ATTEMPTS | `packages/shared/src/utils/rate-limiter.ts:162-176` | ✅ Fixed |
| H-19 | High | SSRF via unsanitized IP in ipapi.co URL interpolation | `packages/shared/src/utils/ip-device-utils.ts:140` | ✅ Fixed |
| H-20 | High | PII sanitizer only checks object keys, never string values | `packages/shared/src/utils/pii-sanitizer.ts:32-46` | ✅ Fixed |
| H-21 | High | z.any() in admin user-management schema — unvalidated arbitrary data | `packages/shared/src/constants/ValidationRules.ts:282` | ✅ Fixed |
| H-22 | High | XSS sanitizer only strips `<script>` tags — event handlers, URIs bypass | `packages/shared/src/constants/ValidationRules.ts:389-394` | ✅ Fixed |
| H-23 | High | Missing 'use client' in checkout components — runtime error | `packages/ui/src/components/checkout/LoadingStates.tsx`, `CheckoutHeader.tsx` | ✅ Fixed |
| H-24 | High | `as number` type assertions in ErrorStatsCards | `packages/ui/src/components/admin/errors/ErrorStatsCards.tsx:62,126` | ✅ Fixed |
| H-25 | High | UI package exports point to ./src/ not ./dist/ | `packages/ui/package.json:18-26` | ✅ Fixed |
| H-26 | High | Analytics package missing @indexnow/shared from externals | `packages/analytics/tsup.config.ts:13-18` | ✅ Fixed |
| H-27 | High | Unsigned admin role-cache cookie — revoked admin retains access 60s | `apps/admin/src/middleware.ts:37-88` | ✅ Fixed |
| M-01 | Medium | 17+ dead endpoint constants with no route implementation | `packages/shared/src/constants/ApiEndpoints.ts` | ✅ Fixed |
| M-02 | Medium | Paddle webhook uses raw NextResponse.json() — non-standard response shape | `apps/api/src/app/api/v1/payments/paddle/webhook/route.ts` | ⏸️ Deferred |
| M-03 | Medium | Sentry webhook uses raw NextResponse.json() (12 instances) | `apps/api/src/app/api/v1/webhooks/sentry/route.ts` | ✅ Fixed |
| M-04 | Medium | No Zod validation on webhook payloads — crash on malformed input | `apps/api/.../webhooks/sentry/route.ts:42`, `paddle/webhook/route.ts` | ⏸️ Deferred |
| M-05 | Medium | 4 stub routes return 501/503 without documentation | `apps/api/.../customer-portal/route.ts`, `seranking/health/metrics/route.ts`, etc. | ⏸️ Deferred |
| M-06 | Medium | Inconsistent error creation — throw Error vs ErrorHandlingService.createError | `apps/api/...` (7 route files) | ⏸️ Deferred |
| M-07 | Medium | Silent error swallowing — ActivityLogger failures invisible | `apps/api/...` (7 route files) | ⏸️ Deferred |
| M-08 | Medium | Type casting `request as unknown as NextRequest` in change-password | `apps/api/.../auth/user/change-password/route.ts:26,101` | ✅ Fixed |
| M-09 | Medium | 3 dead hooks exported but never imported | `apps/user-dashboard/src/hooks/hooks.ts` (useWeeklyTrends, useCheckRank, useAddTag) | ✅ Fixed |
| M-10 | Medium | In-memory rate limiter store — no periodic GC, memory leak under load | `packages/shared/src/utils/rate-limiter.ts:31-56` | ✅ Fixed |
| M-11 | Medium | Rate limiter eviction O(n log n) sort on every set at capacity | `packages/shared/src/utils/rate-limiter.ts:46-50` | ✅ Fixed |
| M-12 | Medium | Circuit breaker HALF_OPEN allows unlimited concurrent requests | `packages/shared/src/utils/resilience/CircuitBreaker.ts:60-72` | ✅ Fixed |
| M-13 | Medium | Circuit breaker — single success resets ALL failure history | `packages/shared/src/utils/resilience/CircuitBreaker.ts:87-98` | ✅ Fixed |
| M-14 | Medium | FallbackHandler cache has no size limit — unbounded memory growth | `packages/shared/src/utils/resilience/FallbackHandler.ts:29` | ✅ Fixed |
| M-15 | Medium | FallbackHandler `return {} as T` — unsafe empty fallback cast | `packages/shared/src/utils/resilience/FallbackHandler.ts:132` | ✅ Fixed |
| M-16 | Medium | FallbackHandler `return result as T` — Partial<T> cast lies to consumers | `packages/shared/src/utils/resilience/FallbackHandler.ts:78` | ✅ Fixed |
| M-17 | Medium | Logger never sanitizes context objects — credentials may appear in logs | `packages/shared/src/utils/logger.ts:45-76` | ✅ Fixed |
| M-18 | Medium | ErrorHandlingService logs entire config object — PII/secrets leak | `packages/shared/src/utils/logger.ts:132-152` | ✅ Fixed |
| M-19 | Medium | Logger uses `as Error & {...}` type assertion | `packages/shared/src/utils/logger.ts:145-146` | ✅ Fixed |
| M-20 | Medium | PII sanitizer SENSITIVE_KEYS includes bare 'key' — false positive redaction | `packages/shared/src/utils/pii-sanitizer.ts:9` | ✅ Fixed |
| M-21 | Medium | PII sanitizer missing patterns: ssn, credit_card, credentials, pin, etc. | `packages/shared/src/utils/pii-sanitizer.ts:6-21` | ✅ Fixed |
| M-22 | Medium | PII sanitizer has 3 `as` type assertions | `packages/shared/src/utils/pii-sanitizer.ts:58-61` | ✅ Fixed |
| M-23 | Medium | JSON-in-string detection bypass — leading whitespace evades parsing | `packages/shared/src/utils/pii-sanitizer.ts:34-35` | ✅ Fixed |
| M-24 | Medium | isValidUrl auto-prepends https:// — no SSRF protection for private IPs | `packages/shared/src/utils/url-utils.ts:87-94` | ✅ Fixed |
| M-25 | Medium | extractDomain no blocklist for internal/private IPs | `packages/shared/src/utils/url-utils.ts:54-63` | ✅ Fixed |
| M-26 | Medium | AppConfig build-time stub uses `as unknown as` double cast | `packages/shared/src/core/config/AppConfig.ts:226-235` | ✅ Fixed |
| M-27 | Medium | getClientIP trusts x-forwarded-for, x-real-ip without validation | `packages/shared/src/utils/ip-device-utils.ts:29-48` | ✅ Fixed |
| M-28 | Medium | Country-based risk scoring compares names vs codes — never triggers | `packages/shared/src/utils/ip-device-utils.ts:256-260` | ✅ Fixed |
| M-29 | Medium | ExponentialBackoff throws undefined when maxAttempts=0 | `packages/shared/src/utils/resilience/ExponentialBackoff.ts:124` | ✅ Fixed |
| M-30 | Medium | Missing 'use client' in 6 base UI components (forwardRef) | `packages/ui/src/components/{button,input,textarea,card,table,alert}.tsx` | ✅ Fixed |
| M-31 | Medium | Wildcard domains in CSP (*.supabase.co, *.posthog.com, etc.) | `apps/*/next.config.ts` | ⏸️ Deferred |
| M-32 | Medium | Dependency versions not in pnpm catalog (recharts, @paddle/paddle-js) | `apps/user-dashboard/package.json`, `packages/ui/package.json` | ✅ Fixed |
| M-33 | Medium | PostCSS config in API app (server-only — dead config) | `apps/api/postcss.config.mjs` | ✅ Fixed |
| M-34 | Medium | SQL schema duplicate CREATE TABLE for indb_keyword_rankings | `database-schema/database_schema.sql` | ⏸️ Deferred |
| M-35 | Medium | Changeset package names don't match workspace names | `.changeset/config.json:7` | ✅ Fixed |
| M-36 | Medium | api-middleware tsup uses skipLibCheck — hides type errors | `packages/api-middleware/tsup.config.ts:6-9` | ✅ Fixed |
| M-37 | Medium | Missing peerDependencies in analytics + services packages | `packages/analytics/package.json`, `packages/services/package.json` | ✅ Fixed |
| M-38 | Medium | Missing splitting:false in supabase-client + api-middleware tsup | `packages/supabase-client/tsup.config.ts`, `packages/api-middleware/tsup.config.ts` | ✅ Fixed |
| M-39 | Medium | API .env.example missing 5 env vars (Paddle, SeRanking, Sentry) | `apps/api/.env.example` | ✅ Fixed |
| M-40 | Medium | Docker services missing health checks | `docker-compose.yml:17-62` | ✅ Fixed |
| L-01 | Low | Non-null assertions on nullable DB fields (3 routes) | `apps/api/...` (webhook utils, trial-status, order status) | ✅ Fixed |
| L-02 | Low | 18 `as unknown as T` patterns in API route handlers | `apps/api/...` (various route files) | ✅ Fixed |
| L-03 | Low | Non-null assertions in IntegrationService (3 instances) | `apps/api/src/lib/keyword-enrichment/services/IntegrationService.ts:215-217` | ✅ Fixed |
| L-04 | Low | `as string` on enum comparisons in keyword enrichment (3 instances) | `apps/api/src/lib/keyword-enrichment/services/KeywordEnrichmentService.ts` | ✅ Fixed |
| L-05 | Low | user-dashboard uses @tanstack/react-query — convention says raw fetch | `apps/user-dashboard/src/hooks/hooks.ts` | ⏸️ Deferred |
| L-06 | Low | 2 hardcoded API URLs (no endpoint constants) | `apps/user-dashboard/.../PlansBillingContent.tsx` | ✅ Fixed |
| L-07 | Low | 'use client' on line 4 instead of line 1 | `apps/user-dashboard/.../resend-verification/page.tsx` | ✅ Fixed |
| L-08 | Low | .env file permissions should be 600 on VPS | `apps/*/.env` | ⏸️ Deferred |
| L-09 | Low | Docker services don't use network isolation | `docker-compose.yml` | ✅ Fixed |
| L-10 | Low | tailwind.config.ts in apps — Tailwind CSS 4 uses CSS-based config | `apps/admin/tailwind.config.ts`, `apps/user-dashboard/tailwind.config.ts` | ⏸️ Deferred |
| L-11 | Low | Node.js engine ">=18" could be ">=20" to match actual usage | `package.json` | ✅ Fixed |
| L-12 | Low | TODO: IP geolocation cache missing — external HTTP per request | `packages/shared/src/utils/ip-device-utils.ts:135-136` | ✅ Fixed |
| L-13 | Low | getCurrencySymbol() always returns '$' for all currencies | `packages/shared/src/utils/currency-utils.ts:23-25` | ✅ Fixed |
| L-14 | Low | countries.ts uses `as RegistrationCountry[]` cast | `packages/shared/src/utils/countries.ts:276` | ✅ Fixed |
| L-15 | Low | REGEX_PATTERNS duplicates VALIDATION_PATTERNS — drift risk | `packages/shared/src/constants/AppConstants.ts:229-235` | ✅ Fixed |
| L-16 | Low | isValidEndpoint only validates subset of endpoints | `packages/shared/src/constants/ApiEndpoints.ts:221-245` | ✅ Fixed |
| L-17 | Low | Resilient decorator uses `Object` type + eslint-disable for any | `packages/shared/src/utils/resilience/ResilientOperationExecutor.ts:194-221` | ✅ Fixed |
| L-18 | Low | CircuitBreaker failures array uses shift() — O(n) per failure | `packages/shared/src/utils/resilience/CircuitBreaker.ts:48` | ✅ Fixed |
| L-19 | Low | formatters.ts month calculation imprecise (30-day approximation) | `packages/shared/src/utils/formatters.ts:74` | ✅ Fixed |
| L-20 | Low | Dynamic Tailwind class `grid-cols-${...}` — not purge-safe | `packages/ui/src/components/skeleton.tsx:43` | ✅ Fixed |
| L-21 | Low | Silent empty .catch() on clipboard write — no user feedback | `packages/ui/src/components/error-state.tsx:70` | ✅ Fixed |
| L-22 | Low | 'use client' on wrong line in 2 UI hooks (after JSDoc) | `packages/ui/src/hooks/useActivityLogger.ts:6`, `useAdminActivityLogger.ts:14` | ✅ Fixed |
| L-23 | Low | Missing @indexnow/shared from externals in supabase-client tsup | `packages/supabase-client/tsup.config.ts` | ✅ Fixed |
| L-24 | Low | database package depends on supabase-client (browser coupling) | `packages/database/src/utils/queryClient.ts:3` | ⏸️ Deferred |
| L-25 | Low | sentry.client.config.ts in API app (server-only) — dead config | `apps/api/sentry.client.config.ts` | ✅ Fixed |
| L-26 | Low | Admin middleware queries DB directly (acceptable for edge but undocumented) | `apps/admin/src/middleware.ts` | ⏸️ Deferred |
| L-27 | Low | Inconsistent tsup config styles across packages | `packages/*/tsup.config.ts` | ⏸️ Deferred |
| E-01 | Enhancement | Extract UserProfileService — 6 routes duplicate profile fetch | `apps/api/src/app/api/v1/...` (6 route files) | Open |
| E-02 | Enhancement | Extract QuotaCalculator — identical quota math in 2 routes | `apps/api/.../quota/route.ts`, `dashboard/route.ts` | Open |
| E-03 | Enhancement | Extract pricing tier extraction — duplicate logic in 2 routes | `apps/api/.../billing/overview/route.ts`, `dashboard/route.ts` | Open |
| E-04 | Enhancement | Create buildOperationContext() helper — ~5 lines boilerplate/route | `apps/api/...` (all routes with SecureServiceRoleWrapper) | Open |
| E-05 | Enhancement | Create fromJsonTyped<T>() utility for 18 Json ↔ T casts | `apps/api/...` (various route files) | Open |
| E-06 | Enhancement | Clean up 17 dead ApiEndpoints constants (M-01) | `packages/shared/src/constants/ApiEndpoints.ts` | Open |
| E-07 | Enhancement | Extract extractErrorMeta() helper for admin error pages | `apps/admin/.../errors/page.tsx`, `errors/[id]/page.tsx` | Open |
| E-08 | Enhancement | Extract useAdminUserDetail(userId) hook from inline useQuery | `apps/admin/.../users/[id]/page.tsx` | Open |
| E-09 | Enhancement | API client runs getUser()+getSession() per call — add token caching | `apps/user-dashboard/src/lib/api.ts` | Open |
| E-10 | Enhancement | Consider Zod runtime validation for API responses | All frontend apps | Open |
| E-11 | Enhancement | Add pnpm audit to CI pipeline | `.github/workflows/ci.yml` | Open |
| E-12 | Enhancement | Implement nonce-based CSP (tracked as #V7 H-18) | `apps/*/next.config.ts` | Open |
| E-13 | Enhancement | Add GitHub Actions Turborepo remote caching | `.github/workflows/ci.yml` | Open |
| E-14 | Enhancement | Pin external GitHub Actions to commit SHAs | `.github/workflows/ci.yml` | Open |
| E-15 | Enhancement | Add Dependabot or Renovate for dependency updates | `.github/` (new file) | Open |
| E-16 | Enhancement | Add Docker health checks for all app services | `docker-compose.yml` | Open |

---

## Detailed Findings

### CRITICAL (C) — Immediate Action Required

#### C-01: Sentry webhook raw handler — no wrapper, no audit trail

**File:** `apps/api/src/app/api/v1/webhooks/sentry/route.ts:20`

```typescript
export async function POST(request: NextRequest) {
```

This is the **only** route in the entire API (out of 86) that exports a raw handler instead of using `publicApiWrapper`. It bypasses ALL middleware: CORS headers, rate limiting, request ID generation, structured error formatting, and audit logging.

Additionally, it performs direct `supabaseAdmin` writes (lines 65–73, 96–104) without `SecureServiceRoleWrapper`, meaning all DB mutations happen without audit trail entries in `indb_security_audit_logs`.

**Fix:** Wrap in `publicApiWrapper`, move DB writes into `SecureServiceRoleWrapper.executeSecureOperation()`.

---

#### C-02: Fire-and-forget DB write in admin error detail

**File:** `apps/api/src/app/api/v1/admin/errors/[id]/route.ts:66-70`

```typescript
supabaseAdmin
  .from('indb_system_error_logs')
  .update({ sentry_issue_id: sentryIssueId })
  .eq('id', errorId)
  .then(() => {});
```

The `.then(() => {})` is unawaited — the promise floats. In Next.js, the runtime tears down the execution context after the response is sent. The DB write may silently fail, and the Sentry issue ID never persists.

**Fix:** `await` the write, handle errors properly.

---

#### C-03: Non-atomic dual writes in subscription cancel

**File:** `apps/api/src/app/api/v1/payments/paddle/subscription/cancel/route.ts`

Two separate DB writes (subscription status update + transaction record) are not atomic. If the process crashes between them, the subscription is cancelled in Paddle but the DB is in an inconsistent state — financial data integrity risk.

A TODO `(#65)` already documents this needs a single Postgres RPC for atomicity.

**Fix:** Implement the Postgres RPC or use a database transaction.

---

#### C-04: CSP `unsafe-eval` across ALL 3 apps

**Files:** `apps/api/next.config.ts:15`, `apps/admin/next.config.ts:26`, `apps/user-dashboard/next.config.ts:29`

All three apps include `'unsafe-eval'` in their CSP `script-src`. This allows `eval()`, `Function()`, and `setTimeout(string)` — the primary vectors for XSS exploitation. A TODO `(#V7 H-18)` exists for nonce-based CSP migration.

**Fix:** Implement nonce-based CSP. Next.js 16 supports `nonce` via `headers()`.

---

#### C-05: CSP `unsafe-inline` on frontend apps

**Files:** `apps/admin/next.config.ts:26`, `apps/user-dashboard/next.config.ts:29`

Combined with C-04, `unsafe-inline` allows any inline `<script>` tag to execute. CSP provides **zero protection** against XSS on these apps.

**Fix:** Same as C-04 — nonce-based CSP eliminates both.

---

### HIGH (H) — Fix Soon

#### H-01: `as any` in API dashboard route

**File:** `apps/api/src/app/api/v1/dashboard/route.ts:264,277`

```typescript
const recentKwRaw = (recentKeywordsResult.data || []) as any[];
const recentKeywords = recentKwRaw.map((kw: any) => ({
```

Direct `as any` violation — the Supabase return type is known. All property accesses on lines 278-284 are completely unchecked.

---

#### H-02: `as never` in admin package update

**File:** `apps/api/src/app/api/v1/admin/settings/packages/[id]/route.ts:106`

```typescript
.update(updateData as never)
```

Indicates a type mismatch that was papered over instead of fixed.

---

#### H-03: `as any` abuse in admin payments page (8 instances)

**File:** `apps/admin/src/app/(dashboard)/settings/payments/page.tsx:9,23,37,73,76`

8 `as any` casts for `configuration` and `api_credentials` objects. Needs proper `PaymentGatewayConfig` / `PaymentGatewayCredentials` interfaces.

---

#### H-04: Fire-and-forget login notifications

**Files:** `apps/api/src/app/api/v1/auth/login/route.ts:196-212`, `auth/session/route.ts:174-190`

Both routes have unawaited `loginNotificationService.sendLoginNotification()` calls. The session route has an empty `.catch()` that swallows all errors silently. Users may intermittently not receive login security notifications.

---

#### H-05: Fire-and-forget secureUpdate in reset-password

**File:** `apps/api/src/app/api/v1/admin/users/[id]/reset-password/route.ts:168-179`

The `.catch()` swallows the error — `must_change_password` flag may not be set, and the route continues as if it succeeded. User won't be forced to change password after admin reset.

---

#### H-06: Direct supabaseAdmin writes bypassing SecureServiceRoleWrapper

**Files:** `apps/api/src/app/api/v1/auth/login/route.ts:180-188`, `webhooks/sentry/route.ts:65-73,96-104`

3 direct `supabaseAdmin` writes without `SecureServiceRoleWrapper`. No audit log entries created for profile modification (including PII: IP address, email) or error log updates.

---

#### H-07: WorkerStartup is a non-functional stub

**File:** `apps/api/src/lib/job-management/worker-startup.ts:1-22`

If `ENABLE_BULLMQ=true` and `WORKER_MODE=true`, jobs get enqueued but never processed. Production time bomb. TODO comment documents this: `⚠ (#V7 H-22)`.

---

#### H-08: Broken cancel subscription call (user-dashboard)

**File:** `apps/user-dashboard/.../PlansBillingContent.tsx:216-220`

Uses raw `fetch()` with no Bearer token, no `credentials:'include'`, and a hardcoded relative URL. The API route requires `authenticatedApiWrapper`. **This call will always 401.**

---

#### H-09: `as any` in admin order detail

**File:** `apps/admin/src/app/(dashboard)/orders/[id]/page.tsx:60`

`order as any` fallback hides API response shape uncertainty.

---

#### H-10: 30 npm vulnerabilities (1 critical, 16 high)

**Source:** `pnpm audit`

Key vulnerabilities:
- `form-data <2.5.4` (CRITICAL) — unsafe random function for multipart boundaries
- `next >=16.1.0-canary.0 <16.1.5` (HIGH) — HTTP deserialization DoS via insecure RSC
- `nodemailer <=7.0.10` (HIGH) — DoS via recursive addressparser
- `rollup >=4.0.0 <4.59.0` (HIGH) — arbitrary file write via path traversal
- `dompurify >=3.1.3 <=3.3.1` (MODERATE) — XSS in the XSS sanitizer

**Fix:** `pnpm update` for direct deps; file issues with upstream for transitive deps.

---

#### H-11: `as any` in admin error pages

**Files:** `apps/admin/.../errors/page.tsx:241-243`, `errors/[id]/page.tsx:50-51`

`ErrorDetailResponse` type missing `sentry` and `resolverInfo` fields. Fix the type definition once.

---

#### H-12: `as unknown as` casts in user-dashboard

**Files:** `apps/user-dashboard/.../PlansBillingContent.tsx:175-178`, `rank-history/page.tsx:653`

Response types don't match actual API shapes, requiring unsafe casts.

---

#### H-13: CI uses pnpm 9, project requires pnpm 10

**File:** `.github/workflows/ci.yml:15`

`PNPM_VERSION: '9'` but `package.json` specifies `pnpm@10.28.2`. pnpm 9→10 had breaking changes (catalog protocol, lockfile format). CI may silently use wrong dependency resolution.

---

#### H-14: turbo.json globalEnv missing ~30 server-side env vars

**File:** `turbo.json:3-26`

Only 22 vars listed. Missing: `REDIS_URL`, `SUPABASE_JWT_SECRET`, `PORT`, `LOG_LEVEL`, `ENABLE_BULLMQ`, `WORKER_MODE`, `SE_RANKING_API_KEY`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, all `BULLMQ_CONCURRENCY_*` and `BULLMQ_RATE_LIMIT_*` vars, and more.

Turborepo uses `globalEnv` to bust cache when env vars change. Missing vars means cached builds may serve stale code.

---

#### H-15: Docker Redis exposed without auth

**File:** `docker-compose.yml:8`

Redis on `ports: '6379:6379'` with no `--requirepass`. Anyone on the network can connect, exfiltrate data, or execute commands.

---

#### H-16: No security audit step in CI

**File:** `.github/workflows/ci.yml`

CI runs lint, type-check, test, build — but no `pnpm audit`, no SAST (CodeQL/SonarQube), no dependency scanning.

---

#### H-17: IP spoofing bypasses rate limiter

**File:** `packages/shared/src/utils/rate-limiter.ts:143-146`

`getClientIp()` trusts `x-forwarded-for` / `x-real-ip` headers without proxy validation. Attacker rotates spoofed IPs to defeat rate limits.

---

#### H-18: TOCTOU race in rate limiter

**File:** `packages/shared/src/utils/rate-limiter.ts:162-176`

`recordFailedAttempt()` reads entry, mutates in-memory, writes back. Two concurrent requests can both read count=4, both write count=5, allowing a 6th attempt past MAX_ATTEMPTS=5.

---

#### H-19: SSRF via IP interpolation

**File:** `packages/shared/src/utils/ip-device-utils.ts:140`

Fetches `https://ipapi.co/${ipAddress}/json/` with unsanitized IP from request headers. A crafted `x-forwarded-for` value can redirect the outbound request.

---

#### H-20: PII sanitizer only checks keys, not values

**File:** `packages/shared/src/utils/pii-sanitizer.ts:32-46`

Emails, SSNs, credit card numbers, phone numbers embedded in string values pass through unsanitized. Only object key names are checked.

---

#### H-21: z.any() in admin user-management schema

**File:** `packages/shared/src/constants/ValidationRules.ts:282`

`z.record(z.any()).optional()` allows arbitrary unvalidated data through the admin endpoint.

---

#### H-22: XSS sanitizer only strips `<script>` tags

**File:** `packages/shared/src/constants/ValidationRules.ts:389-394`

Doesn't handle `onerror=`, `javascript:` URIs, CSS `expression()`, `<img>`, `<svg>`, or encoded variants. Stored XSS possible if this is the sole sanitization layer.

---

#### H-23: Missing 'use client' in checkout components

**Files:** `packages/ui/src/components/checkout/LoadingStates.tsx:1`, `CheckoutHeader.tsx:1`

Both use `onClick` handlers but lack the `'use client'` directive. Will fail as server components at runtime.

---

#### H-24: `as number` in ErrorStatsCards

**File:** `packages/ui/src/components/admin/errors/ErrorStatsCards.tsx:62,126`

Type assertions in sort comparator and JSX render — runtime crash if value is not a number.

---

#### H-25: UI package exports point to ./src/ not ./dist/

**File:** `packages/ui/package.json:18-26`

Consumers get raw TypeScript instead of compiled JS+types. Works in dev due to path aliases but breaks distribution.

---

#### H-26: Analytics missing @indexnow/shared from externals

**File:** `packages/analytics/tsup.config.ts:13-18`

Shared code gets bundled INTO analytics dist — duplicate code, potential version drift.

---

#### H-27: Unsigned admin role-cache cookie

**File:** `apps/admin/src/middleware.ts:37-88`

Admin middleware caches role verification in an unsigned cookie. A forged cookie with a valid admin user ID can skip the DB role check for up to 60 seconds. HMAC-signing would fix this.

---

### MEDIUM (M) — Address in Next Sprint

#### M-01: 17+ dead endpoint constants

**File:** `packages/shared/src/constants/ApiEndpoints.ts`

Constants defined with no corresponding `route.ts` file: `SUSPEND_USER`, `AVATAR`, `PROFILE_COMPLETE`, `QUOTA_HISTORY`, `QUOTA_ALERTS`, `QUOTA_ALERT_ACKNOWLEDGE`, `QUOTA_INCREASE_REQUEST`, `RANK_TRACKING.COMPETITORS/EXPORT/STATS/RANKINGS_CHECK/KEYWORD_BY_ID/KEYWORD_HISTORY/KEYWORDS_BULK`, `ADMIN.USER_ROLE`, `ERROR_ENDPOINTS.LOG`. Frontend calling these gets 404.

---

#### M-02–M-03: Raw NextResponse.json() in webhooks

**Files:** Paddle webhook (6 instances), Sentry webhook (12 instances)

Non-standard response shapes bypass monitoring tools expecting the standard `{ success, data/error, timestamp, requestId }` format.

---

#### M-04: No Zod validation on webhook payloads

**Files:** Sentry webhook (`JSON.parse(bodyText)` line 42), Paddle webhook (inline destructuring)

Malformed payloads cause runtime crashes with unhelpful error messages.

---

#### M-05: 4 stub routes return 501/503

Customer portal, SE Ranking health/metrics, SE Ranking quota/status, and subscription update are stubs. Not documented as planned/unimplemented.

---

#### M-06: Inconsistent error creation

7 route files use `throw new Error()` instead of `ErrorHandlingService.createError()`. While wrappers catch them, errors lack structured metadata (severity, type, context).

---

#### M-07: Silent error swallowing

7 routes suppress `ActivityLogger` failures with `catch (_) { /* non-critical */ }`. If ActivityLogger has a systemic issue, there's zero visibility.

---

#### M-08: Type casting in change-password route

**File:** `apps/api/.../auth/user/change-password/route.ts:26,101`

`request as unknown as NextRequest` double-cast suggests a wrapper type mismatch that was worked around.

---

#### M-09: 3 dead hooks

**File:** `apps/user-dashboard/src/hooks/hooks.ts`

`useWeeklyTrends`, `useCheckRank`, `useAddTag` — exported but never imported anywhere.

---

#### M-10–M-11: Rate limiter memory and performance

In-memory store has no periodic GC (entries leak until eviction). Eviction sorts ALL entries O(n log n) on every `set()` at capacity (10K entries). CPU pressure under distributed attacks.

---

#### M-12–M-13: Circuit breaker design flaws

HALF_OPEN allows unlimited concurrent requests (should allow single probe). A single success in CLOSED state resets ALL failure history — intermittent failures (4 fail, 1 success, repeat) never trip the breaker.

---

#### M-14–M-16: FallbackHandler issues

Unbounded cache (no max-entries). `return {} as T` creates type-level lie (empty object pretends to be T). `return result as T` casts `Partial<T>` to `T`, hiding missing properties.

---

#### M-17–M-19: Logger/ErrorHandling PII risks

Logger doesn't sanitize context objects — passwords/tokens may appear in logs. `ErrorHandlingService.createError()` logs entire config including arbitrary extra keys. Logger uses `as Error & {...}` cast.

---

#### M-20–M-23: PII sanitizer gaps

SENSITIVE_KEYS includes bare `'key'` (matches "primaryKey", "keyboardType"). Missing patterns: 'ssn', 'credit_card', 'credentials', 'pin', 'routing_number'. Has 3 `as` casts. JSON-in-string detection requires exact `{`/`[` start — whitespace bypasses.

---

#### M-24–M-25: URL utils SSRF risk

`isValidUrl` auto-prepends `https://` — `127.0.0.1` validates as legitimate. `extractDomain` has no blocklist for private IPs (10.x, 169.254.x, ::1).

---

#### M-26: AppConfig double cast

Build-time stub uses `as unknown as ReturnType<typeof ConfigSchema.parse>`, returning unvalidated config.

---

#### M-27: IP header trust without validation

**File:** `packages/shared/src/utils/ip-device-utils.ts:29-48`

`getClientIP` trusts `x-forwarded-for`, `x-real-ip`, `x-client-ip` without validation. Related to H-17 but different function/file.

---

#### M-28: Country risk scoring dead code

Compares `country_name` (e.g., "Russian Federation") against ISO codes ("RU"). The condition never matches.

---

#### M-29: ExponentialBackoff edge case

`throw lastError!` with non-null assertion. If `maxAttempts` is 0, `lastError` is never assigned — throws `undefined`.

---

#### M-30: Missing 'use client' in 6 base UI components

`button.tsx`, `input.tsx`, `textarea.tsx`, `card.tsx`, `table.tsx`, `alert.tsx` — all use `React.forwardRef` but lack directive. Works only because parent components have it, but fragile if imported directly.

---

#### M-31: Wildcard domains in CSP

`*.supabase.co`, `*.posthog.com`, `*.paddle.com`, `*.sentry.io` — wildcards on multi-tenant domains allow loading resources from any tenant's subdomain.

---

#### M-32: Dependencies not in pnpm catalog

`recharts@3.7.0` and `@paddle/paddle-js@1.4.2` hardcoded instead of using catalog. Version drift risk.

---

#### M-33: Dead PostCSS config in API app

API is server-only (no UI), but has PostCSS + Tailwind config. Slows build unnecessarily.

---

#### M-34: SQL schema duplicate CREATE TABLE

`indb_keyword_rankings` appears twice in `database_schema.sql`. Can't run idempotently.

---

#### M-35: Changeset names mismatch

`.changeset/config.json` uses `["admin", "api", "user-dashboard"]` but workspace `name` fields may differ.

---

#### M-36: api-middleware tsup uses skipLibCheck

Hides type errors in declaration generation. Inconsistent with other packages.

---

#### M-37: Missing peerDependencies

`packages/analytics` and `packages/services` don't declare peer deps for `react`, `next`, `@indexnow/database`, `@indexnow/shared`.

---

#### M-38: Missing splitting:false in tsup configs

`supabase-client` and `api-middleware` inconsistent with all other packages.

---

#### M-39: API .env.example incomplete

Missing: `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `SENTRY_SUPPRESS_TURBOPACK_WARNING`, `SE_RANKING_API_KEY`, `SE_RANKING_API_URL`.

---

#### M-40: Docker services missing health checks

`api`, `admin`, `user-dashboard` services have no health checks. Container orchestrators can't manage rolling deployments.

---

### LOW (L) — Address When Convenient

#### L-01–L-03: Non-null assertions

3 routes use `!` on nullable DB fields (`customData.packageSlug!`, `userProfile.package_id!`, `updatedTransaction.verified_by!`). Plus 3 instances in `IntegrationService.ts` (`integrationResult.data!`).

#### L-04: `as string` on enum comparisons

`(job.status as string) === 'cancelled'` in keyword enrichment — the status enum likely doesn't include `'cancelled'`.

#### L-05: Convention mismatch — react-query in user-dashboard

User-dashboard hooks use `@tanstack/react-query` in places, but convention says raw `fetch()` + `useState`.

#### L-06: Hardcoded API URLs

2 URLs in `PlansBillingContent.tsx` don't use `ApiEndpoints` constants.

#### L-07: 'use client' on wrong line

`resend-verification/page.tsx` has directive on line 4 instead of line 1.

#### L-08: .env file permissions

Real `.env` files on VPS should be `chmod 600`. Currently standard permissions.

#### L-09: Docker no network isolation

All services share default bridge. Redis accessible from all containers AND host.

#### L-10: Legacy Tailwind v3 config files

`tailwind.config.ts` files in apps may be unused — Tailwind CSS 4 uses CSS-based config.

#### L-11: Node.js engine too permissive

`">=18.0.0"` allows Node 18, but CI and Docker use Node 20. Tighten to `">=20.0.0"`.

#### L-12: IP geolocation cache missing

Every request with a public IP triggers an external HTTP call to `ipapi.co`.

#### L-13: getCurrencySymbol() hardcoded to '$'

Returns `$` for all currencies despite `formatCurrency()` supporting any ISO 4217 code.

#### L-14: `as RegistrationCountry[]` in countries.ts

Type assertion on `.filter(Boolean)` result. Use a type-guard filter instead.

#### L-15: Duplicate regex patterns

`REGEX_PATTERNS` in `AppConstants.ts` duplicates `VALIDATION_PATTERNS` in `ValidationRules.ts`. Drift risk.

#### L-16: isValidEndpoint incomplete

Only validates a subset of endpoints — returns false negatives for valid dynamic endpoints.

#### L-17: Resilient decorator loose typing

Uses `Object` type for target and `eslint-disable` for `any`.

#### L-18: CircuitBreaker O(n) shift()

`failures` array uses `shift()` for cleanup — O(n) per failure.

#### L-19: Imprecise month calculation

`Math.floor(diffInDays / 30)` — 31-day month shows "0 months ago" at day 30.

#### L-20: Dynamic Tailwind class not purge-safe

`grid-cols-${Math.min(count,4)}` — Tailwind strips dynamic classes at build time.

#### L-21: Silent clipboard .catch()

No user feedback when clipboard write fails.

#### L-22: 'use client' misplaced in UI hooks

After JSDoc comment instead of line 1 in `useActivityLogger.ts` and `useAdminActivityLogger.ts`.

#### L-23: Missing external in supabase-client tsup

`@indexnow/shared` not in `external[]` — gets bundled into output.

#### L-24: database → supabase-client coupling

`database` imports browser-only `supabaseBrowser` from `supabase-client`, adding browser-runtime dependency to a package also used server-side.

#### L-25: Dead sentry.client.config.ts in API app

Server-only app has client-side Sentry config. Required by `@sentry/nextjs` wrapper but `@sentry/node` alone would suffice.

#### L-26: Admin middleware direct DB query

Edge middleware queries `indb_auth_user_profiles` directly. Acceptable for edge runtime but undocumented.

#### L-27: Inconsistent tsup config styles

Mixed semicolons, indentation, entry formats across package configs.

---

### ENHANCEMENT (E) — Improve When Possible

#### E-01: Extract UserProfileService
6 routes duplicate the same `SecureServiceRoleWrapper.executeWithUserSession()` → `indb_auth_user_profiles` query pattern.

#### E-02: Extract QuotaCalculator
Identical quota math (`maxKeywords`, `isKeywordsUnlimited`, `remaining`) in `quota/route.ts` and `dashboard/route.ts`.

#### E-03: Extract pricing tier extraction
Identical `pricingTiers` extraction in `billing/overview/route.ts` and `dashboard/route.ts`.

#### E-04: Create buildOperationContext() helper
~5 lines of SecureServiceRoleWrapper metadata boilerplate per route (~400 lines total across 86 routes).

#### E-05: Create fromJsonTyped<T>() utility
Centralize the 18 `as unknown as T` Json bridge casts into a single greppable helper.

#### E-06: Clean up dead ApiEndpoints constants
Remove or annotate the 17 endpoint constants with no implementation to prevent frontend 404s.

#### E-07: Extract extractErrorMeta() helper
Duplicated Sentry/resolverInfo extraction logic in admin error pages.

#### E-08: Extract useAdminUserDetail(userId) hook
Inline `useQuery` in admin users page should be a proper hook.

#### E-09: Token caching in API client
`api.ts` runs `getUser()` + `getSession()` per call. Cache the token with TTL to reduce overhead.

#### E-10: Zod runtime validation for API responses
Type-safe API response parsing instead of `as T` casts in frontend apps.

#### E-11: Add pnpm audit to CI
Automatically catch vulnerable dependencies before merge.

#### E-12: Implement nonce-based CSP
Replace `unsafe-inline` + `unsafe-eval` with nonce-based CSP. Already tracked as `#V7 H-18`.

#### E-13: Add Turborepo remote caching to CI
Add `TURBO_TOKEN`/`TURBO_TEAM` or use the `turbo-cache` GitHub Action.

#### E-14: Pin GitHub Actions to commit SHAs
Prevent supply-chain attacks via tag mutation (e.g., `actions/checkout@a5ac7...`).

#### E-15: Add Dependabot or Renovate
Automated PRs for dependency updates to prevent the 30-vulnerability situation.

#### E-16: Docker health checks for app services
Enable proper rolling deployments and auto-restart for unhealthy containers.

---

## Verified Clean Areas ✅

| Area | Status |
|------|--------|
| Hardcoded secrets/credentials | ✅ None found in source code |
| SQL injection vectors | ✅ No string concatenation in Supabase queries |
| Circular package dependencies | ✅ Clean DAG: shared → database/analytics/supabase-client → auth/services → ui |
| DB schema ↔ TypeScript types | ✅ All 28 tables match between SQL and `database.ts` |
| Frontend auth proxy rule | ✅ All auth flows go through API — no direct Supabase auth in components |
| Frontend DB proxy rule | ✅ No `supabase.from()` in frontend code |
| `.env` files in git | ✅ All `.gitignore`'d, not tracked |
| All routes use standard wrappers | ✅ 85/86 routes (only C-01 violates) |
| console.log in production | ✅ None found — all logging through logger service |
| Workspace protocol | ✅ All internal deps use `workspace:*` |
| tsconfig path aliases | ✅ Consistent across all apps |
| pnpm-workspace.yaml | ✅ Correct patterns, catalog well-adopted |
| vitest.workspace.ts | ✅ Correct — 7 packages configured |
| User-dashboard middleware | ✅ Clean denylist approach, proper auth redirect |
| API middleware | ✅ Rate limiting (100/60s), CORS, security headers, logging |

---

## Recommended Fix Priority

### Immediate (This Week)
1. **C-02**: Await the fire-and-forget DB write (5-minute fix)
2. **H-08**: Fix broken cancel subscription call — users can't cancel (15-minute fix)
3. **H-10**: Update `next` to >=16.1.5 to patch DoS vulnerability
4. **H-13**: Fix CI pnpm version to 10

### Short-Term (Next 2 Sprints)
5. **C-01**: Wrap Sentry webhook in publicApiWrapper + SecureServiceRoleWrapper
6. **C-04/C-05**: Implement nonce-based CSP (tracked as #V7 H-18)
7. **H-01–H-03, H-09, H-11–H-12**: Fix all `as any`/`as never`/`as unknown as` type violations
8. **H-04–H-06**: Fix all fire-and-forget patterns and direct supabaseAdmin bypasses
9. **H-15**: Add Redis auth to docker-compose
10. **H-17–H-18**: Fix rate limiter IP spoofing and race condition

### Medium-Term (Next Quarter)
11. **C-03**: Implement atomic subscription cancel via Postgres RPC
12. **H-20–H-22**: Overhaul PII sanitizer and XSS sanitizer
13. **H-14, H-16**: Fix turbo.json env vars and add CI security audit
14. **M-01–M-09**: Dead code cleanup and webhook standardization
15. **M-10–M-16**: Resilience library fixes (memory leaks, circuit breaker, fallback handler)

---

*Report generated by Copilot CLI. Sub-audit reports available in `docs/2025-07-18-api-full-code-audit.md` and `docs/2025-07-25-config-build-audit.md`.*
