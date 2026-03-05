# Full Codebase Audit: External Service Direct Calls

**Date**: 2026-03-05 (updated)  
**Scope**: All frontend apps + shared packages in `indexnow-dev/`  
**Purpose**: Identify every instance where browser/client code calls ANY external service directly instead of routing through the API at `apps/api` (port 3001)

---

## Architecture Expectation

```
Browser → apps/api (port 3001) → Supabase / Paddle / SendGrid / Google / SE Ranking / etc.
```

All service interactions should be proxied through `apps/api`. The browser should never talk to external services directly, except:
- **Client-side analytics** (Sentry, PostHog, GA4) — designed for browser use
- **Payment checkout overlays** (Paddle JS) — official integration pattern
- **Supabase SDK listeners** — `onAuthStateChange()`, `getSession()` (local read), `setSession()`, `signOut({ scope: 'local' })`
- **Edge middleware** — server-side, can't call API (circular)

---

## Service-by-Service Audit Results

| Service | Status | Violations | Details |
|---------|--------|------------|---------|
| **Supabase Auth** | **CRITICAL** | 11 methods call Supabase directly | See Section 1 |
| **Supabase DB** | **HIGH** | 1 direct browser DB query | See Section 2 |
| **Paddle** | **CLEAN** | 0 | See Section 3 |
| **SendGrid/SMTP** | **CLEAN** | 0 | See Section 4 |
| **Google APIs** | **CLEAN** | 0 | See Section 5 |
| **SE Ranking** | **CLEAN** | 0 | See Section 6 |
| **Sentry/PostHog** | **MINOR** | 2 inconsistencies | See Section 7 |
| **Redis/BullMQ** | **CLEAN** | 0 | Server-only |
| **External fetch()** | **CLEAN** | 0 | No direct external URLs from frontends |
| **WebSockets** | **CLEAN** | 0 | No usage |
| **Direct DB** | **CLEAN** | 0 | No prisma/pg/drizzle in browser |

---

## Section 1: Supabase Auth — CRITICAL

This package is the source of ALL direct Supabase calls. It exports:

| Export | Type | Risk |
|--------|------|------|
| `supabase` / `supabaseBrowser` | Raw Supabase client instance | **CRITICAL** — any importer gets full `supabase.auth.*` and `supabase.from(...)` access |
| `getBrowserClient()` / `createBrowserClient()` | Raw client factories | **CRITICAL** — same risk |
| `authService` | AuthService singleton | **HIGH** — 11 of 14 methods call Supabase directly |
| `authenticatedFetch` | Fetch wrapper | **MEDIUM** — calls `supabase.auth.getUser()` + `getSession()` for token, and `supabase.auth.refreshSession()` on 401 |

### AuthService Method Audit

| Method | Direct Supabase? | API Proxy? | Classification |
|--------|-----------------|------------|----------------|
| `signIn(email, password)` | ✅ `supabase.auth.signInWithPassword()` | ✅ POST `/auth/session` (cookies only) | **HYBRID** — auth direct, session sync via API |
| `signOut()` | ✅ `supabase.auth.signOut()` | ✅ DELETE `/auth/session` | **HYBRID** — signOut direct, cookie cleanup via API |
| `signUp(email, password, ...)` | ❌ | ✅ POST `/auth/register` | **CLEAN** — fully proxied |
| `getCurrentUser()` | ✅ `supabase.auth.getUser()` | ❌ | **DIRECT** |
| `resetPassword(email)` | ✅ `supabase.auth.resetPasswordForEmail()` | ❌ | **DIRECT** |
| `createMagicLink(email)` | ✅ `supabase.auth.signInWithOtp()` | ❌ | **DIRECT** |
| `updateUser(attributes)` | ✅ `supabase.auth.updateUser()` | ❌ | **DIRECT** |
| `getSession()` | ✅ `supabase.auth.getSession()` | ❌ | **DIRECT** |
| `getToken()` | ✅ `supabase.auth.getUser()` + `getSession()` | ❌ | **DIRECT** |
| `getUserRole(user)` | ✅ `supabase.auth.getUser()` + `getSession()` | ✅ GET `/auth/user/profile` | **HYBRID** |
| `onAuthStateChange(cb)` | ✅ `supabase.auth.onAuthStateChange()` | ❌ | **DIRECT** |
| `onFullAuthStateChange(cb)` | ✅ `supabase.auth.onAuthStateChange()` | ❌ | **DIRECT** |

