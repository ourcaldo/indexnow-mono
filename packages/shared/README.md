# @indexnow/shared

Shared types, constants, utilities, and Zod schemas used across the entire IndexNow Studio monorepo.

## Subpath Exports

| Subpath                      | Description                          |
| ---------------------------- | ------------------------------------ |
| `@indexnow/shared`           | Everything (types, constants, utils) |
| `@indexnow/shared/schema`    | Zod validation schemas               |
| `@indexnow/shared/types`     | TypeScript type definitions          |
| `@indexnow/shared/constants` | `ApiEndpoints` and other constants   |
| `@indexnow/shared/utils`     | Utility functions                    |

## Key Exports

- **Types** — `Database`, `UserProfile`, `Json`, `ApiResponse`, `PaginatedResponse`, etc.
- **Constants** — `ApiEndpoints`, `AppConfig`, `USER_ROLES`, `HTTP_STATUS`, `RATE_LIMITS`, `CACHE_KEYS`, etc.
- **Schemas** — `loginSchema`, `registerSchema`, `apiRequestSchemas`, etc.
- **Utils** — `logger`, `formatDate`, `formatNumber`, `truncateString`, `rateLimiter`, `piiSanitizer`, etc.
- **Core** — `formatSuccess`, `formatError`, `ActivityLogger`

## Usage

```ts
import { ApiEndpoints, logger, type UserProfile } from '@indexnow/shared';
import { loginSchema } from '@indexnow/shared/schema';
```

## Install

```jsonc
"@indexnow/shared": "workspace:*"
```

See [CONVENTIONS.md](../../CONVENTIONS.md) for code standards.
