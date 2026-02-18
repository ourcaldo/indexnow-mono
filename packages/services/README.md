# @indexnow/services

Business-logic service layer for IndexNow Studio. Contains domain services used by the API app.

## Key Exports

| Export                  | Description                                 |
| ----------------------- | ------------------------------------------- |
| `RankTrackingService`   | Keyword CRUD, rank checks, history queries  |
| `UserManagementService` | User profile operations, admin user queries |

## Usage

```ts
import { RankTrackingService } from '@indexnow/services';

const keywords = await RankTrackingService.getKeywords(userId);
```

## Install

```jsonc
"@indexnow/services": "workspace:*"
```

See [CONVENTIONS.md](../../CONVENTIONS.md) for code standards.
