# 🏗️ Implementation Plan - Side-by-Side Monorepo Migration

**Goal:** Create a new scalable monorepo structure in `indexnow-dev` and migrate the monolithic code from `main-old` into three separate, independently deployable applications for User Dashboard, Admin Dashboard, and API.

**Constraint:** Do NOT modify `main-old`. Use it as a read-only source.

## User Review Required
> [!IMPORTANT]
> **New Directory:** All work will be done in `c:\Users\Administrator\Desktop\indexnow-main\indexnow-dev`.
> **Routing Change:** We are removing `middleware.ts` domain rewriting.
> - **OLD:** `dashboard.domain.com` -> Middleware Rewrite -> `/dashboard` folder
> - **NEW:** `dashboard.domain.com` -> DNS -> `apps/web` server (Root folder)

## Proposed Architecture

```text
indexnow-main/
├── main-old/                # [READ-ONLY SOURCE]
└── indexnow-dev/            # [NEW MONOREPO ROOT]
    ├── pnpm-workspace.yaml
    ├── package.json
    ├── apps/
    │   ├── web/             # USER DASHBOARD (Next.js)
    │   │                    # Port: 3000
    │   │
    │   ├── admin/           # ADMIN DASHBOARD (Next.js)
    │   │                    # Port: 3001
    │   │
    │   └── api/             # BACKEND CORE (Next.js)
    │                        # Port: 3002
    │
    └── packages/
        └── shared/          # SHARED CODE
                             # Schemas, Types, UI Constants
```

## Step-by-Step Plan

### Phase 1: Foundation Setup (`indexnow-dev`)
1. Create root directory `indexnow-dev`.
2. Initialize `pnpm` workspace configuration (`pnpm-workspace.yaml`).
3. Create root `package.json` with scripts to manage all apps (`dev`, `build`, `lint`).
4. Create `.npmrc` to handle dependency hoisting correctly for Next.js 15.

### Phase 2: The "Shared Brain" (`packages/shared`)
1. Create `packages/shared`.
2. **Migrate Schema:** Copy `main-old/shared/schema.ts` to `packages/shared/src/schema.ts`.
3. **Migrate Types:** Copy `main-old/lib/types` to `packages/shared/src/types`.
4. Configure `tsup` to build this package so other apps can import it as `@indexnow/shared`.

### Phase 3: Database & Application Scaffolding

#### 1. Database Extraction (First Priority)
1. Scan `main-old` for all Supabase table usage.
2. Generate `database_schema.sql` (Cleaned).
3. Verify no marketing tables remain.

#### 2. Initialize Applications
Initialize three empty Next.js applications with correct configurations.

#### 3. Apps/Web (User Dashboard)
- Initialize Next.js app in `apps/web`.
- Install UI dependencies (`tailwindcss`, `radix-ui`, `framer-motion`).
- Link `@indexnow/shared` using `link:` protocol.

#### 2. Apps/Admin (Internal Tool)
- Initialize Next.js app in `apps/admin`.
- Install Admin-specific deps.
- Link `@indexnow/shared`.

#### 3. Apps/API (The Engine)
- Initialize Next.js app in `apps/api`.
- Install Backend deps (`supabase-js`, `bullmq`, `node-cron`, `stripe`).
- Link `@indexnow/shared`.

### Phase 4: Code Migration (The Lift & Shift)

#### 1. Migrate API (First Priority)
- Copy `main-old/lib` (except types) to `apps/api/lib`.
- Copy `main-old/app/api` to `apps/api/app/api`.
- **Key Task:** Ensure `DatabaseConfig` and `AppConstants` are correctly placed.

#### 2. Web App (`apps/user-dashboard`)
- **Critical:** Remove ALL direct `@/lib/` imports
  - App should NOT import database/service code directly
  - Replace with API calls using `fetch` or React Query
- Fix `@/components` → local `./components` or `../components`
- Fix `@/shared/schema` → `@indexnow/shared`

#### 3. Admin App (`apps/admin`)
- Same as User Dashboard: Remove direct `@/lib/` imports
- Point to API endpoints instead
- Fix component and schema imports

#### 4. tsconfig.json Updates
Each app needs proper path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@indexnow/shared": ["../../packages/shared/dist"]
    }
  }
}
```

#### 5. Build Validation
- Run `pnpm -r --filter api build` → Fix errors
- Run `pnpm -r --filter user-dashboard build` → Fix errors
- Run `pnpm -r --filter admin build` → Fix errors

### Phase 5: Fix Imports & Build Errors
This phase addresses specific directory structure mismatches identified during the initial build attempts.

#### 1. Known Build Errors (From `web_build_log.txt`)
- **Error:** `Module not found: Can't resolve '@/lib/contexts/AuthContext'`
    - **Cause:** Files copied to `src/contexts`, but code imports from `@/lib/contexts`.
    - **Fix:** Move `src/contexts` → `src/lib/contexts`.
- **Error:** `Module not found: Can't resolve '@/lib/analytics'`
    - **Cause:** Missing folder.
    - **Fix:** Copy `lib/analytics` (Already done, verification needed).
- **Error:** `Module not found: Can't resolve '@/shared/schema'`
    - **Cause:** Old monorepo import path.
    - **Fix:** Global replace `@/shared/schema` → `@indexnow/shared/schema`.

#### 2. Structural Fixes (User Dashboard & Admin)
We will align the directory structure to match the legacy imports to minimize code rewriting:
- **Contexts:** Move `apps/user-dashboard/src/contexts` → `apps/user-dashboard/src/lib/contexts`
- **Utils:** Ensure `src/lib/utils` acts as the root for `@/lib/utils`
- **Hooks:** Verify if existing imports use `@/lib/hooks` or `@/hooks`. Move `src/hooks` to `src/lib/hooks` if necessary.

#### 3. Iterative Build Process
1. Run `pnpm -r --filter user-dashboard build`
2. Analyze `stderr` for "Module not found" or "Type error"
3. Apply fix (Move folder / Copy missing file / Fix import)
4. Repeat until clean build
5. Apply successful patterns to `apps/admin`

### Phase 6: Verification & Testing
1. **Ports:** Configure `next.config.ts` to run apps on different ports (3000, 3001, 3002).
2. **Env Vars:** Create `.env.local` for each app using `main-old` values.
3. **Build Check:** Run `pnpm build` from root to confirm all 3 apps build successfully.

## Verification Plan
- [ ] **Build:** Run `pnpm build` at root. Expect 3 successful Next.js builds.
- [ ] **Shared:** Verify `@indexnow/shared` works by importing a schema in a test file.
- [ ] **Runtime:** Start all apps (`pnpm dev`).
    - Visit `localhost:3000` -> Should see User Login.
    - Visit `localhost:3001` -> Should see Admin Login.
    - Visit `localhost:3002/api/health` -> Should return 200 OK.
