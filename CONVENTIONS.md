# IndexNow Studio — Code Conventions

## File Naming

| Directory | Convention | Example |
|-----------|-----------|---------|
| `packages/*/src/` (general) | PascalCase for classes/services | `QuotaService.ts`, `PaymentProcessor.ts` |
| `packages/*/src/hooks/` | camelCase (`use` prefix) | `useActivityLogger.ts`, `useSiteSettings.ts` |
| `packages/ui/src/components/` (root) | kebab-case | `admin-sidebar.tsx`, `loading-spinner.tsx` |
| `packages/ui/src/components/` (subdirs) | PascalCase | `TrialOptions.tsx`, `ErrorDetailModal.tsx` |
| `packages/shared/src/types/` | PascalCase | `RankTrackingTypes.ts`, `PaymentTypes.ts` |
| `packages/shared/src/constants/` | PascalCase | `ApiEndpoints.ts`, `AppConfig.ts` |
| `apps/*/src/app/` | kebab-case (Next.js convention) | `plans-billing/`, `test-backend/` |

## Route Colocation

Routes follow a **flat-by-default** structure. Colocated `components/` or `hooks/` subdirectories within routes are allowed when:

- The component is only used by that specific route
- The route is complex enough to warrant splitting (e.g., tabbed layouts, multi-step flows)

Routes that are simple enough to fit in a single `page.tsx` should remain flat.

## Package Boundaries

| Package | Contains | Does NOT contain |
|---------|----------|-----------------|
| `@indexnow/shared` | Types, constants, utils, configs | React components, hooks, DB clients |
| `@indexnow/ui` | React components, hooks, styles | Business logic, DB operations |
| `@indexnow/database` | DB clients, server-only hooks | React components, API fetch logic |
| `@indexnow/auth` | Auth middleware, helpers | UI components |
| `@indexnow/services` | Business logic services | React code |
| `@indexnow/mail` | Email service | React code |

## Import Rules

- Apps import from package barrels: `import { X } from '@indexnow/shared'`
- Packages import from each other's barrels, never deep paths
- Within a package, use relative imports
