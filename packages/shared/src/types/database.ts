import { type PostgrestError } from '@supabase/supabase-js'
import type { EnrichmentJobConfig, JobResult } from './business/EnrichmentJobTypes'

export type { PostgrestError }

// TypeScript types for Supabase database tables
// Generated from the database schema

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

/**
 * Strict JSON types for database columns
 */
export interface PackageFeatures {
    rank_tracking: boolean
    keyword_research: boolean
    api_access: boolean
    custom_reports: boolean
    priority_support: boolean
    [key: string]: boolean | string | number | undefined
}

export interface PackageQuotaLimits {
    daily_keywords: number
    monthly_keywords?: number
    max_domains: number
    [key: string]: number | undefined
}

export interface PackagePricingTier {
    name: string
    price: number
    currency: string
    billing_period: 'monthly' | 'yearly'
    paddle_price_id?: string
}

export interface PricingTierDetails {
    regular_price: number
    promo_price?: number
    period_label?: string
    paddle_price_id?: string
}

export type PackagePricingTiers = Record<string, PricingTierDetails | undefined>

export interface SiteIntegrationRateLimits {
    requests_per_second?: number
    requests_per_minute?: number
    requests_per_day?: number
    concurrent_requests?: number
    [key: string]: number | undefined
}

export interface SiteIntegrationAlertSettings {
    quota_threshold_percent?: number
    error_rate_threshold?: number
    latency_threshold_ms?: number
    notify_email?: boolean
    notify_webhook?: boolean
    [key: string]: boolean | number | string | undefined
}

export interface PaymentGatewayCredentials {
    api_key?: string
    client_token?: string
    secret_key?: string
    webhook_secret?: string
    vendor_id?: string
    auth_code?: string
    [key: string]: string | undefined
}

export interface PaymentGatewayConfiguration {
    environment?: 'sandbox' | 'production' | 'test'
    sandbox_mode?: boolean
    return_url?: string
    cancel_url?: string
    currency?: string
    [key: string]: string | boolean | number | undefined
}

export interface TransactionGatewayResponse {
    transaction_id?: string
    status?: string
    amount?: number
    currency?: string
    [key: string]: Json | undefined
}

export interface TransactionMetadata {
    original_amount?: number
    original_currency?: string
    customer_info?: Json
    user_id?: string
    user_email?: string
    package_id?: string
    billing_period?: string
    created_at?: string
    payment_type?: string
    
    // Paddle specific
    custom_data?: Json
    items?: Json[]
    
    // Processor specific
    transactionId?: string
    gatewayTransactionId?: string
    paymentStatus?: string
    mappedStatus?: string
    hasGatewayResponse?: boolean
    
    [key: string]: Json | undefined
}

