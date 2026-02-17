-- ============================================================
-- IndexNow Studio - Complete Database Schema
-- ============================================================
-- Generated: 2026-01-25
-- Purpose: Complete Supabase PostgreSQL schema for IndexNow Studio
-- Note: Marketing/frontpage tables have been excluded
-- ============================================================

-- ============================================================
-- UTILITY FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PAYMENT SYSTEM (must be created before user_profiles due to FK)
-- ============================================================

-- Payment gateways configuration
CREATE TABLE IF NOT EXISTS indb_payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  -- DESIGN NOTE (#238): To enforce exactly one is_default = TRUE gateway, add a partial unique index:
  -- CREATE UNIQUE INDEX idx_payment_gateways_single_default ON indb_payment_gateways (is_default) WHERE is_default = TRUE AND deleted_at IS NULL;
  -- Omitted for now as application logic handles this during gateway setup.
  is_default BOOLEAN DEFAULT FALSE,
  api_credentials JSONB,
  configuration JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER update_payment_gateways_updated_at
BEFORE UPDATE ON indb_payment_gateways
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Payment packages/plans
CREATE TABLE IF NOT EXISTS indb_payment_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  billing_period VARCHAR(20) DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual', 'lifetime', 'one-time')),
  
  -- Quota limits
  daily_quota INTEGER NOT NULL,
  monthly_quota INTEGER,
  quota_limits JSONB, -- For granular limits like keywords, jobs, etc.
  
  -- Features
  features JSONB,
  pricing_tiers JSONB, -- For flexible pricing (monthly/annual)
  free_trial_enabled BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  
  -- External IDs (Paddle, Stripe, etc.)
  paddle_price_id VARCHAR(100),
  stripe_price_id VARCHAR(100),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER update_payment_packages_updated_at
BEFORE UPDATE ON indb_payment_packages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CORE AUTHENTICATION & USER MANAGEMENT
-- ============================================================

-- User profiles (extends Supabase auth.users)
-- DESIGN NOTE (#212): Quota/subscription fields on profiles are denormalized from subscriptions
-- table for fast access. A trigger or application logic should sync these values when
-- subscriptions change. Consider adding a sync trigger for production robustness.
CREATE TABLE IF NOT EXISTS indb_auth_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  phone_number VARCHAR(50),
  country VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  email_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  
  -- Subscription & Quota
  package_id UUID REFERENCES indb_payment_packages(id),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  daily_quota_limit INTEGER DEFAULT 100,
  daily_quota_used INTEGER DEFAULT 0,
  quota_reset_date DATE,
  
  -- Account Status
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  is_trial_active BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMPTZ,
  suspension_reason TEXT,
  suspended_at TIMESTAMPTZ,
  
  -- Login Metadata
  last_login_at TIMESTAMPTZ,
  last_login_ip VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON indb_auth_user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON indb_auth_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON indb_auth_user_profiles(role);

-- User settings/preferences
CREATE TABLE IF NOT EXISTS indb_auth_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- API Settings
  timeout_duration INTEGER DEFAULT 30000,
  retry_attempts INTEGER DEFAULT 3,
  
  -- Notification Preferences
  email_job_completion BOOLEAN DEFAULT TRUE,
  email_job_failure BOOLEAN DEFAULT TRUE,
  email_quota_alerts BOOLEAN DEFAULT TRUE,
  email_daily_report BOOLEAN DEFAULT FALSE,
  
  -- Defaults
  default_schedule VARCHAR(20) DEFAULT 'one-time',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON indb_auth_user_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- idx_user_settings_user_id removed: user_id UNIQUE constraint already creates an implicit index

-- Payment transactions
CREATE TABLE IF NOT EXISTS indb_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  package_id UUID REFERENCES indb_payment_packages(id),
  gateway_id UUID REFERENCES indb_payment_gateways(id),
  
  -- Transaction details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'proof_uploaded', 'completed', 'failed', 'cancelled', 'refunded')),
  
  -- External references
  external_transaction_id VARCHAR(255),
  payment_method VARCHAR(50),
  
  -- Proof of payment
  proof_url TEXT,
  
  -- Metadata
  metadata JSONB,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON indb_payment_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_transactions_user ON indb_payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON indb_payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_package ON indb_payment_transactions(package_id);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway ON indb_payment_transactions(gateway_id);

-- Transaction history/audit
CREATE TABLE IF NOT EXISTS indb_payment_transactions_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES indb_payment_transactions(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_history_tid ON indb_payment_transactions_history(transaction_id);

-- Enable RLS on transactions_history (SECURITY: prevent unauthorized access to audit trail)
ALTER TABLE indb_payment_transactions_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transaction history" ON indb_payment_transactions_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM indb_payment_transactions pt
      WHERE pt.id = indb_payment_transactions_history.transaction_id
      AND pt.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transaction history" ON indb_payment_transactions_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM indb_auth_user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage transaction history" ON indb_payment_transactions_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM indb_auth_user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- User subscriptions
CREATE TABLE IF NOT EXISTS indb_payment_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  package_id UUID REFERENCES indb_payment_packages(id),
  
  -- Subscription status
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'paused', 'trialing', 'expired')),
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- External IDs
  paddle_subscription_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  
  -- Cancellation details
  cancel_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_payment_subscriptions_updated_at
BEFORE UPDATE ON indb_payment_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON indb_payment_subscriptions(user_id);

-- Paddle-specific transaction data
CREATE TABLE IF NOT EXISTS indb_paddle_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES indb_payment_transactions(id) ON DELETE CASCADE,
  paddle_transaction_id VARCHAR(100) NOT NULL,
  paddle_subscription_id VARCHAR(100),
  paddle_customer_id VARCHAR(100),
  
  -- Event data
  event_type VARCHAR(100),
  event_data JSONB,
  
  -- Status
  status VARCHAR(50),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_paddle_transactions_updated_at
BEFORE UPDATE ON indb_paddle_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_paddle_transactions_paddle_id ON indb_paddle_transactions(paddle_transaction_id);
CREATE INDEX IF NOT EXISTS idx_paddle_transactions_transaction_id ON indb_paddle_transactions(transaction_id);

