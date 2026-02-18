'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DASHBOARD_ENDPOINTS } from '@indexnow/shared'
import { authenticatedFetch } from '@indexnow/supabase-client'

/** @internal Only consumed internally by useQuotaValidation — not directly used by apps */
export interface QuotaInfo {
  daily_quota_used: number;
  daily_quota_limit: number;
  is_unlimited: boolean;
  quota_exhausted: boolean;
  daily_limit_reached: boolean;
  package_name: string;
  remaining_quota: number;
  total_quota_used: number;
  total_quota_limit: number;
  service_account_count: number;
}

export interface QuotaNotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: {
    service_account_name: string;
    service_account_email: string;
    quota_reset_time: string;
  };
  created_at: string;
}

// (#136) Query key constant — export so mutations can invalidate quota cache
export const QUOTA_QUERY_KEY = ['global-quota'] as const

/**
 * (#119/#138/#136) Global quota manager — migrated from manual global singleton
 * to React Query with automatic caching, deduplication, and refetch.
 * 
 * React Query's built-in request deduplication replaces the old global pub/sub
 * pattern. Multiple components using this hook share the same cached data.
 * 
 * After mutations that consume quota, call:
 *   queryClient.invalidateQueries({ queryKey: QUOTA_QUERY_KEY })
 */
export interface UseGlobalQuotaManagerReturn {
  quotaInfo: QuotaInfo | null;
  notifications: QuotaNotificationData[];
  loading: boolean;
  refreshQuota: () => Promise<void>;
  canCreateJob: (urlCount?: number) => { allowed: boolean; reason: string | null };
  lastFetchTime: number;
}

export function useGlobalQuotaManager(): UseGlobalQuotaManagerReturn {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: QUOTA_QUERY_KEY,
    queryFn: async () => {
      const response = await authenticatedFetch(DASHBOARD_ENDPOINTS.MAIN)

      if (!response.ok) {
        throw new Error(`Failed to fetch quota data: ${response.status}`)
      }

      const result = await response.json()
      const dashboardData = result.success === true && result.data ? result.data : result

      return {
        quotaInfo: (dashboardData.user?.quota as QuotaInfo) ?? null,
        notifications: (dashboardData.notifications as QuotaNotificationData[]) ?? [],
      }
    },
    staleTime: 30 * 1000,        // 30 seconds — quota should be relatively fresh
    refetchInterval: 30 * 1000,  // Auto-refetch every 30s when component is mounted
    refetchOnWindowFocus: true,  // Refresh when user returns to tab
  })

  // Force refresh by invalidating the query cache
  const refreshQuota = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUOTA_QUERY_KEY })
  }, [queryClient])

  // Check if quota allows job creation
  const canCreateJob = useCallback((urlCount: number = 1) => {
    const quotaInfo = data?.quotaInfo
    if (!quotaInfo) return { allowed: true, reason: null }
    
    const { quota_exhausted, daily_limit_reached, remaining_quota, is_unlimited } = quotaInfo
    
    if (quota_exhausted || daily_limit_reached) {
      return { allowed: false, reason: 'Daily quota limit reached' }
    }
    
    if (!is_unlimited && remaining_quota < urlCount) {
      return { allowed: false, reason: `Insufficient quota. Need ${urlCount}, have ${remaining_quota}` }
    }
    
    return { allowed: true, reason: null }
  }, [data?.quotaInfo])

  return {
    quotaInfo: data?.quotaInfo ?? null,
    notifications: data?.notifications ?? [],
    loading: isLoading,
    refreshQuota,
    canCreateJob,
    lastFetchTime: 0 // Kept for interface compat — RQ manages freshness internally
  }
}
