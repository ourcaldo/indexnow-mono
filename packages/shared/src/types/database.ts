import { type PostgrestError } from '@supabase/supabase-js';

// Inline types for enrichment jobs (used in indb_enrichment_jobs table)
export interface EnrichmentJobConfig {
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  priority: number;
  preserveOrder: boolean;
  enableRateLimiting: boolean;
  quotaThreshold: number;
  notifyOnCompletion: boolean;
}

export interface JobResult {
  jobId: string;
  status: string;
  results: unknown[];
  summary: {
    totalKeywords: number;
    successfulEnrichments: number;
    failedEnrichments: number;
    skippedKeywords: number;
    cacheHits: number;
    apiCallsMade: number;
    quotaUsed: number;
    processingTime: number;
    averageTimePerKeyword: number;
  };
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
}

export type { PostgrestError };

// TypeScript types for Supabase database tables
// Generated from the database schema

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * Strict JSON types for database columns
 */
export interface PackageFeatures {
  rank_tracking: boolean;
  keyword_research: boolean;
  api_access: boolean;
  custom_reports: boolean;
  priority_support: boolean;
  [key: string]: boolean | string | number | undefined;
}

export interface PackageQuotaLimits {
  daily_keywords: number;
  monthly_keywords?: number;
  max_domains: number;
  [key: string]: number | undefined;
}

export interface PackagePricingTier {
  name: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'annual' | 'lifetime' | 'one-time';
  paddle_price_id?: string;
}

export interface PricingTierDetails {
  regular_price: number;
  promo_price?: number;
  period_label?: string;
  paddle_price_id?: string;
}

export type PackagePricingTiers = Record<string, PricingTierDetails | undefined>;

export interface SiteIntegrationRateLimits {
  requests_per_second?: number;
  requests_per_minute?: number;
  requests_per_day?: number;
  concurrent_requests?: number;
  [key: string]: number | undefined;
}

export interface SiteIntegrationAlertSettings {
  quota_threshold_percent?: number;
  error_rate_threshold?: number;
  latency_threshold_ms?: number;
  notify_email?: boolean;
  notify_webhook?: boolean;
  [key: string]: boolean | number | string | undefined;
}

export interface PaymentGatewayCredentials {
  api_key?: string;
  client_token?: string;
  secret_key?: string;
  webhook_secret?: string;
  vendor_id?: string;
  auth_code?: string;
  [key: string]: string | undefined;
}

export interface PaymentGatewayConfiguration {
  environment?: 'sandbox' | 'production' | 'test';
  sandbox_mode?: boolean;
  return_url?: string;
  cancel_url?: string;
  currency?: string;
  [key: string]: string | boolean | number | undefined;
}

export interface TransactionGatewayResponse {
  transaction_id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  [key: string]: Json | undefined;
}

export interface TransactionMetadata {
  original_amount?: number;
  original_currency?: string;
  customer_info?: Json;
  user_id?: string;
  user_email?: string;
  package_id?: string;
  billing_period?: 'monthly' | 'annual' | 'lifetime' | 'one-time';
  created_at?: string;
  payment_type?: string;

  // Paddle specific
  custom_data?: Json;
  items?: Json[];

  // Processor specific
  transactionId?: string;
  gatewayTransactionId?: string;
  paymentStatus?: string;
  mappedStatus?: string;
  hasGatewayResponse?: boolean;

  [key: string]: Json | undefined;
}

// ── Column union types (M-01 … M-06) ────────────────────────────────────────

/** M-01: indb_notifications_dashboard.type */
export type NotificationDashboardType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'reminder'
  | 'system'
  | 'marketing';

/** M-02: indb_security_activity_logs.event_type — extensive list, see ActivityEventTypes constant. */
export type SecurityActivityEventType =
  | 'login'
  | 'logout'
  | 'register'
  | 'password_reset'
  | 'password_change'
  | 'profile_update'
  | 'settings_change'
  | 'settings_view'
  | 'settings_update'
  | 'notification_settings_update'
  | 'job_create'
  | 'job_update'
  | 'job_delete'
  | 'job_start'
  | 'job_pause'
  | 'job_resume'
  | 'job_cancel'
  | 'job_view'
  | 'checkout_initiated'
  | 'order_created'
  | 'payment_proof_uploaded'
  | 'subscription_upgrade'
  | 'billing_view'
  | 'billing_history_view'
  | 'order_view'
  | 'package_selection'
  | 'subscription_success'
  | 'subscription_failed'
  | 'subscription_cancelled'
  | 'dashboard_view'
  | 'dashboard_stats_view'
  | 'dashboard_data_loaded_from_merged_api'
  | 'dashboard_data_error'
  | 'quota_view'
  | 'indexnow_page_view'
  | 'manage_jobs_view'
  | 'api_call'
  | 'google_api_call'
  | 'admin_login'
  | 'admin_dashboard_view'
  | 'admin_stats_view'
  | 'admin_page_view'
  | 'user_management'
  | 'user_suspend'
  | 'user_unsuspend'
  | 'user_password_reset'
  | 'user_profile_update'
  | 'user_role_change'
  | 'user_quota_reset'
  | 'user_package_change'
  | 'user_subscription_extend'
  | 'admin_settings'
  | 'site_settings_update'
  | 'site_settings_view'
  | 'payment_gateway_create'
  | 'payment_gateway_update'
  | 'payment_gateway_delete'
  | 'payment_gateway_view'
  | 'package_create'
  | 'package_update'
  | 'package_delete'
  | 'package_view'
  | 'order_management'
  | 'order_status_update'
  | 'admin_order_view'
  | 'order_approve'
  | 'order_reject'
  | 'page_view'
  | 'admin_panel_access'
  | 'user_security_view'
  | 'user_activity_view'
  | 'keyword_add'
  | 'keyword_delete'
  | 'keyword_update'
  | 'keyword_bulk_delete'
  | 'keyword_tag_add'
  | 'keyword_tag_remove'
  | 'domain_add'
  | 'domain_delete'
  | 'domain_update'
  | 'keyword_tracker_view'
  | 'rank_history_view'
  | 'error_occurred'
  | 'security_violation'
  | 'quota_exceeded'
  | 'unauthorized_access'
  | 'session_established'
  | 'system_action'
  | 'paddle_overlay_opened'
  | 'checkout_error'
  | (string & {}); // extensible — frontend and future events

