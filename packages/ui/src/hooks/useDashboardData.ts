'use client'

import { useQuery } from '@tanstack/react-query'
import { DASHBOARD_ENDPOINTS } from '@indexnow/shared'
import { authenticatedFetch } from '@indexnow/supabase-client'
import type { 
  Json,
  RankTrackingDomain,
  DashboardRecentKeyword,
  AppUserProfile,
  UserQuotaUsage,
  AppUserSettings,
  TrialEligibility,
  UserSubscription
} from '@indexnow/shared'

export interface DashboardData {
  user: {
    profile: AppUserProfile;
    quota: UserQuotaUsage;
    settings: AppUserSettings;
    trial: TrialEligibility;
  };
  billing: UserSubscription | null;
  rankTracking: {
    usage: UserQuotaUsage;
    domains: RankTrackingDomain[];
    recentKeywords: DashboardRecentKeyword[];
  };
  notifications: Json[];
}

export const useDashboardData = () => {
  return useQuery({
    queryKey: [DASHBOARD_ENDPOINTS.MAIN],
    queryFn: async (): Promise<DashboardData> => {
      const response = await authenticatedFetch(DASHBOARD_ENDPOINTS.MAIN)

      if (!response.ok) {
        throw new Error(`Dashboard API failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      // API now returns: { success: true, data: {...}, timestamp: "..." }
      // Unwrap the data property to maintain compatibility
      if (result.success === true && result.data) {
        return result.data
      }
      
      // Fallback for old format (if any endpoints still use it)
      return result
    },
    // (#146) Using QueryProvider defaults: retry: 3, staleTime: 5min, retryDelay: exponential
  })
}
