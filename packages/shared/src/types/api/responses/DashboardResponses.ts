/**
 * Dashboard-related API response DTOs for IndexNow Studio.
 *
 * These are the canonical shared types for:
 *  - GET /api/v1/dashboard   → DashboardAggregateResponse
 *  - GET /api/v1/public/settings → PublicSettingsResponse
 *
 * Both the API route (apps/api) and the frontend layer (apps/user-dashboard)
 * must use these DTOs so TypeScript enforces shape consistency at compile time.
 */

// ─── Dashboard Aggregate (/api/v1/dashboard) ─────────────────────────────────

/** Pricing tier entry for a billing package */
export interface DashboardPackagePricingTier {
  regular_price: number;
  promo_price?: number;
  paddle_price_id?: string;
}

/** Billing package as embedded in the dashboard profile */
export interface DashboardPackageInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  billing_period: string;
  features: string[] | null;
  quota_limits: Record<string, number> | null;
  is_active: boolean;
  pricing_tiers: Record<string, DashboardPackagePricingTier> | null;
  /** Resolved price for the current billing period, derived from pricing_tiers */
  price?: number;
}

/** User profile section of the dashboard aggregate */
export interface DashboardProfileInfo {
  id: string;
  email: string | null;
  package: DashboardPackageInfo | null;
  daily_quota_limit: number;
  daily_quota_used: number;
  is_trial_active: boolean;
  trial_ends_at: string | null;
  package_id: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  country: string | null;
}

/** Quota usage counters returned in the dashboard aggregate */
export interface DashboardQuota {
  keywords: {
    used: number;
    limit: number;
    is_unlimited: boolean;
    /** -1 when unlimited */
    remaining: number;
  };
  daily_checks: {
    used: number;
    limit: number;
    is_unlimited: boolean;
    remaining: number;
    exhausted: boolean;
  };
}

/** Trial eligibility section of the dashboard aggregate */
export interface DashboardTrialInfo {
  eligible: boolean;
  message: string;
  /** Packages eligible for trial activation (shape matches indb_payment_packages rows) */
  available_packages: unknown[];
}

/** Keyword domain row as returned in the dashboard aggregate  */
export interface DashboardDomainInfo {
  id: string;
  user_id: string;
  domain_name: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  [key: string]: unknown;
}

/** Recent keyword entry returned in the dashboard aggregate */
export interface DashboardRecentKeywordInfo {
  id: string;
  keyword: string;
  /** Top-level domain FK (may be absent in aggregate projection) */
  domain_id?: string;
  device_type: string;
  created_at: string;
  domain: { id?: string; domain_name: string; display_name?: string | null };
  country: { id?: string; name?: string; iso2_code: string };
  recent_ranking: { position: number | null; check_date: string | null } | Array<{ position: number | null; check_date: string | null; url?: string }>;
  current_position?: number | null;
  tags?: string[];
  is_active?: boolean;
}

/**
 * Full response payload for GET /api/v1/dashboard.
 * This is what `api<DashboardAggregateResponse>` resolves to inside the
 * `useDashboardAggregate()` query hook (after envelope unwrap by `api<T>`).
 */
export interface DashboardAggregateResponse {
  user: {
    profile: DashboardProfileInfo | null;
    quota: DashboardQuota;
    trial: DashboardTrialInfo;
  };
  billing: {
    /** All active billing packages (for trial/upgrade CTAs) */
    packages: unknown[];
    current_package_id: string | null;
    expires_at: string | null;
  };
  rankTracking: {
    domains: DashboardDomainInfo[];
    recentKeywords: DashboardRecentKeywordInfo[];
  };
  notifications: unknown[];
}

// ─── Public Settings (/api/v1/public/settings) ───────────────────────────────

/** Single package entry as returned by the public settings endpoint */
export interface PublicSettingsPackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  features: string[];
  quota_limits: {
    daily_urls: number;
    keywords_limit: number;
    concurrent_jobs: number;
  };
  pricing_tiers: Record<string, unknown>;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

/**
 * Full response payload for GET /api/v1/public/settings.
 * This is what `api<PublicSettingsResponse>` resolves to inside the
 * `usePublicSettings()` query hook.
 */
export interface PublicSettingsResponse {
  packages: {
    packages: PublicSettingsPackage[];
  };
}