### supabase-browser.ts concerns

- `hardLogout()` — calls `supabase.auth.signOut()` directly, clears localStorage/cookies manually
- `onAuthStateChange` listener — registered globally, calls `hardLogout` on `SIGNED_OUT` and `refresh_token_already_used` events

---

## 2. `@indexnow/auth` — Direct DB Query from Browser

**Location**: `packages/auth/src/`

| File | Method | Direct Supabase? | Context | Risk |
|------|--------|-----------------|---------|------|
| `admin-auth.ts` | `AdminAuthService.getCurrentAdminUser()` | ✅ `supabase.from('indb_auth_user_profiles').select('role, full_name')` | **Browser** — called by admin components | **HIGH** — direct DB query from browser |
| `auth-error-handler.ts` | `handleAuthError()` | ✅ `supabase.auth.signOut()` | Browser | HIGH |
| `contexts/AuthContext.tsx` | `AuthProvider` | ✅ `supabase.auth.onAuthStateChange()` | Browser | MEDIUM (auth state listening) |
| `hooks/useSessionRefresh.ts` | `useSessionRefresh()` | ✅ `supabase.auth.getSession()` + `supabase.auth.refreshSession()` | Browser | MEDIUM (token management) |
| `middleware.ts` | `getUser()` | ✅ `supabase.auth.getUser()` | **Server-side Edge** | LOW (expected for middleware) |
| `server-auth.ts` | `getServerAuthUser()` | ✅ `supabase.auth.getUser(token)` | **Server-only** | LOW (expected for server) |

---

## 3. `@indexnow/database/client` — Raw Client Re-export

**Location**: `packages/database/src/client.ts`

Re-exports `supabaseBrowser`, `supabase`, `getBrowserClient`, `createBrowserClient` from `@indexnow/supabase-client`. Any consumer importing from `@indexnow/database/client` gets full raw Supabase access.

**Clean**: `useSiteName`, `useSiteLogo`, `useFavicon`, `useSiteSettings` hooks — all use `fetch(PUBLIC_ENDPOINTS.SETTINGS)` via API.

---

## 4. User Dashboard App (`apps/user-dashboard/src/`)

### Direct Supabase Calls (Browser-side)

| File | Line(s) | Method | Supabase API Hit |
|------|---------|--------|-----------------|
| `lib/api.ts` | L24, L26 | `supabaseBrowser.auth.getUser()`, `.getSession()` | GoTrue `/user`, session read |
| `app/login/page.tsx` | L43 | `authService.getCurrentUser()` | GoTrue `/user` |
| `app/login/page.tsx` | L152 | `authService.createMagicLink()` | GoTrue `/otp` |
| `app/login/page.tsx` | L170 | `authService.signIn()` | GoTrue `/token?grant_type=password` |
| `app/login/page.tsx` | L174 | `authService.getUserRole()` | GoTrue `/user` + `/session` |
| `app/login/page.tsx` | L204 | `authService.resetPassword()` | GoTrue `/recover` |
| `components/layout/AppSidebar.tsx` | L273 | `authService.signOut()` | GoTrue `/logout` |

### Clean (API-proxied)

| File | Pattern |
|------|---------|
| `app/register/page.tsx` | `authService.signUp()` → `fetch(AUTH_ENDPOINTS.REGISTER)` ✅ |
| `app/resend-verification/page.tsx` | `fetch(AUTH_ENDPOINTS.RESEND_VERIFICATION)` ✅ |
| All hooks in `lib/hooks.ts` | `api()` helper → `fetch()` to API endpoints ✅ |
| `useSiteName()` / `useSiteLogo()` | `fetch(PUBLIC_ENDPOINTS.SETTINGS)` ✅ |

