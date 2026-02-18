# API Reference

## Overview

All API routes are served under the base path:

```
/api/v1/
```

The API app runs on **port 3001** by default (configurable via `PORT` env var).

### Route Protection Model

Every route handler is wrapped in one of three protection wrappers:

| Wrapper              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `publicRoute`        | No authentication required. Anyone can call it.  |
| `authenticatedRoute` | Requires a valid JWT session cookie.             |
| `adminRoute`         | Requires a valid JWT **and** `super_admin` role. |

---

## Authentication

Authentication is handled via **JWT tokens stored in HTTP-only cookies**. The flow is:

1. Client calls `POST /api/v1/auth/login` with credentials.
2. Server validates credentials against Supabase Auth and sets a session cookie.
3. Subsequent requests include the cookie automatically.
4. On the frontend, `authenticatedFetch` is used as a wrapper around `fetch` that ensures credentials are included and handles 401 responses (redirect to login).

OAuth (Google, GitHub, etc.) uses the `/api/v1/auth/callback` redirect-based flow via Supabase.

---

## Route Reference

### Auth Routes

14 handlers across 13 routes.

| Method | Path                                  | Auth          | Description                     |
| ------ | ------------------------------------- | ------------- | ------------------------------- |
| POST   | `/api/v1/auth/login`                  | public        | Email/password login            |
| POST   | `/api/v1/auth/register`               | public        | Create new account              |
| POST   | `/api/v1/auth/logout`                 | public        | Destroy session                 |
| GET    | `/api/v1/auth/callback`               | public        | OAuth provider callback         |
| GET    | `/api/v1/auth/verify`                 | public        | Email verification link handler |
| GET    | `/api/v1/auth/detect-location`        | public        | Detect user's country via IP    |
| POST   | `/api/v1/auth/resend-verification`    | public        | Resend email verification link  |
| GET    | `/api/v1/auth/session`                | public        | Get current session             |
| POST   | `/api/v1/auth/session`                | public        | Refresh session                 |
| DELETE | `/api/v1/auth/session`                | public        | Delete session                  |
| POST   | `/api/v1/auth/user/change-password`   | authenticated | Change account password         |
| GET    | `/api/v1/auth/user/profile`           | authenticated | Get user profile                |
| GET    | `/api/v1/auth/user/quota`             | authenticated | Get current quota usage         |
| GET    | `/api/v1/auth/user/settings`          | authenticated | Get user settings               |
| PUT    | `/api/v1/auth/user/settings`          | authenticated | Update user settings            |
| GET    | `/api/v1/auth/user/trial-eligibility` | authenticated | Check if user can start a trial |
| GET    | `/api/v1/auth/user/trial-status`      | authenticated | Get current trial status        |

---

### Admin Routes

30 handlers across 22+ routes. **All require `super_admin` role.**