export type Database = {
    public: {
        Tables: {
            indb_auth_user_profiles: {
                Row: {
                    id: string
                    user_id: string
                    full_name: string | null
                    phone_number: string | null
                    country: string | null
                    role: 'user' | 'admin' | 'super_admin'
                    email_verified: boolean
                    avatar_url: string | null
                    package_id: string | null
                    subscription_start_date: string | null
                    subscription_end_date: string | null
                    daily_quota_limit: number
                    daily_quota_used: number
                    quota_reset_date: string | null
                    is_active: boolean
                    is_suspended: boolean
                    is_trial_active: boolean
                    trial_ends_at: string | null
                    suspension_reason: string | null
                    suspended_at: string | null
                    last_login_at: string | null
                    last_login_ip: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    full_name?: string | null
                    phone_number?: string | null
                    country?: string | null
                    role?: 'user' | 'admin' | 'super_admin'
                    email_verified?: boolean
                    avatar_url?: string | null
                    package_id?: string | null
                    subscription_start_date?: string | null
                    subscription_end_date?: string | null
                    daily_quota_limit?: number
                    daily_quota_used?: number
                    quota_reset_date?: string | null
                    is_active?: boolean
                    is_suspended?: boolean
                    is_trial_active?: boolean
                    trial_ends_at?: string | null
                    suspension_reason?: string | null
                    suspended_at?: string | null
                    last_login_at?: string | null
                    last_login_ip?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    full_name?: string | null
                    phone_number?: string | null
                    country?: string | null
                    role?: 'user' | 'admin' | 'super_admin'
                    email_verified?: boolean
                    avatar_url?: string | null
                    package_id?: string | null
                    subscription_start_date?: string | null
                    subscription_end_date?: string | null
                    daily_quota_limit?: number
                    daily_quota_used?: number
                    quota_reset_date?: string | null
                    is_active?: boolean
                    is_suspended?: boolean
                    is_trial_active?: boolean
                    trial_ends_at?: string | null
                    suspension_reason?: string | null
                    suspended_at?: string | null
                    last_login_at?: string | null
                    last_login_ip?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "indb_auth_user_profiles_package_id_fkey"
                        columns: ["package_id"]
                        isOneToOne: false
                        referencedRelation: "indb_payment_packages"
                        referencedColumns: ["id"]
                    }
                ]
            }
            indb_auth_user_settings: {
                Row: {
                    id: string
                    user_id: string
                    timeout_duration: number
                    retry_attempts: number
                    email_job_completion: boolean
                    email_job_failure: boolean
                    email_quota_alerts: boolean
                    default_schedule: 'one-time' | 'hourly' | 'daily' | 'weekly' | 'monthly'
                    email_daily_report: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    timeout_duration?: number
                    retry_attempts?: number
                    email_job_completion?: boolean
                    email_job_failure?: boolean
                    email_quota_alerts?: boolean
                    default_schedule?: 'one-time' | 'hourly' | 'daily' | 'weekly' | 'monthly'
                    email_daily_report?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    timeout_duration?: number
                    retry_attempts?: number
                    email_job_completion?: boolean
                    email_job_failure?: boolean
                    email_quota_alerts?: boolean
                    default_schedule?: 'one-time' | 'hourly' | 'daily' | 'weekly' | 'monthly'
                    email_daily_report?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "indb_auth_user_profiles_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }

            indb_keyword_countries: {
                Row: {
                    id: string
                    name: string
                    iso2_code: string
                    iso3_code: string
                    numeric_code: string
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    iso2_code: string
                    iso3_code: string
                    numeric_code: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    iso2_code?: string
                    iso3_code?: string
                    numeric_code?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_keyword_bank: {
                Row: {
                    id: string
                    keyword: string
                    country_id: string
                    language_code: string
                    is_data_found: boolean
                    volume: number | null
                    cpc: number | null
                    competition: number | null
                    difficulty: number | null
                    history_trend: Json | null
                    keyword_intent: string | null
                    data_updated_at: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    keyword: string
                    country_id: string
                    language_code?: string
                    is_data_found?: boolean
                    volume?: number | null
                    cpc?: number | null
                    competition?: number | null
                    difficulty?: number | null
                    history_trend?: Json | null
                    keyword_intent?: string | null
                    data_updated_at?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    keyword?: string
                    country_id?: string
                    language_code?: string
                    is_data_found?: boolean
                    volume?: number | null
                    cpc?: number | null
                    competition?: number | null
                    difficulty?: number | null
                    history_trend?: Json | null
                    keyword_intent?: string | null
                    data_updated_at?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_keyword_domains: {
                Row: {
                    id: string
                    user_id: string
                    domain_name: string
                    display_name: string | null
                    is_active: boolean
                    verification_status: 'pending' | 'verified' | 'failed'
                    verification_code: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    domain_name: string
                    display_name?: string | null
                    is_active?: boolean
                    verification_status?: 'pending' | 'verified' | 'failed'
                    verification_code?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    domain_name?: string
                    display_name?: string | null
                    is_active?: boolean
                    verification_status?: 'pending' | 'verified' | 'failed'
                    verification_code?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_keyword_keywords: {
                Row: {
                    id: string
                    user_id: string
                    domain_id: string
                    keyword: string
                    device_type: 'desktop' | 'mobile'
                    country_id: string
                    tags: string[]
                    is_active: boolean
                    last_check_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    domain_id: string
                    keyword: string
                    device_type?: 'desktop' | 'mobile'
                    country_id: string
                    tags?: string[]
                    is_active?: boolean
                    last_check_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    domain_id?: string
                    keyword?: string
                    device_type?: 'desktop' | 'mobile'
                    country_id?: string
                    tags?: string[]
                    is_active?: boolean
                    last_check_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_keyword_rankings: {
                Row: {
                    id: string
                    keyword_id: string
                    position: number | null
                    url: string | null
                    search_volume: number | null
                    difficulty_score: number | null
                    check_date: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    keyword_id: string
                    position?: number | null
                    url?: string | null
                    search_volume?: number | null
                    difficulty_score?: number | null
                    check_date?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    keyword_id?: string
                    position?: number | null
                    url?: string | null
                    search_volume?: number | null
                    difficulty_score?: number | null
                    check_date?: string
                    created_at?: string
                }
            }
            indb_keyword_usage: {
                Row: {
                    id: string
                    user_id: string
                    keywords_used: number
                    keywords_limit: number
                    period_start: string
                    period_end: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    keywords_used?: number
                    keywords_limit?: number
                    period_start?: string
                    period_end?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    keywords_used?: number
                    keywords_limit?: number
                    period_start?: string
                    period_end?: string
                    created_at?: string
                    updated_at?: string
                }
            }


            indb_rank_keywords: {
                Row: {
                    id: string
                    user_id: string
                    keyword: string
                    domain: string | null
                    device: string | null
                    country: string | null
                    search_engine: string | null
                    target_url: string | null
                    tags: string[] | null
                    position: number | null
                    previous_position: number | null
                    is_active: boolean
                    last_checked: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    keyword: string
                    domain?: string | null
                    device?: string | null
                    country?: string | null
                    search_engine?: string | null
                    target_url?: string | null
                    tags?: string[] | null
                    position?: number | null
                    previous_position?: number | null
                    is_active?: boolean
                    last_checked?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    keyword?: string
                    domain?: string | null
                    device?: string | null
                    country?: string | null
                    position?: number | null
                    previous_position?: number | null
                    last_checked?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "indb_rank_keywords_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            indb_notifications_dashboard: {
                Row: {
                    id: string
                    user_id: string
                    type: 'info' | 'success' | 'warning' | 'error'
                    title: string
                    message: string
                    is_read: boolean
                    action_url: string | null
                    metadata: Json
                    expires_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: 'info' | 'success' | 'warning' | 'error'
                    title: string
                    message: string
                    is_read?: boolean
                    action_url?: string | null
                    metadata?: Json
                    expires_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: 'info' | 'success' | 'warning' | 'error'
                    title?: string
                    message?: string
                    is_read?: boolean
                    action_url?: string | null
                    metadata?: Json
                    expires_at?: string | null
                    created_at?: string
                }
            }
            indb_analytics_daily_stats: {
                Row: {
                    id: string
                    user_id: string
                    date: string
                    total_jobs: number
                    completed_jobs: number
                    failed_jobs: number
                    total_urls_submitted: number
                    total_urls_indexed: number
                    total_urls_failed: number
                    quota_usage: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    date: string
                    total_jobs?: number
                    completed_jobs?: number
                    failed_jobs?: number
                    total_urls_submitted?: number
                    total_urls_indexed?: number
                    total_urls_failed?: number
                    quota_usage?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    date?: string
                    total_jobs?: number
                    completed_jobs?: number
                    failed_jobs?: number
                    total_urls_submitted?: number
                    total_urls_indexed?: number
                    total_urls_failed?: number
                    quota_usage?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_site_integration: {
                Row: {
                    id: string
                    user_id: string
                    service_name: string
                    api_key: string
                    api_url: string
                    api_quota_limit: number
                    api_quota_used: number
                    quota_reset_date: string
                    quota_reset_interval: string
                    is_active: boolean
                    rate_limits: Json
                    alert_settings: Json
                    last_health_check: string | null
                    health_status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    service_name: string
                    api_key?: string
                    api_url?: string
                    api_quota_limit?: number
                    api_quota_used?: number
                    quota_reset_date?: string
                    quota_reset_interval?: string
                    is_active?: boolean
                    rate_limits?: SiteIntegrationRateLimits
                    alert_settings?: SiteIntegrationAlertSettings
                    last_health_check?: string | null
                    health_status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    service_name?: string
                    api_key?: string
                    api_url?: string
                    api_quota_limit?: number
                    api_quota_used?: number
                    quota_reset_date?: string
                    quota_reset_interval?: string
                    is_active?: boolean
                    rate_limits?: Json
                    alert_settings?: Json
                    last_health_check?: string | null
                    health_status?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_admin_activity_logs: {
                Row: {
                    id: string
                    admin_id: string
                    action_type: string
                    action_description: string
                    target_type: string | null
                    target_id: string | null
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    admin_id: string
                    action_type: string
                    action_description: string
                    target_type?: string | null
                    target_id?: string | null
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    admin_id?: string
                    action_type?: string
                    action_description?: string
                    target_type?: string | null
                    target_id?: string | null
                    metadata?: Json | null
                    created_at?: string
                }
                Relationships: []
            }
            indb_admin_user_summary: {
                Row: {
                    id: string
                    summary_date: string
                    total_users: number
                    new_users: number
                    active_users: number
                    paying_users: number
                    total_revenue: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    summary_date: string
                    total_users?: number
                    new_users?: number
                    active_users?: number
                    paying_users?: number
                    total_revenue?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    summary_date?: string
                    total_users?: number
                    new_users?: number
                    active_users?: number
                    paying_users?: number
                    total_revenue?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_security_activity_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    action: string
                    description: string | null
                    ip_address: string | null
                    user_agent: string | null
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    action: string
                    description?: string | null
                    ip_address?: string | null
                    user_agent?: string | null
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    action?: string
                    description?: string | null
                    ip_address?: string | null
                    user_agent?: string | null
                    metadata?: Json
                    created_at?: string
                }
                Relationships: []
            }
            indb_security_audit_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    event_type: string
                    description: string
                    success: boolean | null
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    event_type: string
                    description: string
                    success?: boolean | null
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    event_type?: string
                    description?: string
                    success?: boolean | null
                    metadata?: Json
                    created_at?: string
                }
            }
            indb_seranking_usage_logs: {
                Row: {
                    id: string
                    integration_id: string
                    operation_type: string
                    request_count: number
                    successful_requests: number
                    failed_requests: number
                    response_time_ms: number | null
                    timestamp: string
                    date: string
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    integration_id: string
                    operation_type: string
                    request_count?: number
                    successful_requests?: number
                    failed_requests?: number
                    response_time_ms?: number | null
                    timestamp?: string
                    date?: string
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    integration_id?: string
                    operation_type?: string
                    request_count?: number
                    successful_requests?: number
                    failed_requests?: number
                    response_time_ms?: number | null
                    timestamp?: string
                    date?: string
                    metadata?: Json | null
                    created_at?: string
                }
            }
            indb_payment_gateways: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    is_active: boolean
                    is_default: boolean
                    api_credentials: Json | null
                    configuration: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    is_active?: boolean
                    is_default?: boolean
                    api_credentials?: PaymentGatewayCredentials | null
                    configuration?: PaymentGatewayConfiguration | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    is_active?: boolean
                    is_default?: boolean
                    api_credentials?: Json | null
                    configuration?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_payment_packages: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    price: number
                    currency: string
                    billing_period: string
                    daily_quota: number
                    monthly_quota: number | null
                    features: PackageFeatures | null
                    quota_limits: PackageQuotaLimits | null
                    pricing_tiers: PackagePricingTier[] | PackagePricingTiers | null
                    free_trial_enabled: boolean
                    is_active: boolean
                    is_popular: boolean
                    sort_order: number
                    paddle_price_id: string | null
                    stripe_price_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    price: number
                    currency?: string
                    billing_period?: string
                    daily_quota: number
                    monthly_quota?: number | null
                    features?: PackageFeatures | null
                    quota_limits?: PackageQuotaLimits | null
                    pricing_tiers?: PackagePricingTier[] | PackagePricingTiers | null
                    free_trial_enabled?: boolean
                    is_active?: boolean
                    is_popular?: boolean
                    sort_order?: number
                    paddle_price_id?: string | null
                    stripe_price_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    price?: number
                    currency?: string
                    billing_period?: string
                    daily_quota?: number
                    monthly_quota?: number | null
                    features?: PackageFeatures | null
                    quota_limits?: PackageQuotaLimits | null
                    pricing_tiers?: PackagePricingTier[] | PackagePricingTiers | null
                    free_trial_enabled?: boolean
                    is_active?: boolean
                    is_popular?: boolean
                    sort_order?: number
                    paddle_price_id?: string | null
                    stripe_price_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_payment_transactions: {
                Row: {
                    id: string
                    user_id: string
                    package_id: string | null
                    gateway_id: string | null
                    amount: number
                    currency: string
                    status: 'pending' | 'proof_uploaded' | 'completed' | 'failed' | 'cancelled' | 'refunded'
                    payment_status: string | null
                    error_message: string | null
                    transaction_id: string | null
                    external_transaction_id: string | null
                    payment_method: string | null
                    proof_url: string | null
                    gateway_response: TransactionGatewayResponse | null
                    metadata: TransactionMetadata | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    package_id?: string | null
                    gateway_id?: string | null
                    amount: number
                    currency?: string
                    status?: 'pending' | 'proof_uploaded' | 'completed' | 'failed' | 'cancelled' | 'refunded'
                    payment_status?: string | null
                    error_message?: string | null
                    transaction_id?: string | null
                    external_transaction_id?: string | null
                    payment_method?: string | null
                    proof_url?: string | null
                    gateway_response?: TransactionGatewayResponse | null
                    metadata?: TransactionMetadata | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    package_id?: string | null
                    gateway_id?: string | null
                    amount?: number
                    currency?: string
                    status?: 'pending' | 'proof_uploaded' | 'completed' | 'failed' | 'cancelled' | 'refunded'
                    payment_status?: string | null
                    error_message?: string | null
                    transaction_id?: string | null
                    external_transaction_id?: string | null
                    payment_method?: string | null
                    proof_url?: string | null
                    gateway_response?: TransactionGatewayResponse | null
                    metadata?: TransactionMetadata | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "indb_payment_transactions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "indb_auth_user_profiles"
                        referencedColumns: ["user_id"]
                    },
                    {
                        foreignKeyName: "indb_payment_transactions_package_id_fkey"
                        columns: ["package_id"]
                        isOneToOne: false
                        referencedRelation: "indb_payment_packages"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "indb_payment_transactions_gateway_id_fkey"
                        columns: ["gateway_id"]
                        isOneToOne: false
                        referencedRelation: "indb_payment_gateways"
                        referencedColumns: ["id"]
                    }
                ]
            }
            indb_payment_subscriptions: {
                Row: {
                    id: string
                    user_id: string
                    package_id: string | null
                    status: 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing' | 'expired'
                    start_date: string
                    end_date: string | null
                    canceled_at: string | null
                    cancel_at_period_end: boolean | null
                    paused_at: string | null
                    current_period_end: string | null
                    paddle_subscription_id: string | null
                    paddle_price_id: string | null
                    stripe_subscription_id: string | null
                    cancel_reason: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    package_id?: string | null
                    status?: 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing' | 'expired'
                    start_date: string
                    end_date?: string | null
                    canceled_at?: string | null
                    cancel_at_period_end?: boolean | null
                    paused_at?: string | null
                    current_period_end?: string | null
                    paddle_subscription_id?: string | null
                    paddle_price_id?: string | null
                    stripe_subscription_id?: string | null
                    cancel_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    package_id?: string | null
                    status?: 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing' | 'expired'
                    start_date?: string
                    end_date?: string | null
                    canceled_at?: string | null
                    cancel_at_period_end?: boolean | null
                    paused_at?: string | null
                    current_period_end?: string | null
                    paddle_subscription_id?: string | null
                    paddle_price_id?: string | null
                    stripe_subscription_id?: string | null
                    cancel_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "indb_payment_subscriptions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "indb_auth_user_profiles"
                        referencedColumns: ["user_id"]
                    },
                    {
                        foreignKeyName: "indb_payment_subscriptions_package_id_fkey"
                        columns: ["package_id"]
                        isOneToOne: false
                        referencedRelation: "indb_payment_packages"
                        referencedColumns: ["id"]
                    }
                ]
            }
            indb_paddle_transactions: {
                Row: {
                    id: string
                    transaction_id: string | null
                    paddle_transaction_id: string
                    paddle_subscription_id: string | null
                    paddle_customer_id: string | null
                    event_type: string | null
                    event_data: Json | null
                    status: string | null
                    amount: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    transaction_id?: string | null
                    paddle_transaction_id: string
                    paddle_subscription_id?: string | null
                    paddle_customer_id?: string | null
                    event_type?: string | null
                    event_data?: Json | null
                    status?: string | null
                    amount?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    transaction_id?: string | null
                    paddle_transaction_id?: string
                    paddle_subscription_id?: string | null
                    paddle_customer_id?: string | null
                    event_type?: string | null
                    event_data?: Json | null
                    status?: string | null
                    amount?: number | null
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_paddle_webhook_events: {
                Row: {
                    id: string
                    event_id: string
                    event_type: string
                    payload: Json
                    processed: boolean
                    processed_at: string | null
                    error_message: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    event_id: string
                    event_type: string
                    payload: Json
                    processed?: boolean
                    processed_at?: string | null
                    error_message?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    event_id?: string
                    event_type?: string
                    payload?: Json
                    processed?: boolean
                    processed_at?: string | null
                    error_message?: string | null
                    created_at?: string
                }
            }
            indb_site_settings: {
                Row: {
                    id: string
                    site_name: string
                    site_description: string | null
                    site_logo_url: string | null
                    site_icon_url: string | null
                    site_favicon_url: string | null
                    contact_email: string | null
                    support_email: string | null
                    maintenance_mode: boolean
                    registration_enabled: boolean
                    smtp_host: string | null
                    smtp_port: number | null
                    smtp_user: string | null
                    smtp_pass: string | null
                    smtp_from_name: string | null
                    smtp_from_email: string | null
                    smtp_secure: boolean
                    smtp_enabled: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    site_name?: string
                    site_description?: string | null
                    site_logo_url?: string | null
                    site_icon_url?: string | null
                    site_favicon_url?: string | null
                    contact_email?: string | null
                    support_email?: string | null
                    maintenance_mode?: boolean
                    registration_enabled?: boolean
                    smtp_host?: string | null
                    smtp_port?: number | null
                    smtp_user?: string | null
                    smtp_pass?: string | null
                    smtp_from_name?: string | null
                    smtp_from_email?: string | null
                    smtp_secure?: boolean
                    smtp_enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    site_name?: string
                    site_description?: string | null
                    site_logo_url?: string | null
                    site_icon_url?: string | null
                    site_favicon_url?: string | null
                    contact_email?: string | null
                    support_email?: string | null
                    maintenance_mode?: boolean
                    registration_enabled?: boolean
                    smtp_host?: string | null
                    smtp_port?: number | null
                    smtp_user?: string | null
                    smtp_pass?: string | null
                    smtp_from_name?: string | null
                    smtp_from_email?: string | null
                    smtp_secure?: boolean
                    smtp_enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_system_error_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    error_type: string
                    severity: string
                    message: string
                    user_message: string
                    endpoint: string | null
                    http_method: string | null
                    status_code: number | null
                    metadata: Json | null
                    stack_trace: string | null
                    resolved_at: string | null
                    resolved_by: string | null
                    acknowledged_at: string | null
                    acknowledged_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    error_type: string
                    severity: string
                    message: string
                    user_message: string
                    endpoint?: string | null
                    http_method?: string | null
                    status_code?: number | null
                    metadata?: Json | null
                    stack_trace?: string | null
                    resolved_at?: string | null
                    resolved_by?: string | null
                    acknowledged_at?: string | null
                    acknowledged_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    error_type?: string
                    severity?: string
                    message?: string
                    user_message?: string
                    endpoint?: string | null
                    http_method?: string | null
                    status_code?: number | null
                    metadata?: Json | null
                    stack_trace?: string | null
                    resolved_at?: string | null
                    resolved_by?: string | null
                    acknowledged_at?: string | null
                    acknowledged_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_enrichment_jobs: {
                Row: {
                    id: string
                    user_id: string
                    status: 'pending' | 'processing' | 'completed' | 'failed'
                    config: EnrichmentJobConfig
                    results: JobResult | null
                    error_message: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    config: EnrichmentJobConfig
                    results?: JobResult | null
                    error_message?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    config?: EnrichmentJobConfig
                    results?: JobResult | null
                    error_message?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_seranking_metrics_raw: {
                Row: {
                    id: string
                    timestamp: string
                    endpoint: string
                    method: string
                    status: 'success' | 'error' | 'timeout' | 'rate_limited'
                    duration_ms: number
                    request_size: number | null
                    response_size: number | null
                    cache_hit: boolean
                    error_type: string | null
                    error_message: string | null
                    user_id: string | null
                    quota_remaining: number | null
                    rate_limit_remaining: number | null
                    retry_attempt: number
                    country_code: string | null
                    keyword_count: number | null
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    timestamp?: string
                    endpoint: string
                    method?: string
                    status: 'success' | 'error' | 'timeout' | 'rate_limited'
                    duration_ms: number
                    request_size?: number | null
                    response_size?: number | null
                    cache_hit?: boolean
                    error_type?: string | null
                    error_message?: string | null
                    user_id?: string | null
                    quota_remaining?: number | null
                    rate_limit_remaining?: number | null
                    retry_attempt?: number
                    country_code?: string | null
                    keyword_count?: number | null
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    timestamp?: string
                    endpoint?: string
                    method?: string
                    status?: 'success' | 'error' | 'timeout' | 'rate_limited'
                    duration_ms?: number
                    request_size?: number | null
                    response_size?: number | null
                    cache_hit?: boolean
                    error_type?: string | null
                    error_message?: string | null
                    user_id?: string | null
                    quota_remaining?: number | null
                    rate_limit_remaining?: number | null
                    retry_attempt?: number
                    country_code?: string | null
                    keyword_count?: number | null
                    metadata?: Json | null
                    created_at?: string
                }
            }
            indb_seranking_metrics_aggregated: {
                Row: {
                    id: string
                    period: string
                    period_type: 'hour' | 'day' | 'week' | 'month'
                    total_requests: number
                    successful_requests: number
                    failed_requests: number
                    timeout_requests: number
                    rate_limited_requests: number
                    average_response_time: number
                    median_response_time: number
                    p95_response_time: number
                    p99_response_time: number
                    cache_hits: number
                    cache_misses: number
                    cache_hit_rate: number
                    error_breakdown: Json
                    quota_utilization_avg: number
                    total_keywords_processed: number
                    unique_users: number
                    peak_rps: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    period: string
                    period_type: 'hour' | 'day' | 'week' | 'month'
                    total_requests?: number
                    successful_requests?: number
                    failed_requests?: number
                    timeout_requests?: number
                    rate_limited_requests?: number
                    average_response_time?: number
                    median_response_time?: number
                    p95_response_time?: number
                    p99_response_time?: number
                    cache_hits?: number
                    cache_misses?: number
                    cache_hit_rate?: number
                    error_breakdown?: Json
                    quota_utilization_avg?: number
                    total_keywords_processed?: number
                    unique_users?: number
                    peak_rps?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    period?: string
                    period_type?: 'hour' | 'day' | 'week' | 'month'
                    total_requests?: number
                    successful_requests?: number
                    failed_requests?: number
                    timeout_requests?: number
                    rate_limited_requests?: number
                    average_response_time?: number
                    median_response_time?: number
                    p95_response_time?: number
                    p99_response_time?: number
                    cache_hits?: number
                    cache_misses?: number
                    cache_hit_rate?: number
                    error_breakdown?: Json
                    quota_utilization_avg?: number
                    total_keywords_processed?: number
                    unique_users?: number
                    peak_rps?: number
                    created_at?: string
                }
            }
            indb_seranking_metrics_alerts: {
                Row: {
                    id: string
                    alert_type: 'error_rate' | 'response_time' | 'cache_miss_rate' | 'quota_threshold'
                    threshold_value: number
                    period_minutes: number
                    is_active: boolean
                    escalation_level: number
                    notification_channels: string[]
                    last_triggered: string | null
                    escalation_count: number
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    alert_type: 'error_rate' | 'response_time' | 'cache_miss_rate' | 'quota_threshold'
                    threshold_value: number
                    period_minutes?: number
                    is_active?: boolean
                    escalation_level?: number
                    notification_channels?: string[]
                    last_triggered?: string | null
                    escalation_count?: number
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    alert_type?: 'error_rate' | 'response_time' | 'cache_miss_rate' | 'quota_threshold'
                    threshold_value?: number
                    period_minutes?: number
                    is_active?: boolean
                    escalation_level?: number
                    notification_channels?: string[]
                    last_triggered?: string | null
                    escalation_count?: number
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_seranking_quota_usage: {
                Row: {
                    id: string
                    timestamp: string
                    user_id: string | null
                    operation_type: string
                    quota_consumed: number
                    quota_remaining: number
                    quota_limit: number
                    usage_percentage: number
                    session_id: string | null
                    endpoint: string | null
                    country_code: string | null
                    keywords_count: number | null
                    cost_per_request: number | null
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    timestamp?: string
                    user_id?: string | null
                    service_account_id?: string | null
                    operation_type?: string
                    quota_consumed: number
                    quota_remaining: number
                    quota_limit: number
                    usage_percentage: number
                    session_id?: string | null
                    endpoint?: string | null
                    country_code?: string | null
                    keywords_count?: number | null
                    cost_per_request?: number | null
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    timestamp?: string
                    user_id?: string | null
                    service_account_id?: string | null
                    operation_type?: string
                    quota_consumed?: number
                    quota_remaining?: number
                    quota_limit?: number
                    usage_percentage?: number
                    session_id?: string | null
                    endpoint?: string | null
                    country_code?: string | null
                    keywords_count?: number | null
                    cost_per_request?: number | null
                    metadata?: Json | null
                    created_at?: string
                }
            }
            indb_seranking_usage_patterns: {
                Row: {
                    id: string
                    pattern_id: string
                    pattern_type: 'hourly' | 'daily' | 'weekly' | 'seasonal' | 'burst'
                    confidence: number
                    description: string
                    detected_at: string
                    pattern_data: Json
                    predictions: Json
                    recommendations: Json
                    is_active: boolean
                    last_updated: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    pattern_id: string
                    pattern_type: 'hourly' | 'daily' | 'weekly' | 'seasonal' | 'burst'
                    confidence: number
                    description: string
                    detected_at?: string
                    pattern_data: Json
                    predictions: Json
                    recommendations: Json
                    is_active?: boolean
                    last_updated?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    pattern_id?: string
                    pattern_type?: 'hourly' | 'daily' | 'weekly' | 'seasonal' | 'burst'
                    confidence?: number
                    description?: string
                    detected_at?: string
                    pattern_data?: Json
                    predictions?: Json
                    recommendations?: Json
                    is_active?: boolean
                    last_updated?: string
                    created_at?: string
                }
            }
            indb_seranking_quota_predictions: {
                Row: {
                    id: string
                    prediction_id: string
                    generated_at: string
                    prediction_horizon_hours: number
                    current_usage: number
                    current_limit: number
                    predicted_usage: number
                    exhaustion_eta: string | null
                    confidence: number
                    risk_level: 'low' | 'medium' | 'high' | 'critical'
                    contributing_factors: string[]
                    recommended_actions: Json
                    accuracy_score: number | null
                    actual_usage: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    prediction_id: string
                    generated_at?: string
                    prediction_horizon_hours: number
                    current_usage: number
                    current_limit: number
                    predicted_usage: number
                    exhaustion_eta?: string | null
                    confidence: number
                    risk_level: 'low' | 'medium' | 'high' | 'critical'
                    contributing_factors?: string[]
                    recommended_actions: Json
                    accuracy_score?: number | null
                    actual_usage?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    prediction_id?: string
                    generated_at?: string
                    prediction_horizon_hours?: number
                    current_usage?: number
                    current_limit?: number
                    predicted_usage?: number
                    exhaustion_eta?: string | null
                    confidence?: number
                    risk_level?: 'low' | 'medium' | 'high' | 'critical'
                    contributing_factors?: string[]
                    recommended_actions?: Json
                    accuracy_score?: number | null
                    actual_usage?: number | null
                    created_at?: string
                }
            }
            indb_seranking_quota_alerts: {
                Row: {
                    id: string
                    alert_type: string
                    threshold_percentage: number
                    is_active: boolean
                    notification_channels: string[]
                    escalation_rules: Json
                    last_triggered: string | null
                    trigger_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    alert_type: string
                    threshold_percentage: number
                    is_active?: boolean
                    notification_channels?: string[]
                    escalation_rules?: Json
                    last_triggered?: string | null
                    trigger_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    alert_type?: string
                    threshold_percentage?: number
                    is_active?: boolean
                    notification_channels?: string[]
                    escalation_rules?: Json
                    last_triggered?: string | null
                    trigger_count?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_seranking_health_checks: {
                Row: {
                    id: string
                    timestamp: string
                    service_name: string
                    check_type: 'api' | 'database' | 'cache' | 'queue' | 'dependency' | 'custom'
                    dependency_level: 'critical' | 'important' | 'optional'
                    status: 'healthy' | 'degraded' | 'unhealthy' | 'critical'
                    response_time: number
                    error_message: string | null
                    metrics: Json
                    diagnostics: Json
                    recommendations: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    timestamp?: string
                    service_name: string
                    check_type: 'api' | 'database' | 'cache' | 'queue' | 'dependency' | 'custom'
                    dependency_level: 'critical' | 'important' | 'optional'
                    status: 'healthy' | 'degraded' | 'unhealthy' | 'critical'
                    response_time: number
                    error_message?: string | null
                    metrics?: Json
                    diagnostics?: Json
                    recommendations?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    timestamp?: string
                    service_name?: string
                    check_type?: 'api' | 'database' | 'cache' | 'queue' | 'dependency' | 'custom'
                    dependency_level?: 'critical' | 'important' | 'optional'
                    status?: 'healthy' | 'degraded' | 'unhealthy' | 'critical'
                    response_time?: number
                    error_message?: string | null
                    metrics?: Json
                    diagnostics?: Json
                    recommendations?: Json
                    created_at?: string
                }
            }
            indb_seranking_incidents: {
                Row: {
                    id: string
                    incident_id: string
                    severity: 'low' | 'medium' | 'high' | 'critical'
                    component: string
                    title: string
                    description: string
                    status: 'open' | 'investigating' | 'resolved' | 'closed'
                    started_at: string
                    detected_at: string
                    acknowledged_at: string | null
                    resolved_at: string | null
                    closed_at: string | null
                    recovery_actions: string[] | null
                    impact_description: string | null
                    root_cause_analysis: string | null
                    prevention_measures: string | null
                    assigned_to: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    incident_id: string
                    severity: 'low' | 'medium' | 'high' | 'critical'
                    component: string
                    title: string
                    description: string
                    status?: 'open' | 'investigating' | 'resolved' | 'closed'
                    started_at?: string
                    detected_at?: string
                    acknowledged_at?: string | null
                    resolved_at?: string | null
                    closed_at?: string | null
                    recovery_actions?: string[] | null
                    impact_description?: string | null
                    root_cause_analysis?: string | null
                    prevention_measures?: string | null
                    assigned_to?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    incident_id?: string
                    severity?: 'low' | 'medium' | 'high' | 'critical'
                    component?: string
                    title?: string
                    description?: string
                    status?: 'open' | 'investigating' | 'resolved' | 'closed'
                    started_at?: string
                    detected_at?: string
                    acknowledged_at?: string | null
                    resolved_at?: string | null
                    closed_at?: string | null
                    recovery_actions?: string[] | null
                    impact_description?: string | null
                    root_cause_analysis?: string | null
                    prevention_measures?: string | null
                    assigned_to?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_seranking_recovery_actions: {
                Row: {
                    id: string
                    action_id: string
                    incident_id: string | null
                    service_name: string
                    action_type: string
                    action_description: string
                    execution_status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped'
                    execution_time_ms: number | null
                    success: boolean | null
                    error_message: string | null
                    impact_description: string | null
                    follow_up_required: boolean
                    follow_up_actions: string[] | null
                    executed_at: string | null
                    executed_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    action_id: string
                    incident_id?: string | null
                    service_name: string
                    action_type: string
                    action_description: string
                    execution_status?: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped'
                    execution_time_ms?: number | null
                    success?: boolean | null
                    error_message?: string | null
                    impact_description?: string | null
                    follow_up_required?: boolean
                    follow_up_actions?: string[] | null
                    executed_at?: string | null
                    executed_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    action_id?: string
                    incident_id?: string | null
                    service_name?: string
                    action_type?: string
                    action_description?: string
                    execution_status?: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped'
                    execution_time_ms?: number | null
                    success?: boolean | null
                    error_message?: string | null
                    impact_description?: string | null
                    follow_up_required?: boolean
                    follow_up_actions?: string[] | null
                    executed_at?: string | null
                    executed_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_seranking_performance_analysis: {
                Row: {
                    id: string
                    analysis_timestamp: string
                    component: string
                    bottleneck_type: 'cpu' | 'memory' | 'network' | 'database' | 'api_limit' | 'cache' | 'queue'
                    severity_score: number
                    impact_description: string
                    root_cause_analysis: string | null
                    optimization_suggestions: string[]
                    estimated_improvement: string | null
                    implementation_effort: 'low' | 'medium' | 'high' | null
                    status: 'identified' | 'planned' | 'in_progress' | 'completed' | 'dismissed'
                    resolved_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    analysis_timestamp?: string
                    component: string
                    bottleneck_type: 'cpu' | 'memory' | 'network' | 'database' | 'api_limit' | 'cache' | 'queue'
                    severity_score: number
                    impact_description: string
                    root_cause_analysis?: string | null
                    optimization_suggestions?: string[]
                    estimated_improvement?: string | null
                    implementation_effort?: 'low' | 'medium' | 'high' | null
                    status?: 'identified' | 'planned' | 'in_progress' | 'completed' | 'dismissed'
                    resolved_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    analysis_timestamp?: string
                    component?: string
                    bottleneck_type?: 'cpu' | 'memory' | 'network' | 'database' | 'api_limit' | 'cache' | 'queue'
                    severity_score?: number
                    impact_description?: string
                    root_cause_analysis?: string | null
                    optimization_suggestions?: string[]
                    estimated_improvement?: string | null
                    implementation_effort?: 'low' | 'medium' | 'high' | null
                    status?: 'identified' | 'planned' | 'in_progress' | 'completed' | 'dismissed'
                    resolved_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_seranking_monitoring_config: {
                Row: {
                    id: string
                    service_name: string
                    config_key: string
                    config_value: Json
                    config_type: 'threshold' | 'interval' | 'notification' | 'feature_flag'
                    description: string | null
                    is_active: boolean
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    service_name: string
                    config_key: string
                    config_value: Json
                    config_type: 'threshold' | 'interval' | 'notification' | 'feature_flag'
                    description?: string | null
                    is_active?: boolean
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    service_name?: string
                    config_key?: string
                    config_value?: Json
                    config_type?: 'threshold' | 'interval' | 'notification' | 'feature_flag'
                    description?: string | null
                    is_active?: boolean
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_seranking_notifications: {
                Row: {
                    id: string
                    notification_id: string
                    type: 'alert' | 'incident' | 'recovery' | 'prediction' | 'maintenance'
                    severity: 'info' | 'warning' | 'error' | 'critical'
                    service_name: string | null
                    title: string
                    message: string
                    channels_sent: string[]
                    recipients: string[]
                    delivery_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
                    metadata: Json | null
                    related_incident_id: string | null
                    sent_at: string | null
                    delivered_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    notification_id: string
                    type: 'alert' | 'incident' | 'recovery' | 'prediction' | 'maintenance'
                    severity: 'info' | 'warning' | 'error' | 'critical'
                    service_name?: string | null
                    title: string
                    message: string
                    channels_sent?: string[]
                    recipients?: string[]
                    delivery_status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
                    metadata?: Json | null
                    related_incident_id?: string | null
                    sent_at?: string | null
                    delivered_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    notification_id?: string
                    type?: 'alert' | 'incident' | 'recovery' | 'prediction' | 'maintenance'
                    severity?: 'info' | 'warning' | 'error' | 'critical'
                    service_name?: string | null
                    title?: string
                    message?: string
                    channels_sent?: string[]
                    recipients?: string[]
                    delivery_status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
                    metadata?: Json | null
                    related_incident_id?: string | null
                    sent_at?: string | null
                    delivered_at?: string | null
                    created_at?: string
                }
            }
            indb_keyword_rank_history: {
                Row: {
                    id: string
                    keyword_id: string
                    position: number | null
                    url: string | null
                    search_volume: number | null
                    difficulty_score: number | null
                    checked_at: string
                    created_at: string
                    updated_at: string
                    device_type: string | null
                    country_id: string | null
                    tags: string[] | null
                    metadata: Json | null
                }
                Insert: {
                    id?: string
                    keyword_id: string
                    position?: number | null
                    url?: string | null
                    search_volume?: number | null
                    difficulty_score?: number | null
                    checked_at: string
                    created_at?: string
                    updated_at?: string
                    device_type?: string | null
                    country_id?: string | null
                    tags?: string[] | null
                    metadata?: Json | null
                }
                Update: {
                    id?: string
                    keyword_id?: string
                    position?: number | null
                    url?: string | null
                    search_volume?: number | null
                    difficulty_score?: number | null
                    checked_at?: string
                    created_at?: string
                    updated_at?: string
                    device_type?: string | null
                    country_id?: string | null
                    tags?: string[] | null
                    metadata?: Json | null
                }
            }
            indb_payment_invoices: {
                Row: {
                    id: string
                    user_id: string
                    subscription_id: string | null
                    transaction_id: string | null
                    invoice_number: string
                    invoice_status: string
                    subtotal: number
                    tax_amount: number
                    discount_amount: number
                    total_amount: number
                    currency: string
                    due_date: string | null
                    paid_at: string | null
                    invoice_data: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    subscription_id?: string | null
                    transaction_id?: string | null
                    invoice_number: string
                    invoice_status?: string
                    subtotal: number
                    tax_amount?: number
                    discount_amount?: number
                    total_amount: number
                    currency?: string
                    due_date?: string | null
                    paid_at?: string | null
                    invoice_data: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    subscription_id?: string | null
                    transaction_id?: string | null
                    invoice_number?: string
                    invoice_status?: string
                    subtotal?: number
                    tax_amount?: number
                    discount_amount?: number
                    total_amount?: number
                    currency?: string
                    due_date?: string | null
                    paid_at?: string | null
                    invoice_data?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            indb_payment_midtrans: {
                Row: {
                    id: string
                    transaction_id: string
                    user_id: string
                    midtrans_subscription_id: string | null
                    saved_token_id: string
                    masked_card: string | null
                    card_type: string | null
                    bank: string | null
                    token_expired_at: string | null
                    subscription_status: string | null
                    next_billing_date: string | null
                    metadata: Json | null
                    created_at: string
                    updated_at: string
                    trial_metadata: Json | null
                }
                Insert: {
                    id?: string
                    transaction_id: string
                    user_id: string
                    midtrans_subscription_id?: string | null
                    saved_token_id: string
                    masked_card?: string | null
                    card_type?: string | null
                    bank?: string | null
                    token_expired_at?: string | null
                    subscription_status?: string | null
                    next_billing_date?: string | null
                    metadata?: Json | null
                    created_at?: string
                    updated_at?: string
                    trial_metadata?: Json | null
                }
                Update: {
                    id?: string
                    transaction_id?: string
                    user_id?: string
                    midtrans_subscription_id?: string | null
                    saved_token_id?: string
                    masked_card?: string | null
                    card_type?: string | null
                    bank?: string | null
                    token_expired_at?: string | null
                    subscription_status?: string | null
                    next_billing_date?: string | null
                    metadata?: Json | null
                    created_at?: string
                    updated_at?: string
                    trial_metadata?: Json | null
                }
            }
            indb_payment_transactions_history: {
                Row: {
                    id: string
                    transaction_id: string
                    old_status: string | null
                    new_status: string
                    action_type: string
                    action_description: string
                    changed_by: string | null
                    changed_by_type: string
                    old_values: Json | null
                    new_values: Json | null
                    notes: string | null
                    metadata: Json | null
                    ip_address: string | null
                    user_agent: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    transaction_id: string
                    old_status?: string | null
                    new_status: string
                    action_type: string
                    action_description: string
                    changed_by?: string | null
                    changed_by_type?: string
                    old_values?: Json | null
                    new_values?: Json | null
                    notes?: string | null
                    metadata?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    transaction_id?: string
                    old_status?: string | null
                    new_status?: string
                    action_type?: string
                    action_description?: string
                    changed_by?: string | null
                    changed_by_type?: string
                    old_values?: Json | null
                    new_values?: Json | null
                    notes?: string | null
                    metadata?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string
                }
            }
            "auth.users": {
                Row: {
                    id: string
                    email: string | null
                    created_at: string | null
                }
                Insert: {
                    id: string
                    email?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string | null
                    created_at?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Convenience types
export type UserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Row']
export type UserSettings = Database['public']['Tables']['indb_auth_user_settings']['Row']

export type DashboardNotification = Database['public']['Tables']['indb_notifications_dashboard']['Row']
export type DailyStats = Database['public']['Tables']['indb_analytics_daily_stats']['Row']
export type KeywordCountry = Database['public']['Tables']['indb_keyword_countries']['Row']
export type KeywordDomain = Database['public']['Tables']['indb_keyword_domains']['Row']
export type KeywordKeyword = Database['public']['Tables']['indb_keyword_keywords']['Row']
export type KeywordRanking = Database['public']['Tables']['indb_keyword_rankings']['Row']
export type KeywordUsage = Database['public']['Tables']['indb_keyword_usage']['Row']
export type RankKeywordRow = Database['public']['Tables']['indb_rank_keywords']['Row']
export type SiteIntegration = Database['public']['Tables']['indb_site_integration']['Row']
export type SeRankingIntegration = Database['public']['Tables']['indb_site_integration']['Row']
export type SeRankingUsageLog = Database['public']['Tables']['indb_seranking_usage_logs']['Row']
export type SecurityAuditLog = Database['public']['Tables']['indb_security_audit_logs']['Row']
export type SecurityActivityLog = Database['public']['Tables']['indb_security_activity_logs']['Row']
export type SystemErrorLog = Database['public']['Tables']['indb_system_error_logs']['Row']

export type PackageRow = Database['public']['Tables']['indb_payment_packages']['Row']
export type SubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row']
export type TransactionRow = Database['public']['Tables']['indb_payment_transactions']['Row']
export type ProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row']
export type UserSettingsRow = Database['public']['Tables']['indb_auth_user_settings']['Row']

// Insert types
export type InsertUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Insert']
export type InsertUserSettings = Database['public']['Tables']['indb_auth_user_settings']['Insert']

export type InsertDashboardNotification = Database['public']['Tables']['indb_notifications_dashboard']['Insert']
export type InsertKeywordCountry = Database['public']['Tables']['indb_keyword_countries']['Insert']
export type InsertKeywordDomain = Database['public']['Tables']['indb_keyword_domains']['Insert']
export type InsertKeywordKeyword = Database['public']['Tables']['indb_keyword_keywords']['Insert']
export type InsertKeywordRanking = Database['public']['Tables']['indb_keyword_rankings']['Insert']
export type InsertKeywordUsage = Database['public']['Tables']['indb_keyword_usage']['Insert']
export type InsertSiteIntegration = Database['public']['Tables']['indb_site_integration']['Insert']
export type InsertSeRankingIntegration = Database['public']['Tables']['indb_site_integration']['Insert']
export type InsertSeRankingUsageLog = Database['public']['Tables']['indb_seranking_usage_logs']['Insert']
export type InsertSecurityAuditLog = Database['public']['Tables']['indb_security_audit_logs']['Insert']
export type InsertSecurityActivityLog = Database['public']['Tables']['indb_security_activity_logs']['Insert']
export type InsertSubscription = Database['public']['Tables']['indb_payment_subscriptions']['Insert']
export type InsertTransaction = Database['public']['Tables']['indb_payment_transactions']['Insert']
export type InsertPackage = Database['public']['Tables']['indb_payment_packages']['Insert']

// Update types
export type UpdateUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Update']
export type UpdateUserSettings = Database['public']['Tables']['indb_auth_user_settings']['Update']

export type UpdateKeywordDomain = Database['public']['Tables']['indb_keyword_domains']['Update']
export type UpdateKeywordKeyword = Database['public']['Tables']['indb_keyword_keywords']['Update']
export type UpdateKeywordRanking = Database['public']['Tables']['indb_keyword_rankings']['Update']
export type UpdateKeywordUsage = Database['public']['Tables']['indb_keyword_usage']['Update']
export type UpdateSiteIntegration = Database['public']['Tables']['indb_site_integration']['Update']
export type UpdateSeRankingIntegration = Database['public']['Tables']['indb_site_integration']['Update']
export type UpdateSeRankingUsageLog = Database['public']['Tables']['indb_seranking_usage_logs']['Update']

export type UpdateDashboardNotification = Database['public']['Tables']['indb_notifications_dashboard']['Update']
export type UpdateTransaction = Database['public']['Tables']['indb_payment_transactions']['Update']
export type UpdateSubscription = Database['public']['Tables']['indb_payment_subscriptions']['Update']
export type UpdatePackage = Database['public']['Tables']['indb_payment_packages']['Update']