---

## 5. Admin App (`apps/admin/src/`)

### Direct Supabase Calls (Browser-side)

| File | Line(s) | Method | Supabase API Hit |
|------|---------|--------|-----------------|
| `app/login/page.tsx` | L20 | `authService.signIn()` | GoTrue `/token?grant_type=password` |
| `components/Sidebar.tsx` | L73 | `authService.signOut()` | GoTrue `/logout` |
| `middleware.ts` | L28, L48-53 | `supabase.auth.getUser()` + `supabase.from('indb_auth_user_profiles')` | GoTrue `/user` + PostgREST (Edge middleware — acceptable) |

### Clean (API-proxied)

| File | Pattern |
|------|---------|
| All 13 hooks (`useAdmin*.ts`) | `authenticatedFetch()` → `fetch()` to `ADMIN_ENDPOINTS.*` ✅ |

---

## 6. Dead API Routes (Never Called)

These routes exist in `apps/api/src/app/api/v1/auth/` but have **zero callers** in any frontend code:

| Route | File | Purpose | Status |
|-------|------|---------|--------|
| `POST /api/v1/auth/login` | `login/route.ts` | Server-side auth with rate limiting, activity logging, last-login tracking, notifications | **DEAD CODE** — never called |
| `POST /api/v1/auth/logout` | `logout/route.ts` | Server-side logout with activity logging | **DEAD CODE** — never called |

Both routes are fully functional and have proper security controls. They just aren't wired up.

---

## 7. Impact Assessment

### Security Bypasses

| Control | In API `/auth/login`? | In current direct flow? |
|---------|----------------------|------------------------|
| Rate limiting (per email + IP) | ✅ | ❌ Completely bypassed |
| Activity logging (login/logout) | ✅ | ❌ Completely bypassed |
| Last login tracking (IP, timestamp) | ✅ | ❌ Partially added to `/session` as workaround |
| Login notification emails | ✅ | ❌ Only triggered via `/session` (workaround) |
| Must-change-password check | ✅ | ❌ Bypassed — admin password reset flag ignored |
| Rate limiting on logout | ✅ | ❌ N/A |
| Logout activity logging | ✅ | ❌ Completely bypassed |

### Performance / Reliability Issues

| Issue | Cause | Impact |
|-------|-------|--------|
| Sign-out hangs indefinitely | Browser → Supabase HTTPS (cross-network), slow/unreliable | User sees "Signing out..." forever, must manually reload |
| Sign-in can be slow | Browser → Supabase HTTPS (cross-network) | Login delay visible to user |
| No server-side control over auth | Supabase JS SDK handles everything client-side | Can't centrally monitor, rate-limit, or audit auth events |

### Architecture Violations

| Violation | Files Affected |
|-----------|---------------|
| Browser calls Supabase auth directly | `auth-service.ts` (11 methods), `supabase-browser.ts`, `auth-error-handler.ts` |
| Browser queries Supabase DB directly | `admin-auth.ts` (1 query: `indb_auth_user_profiles`) |
| Raw Supabase client exported to browser | `supabase-client/index.ts`, `database/client.ts` |
| Dead API routes with good security controls | `login/route.ts`, `logout/route.ts` |

---

## Section 3: Paddle — CLEAN

**Result**: No proxy violations. Paddle JS integration follows the official pattern.

### How it works (correct):
```
Browser → fetch(PAYMENT.PADDLE_CONFIG) → apps/api → returns clientToken from DB
Browser → initializePaddle({ token }) → Paddle CDN (loads checkout overlay iframe)
Browser → paddle.Checkout.open() → Paddle hosted checkout (PCI-compliant, no card data touches our server)
Paddle → POST /api/v1/payments/paddle/webhook → apps/api processes events
```

