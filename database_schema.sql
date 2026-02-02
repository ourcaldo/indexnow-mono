-- ============================================================
-- IndexNow Studio - Complete Database Schema
-- ============================================================
-- Generated: 2026-01-25
-- Purpose: Complete Supabase PostgreSQL schema for IndexNow Studio
-- Note: Marketing/frontpage tables have been excluded
-- ============================================================

-- ============================================================
-- CORE AUTHENTICATION & USER MANAGEMENT
-- ============================================================

-- User profiles (extends Supabase auth.users)
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
  package_id UUID,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  daily_quota_limit INTEGER DEFAULT 100,
  daily_quota_used INTEGER DEFAULT 0,
  quota_reset_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON indb_auth_user_settings(user_id);

-- ============================================================
-- PAYMENT SYSTEM
-- ============================================================

-- Payment gateways configuration
CREATE TABLE IF NOT EXISTS indb_payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  api_credentials JSONB,
  configuration JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment packages/plans
CREATE TABLE IF NOT EXISTS indb_payment_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  
  -- Quota limits
  daily_quota INTEGER NOT NULL,
  monthly_quota INTEGER,
  
  -- Features
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  
  -- External IDs (Paddle, Stripe, etc.)
  paddle_price_id VARCHAR(100),
  stripe_price_id VARCHAR(100),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS indb_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_transactions_user ON indb_payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON indb_payment_transactions(status);

