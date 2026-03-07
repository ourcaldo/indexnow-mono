'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  RANK_TRACKING_ENDPOINTS,
  AUTH_ENDPOINTS,
  DASHBOARD_ENDPOINTS,
  BILLING_ENDPOINTS,
  PUBLIC_ENDPOINTS,
  API_BASE,
  type DashboardAggregateResponse,
  type PublicSettingsResponse,
  type BillingOverviewResponse,
  type BillingHistoryResponse,
  type OrderDetailsResponse,
} from '@indexnow/shared'
import {
  domainListResponseSchema,
  countryListResponseSchema,
  profileResponseSchema,
  keywordUsageSchema,
  keywordsResponseSchema,
  dashboardAggregateResponseSchema,
  publicSettingsResponseSchema,
  billingOverviewResponseSchema,
  billingHistoryResponseSchema,
  subscriptionStatusResponseSchema,
  billingPackageSchema,
  trialEligibilityResponseSchema,
  orderDetailsResponseSchema,
  userSettingsResponseSchema,
  createDomainResponseSchema,
  addKeywordsResponseSchema,
  rankHistoryResponseSchema,
} from '@indexnow/shared/response-schemas'
import { api } from '../lib/api'

// ——— Types ———

export interface Domain {
  id: string
  user_id: string
  domain_name: string
  display_name: string | null
  keyword_count?: number
  created_at: string
}

export interface Country {
  id: string
  name: string
  code: string
  iso2_code: string
  is_active: boolean
}

export interface RankingEntry {
  position: number | null
  url?: string
  check_date: string | null
}

export interface Keyword {
  id: string
  keyword: string
  domain_id?: string
  domain?: { id?: string; domain_name: string; display_name?: string | null }
  country?: { id?: string; name?: string; iso2_code: string }
  device_type: string
  current_position?: number | null
  recent_ranking?: RankingEntry[] | RankingEntry
  tags?: string[]
  is_active?: boolean
  created_at?: string
  // Enrichment data from keyword bank
  search_volume?: number | null
  keyword_intent?: string | null
  keyword_difficulty?: number | null
  keyword_competition?: number | null
  cpc?: number | null
}

export interface UserProfile {
  id: string
  user_id: string
  name: string | null
  full_name?: string | null
  email?: string
  phone_number?: string | null
  country?: string | null
  active_domain?: string | null
  package?: {
    id: string
    name: string
    slug: string
    quota_limits: {
      max_keywords: number
      max_domains: number
    }
  } | null
  subscription_status?: string
  subscription_end_date?: string | null
}

export interface QuotaInfo {
  keywords: {
    used: number
    limit: number
    remaining: number
    is_unlimited: boolean
  }
  domains: {
    used: number
    limit: number
    remaining: number
    is_unlimited: boolean
  }
  package_name: string
}

export interface KeywordUsage {
  used: number
  limit: number
  remaining: number
  is_unlimited: boolean
}

export interface BillingPackage {
  id: string
  name: string
  slug: string
  pricing_tiers: Record<string, {
    regular_price: number
    promo_price?: number
    paddle_price_id?: string
    discount_percentage?: number
  }>
  quota_limits: {
    max_keywords: number
    max_domains: number
  }
  features: string[]
  is_active: boolean
}

// OrderDetails is now exported from @indexnow/shared as OrderDetailsResponse.
// Re-exported here for backwards compatibility with consumers that import from hooks.
export type { OrderDetailsResponse as OrderDetails } from '@indexnow/shared'

// ——— Hooks ———

/** Fetch all user domains */
export function useDomains(enabled = true) {
  return useQuery({
    queryKey: ['domains'],
    queryFn: () => api<{ data: Domain[]; pagination: unknown }>(RANK_TRACKING_ENDPOINTS.DOMAINS, { schema: domainListResponseSchema }),
    select: (d) => d.data ?? [],
    enabled,
  })
}