/** M-03: indb_security_audit_logs.event_type */
export type SecurityAuditEventType = 'service_role_operation' | 'user_operation';

/** M-04: indb_admin_activity_logs.action_type — mirrors ActivityEventTypes admin subset.
 * (#V7 M-01) Uses `(string & {})` intentionally for extensibility, allowing dynamic patterns
 * like `${settingsType}_settings_view` while providing IntelliSense for known values.
 */
export type AdminActionType =
  | 'admin_page_view'
  | 'admin_dashboard_view'
  | 'admin_stats_view'
  | 'admin_order_view'
  | 'order_status_update'
  | 'order_approve'
  | 'order_reject'
  | 'package_create'
  | 'package_update'
  | 'payment_gateway_create'
  | 'user_management'
  | 'user_role_change'
  | 'user_suspend'
  | 'user_quota_reset'
  | (string & {}); // extensible — includes dynamic `${settingsType}_settings_view` patterns

/** M-04: indb_admin_activity_logs.target_type
 * (#V7 M-01) Uses `(string & {})` intentionally — same extensibility pattern as AdminActionType.
 */
export type AdminTargetType = 'order' | 'user' | (string & {});

/** M-05: indb_site_integration.quota_reset_interval */
export type QuotaResetInterval = 'daily' | 'monthly';

/** M-06: indb_seranking_usage_logs.operation_type */
export type SeRankingOperationType =
  | 'quota_usage_tracking'
  | 'quota_reset'
  | 'usage_report_generation'
  | 'api_request'
  | 'connectivity_test'
  | 'stale_keyword_lookup'
  | 'keyword_data_update'
  | 'job_enqueue'
  | 'job_dequeue'
  | 'job_lock'
  | 'integration_config_lookup'
  | 'keyword_enrichment_lookup'
  | 'keyword_enrichment_update'
  | 'smtp_config_lookup'
  | 'quota_usage_history_lookup'
  | 'keyword_export';

/** L-01: indb_keyword_bank.keyword_intent */
export type KeywordIntentType = 'commercial' | 'informational' | 'navigational' | 'transactional';

/** L-02: indb_rank_keywords.search_engine */
export type SearchEngineType = 'google' | 'bing' | 'yahoo';