### Notable files:
| File | What | Violation? |
|------|------|-----------|
| `packages/ui/src/providers/PaddleProvider.tsx` | `initializePaddle()` — loads Paddle checkout SDK | **No** — official client-side pattern (like Stripe Elements) |
| `apps/user-dashboard/src/app/settings/billing/checkout/page.tsx` | `paddle.Checkout.open()` — opens payment overlay | **No** — Paddle-hosted PCI-compliant checkout |
| `apps/api/src/app/api/v1/payments/paddle/webhook/route.ts` | Webhook handler — processes 10 event types | **Correct** — server-side |

All subscription management (cancel, pause, resume, update) goes through API routes — properly proxied.

### Hygiene note:
- `@paddle/paddle-node-sdk` in `apps/api/package.json` is declared but **never imported** in source code. Dead dependency.
- `@paddle/paddle-js` is in both `packages/ui` and `apps/user-dashboard` `package.json` — duplicate (resolved via workspace).

---

## Section 4: SendGrid/SMTP (Email) — CLEAN

**Result**: No proxy violations. All email sending goes through `apps/api`.

### How it works (correct):
```
apps/api route handler → @indexnow/mail (EmailService) → nodemailer SMTP transport
```

| Consumer | File | Server-only? |
|----------|------|-------------|
| Admin password reset | `apps/api/.../admin/users/[id]/reset-password/route.ts` | Yes |
| Email worker (BullMQ) | `apps/api/src/lib/queues/workers/email.worker.ts` | Yes |
| Auto-cancel worker | `apps/api/src/lib/queues/workers/auto-cancel.worker.ts` | Yes |

Frontend apps: Zero imports of `@indexnow/mail`, `nodemailer`, or `sendgrid`. The "resend verification" page correctly calls `fetch(AUTH_ENDPOINTS.RESEND_VERIFICATION)`. The admin "test email" goes through `authenticatedFetch(ADMIN_ENDPOINTS.TEST_EMAIL)`.

