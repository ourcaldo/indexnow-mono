# API App Full Code Audit Report

**Date:** 2025-07-18
**Scope:** `apps/api/src/` — 86 route files, all lib/ modules
**Auditor:** Copilot CLI

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **C — Critical** | 3 | Security gaps, data integrity risks |
| **H — High** | 8 | Type safety violations, fire-and-forget, bypassed wrappers |
| **M — Medium** | 8 | Incomplete features, inconsistent error handling, dead endpoints |
| **L — Low** | 4 | Style inconsistencies, non-null assertions |
| **E — Enhancement** | 6 | Deduplication and performance opportunities |
| **Total** | **29** | |

---

## CRITICAL (C)

### C-1: Sentry webhook route is a raw handler — no wrapper, no audit trail

**File:** `apps/api/src/app/api/v1/webhooks/sentry/route.ts:20`
```typescript
export async function POST(request: NextRequest) {
```
**Issue:** This is the ONLY route in the entire API that exports a raw handler instead of using `publicApiWrapper`. It bypasses all middleware: CORS headers, rate limiting, request ID generation, structured error formatting, and audit logging.

**Why it matters:** Any bug in this handler could crash without structured logging. It also uses direct `supabaseAdmin` writes (lines 65–73, 96–104) without `SecureServiceRoleWrapper`, meaning all DB mutations happen without audit trail entries in `indb_security_audit_logs`.

---

### C-2: Fire-and-forget DB write in admin error detail route

**File:** `apps/api/src/app/api/v1/admin/errors/[id]/route.ts:66-70`
```typescript
supabaseAdmin
  .from('indb_system_error_logs')
  .update({ sentry_issue_id: sentryIssueId })
  .eq('id', errorId)
  .then(() => {});
```
**Issue:** The comment literally says "fire-and-forget". This `.then(() => {})` is unawaited — the promise floats. In Next.js, the runtime tears down the execution context after the response is sent. If the DB write hasn't completed, it gets silently killed. Data may or may not be persisted — it's nondeterministic.

**Why it matters:** This violates Lesson #6 ("Await all critical operations in route handlers"). The Sentry issue ID may never be persisted, causing repeated API calls to Sentry for the same error.

---

### C-3: Subscription cancel has non-atomic dual writes

**File:** `apps/api/src/app/api/v1/payments/paddle/subscription/cancel/route.ts:9-15`
```
TODO (#65): This route performs 2 writes across separate executeWithUserSession calls...
These should be wrapped in a single Postgres RPC for atomicity. Blocked by schema discrepancies.
```
**Issue:** Two separate DB writes (subscription status update + transaction record) are not atomic. If the process crashes between them, the subscription is cancelled in Paddle but the DB is in an inconsistent state.

**Why it matters:** Financial data integrity. A partial failure could result in a user being charged but their subscription showing as cancelled, or vice versa.

---

## HIGH (H)

### H-1: `as any` type assertion in dashboard route

**File:** `apps/api/src/app/api/v1/dashboard/route.ts:264,277`
```typescript
const recentKwRaw = (recentKeywordsResult.data || []) as any[];
const recentKeywords = recentKwRaw.map((kw: any) => ({
```
**Issue:** Direct `as any` violation. The Supabase query return type is known — this should use the proper DB Row type from `@indexnow/shared`. The `kw: any` parameter means all property accesses on lines 278-284 are completely unchecked.

**Why it matters:** Violates the project rule "NEVER use `as any`". Any column rename in the DB will silently produce `undefined` values instead of a compile error.

---

### H-2: `as never` type assertion in package update

**File:** `apps/api/src/app/api/v1/admin/settings/packages/[id]/route.ts:106`
```typescript
.update(updateData as never)
```
**Issue:** `as never` is used to force a value past TypeScript's type checker. This indicates a type mismatch between `updateData` and the expected Supabase insert/update type that was papered over instead of fixed.

**Why it matters:** If `updateData` contains extra or wrong-typed fields, they'll be silently sent to the database.

---

### H-3: Fire-and-forget login notification — login route

