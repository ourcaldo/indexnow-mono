# Full Code Audit — Shared Packages

**Date:** 2025-07-24
**Scope:** All 9 packages in `packages/` + database schema alignment
**Auditor:** Automated deep audit (6 parallel analysis passes)

---

## Executive Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **C — Critical** | 5 | Security bypasses, broken exports, audit gaps |
| **H — High** | 16 | PII leakage, type conflicts, missing validations |
| **M — Medium** | 30 | Race conditions, unsafe casts, config issues |
| **L — Low** | 25 | Convention violations, dead code, cosmetic |
| **E — Enhancement** | 5 | Performance, deduplication |
| **Total** | **81** | |

---

## CRITICAL — Security & Build Breakage

### C-01: Service-role admin client exported without wrapper enforcement
- **File:** `packages/database/src/index.ts` :69, :78
- **Description:** Both `supabaseAdmin` and `typedSupabaseAdmin` are public exports. 20+ call sites in `apps/api/` use `supabaseAdmin` directly (rank-tracking, webhooks, health checks, workers) — bypassing `SecureServiceRoleWrapper` entirely with no validation, sanitization, or audit logging.
- **Why it matters:** Any route importing `supabaseAdmin` directly can perform arbitrary service-role operations on any table without audit trail or input sanitization. This is the single largest security gap in the codebase.

### C-02: Audit logging silently degrades — operations execute without audit trail
- **File:** `packages/database/src/security/SecurityService.ts` :294-303, :344, :384
- **Description:** If `logOperationStart` fails (returns `'unknown'`), subsequent `logOperationSuccess`/`logOperationFailure` calls early-return. The actual DB operation still executes. Sustained failure of `indb_security_audit_logs` silently disables all audit logging while allowing all operations.
- **Why it matters:** Complete loss of audit trail with no alerting; undetectable privilege abuse during audit outage.

### C-03: `@indexnow/shared` sub-path exports are broken
- **File:** `packages/shared/package.json` :28-37
- **Description:** Exports `./types`, `./constants`, `./utils` point to `dist/` files that are never built by tsup (entry points are only `index.ts` + `schema.ts`). Additionally, `./utils` "types" points to `./src/utils/index.ts` which does NOT exist.
- **Why it matters:** Runtime `MODULE_NOT_FOUND` for any consumer using `@indexnow/shared/types`, `/constants`, or `/utils` imports. TypeScript resolution also fails.

### C-04: `executeSecureOperation` does not sanitize context fields
- **File:** `packages/database/src/security/SecureDatabaseHelpers.ts` :175-187
- **Description:** Unlike `executeWithUserSession` (which sanitizes via `sanitizeUserContext`), `executeSecureOperation` passes raw `ServiceRoleOperationContext` directly to audit log writes. Fields `context.operation`, `context.reason`, `context.source` reach the audit log `description` column unsanitized.
- **Why it matters:** Stored XSS if audit logs are rendered in the admin UI; inconsistent sanitization between the two main entry points.

### C-05: `sanitizeQueryOptions` never validates the `table` field
- **File:** `packages/database/src/security/SecurityService.ts` :197-218
- **Description:** Columns, data, and whereConditions are sanitized, but `queryOptions.table` passes through untouched to `client.from(table)`. No allowlist or regex validation.
- **Why it matters:** An attacker controlling the `table` parameter could query or mutate any Supabase-exposed table not intended for that operation. PostgREST limits some exposure, but no application-level defense exists.

---

## HIGH — Type Safety, Data Integrity & Privacy

### H-01: PII leakage to analytics providers
- **File:** `packages/analytics/src/error-tracker.ts` :30-41
- **Description:** `userId` and `keywordId` sent to Sentry AND to GA4/PostHog/GTM on every rank-check error. Line 38-41 spreads entire `RankCheckError` object (including userId) into analytics events.
- **Why it matters:** GDPR/privacy compliance violation — user PII transmitted to third-party analytics providers.

### H-02: PostHog autocapture captures sensitive inputs
- **File:** `packages/analytics/src/posthog-client.ts` :25
- **Description:** `autocapture: true` enables PostHog to automatically capture all click events and form submissions, including password fields, credit card forms, and other sensitive inputs.
- **Why it matters:** Passwords and payment info may be captured and sent to PostHog servers.

