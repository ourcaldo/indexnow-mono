# @indexnow/tsconfig

Shared TypeScript configuration for the IndexNow Studio monorepo.

## Available Configs

| File          | Description                    |
| ------------- | ------------------------------ |
| `nextjs.json` | Base tsconfig for Next.js apps |

## Usage

Extend in your app or package `tsconfig.json`:

```json
{
  "extends": "@indexnow/tsconfig/nextjs.json",
  "compilerOptions": {
    "outDir": "dist"
  }
}
```

## Install

```jsonc
"@indexnow/tsconfig": "workspace:*"
```

See [CONVENTIONS.md](../../CONVENTIONS.md) for code standards.