### Hygiene notes:
- Both `apps/admin/tsconfig.json` and `apps/user-dashboard/tsconfig.json` declare a `"@indexnow/mail"` path alias that is **never used**. This creates a latent risk — a developer could accidentally import `@indexnow/mail` in a frontend component and TypeScript would resolve it without error (but it would fail at runtime because `nodemailer`/`fs` aren't available in browsers). **Recommend removing these unused aliases.**

---

## Section 5: Google APIs — CLEAN

**Result**: No proxy violations. No browser code calls Google Indexing API.

| Finding | Location | Verdict |
|---------|----------|---------|
| `google-auth-library` in `apps/api/package.json` | Dependency declared but **never imported** in any source file | Dead dependency — remove |
| `@analytics/google-analytics` + `@analytics/google-tag-manager` | `packages/analytics/src/analytics-client.ts` | Client-side analytics (GA4/GTM) — acceptable, but actually **dead code** (see Section 7) |
| `next/font/google` | Both frontend layouts | Build-time font download, not a runtime API call |

---

## Section 6: SE Ranking — CLEAN

**Result**: No proxy violations. All SE Ranking API calls are server-only in `apps/api/src/lib/rank-tracking/seranking/` (23+ files).

### How it works (correct):
```
Browser → fetch(RANK_TRACKING_ENDPOINTS.*) → apps/api route → SeRankingService → SeRankingApiClient → https://api.seranking.com
```

- API keys stored in DB (`indb_site_integration`), read server-side only
- No `NEXT_PUBLIC_SE_RANKING_*` env vars exist
- Frontend hooks (`useRankTracking`, etc.) all call API endpoints — properly proxied

---

## Section 7: Sentry / PostHog / Analytics — MINOR ISSUES

**Result**: Client-side analytics are expected to run in the browser. No proxy violations it would be inapplicable. Two minor inconsistencies + dead code found.

### Issue 7a: Direct `@sentry/nextjs` imports bypass analytics wrapper

| File | Code | Problem |
|------|------|---------|
| `apps/user-dashboard/src/app/error.tsx` (line 9) | `import * as Sentry from '@sentry/nextjs'` | Bypasses `@indexnow/analytics` wrapper — misses subdomain context |
| `apps/admin/src/app/error.tsx` (line 6) | `import * as Sentry from '@sentry/nextjs'` | Same |

**Recommended fix**: Use `captureException()` from `@indexnow/analytics` instead of importing `@sentry/nextjs` directly.

### Issue 7b: PostHog `autocapture: true` (privacy concern)

`packages/analytics/src/posthog-client.ts` (line 25) has `autocapture: true`. This captures all clicks, form submits, and page changes automatically — could capture form field names/values in admin panels. Worth reviewing for GDPR.

### Issue 7c: Dead analytics code

These are exported by `@indexnow/analytics` but **never called** by any app:
- `initializeAnalytics()` — would init GA4, GTM, Customer.io
- `trackPageView()`, `trackEvent()`, `identifyUser()`, `resetUser()`
- The entire `analytics-client.ts` (GA4 + GTM + Customer.io plugins) is configured but dead

Only these are actually used: `errorTracker`, `initializeSentry`, `initializeServerSentry`, `trackServerError`, `captureException`.

### Correct patterns (no action needed):
- All DSN/keys from env vars — zero hardcoded
- Sentry client/server properly initialized via `@indexnow/analytics`
- PostHog properly initialized via `@indexnow/analytics`
- Sentry REST API integration (bidirectional issue sync) is server-only in `apps/api`
- No passwords/tokens/secrets sent to analytics

---

## 8. Classification Summary

### Must Fix — Security/Architecture Violations (Supabase)

1. **`authService.signIn()`** — Rewire to call `POST /api/v1/auth/login` instead of Supabase directly
2. **`authService.signOut()`** — Rewire to call `DELETE /api/v1/auth/session` instead of Supabase directly
3. **`AdminAuthService.getCurrentAdminUser()`** — Replace `supabase.from()` with API call
4. **`authService.resetPassword()`** — Proxy through API for rate limiting
5. **`authService.createMagicLink()`** — Proxy through API for rate limiting

### Should Fix — Medium Priority

6. **`authService.updateUser()`** — Proxy through API (password changes should be audited)
7. **`authenticatedFetch` 401 retry** — Use server-side refresh endpoint instead of `supabase.auth.refreshSession()`
8. **Remove raw Supabase client exports** from `@indexnow/database/client` browser bundle
9. **Direct `@sentry/nextjs` imports** in 2 error.tsx files — use `@indexnow/analytics` wrapper

### Should Clean Up — Hygiene

10. **Dead dependency**: `google-auth-library` in `apps/api/package.json` — never imported
11. **Dead dependency**: `@paddle/paddle-node-sdk` in `apps/api/package.json` — never imported
12. **Duplicate dependency**: `@paddle/paddle-js` in both `packages/ui` and `apps/user-dashboard`
13. **Unused tsconfig aliases**: `@indexnow/mail` in both frontend tsconfigs — latent import risk
14. **Dead analytics code**: GA4/GTM/Customer.io plugins in `@indexnow/analytics` — never called
15. **PostHog autocapture** — review for GDPR compliance with form data

### Acceptable (No Action Needed)

16. **`supabase.auth.onAuthStateChange()`** — Client-side SDK listener, can't proxy
17. **`supabase.auth.getSession()`** — Local session read
18. **Middleware `supabase.auth.getUser()`** — Server-side Edge, can't proxy (circular)
19. **Token extraction for Authorization header** — `getToken()`, `getSession()` needed for JWT auth
20. **Paddle `initializePaddle()` + `Checkout.open()`** — Official Paddle client-side checkout pattern
21. **Sentry/PostHog/GA4 browser SDKs** — Designed for client-side analytics