### H-03: Deleted users retain full API access
- **File:** `packages/services/src/UserManagementService.ts` :504-511
- **Description:** `deleteUser()` soft-deletes by setting `is_active: false` but does NOT revoke sessions. TODO at line 506 acknowledges this. A "deleted" user retains their JWT and can continue making authenticated API calls until token expiry.
- **Why it matters:** Data breach risk if account deletion was requested due to compromise. Users expect deletion to mean immediate access revocation.

### H-04: Conflicting `PaymentStatus` type definitions
- **File:** `packages/shared/src/types/business/PaymentTypes.ts` :12-18, `packages/shared/src/types/services/Payments.ts` :11-17
- **Description:** Business layer has `'processing'`, services layer has `'proof_uploaded'`. SQL CHECK constraint uses `('pending', 'proof_uploaded', 'completed', 'failed', 'cancelled', 'refunded')`. Code using the business-layer type can set `'processing'` which the SQL CHECK constraint will reject.
- **Why it matters:** Runtime database constraint violation. Any payment flow using the wrong import path gets a DB error.

### H-05: Conflicting `BillingPeriod` type definitions
- **File:** `packages/shared/src/types/business/PaymentTypes.ts` :20, `packages/shared/src/types/services/Payments.ts` :9
- **Description:** `'monthly' | 'annual'` vs `'monthly' | 'annual' | 'lifetime' | 'one-time'`. Importing from the wrong file silently narrows the type.
- **Why it matters:** `'lifetime'` and `'one-time'` billing periods rejected by the business-layer type, causing silent type mismatches.

### H-06: Zod `createJobSchema` field name mismatch with DB
- **File:** `packages/shared/src/schema.ts` :68
- **Description:** Schema has field `type` but SQL column is `job_type`.
- **Why it matters:** API handler must manually remap; if not, insert fails or value is silently dropped.

### H-07: Zod `createJobSchema` validates phantom column
- **File:** `packages/shared/src/schema.ts` :69
- **Description:** Validates `schedule_type` but this column does NOT exist in `indb_enrichment_jobs`.
- **Why it matters:** Client sends data that is silently discarded.

### H-08: Circuit breaker HALF_OPEN allows unlimited concurrent requests
- **File:** `packages/shared/src/utils/resilience/CircuitBreaker.ts` :64-72
- **Description:** When transitioning from OPEN→HALF_OPEN, every concurrent request passes through instead of limiting to 1 probe request.
- **Why it matters:** Defeats the purpose of the circuit breaker — a failing service gets hammered with N simultaneous requests.

### H-09: `FallbackHandler` returns `{} as T` in empty strategy
- **File:** `packages/shared/src/utils/resilience/FallbackHandler.ts` :132
- **Description:** Returns empty object unsafely cast to generic type T. If T has required properties, consumers get a valid-looking response with no data.
- **Why it matters:** Silent data corruption — callers trust the typed return value but get `{}`.

### H-10: User IP sent to third-party geolocation API without consent
- **File:** `packages/shared/src/utils/ip-device-utils.ts` :140
- **Description:** Every request with a public IP triggers an external HTTP call to `ipapi.co` embedding the user's IP. No caching, no consent.
- **Why it matters:** GDPR/privacy violation — PII transmitted to third-party on every request. Also adds 100-500ms latency.

### H-11: AppConfig build-phase fallback returns unvalidated config
- **File:** `packages/shared/src/core/config/AppConfig.ts` :226-235
- **Description:** During Next.js builds, raw unvalidated env vars returned through a Proxy cast via `as unknown as`. Security decisions at build time use undefined/malformed values.
- **Why it matters:** Type safety completely bypassed for config at build time.

### H-12: PII sanitizer only checks key names, never values
- **File:** `packages/shared/src/utils/pii-sanitizer.ts` :6-21
- **Description:** Does not detect email addresses, SSNs, credit card numbers, or phone numbers embedded as string values. Only redacts values whose _key name_ contains a sensitive substring.
- **Why it matters:** PII in error messages, log payloads, or free-text fields is never redacted.

### H-13: RankTrackingService bypasses SecureServiceRoleWrapper entirely
- **File:** `packages/services/src/RankTrackingService.ts` :14, :21-224
- **Description:** Uses `typedSupabaseAdmin` directly. All DB operations (RPC calls, updates, selects) bypass security wrapper, audit logging, and input sanitization.
- **Why it matters:** Service-role DB mutations with zero audit trail.

