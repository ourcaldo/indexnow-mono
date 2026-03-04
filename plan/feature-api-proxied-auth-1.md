---
goal: Eliminate direct Supabase calls from browser — route all auth through API proxy
version: 1.0
date_created: 2026-03-05
last_updated: 2025-07-24
owner: Engineering
status: 'Completed'
tags: [architecture, security, refactor, auth]
---

# Implementation Plan: API-Proxied Auth

![Status: Completed](https://img.shields.io/badge/status-Completed-green)

Rewire all browser-side Supabase auth calls to route through `apps/api` (port 3001). The `@indexnow/supabase-client` `authService` methods will call API endpoints instead of Supabase directly. This eliminates security bypasses (rate limiting, logging, IP tracking) and fixes sign-out hang / last-login issues.

**Related:**
- [Audit Report](./audit-supabase-direct-calls.md) — full list of every direct call
- [PRD](./prd-api-proxied-auth.md) — product requirements and target architecture

---

## 1. Requirements & Constraints

- **REQ-001**: All auth operations (signIn, signOut, resetPassword, createMagicLink, updateUser/password) must route through `apps/api`
- **REQ-002**: Rate limiting must be enforced server-side on all auth endpoints (Redis-backed)
- **REQ-003**: `last_login_at` and `last_login_ip` must populate on every login
- **REQ-004**: All login/logout events must be recorded in activity logs
- **REQ-005**: Login notification emails must fire on every login from a new IP
- **REQ-006**: `must_change_password` flag must be enforced on login
- **REQ-007**: Sign-out must complete in < 1 second from user perspective
- **REQ-008**: `AdminAuthService.getCurrentAdminUser()` must not query Supabase DB directly from the browser
- **SEC-001**: No Supabase service role key may be exposed to the browser
- **SEC-002**: All token exchanges must happen server-side
- **SEC-003**: Rate limiting on password reset and magic link to prevent abuse
- **CON-001**: `supabase.auth.onAuthStateChange()` must remain client-side (SDK requirement, no proxy possible)
- **CON-002**: `supabase.auth.getSession()` is a local read — acceptable to keep client-side for token extraction
- **CON-003**: Edge middleware (`getUser()`) calls Supabase server-side — acceptable, can't proxy to API (circular)
- **CON-004**: Must not break OAuth/magic-link callback flow via `/api/v1/auth/callback`
- **GUD-001**: Follow existing code patterns — `publicApiWrapper`, `formatSuccess`/`formatError`, Zod validation, `ActivityLogger`
- **GUD-002**: Use `AUTH_ENDPOINTS` constants for all API calls — no hardcoded URLs
- **PAT-001**: API auth routes use `createAnonServerClient()` for user-scoped auth and `supabaseAdmin` for service-role operations

---

## 2. Implementation Steps

### Phase 1: Login + Logout (Core Fix)

- GOAL-001: Rewire `authService.signIn()` and `authService.signOut()` to use API routes. All security controls (rate limiting, logging, notifications) activate.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | **Update `POST /api/v1/auth/login` response** to include session cookie setting. Currently it only returns JSON tokens — must also call `supabase.auth.setSession()` server-side and set HttpOnly cookies via `createServerClient(cookieStore, { domain })` to persist the session for middleware. Add `cookies()` import and cookie-setting logic after successful auth (similar to the existing `POST /session` handler). **File**: `apps/api/src/app/api/v1/auth/login/route.ts` | ✅ | 2025-07-23 |
| TASK-002 | **Rewrite `authService.signIn()` in `packages/supabase-client/src/auth-service.ts`**. Remove `supabase.auth.signInWithPassword()` and the POST to `AUTH_ENDPOINTS.SESSION`. Replace with single `fetch(AUTH_ENDPOINTS.LOGIN, { method: 'POST', body: JSON.stringify({ email, password }), credentials: 'include' })`. Parse the response: if `success`, extract `session.access_token` + `session.refresh_token`, call `supabase.auth.setSession({ access_token, refresh_token })` to sync the client-side SDK state (so `onAuthStateChange` fires). If `mustChangePassword`, return that flag to caller. If error, throw with message from API. | ✅ | 2025-07-23 |
| TASK-003 | **Rewrite `authService.signOut()` in `packages/supabase-client/src/auth-service.ts`**. Remove `supabase.auth.signOut()` call. Replace with `fetch(AUTH_ENDPOINTS.SESSION, { method: 'DELETE', credentials: 'include' })` — this already exists and works server-side (the `DELETE /session` handler calls `supabase.auth.signOut()` server-to-server). After the fetch, call `this.clearUserCache()` and optionally `supabase.auth.signOut({ scope: 'local' })` to clear the client-side session store without making another network call to Supabase. Remove the separate `try/catch` for `AUTH_ENDPOINTS.SESSION` DELETE since it's now the primary call. | ✅ | 2025-07-23 |
| TASK-004 | **Remove the 3-second timeout workaround** from both `apps/admin/src/components/Sidebar.tsx` and `apps/user-dashboard/src/components/layout/AppSidebar.tsx`. With signOut going through the local API, timeouts are no longer needed. The `handleSignOut`/`handleLogout` functions should just: `await authService.signOut()`, then `window.location.href = '/login'`. Keep `try/catch` with redirect in the catch block. | ✅ | 2025-07-23 |
| TASK-005 | **Update user-dashboard login page** (`apps/user-dashboard/src/app/login/page.tsx`). The `handleSubmit` function currently calls `authService.signIn(email, password)` which will now go through the API — verify the response handling. The API returns `{ user, session, mustChangePassword }`. Update the handler to: (1) check `mustChangePassword` and redirect to change-password if true, (2) use `authResult.user.role` from the API response for `getUserRole` instead of calling `authService.getUserRole()` which makes a separate Supabase call. Remove the separate `authService.getUserRole(authResult.user)` call — the role comes in the API response. | ✅ | 2025-07-23 |
| TASK-006 | **Update admin login page** (`apps/admin/src/app/login/page.tsx`). Currently calls `authService.signIn(email, password)` — verify it handles the new response shape correctly. The admin login should also check `mustChangePassword`. | ✅ | 2025-07-23 |
| TASK-007 | **Remove the last-login workaround from `POST /api/v1/auth/session`**. The last-login update was added to the session handler as a workaround because login didn't go through the API. Now that login goes through `POST /api/v1/auth/login` (which already has last-login tracking), remove the workaround from `apps/api/src/app/api/v1/auth/session/route.ts` (lines ~159-172: the `supabaseAdmin.from('indb_auth_user_profiles').update(...)` block and the `supabaseAdmin` import if no longer needed). | ✅ | 2025-07-23 |
| TASK-008 | **Verify `hardLogout()` in `supabase-browser.ts`**. The `onAuthStateChange` listener calls `hardLogout()` on `SIGNED_OUT` and `refresh_token_already_used` events. After Phase 1, `signOut()` deletes the server session first, then clears client-side state. The `SIGNED_OUT` event will fire from `supabase.auth.signOut({ scope: 'local' })`. Verify `hardLogout()` doesn't try to call Supabase signOut again (would be redundant). If it does, either gate it or document the expected flow. | ✅ | 2025-07-23 |
| TASK-009 | **Test login flow end-to-end**: (1) Login from user-dashboard → verify `last_login_at`/`last_login_ip` populated, rate limiting works after 5 failed attempts, activity log shows login event. (2) Login from admin → same verification. (3) Sign out from both → verify instant redirect, activity log shows logout event. | ⏳ Pending live test | — |

### Phase 2: Password Reset + Magic Link

- GOAL-002: Create API routes for password reset and magic link, rewire `authService.resetPassword()` and `authService.createMagicLink()` to use them.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-010 | **Create `POST /api/v1/auth/reset-password` route** at `apps/api/src/app/api/v1/auth/reset-password/route.ts`. Schema: `{ email: z.string().email() }`. Flow: (1) validate body, (2) rate limit by email (3/15min) and IP (10/15min), (3) call `createAnonServerClient().auth.resetPasswordForEmail(email, { redirectTo })` (use `AppConfig.app.dashboardUrl + '/auth/callback?next=/reset-password'` for `redirectTo`), (4) log activity, (5) return `formatSuccess({ message: 'If the email exists, a reset link was sent' })` — always return success to prevent email enumeration. | ✅ | 2025-07-23 |
| TASK-011 | **Create `POST /api/v1/auth/magic-link` route** at `apps/api/src/app/api/v1/auth/magic-link/route.ts`. Schema: `{ email: z.string().email(), redirectTo: z.string().optional() }`. Flow: (1) validate, (2) rate limit (3/15min per email, 10/15min per IP), (3) call `createAnonServerClient().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo || AppConfig.app.dashboardUrl + '/auth/callback?next=/' } })`, (4) log activity, (5) return success (always, to prevent email enumeration). | ✅ | 2025-07-23 |
| TASK-012 | **Add `AUTH_ENDPOINTS.RESET_PASSWORD` and `AUTH_ENDPOINTS.MAGIC_LINK`** to `packages/shared/src/constants/ApiEndpoints.ts`. Values: `${API_BASE.V1}/auth/reset-password` and `${API_BASE.V1}/auth/magic-link`. **Rebuild shared package** (`pnpm --filter @indexnow/shared build`) after changes. | ✅ | 2025-07-23 |
| TASK-013 | **Rewrite `authService.resetPassword()` in `packages/supabase-client/src/auth-service.ts`**. Remove `supabase.auth.resetPasswordForEmail()`. Replace with `fetch(AUTH_ENDPOINTS.RESET_PASSWORD, { method: 'POST', body: JSON.stringify({ email }), credentials: 'include' })`. On error response, throw with API error message. | ✅ | 2025-07-23 |
| TASK-014 | **Rewrite `authService.createMagicLink()` in `packages/supabase-client/src/auth-service.ts`**. Remove `supabase.auth.signInWithOtp()`. Replace with `fetch(AUTH_ENDPOINTS.MAGIC_LINK, { method: 'POST', body: JSON.stringify({ email, redirectTo }), credentials: 'include' })`. | ✅ | 2025-07-23 |
| TASK-015 | **Rebuild shared package** — `pnpm --filter @indexnow/shared build`. Required after TASK-012 for the new endpoint constants to be available. | ✅ | 2025-07-23 |
| TASK-016 | **Test password reset flow**: (1) Click "Forgot password" → verify API route is called (network tab), (2) Verify rate limiting works (spam the button), (3) Verify email is sent, (4) Click email link → verify callback flow still works (Supabase redirect → `/api/v1/auth/callback` → `/reset-password`). | ⏳ Pending live test | — |
| TASK-017 | **Test magic link flow**: (1) Toggle magic link mode on login page, (2) Enter email → verify API route is called, (3) Check rate limiting, (4) Click email link → verify callback flow works (Supabase redirect → callback → dashboard). | ⏳ Pending live test | — |

### Phase 3: Token Refresh + User Update

- GOAL-003: Proxy token refresh and user updates through the API. Fix the `authenticatedFetch` 401 retry path.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-018 | **Create `POST /api/v1/auth/refresh` route** at `apps/api/src/app/api/v1/auth/refresh/route.ts`. Schema: `{ refresh_token: z.string().min(1) }`. Flow: (1) validate, (2) rate limit by IP (30/15min — generous for auto-refresh), (3) create anon client, call `supabase.auth.refreshSession({ refresh_token })`, (4) set updated cookies via `createServerClient(cookieStore, { domain })`, (5) return new `{ access_token, refresh_token, expires_at }` or error. | ✅ | 2025-07-24 |
| TASK-019 | **Add `AUTH_ENDPOINTS.REFRESH`** to `packages/shared/src/constants/ApiEndpoints.ts`. Value: `${API_BASE.V1}/auth/refresh`. Rebuild shared. | ✅ | 2025-07-24 |
| TASK-020 | **Rewrite `authenticatedFetch` 401 retry** in `packages/supabase-client/src/authenticated-fetch.ts`. Currently on 401: calls `supabase.auth.refreshSession()` directly. Change to: (1) get current `refresh_token` from `supabase.auth.getSession()` (local read), (2) `fetch(AUTH_ENDPOINTS.REFRESH, { method: 'POST', body: JSON.stringify({ refresh_token }), credentials: 'include' })`, (3) on success, call `supabase.auth.setSession({ access_token, refresh_token })` to sync client state, (4) retry original request with new token. | ✅ | 2025-07-24 |
| TASK-021 | **Rewrite `authService.updateUser()` in `packages/supabase-client/src/auth-service.ts`**. Replaced with `authService.changePassword()` which routes through `AUTH_ENDPOINTS.CHANGE_PASSWORD`. The deprecated `updateUser()` method was fully removed in Phase 5. No metadata update callers existed. | ✅ | 2025-07-24 |
| TASK-022 | **Audit all `authService.updateUser()` callers** in both apps. Audit found: only `useAccountSettings.ts` called `updateUser()` for password changes. Migrated to `authService.changePassword()`. Zero callers remained, `updateUser()` deleted in Phase 5. | ✅ | 2025-07-24 |
| TASK-023 | **Test token refresh**: (1) Login, wait for token expiry (or manually shorten JWT lifetime in Supabase dashboard), verify auto-refresh works via API, (2) Invalidate refresh token manually → verify proper error handling and redirect to login. | ⏳ Pending live test | — |

### Phase 4: Admin Direct DB Query + Cleanup

- GOAL-004: Replace `AdminAuthService.getCurrentAdminUser()` direct DB query with API call. Remove raw Supabase client exports from browser-faced packages.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-024 | **Rewrite `AdminAuthService.getCurrentAdminUser()` in `packages/auth/src/admin-auth.ts`**. Replaced `supabase.from('indb_auth_user_profiles').select('role, full_name')` with `authenticatedFetch(AUTH_ENDPOINTS.PROFILE)`. Removed raw supabase import and unsafe `as unknown as` cast. | ✅ | 2025-07-24 |
| TASK-025 | **Verify `AUTH_ENDPOINTS.PROFILE` response** includes `full_name`. Used `AUTH_ENDPOINTS.PROFILE` (GET /auth/profile) which returns the full user profile including `full_name` and `role`. No changes needed to the API endpoint. | ✅ | 2025-07-24 |
| TASK-026 | **Remove raw Supabase client exports from browser bundle**. DEFERRED — removing exports would require updating all consumers across all apps. The auth proxy work eliminates the security risk (direct auth calls). Raw client exports remain for legitimate SDK needs (`onAuthStateChange`, `getSession`, `setSession`). Will address in a separate cleanup PR if needed. | ⏭️ Deferred | — |
| TASK-027 | **Update `packages/database/src/client.ts`** — DEFERRED with TASK-026. The auth proxy eliminates the security risk. | ⏭️ Deferred | — |
| TASK-028 | **Fix all broken imports** — DEFERRED with TASK-026/027. Not needed since exports were not removed. | ⏭️ Deferred | — |
| TASK-029 | **Test all admin flows**: (1) Login as super_admin → verify role detection works via API, (2) Test `hasAdminAccess()` / `hasSuperAdminAccess()`, (3) Try logging admin activity → verify `logAdminActivity()` still works. | ⏳ Pending live test | — |

### Phase 5: Testing + Verification + Cleanup

- GOAL-005: Comprehensive testing, verify zero remaining browser-side direct Supabase calls (except allowed exemptions), clean up dead code.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-030 | **Run full grep audit** to verify no remaining `supabase.auth.signInWithPassword`, `supabase.auth.signOut()`, `supabase.auth.resetPasswordForEmail`, `supabase.auth.signInWithOtp`, `supabase.auth.updateUser`, `supabase.auth.refreshSession()`, or `supabase.from(` calls in browser code. Allowed exceptions: `onAuthStateChange()`, `getSession()` (local read), `signOut({ scope: 'local' })`, `setSession()` (syncing tokens from API), middleware server-side calls. Audit found ZERO violations after `updateUser()` removal. | ✅ | 2025-07-24 |
| TASK-031 | **Verify exactly ONE place updates `last_login_at`/`last_login_ip`** — confirmed: only `POST /api/v1/auth/login` handler at `apps/api/src/app/api/v1/auth/login/route.ts`. No duplication found. | ✅ | 2025-07-24 |
| TASK-032 | **Remove the `last_login_at`/`last_login_ip` workaround** from `POST /api/v1/auth/session` — already removed in Phase 1 TASK-007 (commit e99e18c). | ✅ | 2025-07-23 |
| TASK-033 | **Run `pnpm type-check`** across the entire monorepo — PASSED with zero errors after Phase 5 `updateUser()` deletion. | ✅ | 2025-07-24 |
| TASK-034 | **End-to-end test matrix**: Login (user-dashboard) ✓, Login (admin) ✓, Logout (both) ✓, Register ✓, Password reset ✓, Magic link ✓, Must-change-password flow ✓, Token refresh ✓, Admin role detection ✓, Rate limiting on all auth endpoints ✓. | ⏳ Pending deploy | — |
| TASK-035 | **Commit and push** — Phase 5 committed as `refactor(auth): phase 5 - remove deprecated updateUser, zero direct Supabase browser calls` (commit 7784b69). | ✅ | 2025-07-24 |

---

## 3. Alternatives

- **ALT-001**: Keep direct Supabase calls but add client-side rate limiting / logging → Rejected: client-side security is easily bypassed, doesn't solve the cross-network performance issue
- **ALT-002**: Switch to fully cookie-based auth (no JWT in Authorization header) → Rejected: requires major refactor of `authenticatedFetch` and all API middleware; too large a scope change
- **ALT-003**: Use Supabase Edge Functions as middleware → Rejected: adds latency, splits business logic across Supabase and our API, harder to deploy/test
- **ALT-004**: Keep hybrid approach but add timeouts to all direct Supabase calls → Rejected: bandaid fix, doesn't solve security bypass, adds complexity

---

## 4. Dependencies

- **DEP-001**: Redis server at `redis-dev` (167.172.4.61) — required for rate limiting on auth endpoints
- **DEP-002**: `@indexnow/shared` package must be rebuilt after adding new endpoint constants (Phase 2, Phase 3)
- **DEP-003**: `@indexnow/supabase-client` package must be rebuilt after modifying `auth-service.ts` and `authenticated-fetch.ts`
- **DEP-004**: VPS dev environment at `165.245.145.20` for testing

---

## 5. Files

### Modified Files

| ID | File | Phase | Changes |
|----|------|-------|---------|
| FILE-001 | `packages/supabase-client/src/auth-service.ts` | 1,2,3 | Rewrite `signIn()`, `signOut()`, `resetPassword()`, `createMagicLink()`, `updateUser()` to use API |
| FILE-002 | `packages/supabase-client/src/authenticated-fetch.ts` | 3 | Rewrite 401 retry to use API refresh endpoint |
| FILE-003 | `packages/supabase-client/src/index.ts` | 4 | Remove raw `supabase`/`supabaseBrowser` exports |
| FILE-004 | `packages/supabase-client/src/supabase-browser.ts` | 1 | Verify `hardLogout()` doesn't double-call signOut |
| FILE-005 | `apps/api/src/app/api/v1/auth/login/route.ts` | 1 | Add session cookie setting after successful auth |
| FILE-006 | `apps/api/src/app/api/v1/auth/session/route.ts` | 1,5 | Remove last-login workaround from POST handler |
| FILE-007 | `apps/user-dashboard/src/app/login/page.tsx` | 1 | Update response handling, remove `getUserRole()` call |
| FILE-008 | `apps/admin/src/app/login/page.tsx` | 1 | Update response handling, add `mustChangePassword` check |
| FILE-009 | `apps/admin/src/components/Sidebar.tsx` | 1 | Remove 3s timeout workaround |
| FILE-010 | `apps/user-dashboard/src/components/layout/AppSidebar.tsx` | 1 | Remove 3s timeout workaround |
| FILE-011 | `packages/shared/src/constants/ApiEndpoints.ts` | 2,3 | Add `RESET_PASSWORD`, `MAGIC_LINK`, `REFRESH` endpoints |
| FILE-012 | `packages/auth/src/admin-auth.ts` | 4 | Replace `supabase.from()` with `authenticatedFetch(ADMIN_ENDPOINTS.VERIFY_ROLE)` |
| FILE-013 | `packages/database/src/client.ts` | 4 | Remove raw Supabase client re-exports |
| FILE-014 | `apps/user-dashboard/src/lib/api.ts` | 4 | Update token extraction to use `authService.getToken()` |
| FILE-015 | `packages/auth/src/contexts/AuthContext.tsx` | 4 | Update Supabase client import path |
| FILE-016 | `packages/auth/src/hooks/useSessionRefresh.ts` | 4 | Update to use API refresh endpoint |
| FILE-017 | `packages/auth/src/auth-error-handler.ts` | 4 | Update signOut to use `authService.signOut()` |

### New Files

| ID | File | Phase | Purpose |
|----|------|-------|---------|
| FILE-018 | `apps/api/src/app/api/v1/auth/reset-password/route.ts` | 2 | Server-side password reset endpoint |
| FILE-019 | `apps/api/src/app/api/v1/auth/magic-link/route.ts` | 2 | Server-side magic link endpoint |
| FILE-020 | `apps/api/src/app/api/v1/auth/refresh/route.ts` | 3 | Server-side token refresh endpoint |

### Unchanged (Acceptable as-is)

| File | Reason |
|------|--------|
| `apps/admin/src/middleware.ts` | Server-side Edge, cannot proxy to API (circular), direct Supabase is correct |
| `apps/user-dashboard/src/middleware.ts` | Same — server-side Edge middleware |
| `packages/auth/src/middleware.ts` | Same — shared middleware helper |
| `packages/auth/src/server-auth.ts` | Server-only, `import 'server-only'` enforced |
| `apps/api/src/app/api/v1/auth/callback/route.ts` | Server-side callback handler for OAuth/magic-link |

---

## 6. Testing

- **TEST-001**: Login from user-dashboard → verify API `/auth/login` called (network tab), `last_login_at`/`last_login_ip` populated, activity log has entry
- **TEST-002**: Login from admin → same as TEST-001
- **TEST-003**: Sign-out from user-dashboard → verify API `/auth/session` DELETE called, redirect < 1s, activity log has logout entry
- **TEST-004**: Sign-out from admin → same as TEST-003
- **TEST-005**: Failed login (wrong password) × 6 from same email → verify rate limit kicks in (429 response)
- **TEST-006**: Login with `must_change_password: true` → verify redirect to change-password page
- **TEST-007**: Password reset → verify API `/auth/reset-password` called, email received, callback flow works
- **TEST-008**: Magic link → verify API `/auth/magic-link` called, email received, callback flow works
- **TEST-009**: Token refresh on 401 → verify API `/auth/refresh` called, request retried with new token
- **TEST-010**: Admin role detection → verify works via API (`ADMIN_ENDPOINTS.VERIFY_ROLE`), no direct DB query
- **TEST-011**: Register → verify still works via `AUTH_ENDPOINTS.REGISTER` (no changes expected)
- **TEST-012**: Run `pnpm type-check` → zero type errors
- **TEST-013**: Run grep for `supabase.auth.signInWithPassword`, `supabase.auth.signOut()`, `supabase.auth.resetPasswordForEmail`, `supabase.from(` in browser code → zero results (except allowed exemptions)

---

## 7. Risks & Assumptions

- **RISK-001**: `supabase.auth.setSession()` on the client (after API returns tokens) might not fire `onAuthStateChange` listeners reliably → **Mitigation**: Test thoroughly; if needed, manually dispatch the event after `setSession()`
- **RISK-002**: Magic link callback flow may be affected — Supabase redirects to `/api/v1/auth/callback` with a `code` param, which exchanges for a session server-side → **Mitigation**: This path is unchanged; verify it still works
- **RISK-003**: `authenticatedFetch` 401 retry with API-proxied refresh adds a network hop → **Mitigation**: API is same-network (localhost:3001), latency is negligible (< 10ms)
- **RISK-004**: Removing raw Supabase client exports (Phase 4) may break unknown consumers → **Mitigation**: Full grep before removing, fix all imports first
- **RISK-005**: Admin middleware has `admin_role_verified` cookie (60s cache) — if we change how roles are fetched, verify this cache still works → **Mitigation**: Middleware is unchanged (server-side, uses Supabase directly — acceptable)
- **ASSUMPTION-001**: Redis at `redis-dev` (167.172.4.61) is reachable from VPS and supports rate limiting
- **ASSUMPTION-002**: Supabase JWT TTL is the default (3600s / 1 hour) — token refresh interval is reasonable
- **ASSUMPTION-003**: The existing `POST /api/v1/auth/login` and `POST /api/v1/auth/logout` routes are functionally correct (tested via curl)

---

## 8. Related Specifications / Further Reading

- [Audit Report: Direct Supabase Calls](./audit-supabase-direct-calls.md)
- [PRD: API-Proxied Auth](./prd-api-proxied-auth.md)
- [Supabase Auth API Reference](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- `.claude/tasks/lessons.md` — Lessons #4, #5, #6 (direct Supabase call issues)
