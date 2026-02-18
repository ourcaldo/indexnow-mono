-- Migration: 001_atomic_order_activation
-- Issue: A-02 – Non-atomic order status + plan activation
--
-- Adds missing verification-tracking columns to indb_payment_transactions
-- and creates the activate_order_with_plan RPC so that the admin order-status
-- route can update the transaction AND activate the user plan in a single
-- atomic database transaction (no more fragile best-effort rollback).

-- ============================================================
-- 1. Add missing columns to indb_payment_transactions
-- ============================================================
ALTER TABLE indb_payment_transactions
  ADD COLUMN IF NOT EXISTS verified_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- ============================================================
-- 2. Atomic order activation function
-- ============================================================
CREATE OR REPLACE FUNCTION activate_order_with_plan(
  p_transaction_id UUID,
  p_new_status     TEXT,
  p_admin_user_id  UUID,
  p_notes          TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_txn            RECORD;
  v_billing_period TEXT;
  v_expiry_date    TIMESTAMPTZ;
  v_result         JSONB;
BEGIN
  -- 1. Lock the transaction row to prevent concurrent modifications
  SELECT *
    INTO v_txn
    FROM indb_payment_transactions
   WHERE id = p_transaction_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'transaction_not_found');
  END IF;

  -- 2. Prevent updates when the transaction is already in a terminal status
  IF v_txn.status IN ('completed', 'failed') THEN
    RETURN jsonb_build_object(
      'error',          'terminal_status',
      'current_status', v_txn.status
    );
  END IF;

  -- 3. Update the transaction status and verification metadata
  UPDATE indb_payment_transactions
     SET status       = p_new_status,
         verified_by  = p_admin_user_id,
         verified_at  = NOW(),
         processed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE NULL END,
         notes        = COALESCE(p_notes, notes),
         updated_at   = NOW()
   WHERE id = p_transaction_id;

  -- 4. If the new status is 'completed', activate the user's plan
  IF p_new_status = 'completed' THEN
    -- Derive billing_period from transaction metadata (default: monthly)
    v_billing_period := COALESCE(v_txn.metadata ->> 'billing_period', 'monthly');

    v_expiry_date := CASE v_billing_period
      WHEN 'monthly'   THEN NOW() + INTERVAL '1 month'
      WHEN 'quarterly'  THEN NOW() + INTERVAL '3 months'
      WHEN 'biannual'   THEN NOW() + INTERVAL '6 months'
      WHEN 'annual'     THEN NOW() + INTERVAL '1 year'
      ELSE                   NOW() + INTERVAL '1 month'
    END;

    UPDATE indb_auth_user_profiles
       SET package_id              = v_txn.package_id,
           subscription_start_date = NOW(),
           subscription_end_date   = v_expiry_date,
           daily_quota_used        = 0,
           quota_reset_date        = CURRENT_DATE,
           updated_at              = NOW()
     WHERE user_id = v_txn.user_id;
  END IF;

  -- 5. Return the updated transaction row as JSONB
  SELECT to_jsonb(t)
    INTO v_result
    FROM indb_payment_transactions t
   WHERE t.id = p_transaction_id;

  RETURN v_result;
END;
$$;
