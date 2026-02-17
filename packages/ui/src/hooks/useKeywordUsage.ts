'use client'

import { useQuery } from '@tanstack/react-query'
import { RANK_TRACKING_ENDPOINTS, authenticatedFetch } from '@indexnow/shared'

/** @internal Not yet consumed by any app — reserved for future use */
export interface KeywordUsageDataExtended {
  keywords_used: number
  keywords_limit: number
  is_unlimited: boolean
  remaining_quota: number
  period_start: string | null
  period_end: string | null
}

/**
 * (#119/#138) React Query hook for keyword usage data.
 * Previously used manual useState + useEffect + fetch pattern.
 * Now uses useQuery with automatic caching, retry, and stale management.
 */
export function useKeywordUsage() {
  const query = useQuery({
    queryKey: ['keyword-usage'],
    queryFn: async (): Promise<KeywordUsageDataExtended> => {
      const response = await authenticatedFetch(RANK_TRACKING_ENDPOINTS.KEYWORD_USAGE)

      if (!response.ok) {
        throw new Error(`Failed to fetch keyword usage: ${response.status}`)
      }

      return response.json() as Promise<KeywordUsageDataExtended>
    },
    staleTime: 30 * 1000, // 30 seconds — quota data should be relatively fresh
  })

  return { 
    keywordUsage: query.data ?? null, 
    loading: query.isLoading, 
    error: query.error?.message ?? null, 
    refetch: query.refetch 
  }
}