-- Paddle webhook events log
CREATE TABLE IF NOT EXISTS indb_paddle_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(100) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paddle_webhooks_event_type ON indb_paddle_webhook_events(event_type);

-- ============================================================
-- KEYWORD TRACKING & RANK MONITORING
-- ============================================================

-- Keyword countries (reference data for supported countries)
-- Must be created before keyword_bank and keyword_rankings due to FK references
CREATE TABLE IF NOT EXISTS indb_keyword_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso2_code VARCHAR(2) NOT NULL UNIQUE,
  iso3_code VARCHAR(3),
  numeric_code VARCHAR(3),
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_keyword_countries_updated_at
BEFORE UPDATE ON indb_keyword_countries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Keyword bank (global SEO data cache - NOT per-user)
-- Used to cache SeRanking API results for keyword intelligence
CREATE TABLE IF NOT EXISTS indb_keyword_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword VARCHAR(500) NOT NULL,
  country_id UUID REFERENCES indb_keyword_countries(id) ON DELETE SET NULL,
  language_code VARCHAR(10) DEFAULT 'en',
  
  -- SEO Data (from SeRanking API)
  is_data_found BOOLEAN DEFAULT FALSE,
  volume INTEGER,
  cpc DECIMAL(10, 2),
  competition DECIMAL(5, 2),
  difficulty INTEGER,
  history_trend JSONB,
  keyword_intent VARCHAR(50),
  
  -- Cache metadata
  data_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint for cache lookup (keyword + country)
  UNIQUE(keyword, country_id)
);

CREATE TRIGGER update_keyword_bank_updated_at
BEFORE UPDATE ON indb_keyword_bank
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- idx_keyword_bank_lookup removed: UNIQUE(keyword, country_id) constraint already creates an implicit index
CREATE INDEX IF NOT EXISTS idx_keyword_bank_updated ON indb_keyword_bank(data_updated_at);


