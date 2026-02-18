# @indexnow/auth

Authentication utilities for IndexNow Studio. Provides client-safe hooks/context and a separate server-only subpath for admin auth and encryption.

## Subpath Exports

| Subpath                 | Description                                                                |
| ----------------------- | -------------------------------------------------------------------------- |
| `@indexnow/auth`        | Client‑safe: `AuthContext`, `useSessionRefresh`, middleware, error handler |
| `@indexnow/auth/server` | Server‑only: `requireServerAdminAuth`, encryption helpers                  |

## Key Exports

- `AuthContext` / `AuthProvider` — React context for session state
- `useSessionRefresh` — Hook to silently refresh JWT tokens
- `authMiddleware` — Next.js middleware for route protection
- `requireServerAdminAuth` — Server-side admin role validation
- `AdminUser` / `ServerAdminUser` — Type definitions

## Usage

```ts
// Client
import { AuthProvider } from '@indexnow/auth';

// Server
import { requireServerAdminAuth } from '@indexnow/auth/server';
```

## Install

```jsonc
"@indexnow/auth": "workspace:*"
```

**Peer dependency:** `next >=15.0.0`

See [CONVENTIONS.md](../../CONVENTIONS.md) for code standards.
