# Contributing

## Prerequisites

| Tool     | Version                   |
| -------- | ------------------------- |
| Node.js  | >= 18                     |
| pnpm     | >= 10.0.0                 |
| Docker   | Latest (for Redis)        |
| Supabase | Project with Auth enabled |

## Getting Started

```bash
# 1. Clone the repo
git clone <repo-url>
cd indexnow-dev

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Fill in the required values (Supabase URL/keys, Redis URL, Paddle keys, etc.)

# 4. Start Redis
docker compose up redis -d

# 5. Start all apps in dev mode
pnpm dev
```

## Development Workflow

### Running Apps

`pnpm dev` starts all three apps simultaneously via Turborepo:

| App            | Port | Filter command                     |
| -------------- | ---- | ---------------------------------- |
| User Dashboard | 3000 | `pnpm dev --filter=user-dashboard` |
| API            | 3001 | `pnpm dev --filter=api`            |
| Admin          | 3002 | `pnpm dev --filter=admin`          |

To run a single app, use the `--filter` flag:

```bash
pnpm dev --filter=api
```

### Hot Reload

All apps use Next.js / Express dev servers with hot reload. Changes to shared packages are picked up automatically via Turborepo's dependency graph.

## Project Structure

```
indexnow-dev/
├── apps/
│   ├── admin/          # Admin dashboard (Next.js, port 3002)
│   ├── api/            # REST API server (Next.js API routes, port 3001)
│   └── user-dashboard/ # End-user dashboard (Next.js, port 3000)
├── packages/
│   ├── analytics/      # Analytics utilities
│   ├── api-middleware/  # Route wrappers (publicRoute, authenticatedRoute, adminRoute)
│   ├── auth/           # Auth helpers and session management
│   ├── database/       # Drizzle ORM schema and queries
│   ├── eslint-config/  # Shared ESLint configuration
│   ├── mail/           # Email sending (templates + transport)
│   ├── services/       # Business logic services
│   ├── shared/         # Shared types, constants, and utilities
│   ├── supabase-client/# Supabase client factory
│   ├── tsconfig/       # Shared TypeScript configs
│   └── ui/             # Shared UI components (shadcn/ui based)
├── database-schema/    # SQL migrations
├── turbo.json          # Turborepo pipeline config
└── pnpm-workspace.yaml # pnpm workspace definition
```

## Available Scripts

Run from the repo root:

| Script     | Command           | Description                                          |
| ---------- | ----------------- | ---------------------------------------------------- |
| Dev        | `pnpm dev`        | Start all apps in development mode                   |
| Build      | `pnpm build`      | Build all apps and packages                          |
| Lint       | `pnpm lint`       | Run ESLint across the monorepo                       |
| Type-check | `pnpm type-check` | Run `tsc --noEmit` across all packages               |
| Test       | `pnpm test`       | Run Vitest test suites                               |
| Clean      | `pnpm clean`      | Remove `node_modules`, `.next`, and `dist` artifacts |
| Format     | `pnpm format`     | Run Prettier on all files                            |

## Code Conventions

See [CONVENTIONS.md](CONVENTIONS.md) for the full style guide. Key points:

- TypeScript strict mode everywhere — no `as any`.
- Named exports only; no default exports.
- Barrel files (`index.ts`) in every package for public API.
- Use `@repo/<package>` import aliases for cross-package imports.
- Server Components by default in Next.js apps; mark `"use client"` only when needed.

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) prefixes:

```
feat:     New feature
fix:      Bug fix
refactor: Code change that neither fixes a bug nor adds a feature
docs:     Documentation only
chore:    Build process or tooling changes
test:     Adding or updating tests
perf:     Performance improvement
```

Examples:

```
feat(api): add rate limiting to billing endpoints
fix(admin): correct user activity query pagination
docs: update API reference with new paddle routes
```

For versioning, use **changesets** (`pnpm changeset`) when your change affects a published package.

## PR Checklist

Before opening a pull request, verify:

- [ ] `pnpm type-check` passes with no errors
- [ ] `pnpm lint` passes with no warnings
- [ ] No new `as any` casts introduced
- [ ] `pnpm build` completes successfully
- [ ] Tests pass (`pnpm test`) if applicable
- [ ] Commit messages follow the convention above
- [ ] Changeset added if a package's public API changed
