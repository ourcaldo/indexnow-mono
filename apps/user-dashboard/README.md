# @indexnow/user-dashboard

The user-facing dashboard for IndexNow Studio. Authenticated users manage keyword rank tracking, domains, and billing from here.

> Part of the [IndexNow Studio monorepo](../../README.md).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Data Fetching:** React Query (TanStack Query)
- **UI:** `@indexnow/ui` shared component library
- **Auth:** Supabase Auth (session-based)

## Features

- **Dashboard Home** — overview of tracked keywords, rank changes, and domain stats
- **Rank Tracking** — add/remove keywords, view rank history and weekly trends
- **Domain Management** — manage monitored domains
- **Billing & Plans** — view current plan, upgrade/downgrade, payment history
- **Settings** — profile, general preferences, plan management

## Key Routes

| Route                                       | Description                     |
| ------------------------------------------- | ------------------------------- |
| `/`                                         | Dashboard overview              |
| `/settings`                                 | Settings hub                    |
| `/settings/profile`                         | Profile management              |
| `/settings/general`                         | General preferences             |
| `/settings/plans-billing`                   | Current plan & billing overview |
| `/settings/plans-billing/plans`             | Available plans                 |
| `/settings/plans-billing/checkout`          | Plan checkout                   |
| `/settings/plans-billing/history`           | Payment history                 |
| `/settings/plans-billing/orders/[order_id]` | Order detail                    |
| `/login`                                    | User login                      |
| `/register`                                 | New account registration        |
| `/resend-verification`                      | Resend email verification       |

## Development

```bash
# From monorepo root
pnpm dev --filter=user-dashboard

# Run only this app
cd apps/user-dashboard && pnpm dev
```

Default port: `3000` (see `next.config.js`).