| Method | Path                                              | Description                  |
| ------ | ------------------------------------------------- | ---------------------------- |
| GET    | `/api/v1/admin/dashboard`                         | Admin dashboard stats        |
| GET    | `/api/v1/admin/activity`                          | List all activity logs       |
| GET    | `/api/v1/admin/activity/[id]`                     | Get single activity entry    |
| GET    | `/api/v1/admin/errors`                            | List error logs              |
| GET    | `/api/v1/admin/errors/[id]`                       | Get single error entry       |
| PATCH  | `/api/v1/admin/errors/[id]`                       | Update error status          |
| GET    | `/api/v1/admin/errors/critical`                   | List critical errors         |
| GET    | `/api/v1/admin/errors/stats`                      | Error statistics summary     |
| GET    | `/api/v1/admin/orders`                            | List all orders              |
| GET    | `/api/v1/admin/orders/[id]`                       | Get single order             |
| PATCH  | `/api/v1/admin/orders/[id]/status`                | Update order status          |
| GET    | `/api/v1/admin/packages`                          | List subscription packages   |
| POST   | `/api/v1/admin/rank-tracker/trigger-manual-check` | Trigger manual rank check    |
| GET    | `/api/v1/admin/rank-tracker/trigger-manual-check` | Get manual check status      |
| GET    | `/api/v1/admin/settings/packages`                 | List package settings        |
| POST   | `/api/v1/admin/settings/packages`                 | Create package               |
| PATCH  | `/api/v1/admin/settings/packages/[id]`            | Update package               |
| DELETE | `/api/v1/admin/settings/packages/[id]`            | Delete package               |
| GET    | `/api/v1/admin/settings/payments`                 | List payment gateways        |
| POST   | `/api/v1/admin/settings/payments`                 | Create payment gateway       |
| PATCH  | `/api/v1/admin/settings/payments/[id]`            | Update payment gateway       |
| DELETE | `/api/v1/admin/settings/payments/[id]`            | Delete payment gateway       |
| PATCH  | `/api/v1/admin/settings/payments/[id]/default`    | Set default payment gateway  |
| GET    | `/api/v1/admin/settings/site`                     | Get site settings            |
| PATCH  | `/api/v1/admin/settings/site`                     | Update site settings         |
| POST   | `/api/v1/admin/settings/site/test-email`          | Send test email              |
| GET    | `/api/v1/admin/users`                             | List all users               |
| GET    | `/api/v1/admin/users/[id]`                        | Get single user              |
| PATCH  | `/api/v1/admin/users/[id]`                        | Update user                  |
| GET    | `/api/v1/admin/users/[id]/activity`               | User activity log            |
| GET    | `/api/v1/admin/users/[id]/api-stats`              | User API usage stats         |
| POST   | `/api/v1/admin/users/[id]/change-package`         | Change user's package        |
| POST   | `/api/v1/admin/users/[id]/extend-subscription`    | Extend user subscription     |
| GET    | `/api/v1/admin/users/[id]/quota-usage`            | User quota usage breakdown   |
| POST   | `/api/v1/admin/users/[id]/reset-password`         | Reset user password (admin)  |
| POST   | `/api/v1/admin/users/[id]/reset-quota`            | Reset user quota             |
| GET    | `/api/v1/admin/users/[id]/security`               | User security info           |
| GET    | `/api/v1/admin/verify-role`                       | Verify caller has admin role |

---

### Billing Routes

9 handlers across 8 routes.

| Method | Path                                | Auth          | Description                   |
| ------ | ----------------------------------- | ------------- | ----------------------------- |
| GET    | `/api/v1/billing/history`           | authenticated | Billing history               |
| GET    | `/api/v1/billing/orders/[id]`       | authenticated | Get single order details      |
| GET    | `/api/v1/billing/overview`          | authenticated | Billing overview / summary    |
| GET    | `/api/v1/billing/packages`          | authenticated | List available packages       |
| GET    | `/api/v1/billing/packages/[id]`     | public        | Get single package details    |
| POST   | `/api/v1/billing/payment`           | authenticated | Initiate a payment            |
| GET    | `/api/v1/billing/payment-gateways`  | authenticated | List enabled payment gateways |
| GET    | `/api/v1/billing/transactions/[id]` | authenticated | Get transaction details       |
| POST   | `/api/v1/billing/upload-proof`      | authenticated | Upload manual payment proof   |

---

### Payments — Paddle Routes

9 handlers across 8 routes.

| Method | Path                                                      | Auth          | Description                             |
| ------ | --------------------------------------------------------- | ------------- | --------------------------------------- |
| GET    | `/api/v1/payments/paddle/config`                          | public        | Paddle client-side config               |
| GET    | `/api/v1/payments/paddle/customer-portal`                 | authenticated | Get Paddle customer portal URL          |
| POST   | `/api/v1/payments/paddle/subscription/cancel`             | authenticated | Cancel subscription                     |
| GET    | `/api/v1/payments/paddle/subscription/my-subscription`    | authenticated | Get current subscription                |
| POST   | `/api/v1/payments/paddle/subscription/pause`              | authenticated | Pause subscription                      |
| GET    | `/api/v1/payments/paddle/subscription/refund-window-info` | authenticated | Check refund eligibility                |
| POST   | `/api/v1/payments/paddle/subscription/resume`             | authenticated | Resume paused subscription              |
| POST   | `/api/v1/payments/paddle/subscription/update`             | authenticated | Update subscription (plan change)       |
| POST   | `/api/v1/payments/paddle/webhook`                         | public        | Paddle webhook receiver (HMAC verified) |