### H-14: Magic userId values bypass user existence verification
- **File:** `packages/database/src/security/SecurityService.ts` :147
- **Description:** `validateOperationContext` skips `getUserById` check for `'system'` and `'anonymous'` strings. No secondary authorization check exists.
- **Why it matters:** Privilege escalation if an attacker influences `userId` to `'system'`.

### H-15: `@indexnow/database` missing server and middleware-utils exports
- **File:** `packages/database/package.json` :8-19
- **Description:** tsup builds 4 entries (index, server, client, middleware-utils) but exports only maps "." and "./client".
- **Why it matters:** `@indexnow/database/server` and `/middleware-utils` unreachable via package exports.

### H-16: `as ErrorRow[]` on unvalidated API response in ErrorListTable
- **File:** `packages/ui/src/components/admin/errors/ErrorListTable.tsx` :79
- **Description:** Raw API response cast to typed array with no runtime validation.
- **Why it matters:** API shape changes silently propagate as runtime bugs.

---

## MEDIUM — Code Quality & Security

### M-01: Rate-limiter TOCTOU race condition
- **File:** `packages/shared/src/utils/rate-limiter.ts` :162-176
- **Description:** Between async `get()` and `set()`, concurrent requests for the same IP read stale count. Both increment from the same base, losing one increment.
- **Why it matters:** Attacker can bypass rate limiting by 1+ extra attempt per concurrent batch.

### M-02: Rate-limiter trusts x-forwarded-for headers
- **File:** `packages/shared/src/utils/rate-limiter.ts` :142-146
- **Description:** If the app is not behind a trusted reverse proxy, attacker spoofs any IP to bypass rate limits.
- **Why it matters:** Complete rate limit bypass by setting fake `x-forwarded-for`.

### M-03: Rate-limiter no periodic cleanup
- **File:** `packages/shared/src/utils/rate-limiter.ts` :30-56
- **Description:** Expired entries only purged on `get()`. Entries set but never re-queried accumulate until MAX_STORE_SIZE (10K) triggers O(n log n) sort.
- **Why it matters:** Memory leak under sustained attack; CPU spikes at capacity.

### M-04: `isValidUrl` has no SSRF protection
- **File:** `packages/shared/src/utils/url-utils.ts` :87-94
- **Description:** Validates `http://127.0.0.1`, `http://169.254.169.254`, internal IPs as valid.
- **Why it matters:** SSRF vector if used to gate server-side fetches.

### M-05: PII sanitizer `'key'` substring causes aggressive false positives
- **File:** `packages/shared/src/utils/pii-sanitizer.ts` :65
- **Description:** Any key containing "key" (keyword, primaryKey, etc.) is redacted.
- **Why it matters:** Legitimate data silently replaced with `[REDACTED]`, corrupting logs.

### M-06: Logger does not integrate PII sanitizer
- **File:** `packages/shared/src/utils/logger.ts` :45-76
- **Description:** Context objects passed directly to `console.*` without sanitizing.
- **Why it matters:** Credentials/tokens appear in server logs if included in log context.

### M-07: Circuit breaker single success resets all failure history
- **File:** `packages/shared/src/utils/resilience/CircuitBreaker.ts` :87-98
- **Description:** One success wipes entire failure count in CLOSED state.
- **Why it matters:** Intermittent successes prevent circuit from ever opening.

### M-08: Zod phantom fields in `updateSiteSettingsSchema`
- **File:** `packages/shared/src/schema.ts` :107, :110, :301, :304
- **Description:** Validates `site_tagline` and `white_logo` but neither column exists in `indb_site_settings`.
- **Why it matters:** Data silently dropped on write.

### M-09: 40+ duplicate type names across type directories
- **File:** `packages/shared/src/types/` (multiple subdirectories)
- **Description:** Names like `User`, `ApiKey`, `Subscription`, `Transaction`, `Invoice`, `Order`, `Package` appear in multiple files with potentially diverging definitions.
- **Why it matters:** Import path determines which version; silent type confusion.

### M-10: Dead type files: ApiTypes.ts, ConfigTypes.ts
- **File:** `packages/shared/src/types/core/ApiTypes.ts`, `packages/shared/src/types/core/ConfigTypes.ts`
- **Description:** Entire files not imported anywhere in the codebase.
- **Why it matters:** Stale definitions diverge from canonical types; maintenance burden.

