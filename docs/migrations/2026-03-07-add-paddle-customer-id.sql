-- Add paddle_customer_id to indb_auth_user_profiles
-- Stores the Paddle customer ID (e.g. ctm_01k920ed8fmmgheg44qqqbvpet)
-- Used to build the customer portal login URL.
-- Populated by the subscription.created webhook processor.

ALTER TABLE indb_auth_user_profiles
ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT DEFAULT NULL;

COMMENT ON COLUMN indb_auth_user_profiles.paddle_customer_id
  IS 'Paddle customer ID, set on first subscription creation via webhook';
