# 📋 Task List: Monorepo Migration (Side-by-Side)

Refactoring `main-old` into a new `indexnow-dev` monorepo workspace.

- [x] **Phase 1: Foundation Setup (`indexnow-dev`)**
    - [x] Create `indexnow-dev` root directory
    - [x] Initialize `pnpm-workspace.yaml` (apps/*, packages/*)
    - [x] Create root `package.json` and `.npmrc`
    - [x] Set up `packages/shared` structure (TS config, package.json)

- [x] **Phase 2: Shared Library Extraction**
    - [x] Copy `shared/schema.ts` to `packages/shared/src/schema.ts`
    - [x] Copy `lib/types` to `packages/shared/src/types`
    - [x] Configure `tsup` build for `@indexnow/shared`
    - [x] Validate shared package build


- [x] **Phase 3: Application Scaffolding**
    - [x] **Database Extraction**
        - [x] Scan `main-old` for table usage and schemas
        - [x] Generate `database_schema.sql` (Cleaned of marketing tables)
        - [x] Create `seeds.sql` (if applicable)
    - [x] **Apps/Web (User Dashboard)**
        - [x] Initialize Next.js app in `apps/web`
        - [x] Install dependencies (React, Tailwind, etc.)
        - [x] Link `@indexnow/shared`
    - [x] **Apps/Admin (Internal Tool)**
        - [x] Initialize Next.js app in `apps/admin`
        - [x] Install dependencies
        - [x] Link `@indexnow/shared`
    - [x] **Apps/API (Backend)**
        - [x] Initialize Next.js app in `apps/api`
        - [x] Install backend dependencies (Supabase, BullMQ, Node-Cron)
        - [x] Link `@indexnow/shared`

- [x] **Phase 4: Code Migration & Adaptation**
    - [x] **Migrate API:** Copy `app/api` & `lib/` -> `apps/api`
        - [x] Fix imports: `@/lib/core` -> API calls
        - [x] Remove middleware rewrites
    - [x] **Migrate Admin:** Copy `app/backend/admin` -> `apps/admin`
        - [x] Fix imports: `@/lib/core` -> API calls
    - [x] **Migrate Web:** Copy `app/dashboard` & `app/login` -> `apps/web`
        - [x] Verify database connections
        - [x] Ensure API routes accept external calls (CORS)

- [ ] **Phase 5: Fix Imports & Build Errors**
    - [x] **API App Fixes** (Mostly Complete)
        - [x] Fix `@/shared/schema` imports to `@indexnow/shared`
        - [x] Verify `@/lib` imports (Valid, mapped to `src/lib`)
    - [/] **Web & Admin App Fixes (Directory Structure Mismatch)**
        - [x] **Contexts:** Move `src/contexts` -> `src/lib/contexts` (Fixes `@/lib/contexts` imports)
        - [x] **Utils:** Ensure `src/lib/utils` exists and is populated
        - [x] **Hooks:** Verify if imports are `@/hooks` or `@/lib/hooks` and move if necessary (Check `apps/user-dashboard`)
        - [ ] **Components:** Verify `@/components` vs `@/components/shared`
    - [ ] **Global Replacements**
        - [ ] Replace `@/shared/schema` -> `@indexnow/shared/schema` (All apps)
        - [ ] Replace `@/lib/types` -> `@indexnow/shared/types` (All apps)
    - [ ] **Iterative Build & Fix**
        - [x] Fix `formatCurrency` signature mismatch (Iterating)
        - [x] Fix `toast()` usage (`message` -> `description`)
        - [x] Fix `phone` vs `phone_number` property access
        - [ ] Run `pnpm build` -> Analyze Log -> Fix path/file -> Repeat

- [ ] **Phase 6: Verification & Testing**
    - [ ] Verify `pnpm build` (all apps pass)
    - [ ] Test Dashboard Login (Standalone)
    - [ ] Test Admin Access (Standalone)
    - [ ] Test API Health Check

- [ ] **Phase 7: Verification & Testing**
    - [ ] Verify `pnpm build` (all apps pass)
    - [ ] Test Dashboard Login (Standalone)
    - [ ] Test Admin Access (Standalone)
    - [ ] Test API Health Check