### M-11: Encryption legacy CBC path has no padding oracle mitigation
- **File:** `packages/auth/src/encryption.ts` :87-96
- **Description:** PKCS7 padding with no timing protection. New encryptions use GCM (safe), but old CBC ciphertext can still be decrypted.
- **Why it matters:** Padding oracle attack possible if error responses distinguish bad-pad vs bad-data.

### M-12: Encryption key derivation uses raw SHA-256, no KDF
- **File:** `packages/auth/src/encryption.ts` :26-36
- **Description:** No PBKDF2/scrypt/argon2 with salt and iterations. Low-entropy passwords become directly usable AES keys.
- **Why it matters:** Offline brute-force trivial for low-entropy ENCRYPTION_KEY.

### M-13: `supabase.auth.getUser()` called directly from supabase-client
- **File:** `packages/supabase-client/src/auth-service.ts` :52, :170-173, :399-401
- **Description:** Direct network call to Supabase, not in allowed client-side SDK methods.
- **Why it matters:** Violates External Service Proxy Rule. However, routing through API creates circular dependency — needs documented exception.

### M-14: `supabase-browser.ts` uses `as { message?: string }` assertion
- **File:** `packages/supabase-client/src/supabase-browser.ts` :134-135
- **Description:** Type assertion instead of type guard.
- **Why it matters:** Violates strict type safety convention.

### M-15: Shared rate-limit bucket for anonymous users
- **File:** `packages/api-middleware/src/index.ts` :153
- **Description:** When IP extraction fails, ALL unauthenticated requests share a single 'anonymous' rate-limit bucket.
- **Why it matters:** One client can rate-limit all clients where IP is unresolvable.

### M-16: Rate-limit FIFO eviction enables bypass under load
- **File:** `packages/api-middleware/src/index.ts` :157-159
- **Description:** Under heavy load (>10K unique IPs), legitimate rate-limit entries evicted.
- **Why it matters:** Attacker floods with unique IPs to evict legitimate rate-limit entries.

### M-17: Multiple `as` type assertions in UserManagementService
- **File:** `packages/services/src/UserManagementService.ts` :151, :212, :273-278, :526-531, :614
- **Description:** Role and schedule fields cast without runtime validation.
- **Why it matters:** Untrusted input cast to narrow union types could allow role escalation.

### M-18: QuotaService `as Record<string, number>` on JSONB data
- **File:** `packages/services/src/monitoring/QuotaService.ts` :118
- **Description:** Type assertion on untrusted DB data.
- **Why it matters:** Malformed `quota_limits` could bypass quota checks.

### M-19: `SiteSettings` interface includes SMTP credentials
- **File:** `packages/database/src/utils/site-settings.ts` :15-38
- **Description:** Type used by client-side `useSiteSettings` hook. If API returns full settings without stripping SMTP fields, credentials exposed.
- **Why it matters:** SMTP credential exposure to browser client.

### M-20: SecurityViolationError includes internal user IDs
- **File:** `packages/database/src/security/SecureDatabaseHelpers.ts` :141-150
- **Description:** Both `contextUserId` and `sessionUserId` in `details`.
- **Why it matters:** Information disclosure if error propagated to client.

### M-21: `asTypedClient` accepts `object` — overly permissive
- **File:** `packages/database/src/utils/supabase-compat.ts` :15-16
- **Description:** Any JS object can be silently cast to `SupabaseClient<Database>`.
- **Why it matters:** Type-safety bypass; confusing runtime errors.

### M-22: `fromJson<T>` is unchecked trust cast
- **File:** `packages/database/src/utils/json-helpers.ts` :34-35
- **Description:** Casts any `Json` value to arbitrary `T` via `as unknown as T`.
- **Why it matters:** Type confusion bugs; potential issues with untrusted data.

### M-23: Site settings cache race condition
- **File:** `packages/database/src/utils/site-settings.ts` :69-81
- **Description:** Multiple concurrent calls see expired cache simultaneously, all fetch.
- **Why it matters:** Thundering herd on settings API.

### M-24: Unvalidated `as ErrorSeverity` and `as ErrorType` in ApiError
- **File:** `packages/database/src/utils/api-error.ts` :30, :37-38
- **Description:** Arbitrary strings cast to enum types without validation.
- **Why it matters:** Downstream code relying on enum exhaustiveness misses cases.