-- Transaction history/audit
CREATE TABLE IF NOT EXISTS indb_payment_transactions_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES indb_payment_transactions(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_history_tid ON indb_payment_transactions_history(transaction_id);

-- User subscriptions
CREATE TABLE IF NOT EXISTS indb_payment_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Keyword bank (user's keyword library)
CREATE TABLE IF NOT EXISTS indb_keyword_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword VARCHAR(500) NOT NULL,
  domain_id UUID,
  country_code VARCHAR(10),
  device_type VARCHAR(20) DEFAULT 'desktop',
  search_engine VARCHAR(50) DEFAULT 'google',
  target_url TEXT,
  tags TEXT[],
  
  -- Current rank data
  current_position INTEGER,
  previous_position INTEGER,
  best_position INTEGER,
  worst_position INTEGER,
  
  -- Tracking settings
  is_active BOOLEAN DEFAULT TRUE,
  check_frequency VARCHAR(20) DEFAULT 'daily',
  last_checked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keyword_bank_user ON indb_keyword_bank(user_id);
CREATE INDEX IF NOT EXISTS idx_keyword_bank_domain ON indb_keyword_bank(domain_id);

-- Keyword domains
CREATE TABLE IF NOT EXISTS indb_keyword_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keyword_domains_user ON indb_keyword_domains(user_id);

-- Keyword countries
CREATE TABLE IF NOT EXISTS indb_keyword_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Keywords (legacy table - may be duplicate of keyword_bank)
CREATE TABLE IF NOT EXISTS indb_keyword_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword VARCHAR(500) NOT NULL,
  domain VARCHAR(255),
  device VARCHAR(20) DEFAULT 'desktop',
  country_code VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keyword_keywords_user ON indb_keyword_keywords(user_id);

-- Rank tracking history
CREATE TABLE IF NOT EXISTS indb_keyword_rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL,
  position INTEGER,
  url TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_volume INTEGER,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_rank_history_keyword ON indb_keyword_rank_history(keyword_id);
CREATE INDEX IF NOT EXISTS idx_rank_history_checked ON indb_keyword_rank_history(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_rank_history_composite ON indb_keyword_rank_history(keyword_id, checked_at DESC);

-- Current keyword rankings
CREATE TABLE IF NOT EXISTS indb_keyword_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL,
  position INTEGER,
  url TEXT,
  change INTEGER DEFAULT 0,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rankings_keyword ON indb_keyword_rankings(keyword_id);

-- Rank keywords (may be alternate structure)
CREATE TABLE IF NOT EXISTS indb_rank_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  domain TEXT,
  device VARCHAR(20),
  country VARCHAR(10),
  position INTEGER,
  previous_position INTEGER,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rank_keywords_user ON indb_rank_keywords(user_id);

-- ============================================================
-- SITE INTEGRATION & SETTINGS
-- ============================================================

-- Site integration (connected sites/domains)
CREATE TABLE IF NOT EXISTS indb_site_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  integration_type VARCHAR(50),
  api_key TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_integration_user ON indb_site_integration(user_id);

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
  default_package_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Admin activity logs
CREATE TABLE IF NOT EXISTS indb_admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID,
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
  stack_trace TEXT,
  endpoint VARCHAR(255),
  request_data JSONB,
  metadata JSONB,
  
  -- Resolution tracking
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  operation VARCHAR(100) NOT NULL,
  keywords_count INTEGER,
  quota_used INTEGER,
  response_time_ms INTEGER,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seranking_usage_user ON indb_seranking_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_seranking_usage_created ON indb_seranking_usage_logs(created_at DESC);

-- SeRanking raw metrics
CREATE TABLE IF NOT EXISTS indb_seranking_metrics_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  user_id UUID,
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
  user_id UUID,
  operation_type VARCHAR(50) NOT NULL DEFAULT 'api_request',
  quota_consumed INTEGER NOT NULL,
  quota_remaining INTEGER NOT NULL,
  quota_limit INTEGER NOT NULL,
  usage_percentage DECIMAL(6,4) NOT NULL,
  session_id VARCHAR(100),
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
  status VARCHAR(50) DEFAULT 'pending',
  total_keywords INTEGER DEFAULT 0,
  processed_keywords INTEGER DEFAULT 0,
  enriched_keywords INTEGER DEFAULT 0,
  failed_keywords INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_user ON indb_enrichment_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_status ON indb_enrichment_jobs(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_created ON indb_enrichment_jobs(created_at DESC);

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
ALTER TABLE indb_keyword_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_rank_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_site_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_notifications_dashboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_security_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_system_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_seranking_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_seranking_metrics_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_seranking_quota_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE indb_enrichment_jobs ENABLE ROW LEVEL SECURITY;

-- 1. indb_auth_user_profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON indb_auth_user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON indb_auth_user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. indb_auth_user_settings: Users can only see and update their own settings
CREATE POLICY "Users can view own settings" ON indb_auth_user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON indb_auth_user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. indb_payment_transactions: Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON indb_payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 4. indb_payment_subscriptions: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON indb_payment_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 5. indb_keyword_bank: Users can manage their own keyword bank
CREATE POLICY "Users can manage own keyword bank" ON indb_keyword_bank
  FOR ALL USING (auth.uid() = user_id);

-- 6. indb_keyword_domains: Users can manage their own domains
CREATE POLICY "Users can manage own domains" ON indb_keyword_domains
  FOR ALL USING (auth.uid() = user_id);

-- 7. indb_keyword_keywords: Users can manage their own keywords
CREATE POLICY "Users can manage own keywords" ON indb_keyword_keywords
  FOR ALL USING (auth.uid() = user_id);

-- 8. indb_rank_keywords: Users can manage their own rank keywords
CREATE POLICY "Users can manage own rank keywords" ON indb_rank_keywords
  FOR ALL USING (auth.uid() = user_id);

-- 9. indb_site_integration: Users can manage their own integrations
CREATE POLICY "Users can manage own integrations" ON indb_site_integration
  FOR ALL USING (auth.uid() = user_id);

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

-- Insert keyword countries
INSERT INTO indb_keyword_countries (code, name) VALUES
  ('US', 'United States'),
  ('GB', 'United Kingdom'),
  ('CA', 'Canada'),
  ('AU', 'Australia'),
  ('DE', 'Germany'),
  ('FR', 'France'),
  ('ID', 'Indonesia'),
  ('IN', 'India'),
  ('JP', 'Japan'),
  ('BR', 'Brazil')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================