---

### Rank Tracking Routes

10 handlers across 8+ routes.

| Method | Path                                         | Auth          | Description              |
| ------ | -------------------------------------------- | ------------- | ------------------------ |
| POST   | `/api/v1/rank-tracking/check-rank`           | authenticated | Trigger a rank check     |
| GET    | `/api/v1/rank-tracking/check-rank`           | authenticated | Get rank check status    |
| GET    | `/api/v1/rank-tracking/countries`            | public        | List supported countries |
| GET    | `/api/v1/rank-tracking/domains`              | authenticated | List tracked domains     |
| POST   | `/api/v1/rank-tracking/domains`              | authenticated | Add a domain             |
| GET    | `/api/v1/rank-tracking/keywords`             | authenticated | List tracked keywords    |
| POST   | `/api/v1/rank-tracking/keywords`             | authenticated | Add keywords             |
| DELETE | `/api/v1/rank-tracking/keywords`             | authenticated | Delete a keyword         |
| POST   | `/api/v1/rank-tracking/keywords/add-tag`     | authenticated | Tag keywords             |
| DELETE | `/api/v1/rank-tracking/keywords/bulk-delete` | authenticated | Bulk delete keywords     |
| GET    | `/api/v1/rank-tracking/keyword-usage`        | authenticated | Keyword quota usage      |
| GET    | `/api/v1/rank-tracking/rank-history`         | authenticated | Historical rank data     |
| GET    | `/api/v1/rank-tracking/weekly-trends`        | authenticated | Weekly ranking trends    |

---

### SeRanking Integration Routes

6 handlers across 6 routes.

| Method | Path                                               | Auth          | Description              |
| ------ | -------------------------------------------------- | ------------- | ------------------------ |
| GET    | `/api/v1/integrations/seranking/health`            | admin         | Service health check     |
| GET    | `/api/v1/integrations/seranking/health/metrics`    | admin         | Detailed health metrics  |
| GET    | `/api/v1/integrations/seranking/keyword-data`      | authenticated | Get keyword ranking data |
| POST   | `/api/v1/integrations/seranking/keyword-data/bulk` | authenticated | Bulk keyword data fetch  |
| GET    | `/api/v1/integrations/seranking/quota/history`     | authenticated | SeRanking quota history  |
| GET    | `/api/v1/integrations/seranking/quota/status`      | authenticated | Current SeRanking quota  |

---

### System & Dashboard Routes

| Method | Path                                 | Auth          | Description                      |
| ------ | ------------------------------------ | ------------- | -------------------------------- |
| GET    | `/api/v1/dashboard`                  | authenticated | User dashboard data              |
| POST   | `/api/v1/activity`                   | authenticated | Log a client-side activity       |
| POST   | `/api/v1/notifications/dismiss/[id]` | authenticated | Dismiss a notification           |
| GET    | `/api/v1/system/health`              | public        | Health check (uptime, DB, Redis) |
| GET    | `/api/v1/system/status`              | public        | System status summary            |

---

## Response Format

All endpoints return a consistent JSON envelope:

```jsonc
{
  "success": true,       // boolean — was the request successful?
  "data": { ... },       // T — present on success (shape varies per endpoint)
  "error": "string",     // present on failure — machine-readable error key
  "message": "string"    // present on failure — human-readable description
}
```

Paginated list endpoints extend this with:

```jsonc
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 142
  }
}
```

---

## Error Codes

| HTTP Status | Meaning               | When                                                                |
| ----------- | --------------------- | ------------------------------------------------------------------- |
| 400         | Bad Request           | Validation failure, missing/invalid parameters                      |
| 401         | Unauthenticated       | No session cookie or expired JWT                                    |
| 403         | Forbidden             | Valid session but insufficient role (e.g. non-admin on admin route) |
| 404         | Not Found             | Resource does not exist                                             |
| 429         | Too Many Requests     | Rate limit exceeded (Redis-backed sliding window)                   |
| 500         | Internal Server Error | Unexpected server failure                                           |

Rate-limited responses include a `Retry-After` header (seconds).
