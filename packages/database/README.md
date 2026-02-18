# @indexnow/database

Supabase database access layer for IndexNow Studio. Re-exports typed clients, Insert/Update row types, and `DatabaseService` for common queries.

## Subpath Exports

| Subpath                     | Description                                |
| --------------------------- | ------------------------------------------ |
| `@indexnow/database`        | Types, browser client, typed accessors     |
| `@indexnow/database/client` | Client-side only (browser Supabase client) |

## Key Exports

- **Row types** — `UserProfile`, `RankKeywordRow`, `SystemErrorLog`, etc.
- **Insert/Update types** — `InsertUserProfile`, `UpdateUserProfile`, etc.
- **Browser client** — `supabaseBrowser`, `getBrowserClient`
- **Server client** — `supabaseAdmin` (via internal server module)
- **DatabaseService** — Shared query methods for common DB operations
- **JSON helpers** — `toJson` / `fromJson` for safe JSON column handling

## Usage

```ts
import { supabaseBrowser, type UserProfile } from '@indexnow/database';
import { DatabaseService } from '@indexnow/database';
```

## Install

```jsonc
"@indexnow/database": "workspace:*"
```

See [CONVENTIONS.md](../../CONVENTIONS.md) for code standards.