### M-25: Missing mail subject CRLF validation
- **File:** `packages/mail/src/index.ts` :83
- **Description:** Subject passed to `sendMail()` without newline validation. Nodemailer 6.x strips internally but defense-in-depth missing.
- **Why it matters:** SMTP header injection risk if nodemailer behavior changes.

### M-26: `trackError()` sends stack traces to analytics
- **File:** `packages/analytics/src/index.ts` :96-100
- **Description:** `error.stack` sent via `trackEvent('error', ...)`. Stack traces expose internal architecture.
- **Why it matters:** Information disclosure to third-party analytics.

### M-27: Hardcoded "high risk countries" list
- **File:** `packages/shared/src/utils/ip-device-utils.ts` :256-259
- **Description:** `['CN', 'RU', 'KP', 'IR']` not configurable.
- **Why it matters:** Can't update without code deploy; embeds geopolitical policy in library.

### M-28: `z.record(z.any())` in admin schemas
- **File:** `packages/shared/src/constants/ValidationRules.ts` :282
- **Description:** Bypasses all type safety for admin operation payloads.
- **Why it matters:** Arbitrary data flows through admin ops.

### M-29: BillingPeriodSelector `as Record<string, PricingTier>` cast
- **File:** `packages/ui/src/components/checkout/BillingPeriodSelector.tsx` :46
- **Description:** Code handles Array but type only defines Record.
- **Why it matters:** Dead code branch or wrong type definition.

### M-30: Missing `'use client'` directives on interactive components
- **File:** `packages/ui/src/components/checkout/CheckoutHeader.tsx` :15, `LoadingStates.tsx` :27
- **Description:** Components with `onClick` but no `'use client'` directive.
- **Why it matters:** Will error if imported directly in a Server Component.

---

## LOW — Convention Violations & Dead Code

### L-01: `getCurrencySymbol()` always returns `'$'`
- **File:** `packages/shared/src/utils/currency-utils.ts` :23-25
- **Description:** Returns `'$'` regardless of currency. Dead/misleading function.

### L-02: `isMaintenanceMode()` always returns `false`
- **File:** `packages/shared/src/core/config/AppConfig.ts` :297
- **Description:** Stub function with "Implement as needed" comment.

### L-03: `resetUserQuota()` is a no-op
- **File:** `packages/services/src/UserManagementService.ts` :447-450
- **Description:** Dead code method, exported and callable.

### L-04: `quotaUsage.keywords` and `.domains` always 0
- **File:** `packages/services/src/UserManagementService.ts` :632-635
- **Description:** Hardcoded to 0 in mapping function despite data existing.

### L-05: `RadioGroup` component entirely unused
- **File:** `packages/ui/src/components/radio-group.tsx`
- **Description:** Not in barrel export, not imported anywhere.

### L-06: `REGEX_PATTERNS` duplicates `VALIDATION_PATTERNS`
- **File:** `packages/shared/src/constants/AppConstants.ts` :228-234
- **Description:** Identical patterns in two locations.

### L-07: 3 TODO comments outstanding
- **Files:** `packages/services/src/UserManagementService.ts` :496, :506; `packages/shared/src/utils/ip-device-utils.ts` :134
- **Description:** GDPR data erasure TODO, session revocation TODO, IP caching TODO.

### L-08: Multiple `as` convention violations in shared utils
- **Files:** `pii-sanitizer.ts` :58-59, `countries.ts` :276, `rate-limiter.ts` :115/:128, `logger.ts` :145-146
- **Description:** Various `as` casts violating project convention.

### L-09: Multiple `as` convention violations in resilience utils
- **Files:** `ExponentialBackoff.ts` :86, `FallbackHandler.ts` :55/:78/:85/:95, `ResilientOperationExecutor.ts` :198/:208
- **Description:** Various `as` casts and eslint-disable directives.

### L-10: `RankTrackingService.getUserKeywords` returns `Record<string, unknown>[]`
- **File:** `packages/services/src/RankTrackingService.ts` :130
- **Description:** Extremely loose typing.

### L-11: Server-auth fail-open for missing profiles
- **File:** `packages/auth/src/server-auth.ts` :94
- **Description:** No profile row → defaults to `'user'` role instead of rejecting.

### L-12: Multi-tab token refresh race condition
- **File:** `packages/auth/src/hooks/useSessionRefresh.ts` :46/:84/:127
- **Description:** Two tabs can refresh simultaneously; second may fail. Mitigated by AuthErrorHandler.