export type Database = {
  public: {
    Tables: {
      indb_auth_user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          phone_number: string | null;
          country: string | null;
          role: 'user' | 'admin' | 'super_admin';
          email_verified: boolean;
          avatar_url: string | null;
          package_id: string | null;
          subscription_start_date: string | null;
          subscription_end_date: string | null;
          daily_quota_limit: number;
          daily_quota_used: number;
          quota_reset_date: string | null;
          is_active: boolean;
          is_suspended: boolean;
          is_trial_active: boolean;
          trial_ends_at: string | null;
          suspension_reason: string | null;
          suspended_at: string | null;
          last_login_at: string | null;
          last_login_ip: string | null;
          must_change_password: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          phone_number?: string | null;
          country?: string | null;
          role?: 'user' | 'admin' | 'super_admin';
          email_verified?: boolean;
          avatar_url?: string | null;
          package_id?: string | null;
          subscription_start_date?: string | null;
          subscription_end_date?: string | null;
          daily_quota_limit?: number;
          daily_quota_used?: number;
          quota_reset_date?: string | null;
          is_active?: boolean;
          is_suspended?: boolean;
          is_trial_active?: boolean;
          trial_ends_at?: string | null;
          suspension_reason?: string | null;
          suspended_at?: string | null;
          last_login_at?: string | null;
          last_login_ip?: string | null;
          must_change_password?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          phone_number?: string | null;
          country?: string | null;
          role?: 'user' | 'admin' | 'super_admin';
          email_verified?: boolean;
          avatar_url?: string | null;
          package_id?: string | null;
          subscription_start_date?: string | null;
          subscription_end_date?: string | null;
          daily_quota_limit?: number;
          daily_quota_used?: number;
          quota_reset_date?: string | null;
          is_active?: boolean;
          is_suspended?: boolean;
          is_trial_active?: boolean;
          trial_ends_at?: string | null;
          suspension_reason?: string | null;
          suspended_at?: string | null;
          last_login_at?: string | null;
          last_login_ip?: string | null;
          must_change_password?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'indb_auth_user_profiles_package_id_fkey';
            columns: ['package_id'];
            isOneToOne: false;
            referencedRelation: 'indb_payment_packages';
            referencedColumns: ['id'];
          },
        ];
      };
      indb_auth_user_settings: {
        Row: {
          id: string;
          user_id: string;
          timeout_duration: number;
          retry_attempts: number;
          email_job_completion: boolean;
          email_job_failure: boolean;
          email_quota_alerts: boolean;
          default_schedule: 'one-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
          email_daily_report: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          timeout_duration?: number;
          retry_attempts?: number;
          email_job_completion?: boolean;
          email_job_failure?: boolean;
          email_quota_alerts?: boolean;
          default_schedule?: 'one-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
          email_daily_report?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          timeout_duration?: number;
          retry_attempts?: number;
          email_job_completion?: boolean;
          email_job_failure?: boolean;
          email_quota_alerts?: boolean;
          default_schedule?: 'one-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
          email_daily_report?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'indb_auth_user_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      indb_keyword_countries: {
        Row: {
          id: string;
          name: string;
          iso2_code: string;
          iso3_code: string | null;
          numeric_code: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          iso2_code: string;
          iso3_code?: string | null;
          numeric_code?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          iso2_code?: string;
          iso3_code?: string | null; // (#V7 M-02) Matches Row nullable type
          numeric_code?: string | null; // (#V7 M-02) Matches Row nullable type
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      indb_keyword_bank: {
        Row: {
          id: string;
          keyword: string;
          country_id: string | null;
          language_code: string;
          is_data_found: boolean;
          volume: number | null;
          cpc: number | null;
          competition: number | null;
          difficulty: number | null;
          history_trend: Json | null;
          keyword_intent: KeywordIntentType | null;
          data_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          keyword: string;
          country_id?: string | null;
          language_code?: string;
          is_data_found?: boolean;
          volume?: number | null;
          cpc?: number | null;
          competition?: number | null;
          difficulty?: number | null;
          history_trend?: Json | null;
          keyword_intent?: KeywordIntentType | null;
          data_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          keyword?: string;
          country_id?: string;
          language_code?: string;
          is_data_found?: boolean;
          volume?: number | null;
          cpc?: number | null;
          competition?: number | null;
          difficulty?: number | null;
          history_trend?: Json | null;
          keyword_intent?: KeywordIntentType | null;
          data_updated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      indb_keyword_domains: {
        Row: {
          id: string;
          user_id: string;
          domain_name: string;
          display_name: string | null;
          is_active: boolean;
          verification_status: 'pending' | 'verified' | 'failed';
          verification_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          domain_name: string;
          display_name?: string | null;
          is_active?: boolean;
          verification_status?: 'pending' | 'verified' | 'failed';
          verification_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          domain_name?: string;
          display_name?: string | null;
          is_active?: boolean;
          verification_status?: 'pending' | 'verified' | 'failed';
          verification_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      indb_keyword_rankings: {
        Row: {
          id: string;
          keyword_id: string;
          position: number | null;
          url: string | null;
          search_volume: number | null;
          difficulty_score: number | null;
          check_date: string;
          device_type: 'desktop' | 'mobile' | 'tablet' | null;
          country_id: string | null;
          tags: string[] | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          keyword_id: string;
          position?: number | null;
          url?: string | null;
          search_volume?: number | null;
          difficulty_score?: number | null;
          check_date?: string;
          device_type?: 'desktop' | 'mobile' | 'tablet' | null;
          country_id?: string | null;
          tags?: string[] | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          keyword_id?: string;
          position?: number | null;
          url?: string | null;
          search_volume?: number | null;
          difficulty_score?: number | null;
          check_date?: string;
          device_type?: 'desktop' | 'mobile' | 'tablet' | null;
          country_id?: string | null;
          tags?: string[] | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };

      indb_rank_keywords: {
        Row: {
          id: string;
          user_id: string;
          keyword: string;
          domain: string | null;
          device: 'desktop' | 'mobile' | 'tablet' | null;
          country: string | null;
          search_engine: SearchEngineType | null;
          target_url: string | null;
          tags: string[] | null;
          position: number | null;
          previous_position: number | null;
          is_active: boolean;
          last_checked: string | null;
          created_at: string;
          keyword_bank_id: string | null;
          intelligence_updated_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          keyword: string;
          domain?: string | null;
          device?: 'desktop' | 'mobile' | 'tablet' | null;
          country?: string | null;
          search_engine?: SearchEngineType | null;
          target_url?: string | null;
          tags?: string[] | null;
          position?: number | null;
          previous_position?: number | null;
          is_active?: boolean;
          last_checked?: string | null;
          created_at?: string;
          keyword_bank_id?: string | null;
          intelligence_updated_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          keyword?: string;
          domain?: string | null;
          device?: 'desktop' | 'mobile' | 'tablet' | null;
          country?: string | null;
          position?: number | null;
          previous_position?: number | null;
          last_checked?: string | null;
          created_at?: string;
          tags?: string[] | null;
          target_url?: string | null;
          search_engine?: SearchEngineType | null;
          is_active?: boolean;
          keyword_bank_id?: string | null;
          intelligence_updated_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'indb_rank_keywords_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      indb_notifications_dashboard: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationDashboardType;
          title: string;
          message: string | null;
          is_read: boolean;
          action_url: string | null;
          metadata: Json | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationDashboardType;
          title: string;
          message?: string | null;
          is_read?: boolean;
          action_url?: string | null;
          metadata?: Json | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationDashboardType;
          title?: string;
          message?: string | null;
          is_read?: boolean;
          action_url?: string | null;
          metadata?: Json | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      indb_site_integration: {
        Row: {
          id: string;
          user_id: string | null;
          service_name: string | null;
          api_key: string | null;
          api_url: string | null;
          api_quota_limit: number;
          api_quota_used: number;
          quota_reset_date: string | null;
          quota_reset_interval: QuotaResetInterval | null;
          is_active: boolean;
          rate_limits: Json | null;
          alert_settings: Json | null;
          last_health_check: string | null;
          health_status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          service_name?: string | null;
          api_key?: string | null;
          api_url?: string | null;
          api_quota_limit?: number;
          api_quota_used?: number;
          quota_reset_date?: string | null;
          quota_reset_interval?: QuotaResetInterval | null;
          is_active?: boolean;
          rate_limits?: SiteIntegrationRateLimits | null;
          alert_settings?: SiteIntegrationAlertSettings | null;
          last_health_check?: string | null;
          health_status?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          service_name?: string | null;
          api_key?: string | null;
          api_url?: string | null;
          api_quota_limit?: number;
          api_quota_used?: number;
          quota_reset_date?: string | null;
          quota_reset_interval?: QuotaResetInterval | null;
          is_active?: boolean;
          rate_limits?: SiteIntegrationRateLimits | null;
          alert_settings?: SiteIntegrationAlertSettings | null;
          last_health_check?: string | null;
          health_status?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      indb_admin_activity_logs: {
        Row: {
          id: string;
          admin_id: string;
          action_type: AdminActionType;
          action_description: string | null;
          target_type: AdminTargetType | null;
          target_id: string | null;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action_type: AdminActionType;
          action_description?: string | null;
          target_type?: AdminTargetType | null;
          target_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action_type?: AdminActionType;
          action_description?: string | null;
          target_type?: AdminTargetType | null;
          target_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: never[];
      };
      indb_admin_user_summary: {
        Row: {
          id: string;
          summary_date: string;
          total_users: number;
          new_users: number;
          active_users: number;
          paying_users: number;
          total_revenue: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          summary_date: string;
          total_users?: number;
          new_users?: number;
          active_users?: number;
          paying_users?: number;
          total_revenue?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          summary_date?: string;
          total_users?: number;
          new_users?: number;
          active_users?: number;
          paying_users?: number;
          total_revenue?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      indb_security_activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: SecurityActivityEventType;
          action_description: string | null;
          target_type: string | null;
          target_id: string | null;
          device_info: Json | null;
          location_data: Json | null;
          success: boolean;
          error_message: string | null;
          metadata: Json | null;
          details: Json | null;
          severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: SecurityActivityEventType;
          action_description?: string | null;
          target_type?: string | null;
          target_id?: string | null;
          device_info?: Json | null;
          location_data?: Json | null;
          success?: boolean;
          error_message?: string | null;
          metadata?: Json | null;
          details?: Json | null;
          severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_type?: SecurityActivityEventType;
          action_description?: string | null;
          target_type?: string | null;
          target_id?: string | null;
          device_info?: Json | null;
          location_data?: Json | null;
          success?: boolean;
          error_message?: string | null;
          metadata?: Json | null;
          details?: Json | null;
          severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: never[];
      };
      indb_security_audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: SecurityAuditEventType;
          description: string;
          success: boolean | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: SecurityAuditEventType;
          description: string;
          success?: boolean | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_type?: SecurityAuditEventType;
          description?: string;
          success?: boolean | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: never[];
      };
      indb_seranking_usage_logs: {
        Row: {
          id: string;
          integration_id: string;
          operation_type: SeRankingOperationType;
          request_count: number;
          successful_requests: number;
          failed_requests: number;
          response_time_ms: number | null;
          timestamp: string;
          date: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          integration_id: string;
          operation_type: SeRankingOperationType;
          request_count?: number;
          successful_requests?: number;
          failed_requests?: number;
          response_time_ms?: number | null;
          timestamp?: string;
          date?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          integration_id?: string;
          operation_type?: SeRankingOperationType;
          request_count?: number;
          successful_requests?: number;
          failed_requests?: number;
          response_time_ms?: number | null;
          timestamp?: string;
          date?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: never[];
      };
      indb_payment_gateways: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_active: boolean;
          is_default: boolean;
          api_credentials: Json | null;
          configuration: Json | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_active?: boolean;
          is_default?: boolean;
          api_credentials?: PaymentGatewayCredentials | null;
          configuration?: PaymentGatewayConfiguration | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          is_active?: boolean;
          is_default?: boolean;
          api_credentials?: Json | null;
          configuration?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: never[];
      };
      indb_payment_packages: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          currency: string;
          billing_period: 'monthly' | 'annual' | 'lifetime' | 'one-time';
          daily_quota: number;
          monthly_quota: number | null;
          features: PackageFeatures | null;
          quota_limits: PackageQuotaLimits | null;
          pricing_tiers: PackagePricingTier[] | PackagePricingTiers | null;
          free_trial_enabled: boolean;
          is_active: boolean;
          is_popular: boolean;
          sort_order: number;
          paddle_price_id: string | null;
          stripe_price_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          currency?: string;
          billing_period?: 'monthly' | 'annual' | 'lifetime' | 'one-time';
          daily_quota: number;
          monthly_quota?: number | null;
          features?: PackageFeatures | null;
          quota_limits?: PackageQuotaLimits | null;
          pricing_tiers?: PackagePricingTier[] | PackagePricingTiers | null;
          free_trial_enabled?: boolean;
          is_active?: boolean;
          is_popular?: boolean;
          sort_order?: number;
          paddle_price_id?: string | null;
          stripe_price_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          billing_period?: 'monthly' | 'annual' | 'lifetime' | 'one-time';
          daily_quota?: number;
          monthly_quota?: number | null;
          features?: PackageFeatures | null;
          quota_limits?: PackageQuotaLimits | null;
          pricing_tiers?: PackagePricingTier[] | PackagePricingTiers | null;
          free_trial_enabled?: boolean;
          is_active?: boolean;
          is_popular?: boolean;
          sort_order?: number;
          paddle_price_id?: string | null;
          stripe_price_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: never[];
      };
      indb_payment_transactions: {
        Row: {
          id: string;
          user_id: string | null;
          package_id: string | null;
          gateway_id: string | null;
          amount: number;
          currency: string;
          status: 'pending' | 'proof_uploaded' | 'completed' | 'failed' | 'cancelled' | 'refunded';
          /** Gateway-specific status string (e.g. Paddle/Stripe raw status). Unconstrained VARCHAR(100) — no SQL CHECK. */
          transaction_status: string | null;
          /** Gateway-specific payment state (e.g. 'paid', 'refunded'). Unconstrained VARCHAR(100) — no SQL CHECK. */
          payment_status: string | null;
          error_message: string | null;
          transaction_id: string | null;
          external_transaction_id: string | null;
          payment_method: string | null;
          proof_url: string | null;
          gateway_response: TransactionGatewayResponse | null;
          metadata: TransactionMetadata | null;
          notes: string | null;
          user_email: string | null;
          customer_name: string | null;
          order_id: string | null;
          package_name: string | null;
          billing_period: 'monthly' | 'annual' | 'lifetime' | 'one-time' | null;
          gross_amount: number | null;
          verified_by: string | null;
          verified_at: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          package_id?: string | null;
          gateway_id?: string | null;
          amount: number;
          currency?: string;
          status?: 'pending' | 'proof_uploaded' | 'completed' | 'failed' | 'cancelled' | 'refunded';
          transaction_status?: string | null;
          payment_status?: string | null;
          error_message?: string | null;
          transaction_id?: string | null;
          external_transaction_id?: string | null;
          payment_method?: string | null;
          proof_url?: string | null;
          gateway_response?: TransactionGatewayResponse | null;
          metadata?: TransactionMetadata | null;
          notes?: string | null;
          user_email?: string | null;
          customer_name?: string | null;
          order_id?: string | null;
          package_name?: string | null;
          billing_period?: 'monthly' | 'annual' | 'lifetime' | 'one-time' | null;
          gross_amount?: number | null;
          verified_by?: string | null;
          verified_at?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          package_id?: string | null;
          gateway_id?: string | null;
          amount?: number;
          currency?: string;
          status?: 'pending' | 'proof_uploaded' | 'completed' | 'failed' | 'cancelled' | 'refunded';
          transaction_status?: string | null;
          payment_status?: string | null;
          error_message?: string | null;
          transaction_id?: string | null;
          external_transaction_id?: string | null;
          payment_method?: string | null;
          proof_url?: string | null;
          gateway_response?: TransactionGatewayResponse | null;
          metadata?: TransactionMetadata | null;
          notes?: string | null;
          user_email?: string | null;
          customer_name?: string | null;
          order_id?: string | null;
          package_name?: string | null;
          billing_period?: 'monthly' | 'annual' | 'lifetime' | 'one-time' | null;
          gross_amount?: number | null;
          verified_by?: string | null;
          verified_at?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'indb_payment_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'indb_auth_user_profiles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'indb_payment_transactions_package_id_fkey';
            columns: ['package_id'];
            isOneToOne: false;
            referencedRelation: 'indb_payment_packages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'indb_payment_transactions_gateway_id_fkey';
            columns: ['gateway_id'];
            isOneToOne: false;
            referencedRelation: 'indb_payment_gateways';
            referencedColumns: ['id'];
          },
        ];
      };
      indb_payment_subscriptions: {
        Row: {
          id: string;
          user_id: string | null;
          package_id: string | null;
          status: 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing' | 'expired';
          start_date: string;
          end_date: string | null;
          canceled_at: string | null;
          cancel_at_period_end: boolean | null;
          paused_at: string | null;
          current_period_end: string | null;
          paddle_subscription_id: string | null;
          paddle_price_id: string | null;
          stripe_subscription_id: string | null;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          package_id?: string | null;
          status?: 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing' | 'expired';
          start_date: string;
          end_date?: string | null;
          canceled_at?: string | null;
          cancel_at_period_end?: boolean | null;
          paused_at?: string | null;
          current_period_end?: string | null;
          paddle_subscription_id?: string | null;
          paddle_price_id?: string | null;
          stripe_subscription_id?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          package_id?: string | null;
          status?: 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing' | 'expired';
          start_date?: string;
          end_date?: string | null;
          canceled_at?: string | null;
          cancel_at_period_end?: boolean | null;
          paused_at?: string | null;
          current_period_end?: string | null;
          paddle_subscription_id?: string | null;
          paddle_price_id?: string | null;
          stripe_subscription_id?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'indb_payment_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'indb_auth_user_profiles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'indb_payment_subscriptions_package_id_fkey';
            columns: ['package_id'];
            isOneToOne: false;
            referencedRelation: 'indb_payment_packages';
            referencedColumns: ['id'];
          },
        ];
      };
      indb_paddle_transactions: {
        Row: {
          id: string;
          transaction_id: string | null;
          paddle_transaction_id: string;
          paddle_subscription_id: string | null;
          paddle_customer_id: string | null;
          event_type: string | null;
          event_data: Json | null;
          status: string | null;
          amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transaction_id?: string | null;
          paddle_transaction_id: string;
          paddle_subscription_id?: string | null;
          paddle_customer_id?: string | null;
          event_type?: string | null;
          event_data?: Json | null;
          status?: string | null;
          amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string | null;
          paddle_transaction_id?: string;
          paddle_subscription_id?: string | null;
          paddle_customer_id?: string | null;
          event_type?: string | null;
          event_data?: Json | null;
          status?: string | null;
          amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      indb_paddle_webhook_events: {
        Row: {
          id: string;
          event_id: string;
          event_type: string;
          payload: Json;
          processed: boolean;
          processed_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          event_type: string;
          payload: Json;
          processed?: boolean;
          processed_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          event_type?: string;
          payload?: Json;
          processed?: boolean;
          processed_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: never[];
      };
      indb_site_settings: {
        Row: {
          id: string;
          site_name: string | null;
          site_description: string | null;
          site_logo_url: string | null;
          site_icon_url: string | null;
          site_favicon_url: string | null;
          contact_email: string | null;
          support_email: string | null;
          maintenance_mode: boolean;
          registration_enabled: boolean;
          smtp_host: string | null;
          smtp_port: number | null;
          smtp_user: string | null;
          smtp_pass: string | null;
          smtp_from_name: string | null;
          smtp_from_email: string | null;
          smtp_secure: boolean;
          smtp_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_name?: string;
          site_description?: string | null;
          site_logo_url?: string | null;
          site_icon_url?: string | null;
          site_favicon_url?: string | null;
          contact_email?: string | null;
          support_email?: string | null;
          maintenance_mode?: boolean;
          registration_enabled?: boolean;
          smtp_host?: string | null;
          smtp_port?: number | null;
          smtp_user?: string | null;
          smtp_pass?: string | null;
          smtp_from_name?: string | null;
          smtp_from_email?: string | null;
          smtp_secure?: boolean;
          smtp_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_name?: string;
          site_description?: string | null;
          site_logo_url?: string | null;
          site_icon_url?: string | null;
          site_favicon_url?: string | null;
          contact_email?: string | null;
          support_email?: string | null;
          maintenance_mode?: boolean;
          registration_enabled?: boolean;
          smtp_host?: string | null;
          smtp_port?: number | null;
          smtp_user?: string | null;
          smtp_pass?: string | null;
          smtp_from_name?: string | null;
          smtp_from_email?: string | null;
          smtp_secure?: boolean;
          smtp_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      indb_system_error_logs: {
        Row: {
          id: string;
          user_id: string | null;
          error_type: string;
          severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
          message: string;
          user_message: string | null;
          endpoint: string | null;
          http_method: string | null;
          status_code: number | null;
          metadata: Json | null;
          stack_trace: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          error_type: string;
          severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
          message: string;
          user_message?: string | null;
          endpoint?: string | null;
          http_method?: string | null;
          status_code?: number | null;
          metadata?: Json | null;
          stack_trace?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          error_type?: string;
          severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
          message?: string;
          user_message?: string | null;
          endpoint?: string | null;
          http_method?: string | null;
          status_code?: number | null;
          metadata?: Json | null;
          stack_trace?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      indb_enrichment_jobs: {
        Row: {
          id: string;
          user_id: string | null;
          name: string | null;
          job_type: string;
          status:
            | 'pending'
            | 'queued'
            | 'processing'
            | 'completed'
            | 'failed'
            | 'cancelled'
            | 'paused'
            | 'retrying';
          priority: number;
          config: EnrichmentJobConfig | null;
          source_data: Json | null;
          progress_data: Json | null;
          result_data: Json | null;
          results: JobResult | null;
          error_message: string | null;
          retry_count: number;
          metadata: Json | null;
          next_retry_at: string | null;
          last_retry_at: string | null;
          worker_id: string | null;
          locked_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          total_keywords: number | null;
          processed_keywords: number | null;
          enriched_keywords: number | null;
          failed_keywords: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          job_type: string;
          status?:
            | 'pending'
            | 'queued'
            | 'processing'
            | 'completed'
            | 'failed'
            | 'cancelled'
            | 'paused'
            | 'retrying';
          priority?: number;
          config?: EnrichmentJobConfig | null;
          source_data?: Json | null;
          progress_data?: Json | null;
          result_data?: Json | null;
          results?: JobResult | null;
          error_message?: string | null;
          retry_count?: number;
          metadata?: Json | null;
          next_retry_at?: string | null;
          last_retry_at?: string | null;
          worker_id?: string | null;
          locked_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          total_keywords?: number | null;
          processed_keywords?: number | null;
          enriched_keywords?: number | null;
          failed_keywords?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          job_type?: string;
          status?:
            | 'pending'
            | 'queued'
            | 'processing'
            | 'completed'
            | 'failed'
            | 'cancelled'
            | 'paused'
            | 'retrying';
          priority?: number;
          config?: EnrichmentJobConfig | null;
          source_data?: Json | null;
          progress_data?: Json | null;
          result_data?: Json | null;
          results?: JobResult | null;
          error_message?: string | null;
          retry_count?: number;
          metadata?: Json | null;
          next_retry_at?: string | null;
          last_retry_at?: string | null;
          worker_id?: string | null;
          locked_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          total_keywords?: number | null;
          processed_keywords?: number | null;
          enriched_keywords?: number | null;
          failed_keywords?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      indb_api_keys: {
        Row: {
          id: string;
          service_name: string;
          key_value: string;
          is_active: boolean;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_name: string;
          key_value: string;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_name?: string;
          key_value?: string;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      indb_system_activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          description: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_type?: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: never[];
      };
      indb_seranking_metrics_raw: {
        Row: {
          id: string;
          timestamp: string;
          endpoint: string;
          method: string;
          status: 'success' | 'error' | 'timeout' | 'rate_limited';
          duration_ms: number;
          request_size: number | null;
          response_size: number | null;
          cache_hit: boolean;
          error_type: string | null;
          error_message: string | null;
          user_id: string | null;
          quota_remaining: number | null;
          rate_limit_remaining: number | null;
          retry_attempt: number;
          country_code: string | null;
          keyword_count: number | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          timestamp?: string;
          endpoint: string;
          method?: string;
          status: 'success' | 'error' | 'timeout' | 'rate_limited';
          duration_ms: number;
          request_size?: number | null;
          response_size?: number | null;
          cache_hit?: boolean;
          error_type?: string | null;
          error_message?: string | null;
          user_id?: string | null;
          quota_remaining?: number | null;
          rate_limit_remaining?: number | null;
          retry_attempt?: number;
          country_code?: string | null;
          keyword_count?: number | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          timestamp?: string;
          endpoint?: string;
          method?: string;
          status?: 'success' | 'error' | 'timeout' | 'rate_limited';
          duration_ms?: number;
          request_size?: number | null;
          response_size?: number | null;
          cache_hit?: boolean;
          error_type?: string | null;
          error_message?: string | null;
          user_id?: string | null;
          quota_remaining?: number | null;
          rate_limit_remaining?: number | null;
          retry_attempt?: number;
          country_code?: string | null;
          keyword_count?: number | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: never[];
      };
      indb_seranking_metrics_aggregated: {
        Row: {
          id: string;
          period: string;
          period_type: 'hour' | 'day' | 'week' | 'month';
          total_requests: number;
          successful_requests: number;
          failed_requests: number;
          average_response_time: number;
          cache_hit_rate: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          period: string;
          period_type: 'hour' | 'day' | 'week' | 'month';
          total_requests?: number;
          successful_requests?: number;
          failed_requests?: number;
          average_response_time?: number;
          cache_hit_rate?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          period?: string;
          period_type?: 'hour' | 'day' | 'week' | 'month';
          total_requests?: number;
          successful_requests?: number;
          failed_requests?: number;
          average_response_time?: number;
          cache_hit_rate?: number;
          created_at?: string;
        };
        Relationships: never[];
      };
      indb_seranking_quota_usage: {
        Row: {
          id: string;
          timestamp: string;
          user_id: string | null;
          operation_type: string;
          quota_consumed: number;
          quota_remaining: number;
          quota_limit: number;
          usage_percentage: number;
          session_id: string | null;
          service_account_id: string | null;
          endpoint: string | null;
          country_code: string | null;
          keywords_count: number | null;
          cost_per_request: number | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          timestamp?: string;
          user_id?: string | null;
          operation_type?: string;
          quota_consumed: number;
          quota_remaining: number;
          quota_limit: number;
          usage_percentage: number;
          session_id?: string | null;
          service_account_id?: string | null;
          endpoint?: string | null;
          country_code?: string | null;
          keywords_count?: number | null;
          cost_per_request?: number | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          timestamp?: string;
          user_id?: string | null;
          operation_type?: string;
          quota_consumed?: number;
          quota_remaining?: number;
          quota_limit?: number;
          usage_percentage?: number;
          session_id?: string | null;
          service_account_id?: string | null;
          endpoint?: string | null;
          country_code?: string | null;
          keywords_count?: number | null;
          cost_per_request?: number | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: never[];
      };
      indb_seranking_health_checks: {
        Row: {
          id: string;
          timestamp: string;
          service_name: string;
          check_type: 'api' | 'database' | 'cache' | 'queue' | 'dependency' | 'custom';
          dependency_level: 'critical' | 'important' | 'optional';
          status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
          response_time: number;
          error_message: string | null;
          metrics: Json;
          diagnostics: Json;
          recommendations: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          timestamp?: string;
          service_name: string;
          check_type: 'api' | 'database' | 'cache' | 'queue' | 'dependency' | 'custom';
          dependency_level: 'critical' | 'important' | 'optional';
          status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
          response_time: number;
          error_message?: string | null;
          metrics?: Json;
          diagnostics?: Json;
          recommendations?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          timestamp?: string;
          service_name?: string;
          check_type?: 'api' | 'database' | 'cache' | 'queue' | 'dependency' | 'custom';
          dependency_level?: 'critical' | 'important' | 'optional';
          status?: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
          response_time?: number;
          error_message?: string | null;
          metrics?: Json;
          diagnostics?: Json;
          recommendations?: Json;
          created_at?: string;
        };
        Relationships: never[];
      };
      indb_payment_transactions_history: {
        Row: {
          id: string;
          transaction_id: string;
          old_status: string | null;
          new_status: string;
          action_type: string;
          action_description: string;
          changed_by: string | null;
          changed_by_type: string;
          old_values: Json | null;
          new_values: Json | null;
          notes: string | null;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          old_status?: string | null;
          new_status: string;
          action_type: string;
          action_description: string;
          changed_by?: string | null;
          changed_by_type: string;
          old_values?: Json | null;
          new_values?: Json | null;
          notes?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          old_status?: string | null;
          new_status?: string;
          action_type?: string;
          action_description?: string;
          changed_by?: string | null;
          changed_by_type?: string;
          old_values?: Json | null;
          new_values?: Json | null;
          notes?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: never[];
      };
      'auth.users': {
        Row: {
          id: string;
          email: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string | null;
        };
        Relationships: never[];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      update_keyword_position_atomic: {
        Args: {
          target_keyword_id: string;
          new_rank_position: number;
        };
        Returns: void;
      };
      add_tags_to_keywords_atomic: {
        Args: {
          target_keyword_ids: string[];
          target_user_id: string;
          new_tags: string[];
        };
        Returns: number;
      };
      get_user_domain_stats: {
        Args: {
          target_user_id: string;
        };
        Returns: {
          domain: string;
          keyword_count: number;
        }[];
      };
      consume_user_quota: {
        Args: {
          target_user_id: string;
          quota_amount: number;
        };
        Returns: boolean;
      };
      activate_order_with_plan: {
        Args: {
          p_transaction_id: string;
          p_new_status: string;
          p_admin_user_id: string;
          p_notes: string | null;
        };
        Returns: Json;
      };
      get_user_emails_by_ids: {
        Args: {
          p_user_ids: string[];
        };
        Returns: {
          id: string;
          email: string;
        }[];
      };
      increment_user_quota: {
        Args: {
          target_user_id: string;
          resource_type: string;
          amount: number;
        };
        Returns: undefined;
      };
      get_total_revenue: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_revenue_by_period: {
        Args: {
          start_date: string;
          end_date: string;
        };
        Returns: number;
      };
      bulk_delete_keywords_service: {
        Args: {
          p_keyword_ids: string[];
          p_user_id: string;
        };
        Returns: number;
      };
      set_default_payment_gateway_service: {
        Args: {
          p_gateway_id: string;
        };
        Returns: undefined;
      };
      save_rank_check_result_service: {
        Args: {
          p_keyword_id: string;
          p_user_id: string;
          p_position: number;
          p_url: string | null;
          p_check_date: string;
          p_device_type: 'desktop' | 'mobile' | 'tablet' | null;
          p_country_iso: string | null;
        };
        Returns: undefined;
      };
      get_user_completed_amount: {
        Args: {
          p_user_id: string;
        };
        Returns: number;
      };
      get_error_type_distribution: {
        Args: {
          p_since: string;
        };
        Returns: Json;
      };
      get_error_severity_distribution: {
        Args: {
          p_since: string;
        };
        Returns: Json;
      };
      get_error_endpoint_distribution: {
        Args: {
          p_since: string;
          p_limit: number;
        };
        Returns: {
          endpoint: string;
          count: number;
        }[];
      };
      get_domain_keyword_counts: {
        Args: {
          p_user_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience types
export type UserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Row'];
export type UserSettings = Database['public']['Tables']['indb_auth_user_settings']['Row'];

export type DashboardNotification =
  Database['public']['Tables']['indb_notifications_dashboard']['Row'];
export type KeywordCountry = Database['public']['Tables']['indb_keyword_countries']['Row'];
export type KeywordDomain = Database['public']['Tables']['indb_keyword_domains']['Row'];
/** @deprecated (#V7 M-03) Use RankKeywordRow instead */
export type KeywordKeyword = Database['public']['Tables']['indb_rank_keywords']['Row'];
export type KeywordRanking = Database['public']['Tables']['indb_keyword_rankings']['Row'];
export type RankKeywordRow = Database['public']['Tables']['indb_rank_keywords']['Row'];
export type SiteIntegration = Database['public']['Tables']['indb_site_integration']['Row'];
/** (#V7 M-04) Maps to indb_site_integration, not a separate SE Ranking table */
export type SeRankingIntegration = Database['public']['Tables']['indb_site_integration']['Row'];
export type SeRankingUsageLog = Database['public']['Tables']['indb_seranking_usage_logs']['Row'];
export type SecurityAuditLog = Database['public']['Tables']['indb_security_audit_logs']['Row'];
export type SecurityActivityLog =
  Database['public']['Tables']['indb_security_activity_logs']['Row'];
export type SystemErrorLog = Database['public']['Tables']['indb_system_error_logs']['Row'];

export type PackageRow = Database['public']['Tables']['indb_payment_packages']['Row'];
export type SubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row'];
export type TransactionRow = Database['public']['Tables']['indb_payment_transactions']['Row'];
export type ProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row'];
export type UserSettingsRow = Database['public']['Tables']['indb_auth_user_settings']['Row'];

export type PaymentGatewayRow = Database['public']['Tables']['indb_payment_gateways']['Row'];

// Insert types
export type InsertUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Insert'];
export type InsertUserSettings = Database['public']['Tables']['indb_auth_user_settings']['Insert'];

export type InsertDashboardNotification =
  Database['public']['Tables']['indb_notifications_dashboard']['Insert'];
export type InsertKeywordCountry = Database['public']['Tables']['indb_keyword_countries']['Insert'];
export type InsertKeywordDomain = Database['public']['Tables']['indb_keyword_domains']['Insert'];
/** @deprecated (#V7 M-03) Use InsertRankKeyword instead */
export type InsertKeywordKeyword = Database['public']['Tables']['indb_rank_keywords']['Insert'];
export type InsertKeywordRanking = Database['public']['Tables']['indb_keyword_rankings']['Insert'];
export type InsertSiteIntegration = Database['public']['Tables']['indb_site_integration']['Insert'];
export type InsertSeRankingIntegration =
  Database['public']['Tables']['indb_site_integration']['Insert'];
export type InsertSeRankingUsageLog =
  Database['public']['Tables']['indb_seranking_usage_logs']['Insert'];
export type InsertSecurityAuditLog =
  Database['public']['Tables']['indb_security_audit_logs']['Insert'];
export type InsertSecurityActivityLog =
  Database['public']['Tables']['indb_security_activity_logs']['Insert'];
export type InsertSubscription =
  Database['public']['Tables']['indb_payment_subscriptions']['Insert'];
export type InsertTransaction = Database['public']['Tables']['indb_payment_transactions']['Insert'];
export type InsertPackage = Database['public']['Tables']['indb_payment_packages']['Insert'];
export type InsertPaymentGateway = Database['public']['Tables']['indb_payment_gateways']['Insert'];

// Update types
export type UpdateUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Update'];
export type UpdateUserSettings = Database['public']['Tables']['indb_auth_user_settings']['Update'];

export type UpdateKeywordDomain = Database['public']['Tables']['indb_keyword_domains']['Update'];
/** @deprecated (#V7 M-03) Use UpdateRankKeyword instead */
export type UpdateKeywordKeyword = Database['public']['Tables']['indb_rank_keywords']['Update'];
export type UpdateKeywordRanking = Database['public']['Tables']['indb_keyword_rankings']['Update'];
export type UpdateSiteIntegration = Database['public']['Tables']['indb_site_integration']['Update'];
export type UpdateSeRankingIntegration =
  Database['public']['Tables']['indb_site_integration']['Update'];
export type UpdateSeRankingUsageLog =
  Database['public']['Tables']['indb_seranking_usage_logs']['Update'];

export type UpdateDashboardNotification =
  Database['public']['Tables']['indb_notifications_dashboard']['Update'];
export type UpdateTransaction = Database['public']['Tables']['indb_payment_transactions']['Update'];
export type UpdateSubscription =
  Database['public']['Tables']['indb_payment_subscriptions']['Update'];
export type UpdatePackage = Database['public']['Tables']['indb_payment_packages']['Update'];
export type UpdatePaymentGateway = Database['public']['Tables']['indb_payment_gateways']['Update'];

export type SiteSettingsRow = Database['public']['Tables']['indb_site_settings']['Row'];
export type InsertSiteSettings = Database['public']['Tables']['indb_site_settings']['Insert'];
export type UpdateSiteSettings = Database['public']['Tables']['indb_site_settings']['Update'];
