# @indexnow/admin

Internal admin dashboard for managing the IndexNow Studio platform. Access is restricted to users with the `super_admin` role.

> Part of the [IndexNow Studio monorepo](../../README.md).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** `@indexnow/ui` shared component library
- **Analytics:** `@indexnow/analytics` tracking package
- **Auth:** Supabase Auth (super_admin role gate)

## Features

- **User Management** — list, view, and manage user accounts and activity
- **Order Management** — view and inspect orders and transactions
- **Analytics Dashboard** — platform-wide analytics and metrics
- **Error Monitoring** — browse and inspect application errors
- **Activity Log** — per-user and global activity history
- **Settings** — site configuration, package management, payment settings

## Key Routes

| Route                | Description              |
| -------------------- | ------------------------ |
| `/`                  | Admin dashboard overview |
| `/users`             | User list and management |
| `/users/[id]`        | User detail / activity   |
| `/orders`            | Order list               |
| `/orders/[id]`       | Order detail             |
| `/analytics`         | Platform analytics       |
| `/errors`            | Error log                |
| `/activity`          | Activity feed            |
| `/settings/site`     | Site settings            |
| `/settings/packages` | Package configuration    |
| `/settings/payments` | Payment gateway settings |
| `/login`             | Admin login              |

## Environment Variables

| Variable                        | Required | Description                                 |
| ------------------------------- | -------- | ------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anonymous key                      |
| `NEXT_PUBLIC_ADMIN_API_URL`     | Yes      | API base URL (e.g. `http://localhost:3001`) |
| `NEXT_PUBLIC_POSTHOG_KEY`       | No       | PostHog project API key                     |
| `NEXT_PUBLIC_POSTHOG_HOST`      | No       | PostHog ingestion host                      |

## Development

```bash
# From monorepo root
pnpm dev --filter=admin

# Run only this app
cd apps/admin && pnpm dev
```

Default port: `3002` (see `next.config.js`).
