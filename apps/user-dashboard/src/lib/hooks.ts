'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RANK_TRACKING_ENDPOINTS, AUTH_ENDPOINTS, DASHBOARD_ENDPOINTS, BILLING_ENDPOINTS } from '@indexnow/shared'
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
  check_date: string
}

export interface Keyword {
  id: string
  keyword: string
  domain_id: string
  domain?: { id: string; domain_name: string; display_name: string | null }
  country?: { id?: string; name: string; iso2_code: string }
  device_type: string
  current_position?: number | null
  recent_ranking?: RankingEntry[] | RankingEntry
  tags?: string[]
  is_active?: boolean
  created_at?: string
}

export interface UserProfile {
  id: string
  name: string | null
  email?: string
  phone_number?: string | null
  country?: string | null
  package?: {
    id: string
    name: string
    slug: string
    quota_limits: {
      keywords_limit: number
      daily_checks_limit: number
    }
  } | null
  keywords_used?: number
  subscription_status?: string
  subscription_end_date?: string | null
}

export interface QuotaInfo {
  daily_quota_used: number
  daily_quota_limit: number
  is_unlimited: boolean
  remaining_quota: number
}

export interface KeywordUsage {
  used: number
  limit: number
  remaining: number
  is_unlimited: boolean
}

export interface WeeklyTrend {
  id: string
  keyword: string
  domain: string
  current_position: number | null
  previous_position: number | null
  change: number | null
  url?: string
}

export interface BillingPackage {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  quota_limits: {
    keywords_limit: number
    daily_checks_limit: number
  }
  features: string[]
  is_active: boolean
  free_trial_enabled?: boolean
}

// ——— Hooks ———

/** Fetch all user domains */
export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: () => api<{ data: Domain[]; pagination: unknown }>(RANK_TRACKING_ENDPOINTS.DOMAINS),
    select: (d) => d.data ?? [],
  })
}

/** Fetch available countries */
export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: () => api<{ data: Country[] }>(RANK_TRACKING_ENDPOINTS.COUNTRIES),
    select: (d) => d.data ?? [],
  })
}

/** Fetch user profile with package info */
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api<{ profile: UserProfile }>(AUTH_ENDPOINTS.PROFILE),
    select: (d) => d.profile,
  })
}

/** Fetch user quota */
export function useQuota() {
  return useQuery({
    queryKey: ['quota'],
    queryFn: () => api<{ quota: QuotaInfo }>(AUTH_ENDPOINTS.QUOTA),
    select (d) { return d.quota },
  })
}

/** Fetch keyword usage (used / limit) */
export function useKeywordUsage() {
  return useQuery({
    queryKey: ['keyword-usage'],
    queryFn: () => api<KeywordUsage>(RANK_TRACKING_ENDPOINTS.KEYWORD_USAGE),
  })
}

/** Fetch keywords (paginated) */
export function useKeywords(params?: { domain?: string; page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['keywords', params],
    queryFn: () =>
      api<{ keywords: Keyword[]; total: number }>(
        RANK_TRACKING_ENDPOINTS.KEYWORDS,
        { params: params as Record<string, string | number | boolean> }
      ),
  })
}

/** Fetch weekly trends */
export function useWeeklyTrends() {
  return useQuery({
    queryKey: ['weekly-trends'],
    queryFn: () => api<WeeklyTrend[]>(RANK_TRACKING_ENDPOINTS.WEEKLY_TRENDS),
  })
}

/** Fetch billing packages */
export function useBillingPackages() {
  return useQuery({
    queryKey: ['billing-packages'],
    queryFn: () => api<{ packages: BillingPackage[] }>(BILLING_ENDPOINTS.PACKAGES),
    select: (d) => d.packages ?? [],
  })
}

/** Fetch dashboard aggregate data */
export function useDashboardAggregate() {
  return useQuery({
    queryKey: ['dashboard-aggregate'],
    queryFn: () => api<{
      user: { profile: UserProfile; quota: QuotaInfo; trial: unknown }
      billing: { packages: unknown; current_package_id: string | null; expires_at: string | null }
      rankTracking: { domains: Domain[]; recentKeywords: Keyword[] }
      notifications: unknown[]
    }>(DASHBOARD_ENDPOINTS.MAIN),
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
      api<unknown>(RANK_TRACKING_ENDPOINTS.KEYWORDS, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keywords'] })
      qc.invalidateQueries({ queryKey: ['keyword-usage'] })
      qc.invalidateQueries({ queryKey: ['dashboard-aggregate'] })
      qc.invalidateQueries({ queryKey: ['domains'] })
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

/** Trigger manual rank check for a keyword */
export function useCheckRank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (keywordId: string) =>
      api<unknown>(RANK_TRACKING_ENDPOINTS.CHECK_RANK, {
        method: 'POST',
        body: JSON.stringify({ keyword_id: keywordId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keywords'] })
      qc.invalidateQueries({ queryKey: ['quota'] })
      qc.invalidateQueries({ queryKey: ['weekly-trends'] })
    },
  })
}

/** Add tag to keywords */
export function useAddTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { keywordIds: string[]; tag: string }) =>
      api<unknown>(RANK_TRACKING_ENDPOINTS.ADD_KEYWORD_TAG, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keywords'] })
    },
  })
}