**File:** `apps/api/src/app/api/v1/auth/login/route.ts:196-212`
```typescript
loginNotificationService
  .sendLoginNotification({ ... })
  .catch((emailError) => {
    logger.error(...);
  });
```
**Issue:** Unawaited promise. The response is returned before the notification completes. Next.js will tear down the context, potentially killing the email mid-send.

**Why it matters:** Users may intermittently not receive login notifications, making security alerting unreliable.

---

### H-4: Fire-and-forget login notification — session route

**File:** `apps/api/src/app/api/v1/auth/session/route.ts:174-190`
```typescript
loginNotificationService
  .sendLoginNotification({ ... })
  .catch(() => {
    // Silent fail for notification errors
  });
```
**Issue:** Same unawaited pattern as H-3, with an even worse empty catch that swallows all errors silently.

---

### H-5: Fire-and-forget `secureUpdate` in reset-password

**File:** `apps/api/src/app/api/v1/admin/users/[id]/reset-password/route.ts:168-179`
```typescript
await SecureServiceRoleHelpers.secureUpdate(...)
  .catch((err: unknown) => {
    logger.warn(...);
  });
```
**Issue:** While this has `await`, the `.catch()` swallows the error — the `must_change_password` flag may not be set, and the route continues as if it succeeded. The user won't be forced to change their password after admin reset.

---

### H-6: Direct `supabaseAdmin` write bypassing SecureServiceRoleWrapper — login route

**File:** `apps/api/src/app/api/v1/auth/login/route.ts:180-188`
```typescript
const { error: loginUpdateError } = await supabaseAdmin
  .from('indb_auth_user_profiles')
  .update({
    last_login_at: new Date().toISOString(),
    last_login_ip: clientIP !== 'unknown' ? clientIP : null,
    email: user.email ?? null,
    updated_at: new Date().toISOString(),
  })
  .eq('user_id', user.id);
```
**Issue:** Direct `supabaseAdmin` write to `indb_auth_user_profiles` without `SecureServiceRoleWrapper`. No audit log entry is created for this profile modification.

**Why it matters:** All DB writes should go through `SecureServiceRoleWrapper` per project conventions. This write modifies user PII (IP address, email) without audit trail.

---

### H-7: Direct `supabaseAdmin` writes in Sentry webhook

**File:** `apps/api/src/app/api/v1/webhooks/sentry/route.ts:65-73, 96-104`
```typescript
await supabaseAdmin
  .from('indb_system_error_logs')
  .update({ resolved_at: ..., resolved_by: null })
  .eq('sentry_issue_id', sentryIssueId)
  ...
```
**Issue:** Two direct `supabaseAdmin` writes without `SecureServiceRoleWrapper`. Combined with C-1, this entire route has zero security infrastructure.

---

### H-8: WorkerStartup is a non-functional stub

**File:** `apps/api/src/lib/job-management/worker-startup.ts:1-22`
```
TODO: Implement worker startup logic
⚠ (#V7 H-22): This is a stub — BullMQ workers will NOT process jobs until implemented.
```
**Issue:** If `ENABLE_BULLMQ=true` and `WORKER_MODE=true` are set, jobs get enqueued but never processed. This is a production time bomb.

---

## MEDIUM (M)

### M-1: 17+ dead endpoint constants in ApiEndpoints.ts

**File:** `packages/shared/src/constants/ApiEndpoints.ts`

These endpoints are defined but have NO corresponding route.ts file:
- `SUSPEND_USER(id)` → `/admin/users/{id}/suspend`
- `AVATAR` → `/auth/user/avatar`
- `PROFILE_COMPLETE` → `/auth/user/profile/complete`
- `QUOTA_HISTORY(days)` → `/auth/user/quota/history`
- `QUOTA_ALERTS` → `/auth/user/quota/alerts`
- `QUOTA_ALERT_ACKNOWLEDGE(id)` → `/auth/user/quota/alerts/{id}/acknowledge`
- `QUOTA_INCREASE_REQUEST` → `/auth/user/quota/increase-request`
- `RANK_TRACKING.COMPETITORS` → `/rank-tracking/competitors`
- `RANK_TRACKING.EXPORT` → `/rank-tracking/export`
- `RANK_TRACKING.STATS` → `/rank-tracking/stats`
- `RANK_TRACKING.RANKINGS_CHECK` → `/rank-tracking/rankings/check`
- `RANK_TRACKING.KEYWORD_BY_ID(id)` → `/rank-tracking/keywords/{id}`
- `RANK_TRACKING.KEYWORD_HISTORY(id)` → `/rank-tracking/keywords/{id}/history`
- `RANK_TRACKING.KEYWORDS_BULK` → `/rank-tracking/keywords/bulk`
- `ADMIN.USER_ROLE(id)` → `/admin/users/{id}/role`
- `ERROR_ENDPOINTS.LOG` → `/errors/log`

