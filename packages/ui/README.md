# @indexnow/ui

Full UI component library for IndexNow Studio. Built on Radix UI, Tailwind CSS, and `class-variance-authority`.

## Subpath Exports

| Subpath                        | Description                              |
| ------------------------------ | ---------------------------------------- |
| `@indexnow/ui`                 | All components, hooks, providers, utils  |
| `@indexnow/ui/primitives`      | Base UI primitives (Button, Input, etc.) |
| `@indexnow/ui/admin`           | Admin-specific components                |
| `@indexnow/ui/auth`            | Auth forms and components                |
| `@indexnow/ui/billing`         | Billing & plan components                |
| `@indexnow/ui/checkout`        | Checkout flow components                 |
| `@indexnow/ui/dashboard`       | Dashboard widgets and layouts            |
| `@indexnow/ui/modals`          | Modal/dialog components                  |
| `@indexnow/ui/settings`        | Settings page components                 |
| `@indexnow/ui/trial`           | Trial-related components                 |
| `@indexnow/ui/hooks`           | Shared React hooks                       |
| `@indexnow/ui/providers`       | Context providers                        |
| `@indexnow/ui/contexts`        | React contexts                           |
| `@indexnow/ui/utils`           | `cn()` and Tailwind merge utilities      |
| `@indexnow/ui/styles.css`      | Global stylesheet                        |
| `@indexnow/ui/tailwind.config` | Shared Tailwind config                   |

## Usage

```tsx
import { Button, Input } from '@indexnow/ui/primitives';
import { DashboardLayout } from '@indexnow/ui/dashboard';
import '@indexnow/ui/styles.css';
```

## Install

```jsonc
"@indexnow/ui": "workspace:*"
```

See [CONVENTIONS.md](../../CONVENTIONS.md) for code standards.