-- Keyword domains
CREATE TABLE IF NOT EXISTS indb_keyword_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keyword_domains_user ON indb_keyword_domains(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_keyword_domains_user_domain ON indb_keyword_domains(user_id, domain);


-- Rank keywords (user's tracked keywords for rank monitoring)
CREATE TABLE IF NOT EXISTS indb_rank_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  domain TEXT,
  device VARCHAR(20) DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile', 'tablet')),
  country VARCHAR(10),
  
  -- Tracking configuration
  search_engine VARCHAR(50) DEFAULT 'google',
  target_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  tags TEXT[],
  
  -- Current rank position
  position INTEGER,
  previous_position INTEGER,
  last_checked TIMESTAMPTZ,
  
  -- Link to SEO data cache (JOIN for search_volume, cpc, difficulty, etc.)
  keyword_bank_id UUID REFERENCES indb_keyword_bank(id) ON DELETE SET NULL,
  intelligence_updated_at TIMESTAMPTZ,
  
  -- DESIGN NOTE (#218): country here is a free-text shortcode (e.g., 'US') for quick display.
  -- For referential integrity, use keyword_bank.country_id → indb_keyword_countries FK.
  -- DESIGN NOTE (#227): domain here is free-text. For verified domains, cross-reference
  -- indb_keyword_domains table via (user_id, domain) lookup.
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_rank_keywords_updated_at
BEFORE UPDATE ON indb_rank_keywords
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_rank_keywords_user ON indb_rank_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_keywords_active ON indb_rank_keywords(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_rank_keywords_needs_enrichment ON indb_rank_keywords(keyword_bank_id) WHERE keyword_bank_id IS NULL AND is_active = TRUE;

-- Keyword rankings (historical rank position snapshots per check)
-- Each rank check creates a new record for historical tracking
-- SCALABILITY NOTE: This table grows unboundedly (one row per keyword per check).
-- At scale (>10M rows), consider:
--   1. Range partitioning by check_date (monthly/quarterly partitions)
--      e.g., CREATE TABLE indb_keyword_rankings (...) PARTITION BY RANGE (check_date);
--   2. Automated partition management with pg_partman
--   3. Archiving old partitions to cold storage after 12-24 months
--   4. Materialized views for aggregated historical stats (weekly/monthly averages)
CREATE TABLE IF NOT EXISTS indb_keyword_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES indb_rank_keywords(id) ON DELETE CASCADE,
  position INTEGER,
  url TEXT,
  -- DESIGN NOTE (#213): search_volume and difficulty_score are snapshotted per ranking check
  -- for historical accuracy. Canonical values live on indb_keyword_bank (joined via rank_keywords.keyword_bank_id).
  search_volume INTEGER,
  difficulty_score INTEGER,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  device_type VARCHAR(50) CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  country_id UUID REFERENCES indb_keyword_countries(id) ON DELETE SET NULL,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_keyword_rankings_updated_at
BEFORE UPDATE ON indb_keyword_rankings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- idx_keyword_rankings_keyword removed: subsumed by composite idx_keyword_rankings_keyword_date
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_date ON indb_keyword_rankings(check_date DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_keyword_date ON indb_keyword_rankings(keyword_id, check_date DESC);


-- ============================================================
-- SITE INTEGRATION & SETTINGS
-- ============================================================


-- Site integration (connected sites/domains AND system integrations)
-- user_id NULL = system-wide integration (e.g., SeRanking API config)
-- user_id NOT NULL = per-user domain integration
CREATE TABLE IF NOT EXISTS indb_site_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain VARCHAR(255),
  integration_type VARCHAR(50),
  
  -- API Configuration
  service_name VARCHAR(100),
  api_key TEXT,
  api_url TEXT,
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  health_status VARCHAR(50) DEFAULT 'unknown',
  last_health_check TIMESTAMPTZ,
  
  -- Quota tracking (for SeRanking etc.)
  api_quota_limit INTEGER DEFAULT 10000,
  api_quota_used INTEGER DEFAULT 0,
  quota_reset_date TIMESTAMPTZ,
  
  -- Settings
  settings JSONB,
  rate_limits JSONB,
  alert_settings JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_site_integration_updated_at
BEFORE UPDATE ON indb_site_integration
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_site_integration_user ON indb_site_integration(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_site_integration_service ON indb_site_integration(service_name) WHERE service_name IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_integration_service_unique ON indb_site_integration(service_name) WHERE user_id IS NULL;


-- Site settings (global application settings)
CREATE TABLE IF NOT EXISTS indb_site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name VARCHAR(255),
  site_tagline VARCHAR(500),
  site_description TEXT,
  site_logo_url TEXT,
  white_logo TEXT,
  site_icon_url TEXT,
  site_favicon_url TEXT,
  contact_email VARCHAR(255),
  support_email VARCHAR(255),
  maintenance_mode BOOLEAN DEFAULT FALSE,
  registration_enabled BOOLEAN DEFAULT TRUE,
  default_package_id UUID REFERENCES indb_payment_packages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Single-row enforcement: prevent multiple site_settings rows
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_settings_singleton ON indb_site_settings ((TRUE));

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON indb_site_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- NOTIFICATIONS & ACTIVITY
-- ============================================================

-- User notifications
CREATE TABLE IF NOT EXISTS indb_notifications_dashboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON indb_notifications_dashboard(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON indb_notifications_dashboard(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON indb_notifications_dashboard(user_id, created_at DESC);

-- Admin activity logs
CREATE TABLE IF NOT EXISTS indb_admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON indb_admin_activity_logs(admin_id);

-- Admin user summary (dashboard aggregations)
CREATE TABLE IF NOT EXISTS indb_admin_user_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  paying_users INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_admin_user_summary_updated_at
BEFORE UPDATE ON indb_admin_user_summary
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SECURITY & AUDIT
-- ============================================================

-- Security activity logs
CREATE TABLE IF NOT EXISTS indb_security_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  details JSONB,
  severity VARCHAR(20) DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_activity_user ON indb_security_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_activity_event ON indb_security_activity_logs(event_type);

-- Security audit logs (for service role operations)
CREATE TABLE IF NOT EXISTS indb_security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  operation VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  reason TEXT,
  source VARCHAR(50),
  ip_address VARCHAR(50),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON indb_security_audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON indb_security_audit_logs(user_id);

-- System error logs
CREATE TABLE IF NOT EXISTS indb_system_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'error' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  user_message TEXT,
  stack_trace TEXT,
  endpoint VARCHAR(255),
  http_method VARCHAR(10),
  status_code INTEGER,
  request_data JSONB,
  metadata JSONB,
  
  -- Resolution tracking
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON indb_system_error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON indb_system_error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON indb_system_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON indb_system_error_logs(created_at DESC) WHERE resolved_at IS NULL;


-- ============================================================
-- SERANKING MONITORING (External API Integration)
-- ============================================================

-- SeRanking usage logs
CREATE TABLE IF NOT EXISTS indb_seranking_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- DESIGN NOTE (#224): integration_id is VARCHAR for flexibility with external IDs.
  -- If only internal UUIDs are used, consider changing to UUID FK to indb_site_integration.
  integration_id VARCHAR(100),
  operation VARCHAR(100) NOT NULL,
  operation_type VARCHAR(100),
  keywords_count INTEGER,
  quota_used INTEGER,
  request_count INTEGER DEFAULT 1,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  status VARCHAR(50),
  error_message TEXT,
  metadata JSONB,
  -- DESIGN NOTE (#236): date, timestamp, and created_at are intentionally separate:
  -- date = calendar day for aggregation, timestamp = event precision, created_at = audit.
  date DATE DEFAULT CURRENT_DATE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seranking_usage_user ON indb_seranking_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_seranking_usage_created ON indb_seranking_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seranking_usage_integration ON indb_seranking_usage_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_seranking_usage_date ON indb_seranking_usage_logs(date);


-- SeRanking raw metrics
-- SCALABILITY NOTE (#222): High-growth table. At scale, consider:
--   1. Range partitioning by timestamp (monthly)
--   2. Automated cleanup of records older than 30-90 days
--   3. Materialized views for aggregated historical stats
CREATE TABLE IF NOT EXISTS indb_seranking_metrics_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- DESIGN NOTE (#237): timestamp is the metric event time, created_at is the DB insert time.
  -- Both are kept for accuracy in async/batched metric ingestion.
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL DEFAULT 'POST',
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'timeout', 'rate_limited')),
  duration_ms INTEGER NOT NULL,
  request_size INTEGER,
  response_size INTEGER,
  cache_hit BOOLEAN NOT NULL DEFAULT FALSE,
  error_type VARCHAR(50),
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quota_remaining INTEGER,
  rate_limit_remaining INTEGER,
  retry_attempt INTEGER DEFAULT 0,
  country_code VARCHAR(5),
  keyword_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seranking_metrics_raw_timestamp ON indb_seranking_metrics_raw(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_seranking_metrics_raw_user ON indb_seranking_metrics_raw(user_id);
CREATE INDEX IF NOT EXISTS idx_seranking_metrics_raw_status ON indb_seranking_metrics_raw(status);
CREATE INDEX IF NOT EXISTS idx_seranking_metrics_composite ON indb_seranking_metrics_raw(user_id, timestamp DESC);

-- SeRanking aggregated metrics
CREATE TABLE IF NOT EXISTS indb_seranking_metrics_aggregated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TIMESTAMPTZ NOT NULL,
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('hour', 'day', 'week', 'month')),
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,
  average_response_time DECIMAL(10,2) NOT NULL DEFAULT 0,
  cache_hit_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(period, period_type)
);

-- SeRanking quota usage
CREATE TABLE IF NOT EXISTS indb_seranking_quota_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  operation_type VARCHAR(50) NOT NULL DEFAULT 'api_request',
  quota_consumed INTEGER NOT NULL,
  quota_remaining INTEGER NOT NULL,
  quota_limit INTEGER NOT NULL,
  usage_percentage DECIMAL(6,4) NOT NULL,
  session_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seranking_quota_user ON indb_seranking_quota_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_seranking_quota_timestamp ON indb_seranking_quota_usage(timestamp DESC);

-- SeRanking health checks
CREATE TABLE IF NOT EXISTS indb_seranking_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  service_name VARCHAR(100) NOT NULL,
  check_type VARCHAR(20) NOT NULL CHECK (check_type IN ('api', 'database', 'cache', 'queue', 'dependency', 'custom')),
  dependency_level VARCHAR(20) NOT NULL CHECK (dependency_level IN ('critical', 'important', 'optional')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'critical')),
  response_time INTEGER NOT NULL,
  error_message TEXT,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seranking_health_checks_timestamp ON indb_seranking_health_checks(timestamp DESC);

-- ============================================================
-- ENRICHMENT JOBS (Keyword Enrichment)
-- ============================================================

CREATE TABLE IF NOT EXISTS indb_enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  job_type VARCHAR(50) NOT NULL, -- e.g. 'single_keyword', 'bulk_enrichment'
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'retrying')),
  priority INTEGER DEFAULT 2,
  
  -- Job Data
  config JSONB,
  source_data JSONB,
  progress_data JSONB,
  result_data JSONB,
  
  -- Execution Control
  worker_id VARCHAR(100),
  locked_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  
  -- Metrics (Legacy/Summary)
  total_keywords INTEGER DEFAULT 0,
  processed_keywords INTEGER DEFAULT 0,
  enriched_keywords INTEGER DEFAULT 0,
  failed_keywords INTEGER DEFAULT 0,
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_enrichment_jobs_updated_at
BEFORE UPDATE ON indb_enrichment_jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_user ON indb_enrichment_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_status ON indb_enrichment_jobs(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_created ON indb_enrichment_jobs(created_at DESC);

-- 20. indb_keyword_countries: Public read
ALTER TABLE indb_keyword_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read countries" ON indb_keyword_countries
  FOR SELECT USING (true);

-- 21. indb_site_settings: Public read (non-sensitive), Admin write
ALTER TABLE indb_site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site settings" ON indb_site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON indb_site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM indb_auth_user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- 22. indb_admin_user_summary: Admins only
ALTER TABLE indb_admin_user_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view user summary" ON indb_admin_user_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM indb_auth_user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE OR REPLACE FUNCTION increment_user_quota(target_user_id UUID, resource_type TEXT, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Security Check: Only allow if user is modifying their own quota OR is an admin
  IF auth.uid() != target_user_id AND NOT EXISTS (
    SELECT 1 FROM indb_auth_user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You can only modify your own quota or must be an admin';
  END IF;

  IF resource_type = 'api_calls' THEN
    UPDATE indb_site_integration 
    SET api_quota_used = api_quota_used + amount,
        updated_at = NOW()
    WHERE user_id = target_user_id;
  ELSIF resource_type = 'daily_urls' THEN
    UPDATE indb_auth_user_profiles 
    SET daily_quota_used = daily_quota_used + amount,
        updated_at = NOW()
    WHERE user_id = target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all core tables
ALTER TABLE indb_auth_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_auth_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_payment_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_keyword_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_keyword_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_rank_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_site_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_notifications_dashboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_security_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_system_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_seranking_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_seranking_metrics_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_seranking_quota_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_enrichment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_security_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. indb_auth_user_profiles: Users can only see and update their own profile (restricted fields)
CREATE POLICY "Users can view own profile" ON indb_auth_user_profiles
  FOR SELECT USING (auth.uid() = user_id);
-- SECURITY: Users can only update safe profile fields. Sensitive fields (role, package_id,
-- daily_quota_limit, is_suspended, is_active, is_trial_active, trial_ends_at, subscription_*,
-- quota_reset_date) are protected and can only be changed by admin policies or service role.
CREATE POLICY "Users can update own profile fields" ON indb_auth_user_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- Prevent role escalation
    role = (SELECT role FROM indb_auth_user_profiles WHERE user_id = auth.uid()) AND
    -- Prevent self-modification of subscription/quota/status fields
    package_id IS NOT DISTINCT FROM (SELECT package_id FROM indb_auth_user_profiles WHERE user_id = auth.uid()) AND
    daily_quota_limit = (SELECT daily_quota_limit FROM indb_auth_user_profiles WHERE user_id = auth.uid()) AND
    daily_quota_used = (SELECT daily_quota_used FROM indb_auth_user_profiles WHERE user_id = auth.uid()) AND
    quota_reset_date IS NOT DISTINCT FROM (SELECT quota_reset_date FROM indb_auth_user_profiles WHERE user_id = auth.uid()) AND
    is_suspended = (SELECT is_suspended FROM indb_auth_user_profiles WHERE user_id = auth.uid()) AND
    is_active = (SELECT is_active FROM indb_auth_user_profiles WHERE user_id = auth.uid()) AND
    is_trial_active = (SELECT is_trial_active FROM indb_auth_user_profiles WHERE user_id = auth.uid()) AND
    trial_ends_at IS NOT DISTINCT FROM (SELECT trial_ends_at FROM indb_auth_user_profiles WHERE user_id = auth.uid()) AND
    subscription_start_date IS NOT DISTINCT FROM (SELECT subscription_start_date FROM indb_auth_user_profiles WHERE user_id = auth.uid()) AND
    subscription_end_date IS NOT DISTINCT FROM (SELECT subscription_end_date FROM indb_auth_user_profiles WHERE user_id = auth.uid())
  );
-- Admin policies for user profile management
CREATE POLICY "Admins can view all profiles" ON indb_auth_user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM indb_auth_user_profiles AS admin_check
      WHERE admin_check.user_id = auth.uid() AND admin_check.role IN ('admin', 'super_admin')
    )
  );
CREATE POLICY "Admins can update all profiles" ON indb_auth_user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM indb_auth_user_profiles AS admin_check
      WHERE admin_check.user_id = auth.uid() AND admin_check.role IN ('admin', 'super_admin')
    )
  );
CREATE POLICY "Admins can insert profiles" ON indb_auth_user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM indb_auth_user_profiles AS admin_check
      WHERE admin_check.user_id = auth.uid() AND admin_check.role IN ('admin', 'super_admin')
    )
  );
CREATE POLICY "Admins can delete profiles" ON indb_auth_user_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM indb_auth_user_profiles AS admin_check
      WHERE admin_check.user_id = auth.uid() AND admin_check.role IN ('admin', 'super_admin')
    )
  );

-- Users can insert their own profile (needed for registration flow)
CREATE POLICY "Users can insert own profile" ON indb_auth_user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin override policies for tables that need admin access (#225)
-- Transactions: Admins can view/manage all
CREATE POLICY "Admins can view all transactions" ON indb_payment_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
CREATE POLICY "Admins can manage all transactions" ON indb_payment_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Subscriptions: Admins can view/manage all
CREATE POLICY "Admins can view all subscriptions" ON indb_payment_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
CREATE POLICY "Admins can manage all subscriptions" ON indb_payment_subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Keyword bank: Admins can manage
CREATE POLICY "Admins can manage keyword bank" ON indb_keyword_bank
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Keyword domains: Admins can manage all
CREATE POLICY "Admins can manage all keyword domains" ON indb_keyword_domains
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Rank keywords: Admins can manage all
CREATE POLICY "Admins can manage all rank keywords" ON indb_rank_keywords
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Keyword rankings: Admins can manage all
CREATE POLICY "Admins can manage all keyword rankings" ON indb_keyword_rankings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Site integration: Admins can manage all (including system integrations)
CREATE POLICY "Admins can manage all integrations" ON indb_site_integration
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Notifications: Admins can manage all
CREATE POLICY "Admins can manage all notifications" ON indb_notifications_dashboard
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Security activity logs: Admins can view all
CREATE POLICY "Admins can view all security activity logs" ON indb_security_activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- System error logs: Admins can manage all
CREATE POLICY "Admins can manage all error logs" ON indb_system_error_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- SeRanking usage logs: Admins can view all
CREATE POLICY "Admins can view all seranking usage" ON indb_seranking_usage_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- SeRanking metrics: Admins can manage all
CREATE POLICY "Admins can manage all seranking metrics" ON indb_seranking_metrics_raw
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- SeRanking quota: Admins can manage all
CREATE POLICY "Admins can manage all seranking quota" ON indb_seranking_quota_usage
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Enrichment jobs: Admins can manage all
CREATE POLICY "Admins can manage all enrichment jobs" ON indb_enrichment_jobs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 2. indb_auth_user_settings: Users can only see and update their own settings
CREATE POLICY "Users can view own settings" ON indb_auth_user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON indb_auth_user_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON indb_auth_user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON indb_auth_user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- 3. indb_payment_transactions: Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON indb_payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 4. indb_payment_subscriptions: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON indb_payment_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 5. indb_keyword_bank: Global SEO cache table - all authenticated users can read
CREATE POLICY "Authenticated users can read keyword bank" ON indb_keyword_bank
  FOR SELECT USING (auth.role() = 'authenticated');

-- 6. indb_keyword_domains: Users can manage their own domains
CREATE POLICY "Users can manage own domains" ON indb_keyword_domains
  FOR ALL USING (auth.uid() = user_id);

-- 7. indb_rank_keywords: Users can manage their own rank keywords
CREATE POLICY "Users can manage own rank keywords" ON indb_rank_keywords
  FOR ALL USING (auth.uid() = user_id);

-- 9. indb_site_integration: Users can manage their own integrations
CREATE POLICY "Users can manage own integrations" ON indb_site_integration
  FOR ALL USING (auth.uid() = user_id);

-- System integrations (NULL user_id) are readable by all authenticated users
CREATE POLICY "Authenticated users can view system integrations" ON indb_site_integration
  FOR SELECT USING (user_id IS NULL AND auth.role() = 'authenticated');

-- 10. indb_notifications_dashboard: Users can manage their own notifications
CREATE POLICY "Users can manage own notifications" ON indb_notifications_dashboard
  FOR ALL USING (auth.uid() = user_id);

-- 11. indb_security_activity_logs: Users can view their own security logs
CREATE POLICY "Users can view own security logs" ON indb_security_activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 12. indb_system_error_logs: Users can view their own error logs
CREATE POLICY "Users can view own error logs" ON indb_system_error_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 13. indb_seranking_usage_logs: Users can view their own usage logs
CREATE POLICY "Users can view own usage logs" ON indb_seranking_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 14. indb_seranking_metrics_raw: Users can view their own metrics
CREATE POLICY "Users can view own metrics" ON indb_seranking_metrics_raw
  FOR SELECT USING (auth.uid() = user_id);

-- 15. indb_seranking_quota_usage: Users can view their own quota usage
CREATE POLICY "Users can view own quota usage" ON indb_seranking_quota_usage
  FOR SELECT USING (auth.uid() = user_id);

-- 16. indb_enrichment_jobs: Users can manage their own enrichment jobs
CREATE POLICY "Users can manage own enrichment jobs" ON indb_enrichment_jobs
  FOR ALL USING (auth.uid() = user_id);


-- 18. indb_keyword_rankings: Users can only see rankings for keywords they own
CREATE POLICY "Users can view own rankings" ON indb_keyword_rankings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM indb_rank_keywords
      WHERE indb_rank_keywords.id = indb_keyword_rankings.keyword_id
      AND indb_rank_keywords.user_id = auth.uid()
    )
  );

