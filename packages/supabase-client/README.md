# @indexnow/supabase-client

Supabase client factory for IndexNow Studio. Provides typed browser and SSR clients using `@supabase/ssr`.

## Key Exports

| Export                         | Description                                 |
| ------------------------------ | ------------------------------------------- |
| `createBrowserClient`          | Create a new Supabase browser client        |
| `getBrowserClient`             | Singleton browser client accessor           |
| `supabaseBrowser` / `supabase` | Default browser client instance             |
| `AuthService`                  | Auth helper (sign in, sign up, sign out)    |
| `authenticatedFetch`           | `fetch` wrapper that injects the JWT header |
| `authenticatedFetchJson`       | Same as above, returns parsed JSON          |

## Usage

```ts
import { supabase, AuthService } from '@indexnow/supabase-client';

const { data } = await supabase.from('indb_auth_user_profiles').select('*');
await AuthService.signOut();
```

## Install

```jsonc
"@indexnow/supabase-client": "workspace:*"
```

See [CONVENTIONS.md](../../CONVENTIONS.md) for code standards.