**Why it matters:** Frontend code calling these endpoints will get 404s. Dead constants create confusion about what's implemented vs planned.

---

### M-2: Paddle webhook uses raw `NextResponse.json()` instead of `formatSuccess/formatError`

**File:** `apps/api/src/app/api/v1/payments/paddle/webhook/route.ts:111,126,145,195,218,230`

6 instances of raw `NextResponse.json()` with inconsistent error shapes (e.g., `{ error: 'Missing Paddle signature' }` instead of the standard `{ success: false, error: { id, type, message, severity, statusCode } }` shape).

**Why it matters:** Monitoring tools expecting the standard response shape will misparse webhook errors.

---

### M-3: Sentry webhook uses raw `NextResponse.json()` everywhere

**File:** `apps/api/src/app/api/v1/webhooks/sentry/route.ts` (12 instances)

Every response in the file uses raw `NextResponse.json()` with ad-hoc shapes like `{ ok: true, skipped: '...' }` and `{ error: '...' }`.

---

### M-4: No Zod validation on webhook payloads

**Files:**
- `apps/api/src/app/api/v1/webhooks/sentry/route.ts:42` — `JSON.parse(bodyText)` with no schema validation
- `apps/api/src/app/api/v1/payments/paddle/webhook/route.ts` — Inline destructuring without Zod

**Why it matters:** Malformed webhook payloads could cause runtime crashes with unhelpful error messages.

---

### M-5: Multiple stub routes return 501/503 without being documented

**Files:**
- `apps/api/src/app/api/v1/payments/paddle/customer-portal/route.ts:83-90` — Returns 501 "not yet available"
- `apps/api/src/app/api/v1/integrations/seranking/health/metrics/route.ts:13-20` — Returns 501 "not implemented"
- `apps/api/src/app/api/v1/integrations/seranking/quota/status/route.ts` — Returns 501 (missing DB table)
- `apps/api/src/app/api/v1/payments/paddle/subscription/update/route.ts` — Only updates local DB, not Paddle

---

### M-6: Inconsistent error creation — `throw new Error()` vs `ErrorHandlingService.createError()`

**Files using raw throws:**
- `rank-tracking/domains/route.ts:65,73`
- `payments/paddle/subscription/pause/route.ts:112`
- `payments/paddle/customer-portal/route.ts:56`
- `admin/settings/packages/route.ts:78`
- `payments/paddle/webhook/route.ts:75,82-84,187`

These throw plain `Error` objects instead of using `ErrorHandlingService.createError()`. While the wrapper's catch block will handle them, the errors won't have structured metadata (severity, error type, user context).

---

### M-7: Silent error swallowing in multiple routes

**Files using `catch (_) { /* non-critical */ }`:**
- `auth/user/change-password/route.ts:103`
- `rank-tracking/domains/route.ts`
- `payments/paddle/subscription/pause/route.ts:126`
- `payments/paddle/subscription/resume/route.ts`
- `payments/paddle/subscription/cancel/route.ts`
- `admin/settings/packages/route.ts`
- `billing/upload-proof/route.ts`

All suppress `ActivityLogger` failures silently. While individually non-critical, if `ActivityLogger` has a systemic issue, there's zero visibility.

---

### M-8: `auth/user/change-password/route.ts` casts request type

**File:** `apps/api/src/app/api/v1/auth/user/change-password/route.ts:26,101`
```typescript
request as unknown as NextRequest,
request: request as unknown as import('next/server').NextRequest,
```
**Issue:** The wrapper's `request` parameter should already be `NextRequest`. Double-casting suggests a type definition mismatch in the wrapper that was worked around instead of fixed.

---

## LOW (L)

### L-1: Non-null assertions on nullable DB fields