-- 19. indb_admin_activity_logs: Only admins can view admin activity logs
CREATE POLICY "Admins can view admin activity logs" ON indb_admin_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM indb_auth_user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 20. indb_security_audit_logs: Admins can view all, users can only view their own
CREATE POLICY "Users can view own security audit logs" ON indb_security_audit_logs
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM indb_auth_user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- SEED DATA (Optional)
-- ============================================================

-- Insert default site settings
INSERT INTO indb_site_settings (site_name, site_tagline, registration_enabled, maintenance_mode)
VALUES ('IndexNow Studio', 'Professional URL Indexing Service', true, false)
ON CONFLICT DO NOTHING;

-- Insert default Paddle gateway
INSERT INTO indb_payment_gateways (name, slug, is_active, is_default, configuration)
VALUES (
  'Paddle',
  'paddle',
  false,
  true,
  '{"environment": "sandbox"}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Insert default payment packages (#221 - required for registration/default-package assignment)
INSERT INTO indb_payment_packages (name, slug, description, price, daily_quota, features, is_active, sort_order) VALUES
  ('Free', 'free', 'Basic free plan with limited daily quota', 0.00, 50, '{"max_keywords": 10, "max_domains": 1}'::jsonb, true, 0),
  ('Starter', 'starter', 'Starter plan for small websites', 9.99, 200, '{"max_keywords": 50, "max_domains": 3, "priority_support": false}'::jsonb, true, 1),
  ('Pro', 'pro', 'Professional plan for growing businesses', 29.99, 1000, '{"max_keywords": 200, "max_domains": 10, "priority_support": true}'::jsonb, true, 2),
  ('Enterprise', 'enterprise', 'Enterprise plan with unlimited access', 99.99, -1, '{"max_keywords": -1, "max_domains": -1, "priority_support": true, "dedicated_support": true}'::jsonb, true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert keyword countries (expanded with major markets #246)
INSERT INTO indb_keyword_countries (iso2_code, name) VALUES
  ('US', 'United States'),
  ('GB', 'United Kingdom'),
  ('CA', 'Canada'),
  ('AU', 'Australia'),
  ('DE', 'Germany'),
  ('FR', 'France'),
  ('ID', 'Indonesia'),
  ('IN', 'India'),
  ('JP', 'Japan'),
  ('BR', 'Brazil'),
  ('ES', 'Spain'),
  ('IT', 'Italy'),
  ('NL', 'Netherlands'),
  ('SE', 'Sweden'),
  ('NO', 'Norway'),
  ('DK', 'Denmark'),
  ('FI', 'Finland'),
  ('PL', 'Poland'),
  ('RU', 'Russia'),
  ('KR', 'South Korea'),
  ('MX', 'Mexico'),
  ('AR', 'Argentina'),
  ('TH', 'Thailand'),
  ('VN', 'Vietnam'),
  ('MY', 'Malaysia'),
  ('SG', 'Singapore'),
  ('PH', 'Philippines'),
  ('TR', 'Turkey'),
  ('ZA', 'South Africa'),
  ('AE', 'United Arab Emirates'),
  ('SA', 'Saudi Arabia'),
  ('EG', 'Egypt'),
  ('NG', 'Nigeria'),
  ('NZ', 'New Zealand'),
  ('PT', 'Portugal'),
  ('CH', 'Switzerland'),
  ('AT', 'Austria'),
  ('BE', 'Belgium'),
  ('IE', 'Ireland'),
  ('TW', 'Taiwan')
ON CONFLICT (iso2_code) DO NOTHING;

-- DESIGN NOTE (#242): Soft-delete (deleted_at) is used on gateways and packages for
-- auditability. Transactions/subscriptions use status-based lifecycle instead.
-- Both approaches are valid; maintain consistency within each domain.

-- DESIGN NOTE (#239): RLS policies for gateways/packages filter by is_active/deleted_at,
-- ensuring soft-deleted records are hidden from non-admin users.

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================

-- ============================================================
-- IndexNow Studio - Missing Indexes Migration
-- ============================================================
-- Generated: 2026-02-03
-- Purpose: Add critical performance indexes for rank tracking queries
-- ============================================================

-- 1. Composite index for faster user domain lookups
-- This optimizes queries that filter keywords by user_id and domain
CREATE INDEX IF NOT EXISTS idx_rank_keywords_user_domain 
ON indb_rank_keywords(user_id, domain);

-- 2. GIN index for faster keyword searches
-- This optimizes ILIKE queries on the keyword column
CREATE INDEX IF NOT EXISTS idx_rank_keywords_keyword_gin 
ON indb_rank_keywords USING gin(keyword gin_trgm_ops);

-- 3. Composite index for filtering by user and tags
-- The tags column is an array, so we use GIN
CREATE INDEX IF NOT EXISTS idx_rank_keywords_user_tags 
ON indb_rank_keywords USING gin(tags);

-- idx_rank_keywords_user_active removed: near-duplicate of partial idx_rank_keywords_active
CREATE INDEX IF NOT EXISTS idx_rank_keywords_user_active_dedup_note 
  ON indb_rank_keywords(user_id) WHERE is_active = TRUE;
-- The partial idx_rank_keywords_active covers (user_id, is_active) WHERE is_active = TRUE

-- 5. Index for last_checked to optimize stale keyword queries
CREATE INDEX IF NOT EXISTS idx_rank_keywords_last_checked 
ON indb_rank_keywords(last_checked);

-- 6. Add pg_trgm extension if not exists (required for GIN trgm ops)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- IndexNow Studio - Domain Stats RPC
-- ============================================================
-- Generated: 2026-02-03
-- Purpose: Efficiently aggregate keyword counts per domain via RPC
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_domain_stats(target_user_id UUID)
RETURNS TABLE (
  domain TEXT,
  keyword_count BIGINT
) AS $$
BEGIN
  -- Security Check
  IF auth.uid() != target_user_id AND NOT EXISTS (
    SELECT 1 FROM indb_auth_user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    rk.domain,
    COUNT(*) as keyword_count
  FROM indb_rank_keywords rk
  WHERE rk.user_id = target_user_id
  AND rk.domain IS NOT NULL
  GROUP BY rk.domain
  ORDER BY keyword_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================================
-- IndexNow Studio - Atomic Operations RPC
-- ============================================================
-- Generated: 2026-02-03
-- Purpose: Prevent race conditions in rank tracking updates
-- ============================================================

-- 1. Atomic Keyword Position Update
-- Prevents race conditions when updating rank positions
CREATE OR REPLACE FUNCTION update_keyword_position_atomic(
  target_keyword_id UUID,
  new_rank_position INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_pos INTEGER;
  keyword_owner_id UUID;
BEGIN
  -- Lock the row for update
  SELECT position, user_id INTO current_pos, keyword_owner_id
  FROM indb_rank_keywords
  WHERE id = target_keyword_id
  FOR UPDATE;

  -- Security Check
  IF keyword_owner_id IS NULL OR (auth.uid() != keyword_owner_id AND NOT EXISTS (
    SELECT 1 FROM indb_auth_user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update with atomic swap logic
  UPDATE indb_rank_keywords
  SET 
    previous_position = current_pos,
    position = new_rank_position,
    last_checked = NOW()
  WHERE id = target_keyword_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;


-- 2. Atomic Add Tags
-- Prevents race conditions when adding tags from multiple sources
CREATE OR REPLACE FUNCTION add_tags_to_keywords_atomic(
  target_keyword_ids UUID[],
  target_user_id UUID,
  new_tags TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Security Check
  IF auth.uid() != target_user_id AND NOT EXISTS (
    SELECT 1 FROM indb_auth_user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  WITH updated_rows AS (
    UPDATE indb_rank_keywords
    SET tags = (
      SELECT array_agg(DISTINCT x)
      FROM unnest(COALESCE(tags, ARRAY[]::TEXT[]) || new_tags) t(x)
    )
    WHERE id = ANY(target_keyword_ids)
    AND user_id = target_user_id
    RETURNING 1
  )
  SELECT count(*) INTO updated_count FROM updated_rows;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 3. Atomic Quota Consumption
-- Consumes user quota atomically, returns false if insufficient
CREATE OR REPLACE FUNCTION consume_user_quota(
  target_user_id UUID,
  quota_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  current_quota_limit INTEGER;
BEGIN
  -- Security Check
  IF auth.uid() != target_user_id AND NOT EXISTS (
    SELECT 1 FROM indb_auth_user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock the user profile and get both usage and limit in a single SELECT
  SELECT daily_quota_used, daily_quota_limit
  INTO current_usage, current_quota_limit
  FROM indb_auth_user_profiles
  WHERE user_id = target_user_id
  FOR UPDATE;

  -- Check if user exists
  IF current_usage IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Check if unlimited (-1) or sufficient
  IF current_quota_limit = -1 THEN
    -- Unlimited, just track usage
    UPDATE indb_auth_user_profiles
    SET daily_quota_used = daily_quota_used + quota_amount,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    RETURN TRUE;
  END IF;

  IF (current_usage + quota_amount) > current_quota_limit THEN
    RETURN FALSE; -- Insufficient quota
  END IF;

  -- Consume quota
  UPDATE indb_auth_user_profiles
  SET daily_quota_used = daily_quota_used + quota_amount,
      updated_at = NOW()
  WHERE user_id = target_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================================
-- PERFORMANCE OPTIMIZATION: COMPOSITE INDEXES
-- ============================================================
-- These indexes optimize common query patterns for better performance

-- Transaction history lookup by user + date (for payment history pages)
CREATE INDEX IF NOT EXISTS idx_transactions_user_created 
ON indb_payment_transactions(user_id, created_at DESC);

-- Queue processing priority (for worker job fetching)
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_priority 
ON indb_enrichment_jobs(status, priority DESC, created_at ASC)
WHERE status IN ('pending', 'retrying');

-- Usage analytics aggregation (for dashboard stats)
CREATE INDEX IF NOT EXISTS idx_usage_logs_analytics 
ON indb_seranking_usage_logs(user_id, operation, date);

-- Subscription status lookup (for billing/expiry checks)
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_end_date 
ON indb_payment_subscriptions(status, end_date)
WHERE status IN ('active', 'trialing');

-- ============================================================
-- SECURITY: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Payment Gateways: Public can read active (excluding api_credentials), Admins can manage all
ALTER TABLE indb_payment_gateways ENABLE ROW LEVEL SECURITY;
-- SECURITY: Public SELECT policy only shows non-sensitive columns.
-- api_credentials is only accessible via admin policy or service role.
-- Use a view (indb_payment_gateways_public) for public-facing queries.
CREATE POLICY "indb_payment_gateways_select_active" ON indb_payment_gateways
  FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL);
CREATE POLICY "indb_payment_gateways_admin_all" ON indb_payment_gateways
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Public-safe view for payment gateways (excludes api_credentials)
CREATE OR REPLACE VIEW indb_payment_gateways_public AS
SELECT id, name, slug, is_active, is_default, configuration, created_at, updated_at
FROM indb_payment_gateways
WHERE is_active = TRUE AND deleted_at IS NULL;

-- Payment Packages: Public can read active, Admins can manage
ALTER TABLE indb_payment_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "indb_payment_packages_select_active" ON indb_payment_packages
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "indb_payment_packages_admin_all" ON indb_payment_packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Paddle Transactions: Users see own, Admins see all
ALTER TABLE indb_paddle_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "indb_paddle_transactions_user_own" ON indb_paddle_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM indb_payment_transactions pt WHERE pt.id = indb_paddle_transactions.transaction_id AND pt.user_id = auth.uid())
  );
CREATE POLICY "indb_paddle_transactions_admin_select" ON indb_paddle_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Paddle Webhook Events: Admin-only
ALTER TABLE indb_paddle_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "indb_paddle_webhook_events_admin_only" ON indb_paddle_webhook_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- SeRanking Health Checks: Admin-only
ALTER TABLE indb_seranking_health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "indb_seranking_health_checks_admin_only" ON indb_seranking_health_checks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- SeRanking Metrics Aggregated: Authenticated users can read
ALTER TABLE indb_seranking_metrics_aggregated ENABLE ROW LEVEL SECURITY;
CREATE POLICY "indb_seranking_metrics_aggregated_auth_read" ON indb_seranking_metrics_aggregated
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "indb_seranking_metrics_aggregated_admin_write" ON indb_seranking_metrics_aggregated
  FOR ALL USING (
    EXISTS (SELECT 1 FROM indb_auth_user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- JSONB GIN INDEXES FOR QUERY PERFORMANCE
-- ============================================================
-- These indexes support @>, ?, ?&, ?| operators for JSONB queries

-- Payment Packages: features column (filter packages by feature availability)
CREATE INDEX IF NOT EXISTS idx_indb_payment_packages_features_gin 
ON indb_payment_packages USING GIN (features);

-- Site Integration: settings column (lookup integration configurations)
CREATE INDEX IF NOT EXISTS idx_indb_site_integration_settings_gin
ON indb_site_integration USING GIN (settings);

-- Keyword Bank: history_trend column (trend analysis queries)
CREATE INDEX IF NOT EXISTS idx_indb_keyword_bank_history_trend_gin
ON indb_keyword_bank USING GIN (history_trend);

-- ============================================================
-- RPC FUNCTIONS: ADMIN UTILITIES
-- ============================================================

-- Revenue aggregation: total completed transaction revenue
CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) FROM indb_payment_transactions WHERE status = 'completed'),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_total_revenue() TO service_role;

-- Revenue aggregation: filtered by date range
CREATE OR REPLACE FUNCTION get_revenue_by_period(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) FROM indb_payment_transactions
     WHERE status = 'completed'
     AND created_at >= start_date
     AND created_at < end_date),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_revenue_by_period(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- Batch user email lookup: avoids N+1 individual auth.admin.getUserById() calls
CREATE OR REPLACE FUNCTION get_user_emails_by_ids(p_user_ids UUID[])
RETURNS TABLE(id UUID, email TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT u.id, u.email::TEXT
  FROM auth.users u
  WHERE u.id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION get_user_emails_by_ids(UUID[]) TO service_role;

-- ============================================================
-- RPC FUNCTIONS: ATOMIC MULTI-STEP OPERATIONS (SERVICE ROLE)
-- ============================================================
-- These functions wrap multi-step mutations in a single transaction
-- to prevent partial writes. Called via supabaseAdmin.rpc() from API routes.

-- 4. Atomic bulk delete keywords and their rankings
-- Prevents orphaned ranking records if keyword delete fails
CREATE OR REPLACE FUNCTION bulk_delete_keywords_service(
  p_keyword_ids UUID[],
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  verified_count INTEGER;
  deleted_count INTEGER;
BEGIN
  -- Verify all keywords belong to user
  SELECT count(*) INTO verified_count
  FROM indb_rank_keywords
  WHERE id = ANY(p_keyword_ids) AND user_id = p_user_id;

  IF verified_count != array_length(p_keyword_ids, 1) THEN
    RAISE EXCEPTION 'Some keywords not found or access denied';
  END IF;

  -- Delete child records first (rankings/history)
  DELETE FROM indb_keyword_rankings WHERE keyword_id = ANY(p_keyword_ids);

  -- Delete keywords
  DELETE FROM indb_rank_keywords
  WHERE id = ANY(p_keyword_ids) AND user_id = p_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION bulk_delete_keywords_service(UUID[], UUID) TO service_role;

-- 5. Atomic set default payment gateway
-- Prevents state where no gateway is marked as default
CREATE OR REPLACE FUNCTION set_default_payment_gateway_service(
  p_gateway_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Reset all other defaults
  UPDATE indb_payment_gateways
  SET is_default = false
  WHERE is_default = true AND id != p_gateway_id;

  -- Set new default
  UPDATE indb_payment_gateways
  SET is_default = true, updated_at = NOW()
  WHERE id = p_gateway_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gateway not found: %', p_gateway_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION set_default_payment_gateway_service(UUID) TO service_role;

-- 6. Atomic save rank check result
-- Updates keyword position + inserts ranking history + increments quota in one transaction
CREATE OR REPLACE FUNCTION save_rank_check_result_service(
  p_keyword_id UUID,
  p_user_id UUID,
  p_position INTEGER,
  p_url TEXT,
  p_check_date DATE,
  p_device_type TEXT,
  p_country_iso TEXT
)
RETURNS VOID AS $$
DECLARE
  v_country_id UUID;
BEGIN
  -- Update keyword with new position
  UPDATE indb_rank_keywords
  SET position = p_position, last_checked = NOW()
  WHERE id = p_keyword_id;

  -- Resolve country ISO code to FK
  IF p_country_iso IS NOT NULL THEN
    SELECT id INTO v_country_id
    FROM indb_keyword_countries
    WHERE iso2_code = lower(p_country_iso)
    LIMIT 1;
  END IF;

  -- Insert ranking history record
  INSERT INTO indb_keyword_rankings (keyword_id, position, url, check_date, device_type, country_id)
  VALUES (p_keyword_id, p_position, p_url, p_check_date, p_device_type, v_country_id);

  -- Increment user quota atomically
  UPDATE indb_auth_user_profiles
  SET daily_quota_used = daily_quota_used + 1, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION save_rank_check_result_service(UUID, UUID, INTEGER, TEXT, DATE, TEXT, TEXT) TO service_role;

-- 7. User billing total: sum of completed transaction amounts for a specific user
CREATE OR REPLACE FUNCTION get_user_completed_amount(p_user_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) FROM indb_payment_transactions
     WHERE user_id = p_user_id AND status = 'completed'),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION get_user_completed_amount(UUID) TO service_role;

-- 8. Error type distribution: counts grouped by error_type since a given timestamp
CREATE OR REPLACE FUNCTION get_error_type_distribution(p_since TIMESTAMPTZ)
RETURNS JSONB AS $$
BEGIN
  RETURN COALESCE(
    (SELECT jsonb_object_agg(error_type, cnt)
     FROM (
       SELECT error_type, count(*) AS cnt
       FROM indb_system_error_logs
       WHERE created_at >= p_since
       GROUP BY error_type
     ) sub),
    '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION get_error_type_distribution(TIMESTAMPTZ) TO service_role;

-- 9. Error severity distribution: counts grouped by severity since a given timestamp
CREATE OR REPLACE FUNCTION get_error_severity_distribution(p_since TIMESTAMPTZ)
RETURNS JSONB AS $$
BEGIN
  RETURN COALESCE(
    (SELECT jsonb_object_agg(severity, cnt)
     FROM (
       SELECT severity, count(*) AS cnt
       FROM indb_system_error_logs
       WHERE created_at >= p_since
       GROUP BY severity
     ) sub),
    '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION get_error_severity_distribution(TIMESTAMPTZ) TO service_role;

-- 10. Error endpoint distribution: top N endpoints by error count since a given timestamp
CREATE OR REPLACE FUNCTION get_error_endpoint_distribution(p_since TIMESTAMPTZ, p_limit INTEGER DEFAULT 5)
RETURNS TABLE(endpoint TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
    SELECT e.endpoint, count(*) AS count
    FROM indb_system_error_logs e
    WHERE e.created_at >= p_since AND e.endpoint IS NOT NULL
    GROUP BY e.endpoint
    ORDER BY count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION get_error_endpoint_distribution(TIMESTAMPTZ, INTEGER) TO service_role;

-- 11. Domain keyword counts: count of active keywords per domain for a user
CREATE OR REPLACE FUNCTION get_domain_keyword_counts(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN COALESCE(
    (SELECT jsonb_object_agg(domain, cnt)
     FROM (
       SELECT domain, count(*) AS cnt
       FROM indb_rank_keywords
       WHERE user_id = p_user_id AND is_active = true
       GROUP BY domain
     ) sub),
    '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION get_domain_keyword_counts(UUID) TO service_role;
