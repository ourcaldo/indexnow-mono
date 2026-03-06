# Task Tracker

## Cleanup: Remove dead `indb_payment_transactions_history` — full removal

**Context**: Table was designed for manual payment flow (bank transfer). Now using Paddle (fully automatic). Table is empty in production despite real transactions existing. All code referencing it is dead weight.

**Decision**: Full cleanup — remove all code, types, schema references, and the DB table itself.

**Lesson applied**: `database.ts` is manually managed (not auto-generated). When removing a dead feature, remove ALL traces.

---

### Phase 1: Delete `usePaymentHistory` hook files (3 files)

These are `'use client'` React hooks that exist in all 3 apps but are **never imported by any component**.

- [ ] **1.1** Delete `apps/api/src/hooks/data/usePaymentHistory.ts` (dead code, wrong app)
- [ ] **1.2** Delete `apps/user-dashboard/src/hooks/data/usePaymentHistory.ts` (never imported)
- [ ] **1.3** Delete `apps/admin/src/hooks/data/usePaymentHistory.ts` (never imported, not in barrel)

### Phase 2: Remove barrel exports (2 files)

- [ ] **2.1** Remove `export { usePaymentHistory } from './data/usePaymentHistory'` from `apps/api/src/hooks/index.ts`
- [ ] **2.2** Remove `export { usePaymentHistory } from './data/usePaymentHistory'` from `apps/user-dashboard/src/hooks/index.ts`
- (admin `hooks/index.ts` does NOT export it — no change needed)

### Phase 3: Remove history INSERT from auto-cancel-job (1 file)

File: `apps/api/src/lib/payment-services/auto-cancel-job.ts`

- [ ] **3.1** Remove the history insert block (~lines 156-176) and the `historyError` check. Keep the transaction status update to `indb_payment_transactions`.

### Phase 4: Remove history SELECT from admin order detail API (1 file)

File: `apps/api/src/app/api/v1/admin/orders/[id]/route.ts`

- [ ] **4.1** Remove the `AdminTransactionHistory` import
- [ ] **4.2** Remove the entire `transactionHistory` variable + `SecureServiceRoleWrapper` read block + error catch
- [ ] **4.3** Change response from `transaction_history: transactionHistory` to `transaction_history: []`

### Phase 5: Remove `AdminTransactionHistory` type + update `AdminOrderDetailResponse` (1 file)

File: `packages/shared/src/types/api/responses/AdminResponses.ts`

- [ ] **5.1** Delete the `AdminTransactionHistory` interface (lines 133-161)
- [ ] **5.2** Change `transaction_history: AdminTransactionHistory[]` to `transaction_history: never[]` in `AdminOrderDetailResponse` (keeps the field for backward compat but signals it's dead)

### Phase 6: Remove table types from `database.ts` (1 file)

File: `packages/shared/src/types/database.ts` — **manually managed**, not auto-generated.

- [ ] **6.1** Remove the entire `indb_payment_transactions_history` block (Row/Insert/Update, lines ~1849-1909)

### Phase 7: Remove table DDL from schema SQL (1 file)

File: `indexnow-dev/database_schema.sql`

- [ ] **7.1** Remove the `CREATE TABLE IF NOT EXISTS indb_payment_transactions_history` block (lines ~223-231)

### Phase 8: Update copilot-instructions.md (1 file)

File: `.github/copilot-instructions.md`

- [ ] **8.1** Remove `indb_payment_transactions_history` from the Database tables list (Payments row)
- [ ] **8.2** Update table count from 30 to 29

### Phase 9: Rebuild shared package + type-check

- [ ] **9.1** Run `pnpm --filter @indexnow/shared build` to regenerate dist
- [ ] **9.2** Run `pnpm type-check` from `indexnow-dev/` to confirm no type errors
- [ ] **9.3** Verify no remaining references with grep

### Phase 10: Commit and push

- [ ] **10.1** Read git skills, commit with conventional message, push

---

### Files changed summary

| # | File | Action |
|---|------|--------|
| 1 | `apps/api/src/hooks/data/usePaymentHistory.ts` | DELETE |
| 2 | `apps/user-dashboard/src/hooks/data/usePaymentHistory.ts` | DELETE |
| 3 | `apps/admin/src/hooks/data/usePaymentHistory.ts` | DELETE |
| 4 | `apps/api/src/hooks/index.ts` | EDIT — remove barrel export |
| 5 | `apps/user-dashboard/src/hooks/index.ts` | EDIT — remove barrel export |
| 6 | `apps/api/src/lib/payment-services/auto-cancel-job.ts` | EDIT — remove history insert |
| 7 | `apps/api/src/app/api/v1/admin/orders/[id]/route.ts` | EDIT — remove history read + import |
| 8 | `packages/shared/src/types/api/responses/AdminResponses.ts` | EDIT — remove type, update response |
| 9 | `packages/shared/src/types/database.ts` | EDIT — remove table definition |
| 10 | `indexnow-dev/database_schema.sql` | EDIT — remove CREATE TABLE |
| 11 | `.github/copilot-instructions.md` | EDIT — remove from table list |

### Files NOT changed (intentionally)

| File | Reason |
|------|--------|
| `apps/admin/src/hooks/index.ts` | Doesn't export the hook |
| `apps/admin/src/app/orders/[id]/page.tsx` | Only uses `activity_history`, not `transaction_history` |

### Risk assessment

- **LOW RISK**: All deleted code is provably dead (never called/imported)
- Table confirmed empty in production
- API shape preserved (field stays as `never[]`)
- No frontend component renders `transaction_history`

### Future: Drop the actual DB table

After this code cleanup ships, run this migration in Supabase:
```sql
DROP TABLE IF EXISTS indb_payment_transactions_history;
```