**Files:**
- `payments/paddle/webhook/processors/utils.ts:139` — `customData.packageSlug!`
- `auth/user/trial-status/route.ts:109` — `userProfile.package_id!`
- `admin/orders/[id]/status/route.ts:265` — `updatedTransaction.verified_by!`

**Issue:** `!` non-null assertions skip the null check. If the value is actually null, the `.eq()` query will match nothing (or worse, match all rows if Supabase treats null differently).

---

### L-2: 18 `as unknown as T` patterns in production code

**Files:** Spread across route handlers and lib/ modules (see H-1, H-2, M-8 for the most concerning).

Most are bridging Supabase's `Json` type to application types. While individually justified, the volume suggests the `Json` ↔ application type boundary needs a proper utility instead of ad-hoc casting.

---

### L-3: Non-null assertions in lib/ services

**File:** `apps/api/src/lib/keyword-enrichment/services/IntegrationService.ts:215-217`
```typescript
integrationResult.data!.api_quota_used;
integrationResult.data!.api_quota_limit
```
Triple non-null assertion on `.data!` without null guard. If the query returns null data, this throws a runtime error.

---

### L-4: `as string` / `as Record` patterns in keyword enrichment

**Files:**
- `lib/keyword-enrichment/services/KeywordEnrichmentService.ts` — `(job.status as string) === 'cancelled'` (3 instances)
- `lib/keyword-enrichment/services/ErrorHandlingService.ts` — `{} as Record<SeRankingErrorType, number>`

The `as string` comparison suggests the status enum type doesn't include `'cancelled'` — the enum should be fixed.

---

## ENHANCEMENT (E)

### E-1: Extract user profile fetching to shared service

~6 routes repeat the same `SecureServiceRoleWrapper.executeWithUserSession()` → `indb_auth_user_profiles` query. Extract to `UserProfileService.fetch(auth, fields)`.

**Files:** `auth/user/profile/route.ts`, `billing/packages/route.ts`, `auth/user/quota/route.ts`, `auth/user/trial-status/route.ts`, `dashboard/route.ts`, `rank-tracking/domains/route.ts`

---

### E-2: Extract quota calculation logic

Identical quota math (`maxKeywords`, `isKeywordsUnlimited`, `remaining`) in:
- `auth/user/quota/route.ts`
- `dashboard/route.ts`

Extract to `QuotaCalculator.calculate(limits, used)`.

---

### E-3: Extract pricing tier extraction

Identical `pricingTiers` extraction logic in:
- `billing/overview/route.ts`
- `dashboard/route.ts`

---

### E-4: Create `buildOperationContext()` helper

Nearly every route manually builds the same metadata object for `SecureServiceRoleWrapper`:
```typescript
{ userId, operation, source, reason, metadata: { endpoint }, ipAddress: getClientIP(request), userAgent: request.headers.get('user-agent') ?? undefined }
```
A helper function would eliminate ~5 lines of boilerplate per route (~400 lines total).

---

### E-5: Create a `fromJsonTyped<T>()` utility

The 18 `as unknown as Json` patterns could be replaced with a type-safe utility:
```typescript
function fromJsonTyped<T>(value: Json): T { return value as T; }
```
This centralizes the cast and makes it greppable.

---

### E-6: Clean up dead ApiEndpoints constants (M-1)

Remove or mark as `@planned` the 17 endpoint constants that have no implementation. This prevents frontend developers from writing code against non-existent endpoints.

---

## Compliance Summary

| Check | Result |
|-------|--------|
| All routes use standard wrappers | ❌ 1 violation (sentry webhook) |
| No `as any` | ❌ 1 violation (dashboard) |
| No `as unknown` | ⚠️ 18 instances (most justified, some avoidable) |
| No `as never` | ❌ 1 violation (admin packages) |
| No fire-and-forget | ❌ 4 violations |
| All writes through SecureServiceRoleWrapper | ❌ 3 violations |
| No hardcoded secrets | ✅ Clean |
| No SQL injection vectors | ✅ Clean |
| Consistent error handling | ❌ Multiple inconsistencies |
| No dead code | ❌ 17 dead endpoint constants, 4 stub routes |
| No TODO/FIXME in production | ❌ 3 critical TODOs |
