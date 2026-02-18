# IndexNow Monorepo

Full-stack SaaS platform for SEO rank tracking and IndexNow URL submission, built as a pnpm + Turborepo monorepo.

## Tech Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| Framework     | Next.js 16 (App Router) / React 19 |
| Language      | TypeScript 5 (strict)              |
| Monorepo      | pnpm 10 workspaces + Turborepo     |
| Database      | Supabase (PostgreSQL)              |
| Cache / Queue | Redis + BullMQ                     |
| Payments      | Paddle                             |
| Analytics     | PostHog, Sentry                    |
| Styling       | Tailwind CSS 4                     |

## Repository Structure

```
apps/
  api/              → API server (Next.js, port 3001)
  admin/            → Admin dashboard (Next.js, port 3002)
  user-dashboard/   → User-facing dashboard (Next.js, port 3000)

packages/
  shared/           → Types, constants, utilities shared across all apps
  ui/               → Shared React components (shadcn/ui based)
  database/         → Supabase client, migrations, DB utilities
  auth/             → Authentication logic & middleware
  services/         → Business logic services
  mail/             → Email templates & sending
  analytics/        → PostHog & analytics instrumentation
  api-middleware/    → Shared API middleware (CORS, rate limiting, logging)
  supabase-client/  → Supabase browser/server client factories
  eslint-config/    → Shared ESLint configuration
  tsconfig/         → Shared TypeScript configurations
```

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 10 (`corepack enable && corepack prepare pnpm@10.28.2 --activate`)
- **Redis** (local or remote, for rate limiting and job queues)
- **Supabase** project (or local via `supabase start`)

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Build all packages
pnpm build

# 4. Start all apps in development
pnpm dev
```

## Development Commands

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `pnpm dev`        | Start all apps in dev mode (Turborepo)           |
| `pnpm build`      | Build all apps and packages                      |
| `pnpm type-check` | Run TypeScript type checking across all packages |
| `pnpm lint`       | Lint all packages                                |
| `pnpm test`       | Run all tests (Vitest)                           |
| `pnpm test:watch` | Run tests in watch mode                          |
| `pnpm format`     | Format code with Prettier                        |
| `pnpm clean`      | Remove all build artifacts and caches            |

## Architecture

### API Design

- All API routes live in `apps/api/src/app/api/v1/`
- Endpoints return `ApiResponse<T>` — a discriminated union of `ApiSuccessResponse<T> | ApiErrorResponse`
- Three layers of rate limiting: global in-memory (Edge middleware), Redis-backed route-level, and per-user quotas

### Package Dependencies

```
apps/* → packages/shared, packages/ui, packages/database, ...
packages/ui → packages/shared, packages/supabase-client
packages/database → packages/shared
packages/auth → packages/shared, packages/database
packages/services → packages/shared, packages/database
```

### Authentication

- Supabase Auth with JWT tokens
- `authenticatedFetch` wrapper for all authenticated API calls
- Admin role-based access control via middleware

## Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable                        | Description                             |
| ------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server-only) |
| `REDIS_URL`                     | Redis connection URL                    |
| `SE_RANKING_API_KEY`            | SE Ranking API key for rank tracking    |
| `PADDLE_API_KEY`                | Paddle payment API key                  |
| `SENTRY_DSN`                    | Sentry error tracking DSN               |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CONVENTIONS.md](CONVENTIONS.md) for guidelines.
