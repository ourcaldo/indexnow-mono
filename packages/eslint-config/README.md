# @indexnow/eslint-config

Shared ESLint flat-config presets for the IndexNow Studio monorepo.

## Available Configs

| Export                            | Description                            |
| --------------------------------- | -------------------------------------- |
| `@indexnow/eslint-config/base`    | Base rules for all TypeScript packages |
| `@indexnow/eslint-config/next`    | Adds Next.js-specific rules            |
| `@indexnow/eslint-config/library` | Rules for publishable library packages |

## Usage

```js
// eslint.config.mjs
import base from '@indexnow/eslint-config/base';

export default [...base];
```

## Install

```jsonc
"@indexnow/eslint-config": "workspace:*"
```

**Peer dependencies:** `eslint ^9`, `typescript ^5`

See [CONVENTIONS.md](../../CONVENTIONS.md) for code standards.
