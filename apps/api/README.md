# @indexnow/api

Headless Next.js 16 app providing all REST API routes for the IndexNow Studio platform. No UI — only `src/app/api/` route handlers.

> Part of the [IndexNow Studio monorepo](../../README.md).

## Tech Stack

- **Runtime:** Next.js 16 (App Router, route handlers only)
- **Database:** Supabase (Row-Level Security + service-role access)
- **Payments:** Paddle (subscriptions, webhooks)
- **Rank Tracking:** SeRanking integration
- **Logging:** pino (structured JSON)
- **Rate Limiting:** Redis
- **Auth:** Supabase Auth (JWT validation via `@indexnow/auth`)

## API Routes (`/api/v1/`)

| Domain            | Routes                                                                                                      | Description                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Auth**          | `auth/session`, `auth/verify`, `auth/user/change-password`                                                  | Login, session validation, password change         |
| **Admin**         | `admin/users`, `admin/verify-role`                                                                          | User management, role verification (super_admin)   |
| **Billing**       | `billing/history`, `billing/overview`, `billing/payment`, `billing/orders/[id]`                             | Payment history, billing overview, order details   |
| **Paddle**        | `payments/paddle/webhook`, `payments/paddle/subscription/*`, `payments/paddle/config`                       | Webhook receiver, subscription lifecycle, config   |
| **Rank Tracking** | `rank-tracking/keywords`, `rank-tracking/domains`, `rank-tracking/check-rank`, `rank-tracking/rank-history` | Keyword CRUD, domain management, rank checks       |
| **SeRanking**     | `integrations/seranking/keyword-data`, `integrations/seranking/quota/*`, `integrations/seranking/health`    | Keyword data sync, quota monitoring, health checks |
| **Dashboard**     | `dashboard`                                                                                                 | Aggregated dashboard data                          |
| **Activity**      | `activity`                                                                                                  | User activity log                                  |
| **Notifications** | `notifications/dismiss/[id]`                                                                                | Dismiss notifications                              |
| **System**        | `system/health`, `system/status`                                                                            | Health check, system status                        |

## Development

```bash
# From monorepo root
pnpm dev --filter=api

# Run only this app
cd apps/api && pnpm dev
```

Default port: `3001` (see `next.config.js`).

## Environment Variables

| Variable                        | Description                             |
| ------------------------------- | --------------------------------------- |
| `SUPABASE_URL`                  | Supabase project URL                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service-role key (server-side only)     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key for client validation          |
| `PADDLE_API_KEY`                | Paddle API key                          |
| `PADDLE_WEBHOOK_SECRET`         | Paddle webhook signature secret         |
| `SERANKING_API_KEY`             | SeRanking API key                       |
| `REDIS_URL`                     | Redis connection string (rate limiting) |

## Architecture Notes

- All routes are versioned under `/api/v1/`.
- Auth middleware validates JWTs on protected routes via `@indexnow/auth`.
- Paddle webhooks are verified using signature validation before processing.
- Rate limiting is applied per-IP via Redis with configurable windows.
- Structured logs (pino) are emitted as JSON for production log aggregation.