### L-13: Auth error handler re-entrancy guard timeout
- **File:** `packages/auth/src/auth-error-handler.ts` :115
- **Description:** 500ms fixed timeout may be too short for slow networks.

### L-14: Public routes hardcoded in AuthContext
- **File:** `packages/auth/src/contexts/AuthContext.tsx` :80
- **Description:** Duplicates route config; can drift from server-side.

### L-15: localStorage token migration path never expires
- **File:** `packages/supabase-client/src/auth-service.ts` :113-143
- **Description:** Migration attempted indefinitely on every init.

### L-16: `@tanstack/react-query` as peerDependency of database package
- **File:** `packages/database/package.json` :46
- **Description:** Database shouldn't need React Query.

### L-17: Inconsistent `sideEffects` field across packages
- **Files:** 4 of 9 packages missing `"sideEffects": false`

### L-18: Missing test scripts in analytics and supabase-client
- **Files:** `packages/analytics/package.json`, `packages/supabase-client/package.json`

### L-19: `@sentry/browser` imported but not declared as dependency
- **File:** `packages/analytics/src/sentry-client.ts` :3
- **Description:** Only `@sentry/nextjs` declared; works transitively but fragile.

### L-20: UI alert.tsx has UTF-8 BOM
- **File:** `packages/ui/src/components/alert.tsx` :1
- **Description:** Inconsistent with all other files.

### L-21: Sentry `scope.setExtras({ ...context })` spreads all context
- **File:** `packages/analytics/src/sentry-server.ts` :64
- **Description:** If context contains PII, it goes to Sentry unfiltered.

### L-22: Decrypt error message includes original exception
- **File:** `packages/auth/src/encryption.ts` :99-103
- **Description:** Leaks whether auth tag failed vs format error.

### L-23: GCM decrypt doesn't validate IV/tag length
- **File:** `packages/auth/src/encryption.ts` :72-85
- **Description:** Malformed input produces confusing Node.js crypto errors.

### L-24: `queryClient.ts` trust casts `as T` on API responses
- **File:** `packages/database/src/utils/queryClient.ts` :79, :81
- **Description:** Unvalidated response cast to generic type.

### L-25: `createAdminClient` factory publicly exported
- **File:** `packages/database/src/index.ts` :74
- **Description:** Any consumer can create new service-role clients outside singleton.

---

## ENHANCEMENT — Performance & Improvements

### E-01: Add periodic cleanup to in-memory rate limiter
- Instead of only purging on `get()`, add a `setInterval`-based sweep of expired entries.

### E-02: Add IP geolocation caching
- Cache `ipapi.co` results with 5-min TTL (acknowledged in TODO).

### E-03: Consolidate duplicate type definitions
- Merge `business/PaymentTypes.ts` and `services/Payments.ts` into a single canonical source.

### E-04: Add circuit breaker HALF_OPEN concurrency limit
- Limit to 1 probe request in HALF_OPEN state per standard pattern.

### E-05: Integrate PII sanitizer into logger
- Auto-sanitize all log context objects before passing to `console.*`.

---

## Priority Action Plan

### Immediate (This Sprint)
1. **C-01/H-13:** Restrict `supabaseAdmin` export; create wrapper enforcement lint rule
2. **C-03/H-15:** Fix broken `@indexnow/shared` sub-path exports and missing database exports
3. **H-01/H-02:** Disable PostHog autocapture; filter PII from analytics events
4. **H-04/H-05:** Consolidate PaymentStatus/BillingPeriod into single canonical types
5. **C-04/C-05:** Add context sanitization to `executeSecureOperation`; add table allowlist

### Next Sprint
6. **C-02:** Add alerting on audit log write failures; consider fail-closed option
7. **H-03:** Revoke sessions on user deletion
8. **H-06/H-07/M-08:** Fix Zod schema field name mismatches and phantom fields
9. **M-01/M-02:** Fix rate-limiter race condition and header trust issue
10. **M-11/M-12:** Remove legacy CBC path; use proper KDF for encryption key

### Backlog
11. Fix remaining `as` type assertion violations (L-08, L-09, M-17, etc.)
12. Remove dead code (L-01, L-02, L-03, L-05, M-10)
13. Consolidate duplicate patterns (L-06)
14. Add missing peer dependencies and align package configs
