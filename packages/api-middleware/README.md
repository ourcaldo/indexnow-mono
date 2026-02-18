# @indexnow/api-middleware

API route wrappers and middleware for Next.js route handlers. Provides request logging, CORS handling, and authenticated/admin route guards.

## Exports

| Export                    | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `requestLogger`           | Middleware that logs request method/url/timing |
| `corsMiddleware`          | CORS origin validation middleware              |
| `publicApiWrapper`        | Wrapper for unauthenticated API routes         |
| `authenticatedApiWrapper` | Wrapper requiring a valid JWT                  |
| `adminApiWrapper`         | Wrapper requiring `super_admin` role           |

## Usage

```ts
import { authenticatedApiWrapper } from '@indexnow/api-middleware';

export const GET = authenticatedApiWrapper(async (req, { userId }) => {
  // userId is guaranteed to exist
});
```

## Install

Workspace dependency — already available via `pnpm`:

```jsonc
"@indexnow/api-middleware": "workspace:*"
```

**Peer dependency:** `next >=15.0.0`

See [CONVENTIONS.md](../../CONVENTIONS.md) for code standards.