/** Fetch available countries */
export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: () => api<{ data: Country[] }>(RANK_TRACKING_ENDPOINTS.COUNTRIES, { schema: countryListResponseSchema }),
    select: (d) => d.data ?? [],
  })
}

/** Returns a map of iso2_code (uppercase) -> country name, built from the countries list */
export function useCountryMap(): Record<string, string> {
  const { data } = useCountries()
  if (!data) return {}
  const map: Record<string, string> = {}
  for (const c of data) {
    if (c.iso2_code) map[c.iso2_code.toUpperCase()] = c.name
  }
  return map
}

/** Fetch user profile with package info */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api<{ profile: UserProfile }>(AUTH_ENDPOINTS.PROFILE, { schema: profileResponseSchema }),
    select: (d) => d.profile,
    enabled,
  })
}

/** Fetch keyword usage (used / limit) — account-wide, not workspace-scoped */
export function useKeywordUsage() {
  return useQuery({
    queryKey: ['keyword-usage'],
    queryFn: () => api<KeywordUsage>(RANK_TRACKING_ENDPOINTS.KEYWORD_USAGE, { schema: keywordUsageSchema }),
  })
}

/** Persist the user's active workspace domain to their profile */
export function useUpdateActiveDomain() {
  return useMutation({
    mutationFn: (activeDomain: string | null) =>
      api<void>(AUTH_ENDPOINTS.PROFILE, {
        method: 'PUT',
        body: JSON.stringify({ active_domain: activeDomain }),
      }),
  })
}

/** Fetch keywords (paginated) */
export function useKeywords(params?: { domain?: string; page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['keywords', params],
    queryFn: () =>
      api<{ keywords: Keyword[]; total: number }>(
        RANK_TRACKING_ENDPOINTS.KEYWORDS,
        { params: params as Record<string, string | number | boolean>, schema: keywordsResponseSchema }
      ),
  })
}

/** Fetch dashboard aggregate data — optionally scoped to a workspace domain */
export function useDashboardAggregate(domain?: string | null) {
  return useQuery({
    queryKey: ['dashboard-aggregate', domain ?? 'all'],
    queryFn: () => api<DashboardAggregateResponse>(DASHBOARD_ENDPOINTS.MAIN, {
      params: domain ? { domain } : undefined,
      schema: dashboardAggregateResponseSchema,
    }),
  })
}

/** Fetch public settings (site settings + packages). Long staleTime — data rarely changes. */
export function usePublicSettings() {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api<PublicSettingsResponse>(PUBLIC_ENDPOINTS.SETTINGS, { schema: publicSettingsResponseSchema }),
    staleTime: 5 * 60 * 1000, // 5 minutes — this data barely changes
  })
}

/** Fetch billing overview (current subscription + stats) */
export function useBillingOverview() {
  return useQuery({
    queryKey: ['billing-overview'],
    queryFn: () => api<BillingOverviewResponse>(BILLING_ENDPOINTS.OVERVIEW, { schema: billingOverviewResponseSchema }),
  })
}

/** Fetch billing history (paginated) */
export function useBillingHistory(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['billing-history', page, limit],
    queryFn: () =>
      api<BillingHistoryResponse>(BILLING_ENDPOINTS.HISTORY, {
        params: { page, limit },
        schema: billingHistoryResponseSchema,
      }),
  })
}

/** Fetch Paddle subscription status */
export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await api<{
        hasSubscription: boolean
        subscription?: {
          paddle_subscription_id: string
          status: string
          expires_at: string
          package_id: string
        }
      }>(`${API_BASE.V1}/payments/paddle/subscription/my-subscription`, { schema: subscriptionStatusResponseSchema })
      return res
    },
    retry: false, // Don't retry — subscription may not exist
  })
}

/** Fetch a single billing package by ID */
export function usePackageById(id: string | null | undefined) {
  return useQuery({
    queryKey: ['package', id],
    queryFn: () => api<BillingPackage>(BILLING_ENDPOINTS.PACKAGE_BY_ID(id!), { schema: billingPackageSchema }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/** Fetch trial eligibility for current user */
export function useTrialEligibility(enabled = true) {
  return useQuery({
    queryKey: ['trial-eligibility'],
    queryFn: () => api<{ eligible: boolean; message?: string }>(AUTH_ENDPOINTS.TRIAL_ELIGIBILITY, { schema: trialEligibilityResponseSchema }),
    enabled,
    staleTime: 2 * 60 * 1000,
  })
}

/** Fetch order details by ID */
export function useOrderDetails(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api<OrderDetailsResponse>(BILLING_ENDPOINTS.ORDER_BY_ID(orderId!), { schema: orderDetailsResponseSchema }),
    enabled: !!orderId,
  })
}

/** Fetch user notification/settings preferences */
export function useUserSettings() {
  return useQuery({
    queryKey: ['user-settings'],
    queryFn: () => api<{
      settings: {
        email_job_completion: boolean
        email_job_failure: boolean
        email_daily_report: boolean
        email_quota_alerts: boolean
        [key: string]: unknown
      }
    }>(AUTH_ENDPOINTS.SETTINGS, { schema: userSettingsResponseSchema }),
  })
}

// ——— Mutations ———

/** Create a new domain */
export function useCreateDomain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { domain_name: string; display_name?: string }) =>
      api<{ data: Domain }>(RANK_TRACKING_ENDPOINTS.DOMAINS, {
        method: 'POST',
        body: JSON.stringify(data),
        schema: createDomainResponseSchema,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['domains'] })
      qc.invalidateQueries({ queryKey: ['dashboard-aggregate'] })
    },
  })
}

/** Add keywords to a domain */
export function useAddKeywords() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      domain_id: string
      keywords: string[]
      device_type: string
      country_id: string
      tags?: string[]
    }) =>
      api<{ created: number; keywords: unknown[]; skipped?: string[] }>(RANK_TRACKING_ENDPOINTS.KEYWORDS, {
        method: 'POST',
        body: JSON.stringify(data),
        schema: addKeywordsResponseSchema,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keywords'] })
      qc.invalidateQueries({ queryKey: ['keyword-usage'] })
      qc.invalidateQueries({ queryKey: ['dashboard-aggregate'] })
      qc.invalidateQueries({ queryKey: ['domains'] })
      // Rank check runs async on server (~2-3s). Re-fetch after 5s to show real position.
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['keywords'] })
      }, 5000)
    },
  })
}

/** Bulk delete keywords */
export function useDeleteKeywords() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (keywordIds: string[]) =>
      api<unknown>(RANK_TRACKING_ENDPOINTS.BULK_DELETE_KEYWORDS, {
        method: 'DELETE',
        body: JSON.stringify({ keywordIds }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keywords'] })
      qc.invalidateQueries({ queryKey: ['keyword-usage'] })
      qc.invalidateQueries({ queryKey: ['dashboard-aggregate'] })
    },
  })
}

// ── Rank History ──────────────────────────────────────────────────────────────

export interface RankHistoryKeyword {
  id: string
  keyword: string
  domain: string
  country: string
  country_name: string
  device: string
  current_position: number | null
  change: number | null
  latest_url: string | null
  latest_check: string | null
  /** date → position map, e.g. { "2025-01-01": 5 } */
  history: Record<string, number>
}

export interface RankHistoryResponse {
  keywords: RankHistoryKeyword[]
  total: number
  startDate: string
  endDate: string
}

/**
 * Fetch rank history for the authenticated user's keywords over a date range.
 * startDate / endDate should be ISO date strings: "YYYY-MM-DD"
 */
export function useRankHistory(startDate: string, endDate: string, domain?: string | null) {
  return useQuery({
    queryKey: ['rank-history', startDate, endDate, domain ?? 'all'],
    queryFn: () =>
      api<RankHistoryResponse>(
        RANK_TRACKING_ENDPOINTS.RANK_HISTORY,
        { params: { start_date: startDate, end_date: endDate, limit: '200', ...(domain ? { domain } : {}) }, schema: rankHistoryResponseSchema }
      ),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}


