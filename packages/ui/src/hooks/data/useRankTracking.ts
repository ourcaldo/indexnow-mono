'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type Json, RANK_TRACKING_ENDPOINTS, logger, authenticatedFetch } from '@indexnow/shared'

/** @internal Not yet consumed by any app — reserved for future use */
interface Keyword {
  id: string
  user_id: string
  domain: string
  keyword: string
  target_url: string
  country_code: string
  location: string
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  current_ranking?: RankingData
  ranking_history: RankingData[]
}

interface RankingData {
  id: string
  keyword_id: string
  position: number | null
  previous_position: number | null
  position_change: number
  search_volume: number | null
  competition: 'low' | 'medium' | 'high' | null
  cpc: number | null
  serp_features: string[]
  checked_at: string
  top_10_results?: SerpResult[]
}

interface SerpResult {
  position: number
  title: string
  url: string
  snippet: string
  domain: string
}

interface RankTrackingStats {
  total_keywords: number
  active_keywords: number
  domains: number
  average_position: number
  keywords_improved: number
  keywords_declined: number
  keywords_unchanged: number
  top_10_count: number
  top_3_count: number
  position_1_count: number
  last_check_date: string
}

interface CompetitorAnalysis {
  domain: string
  keywords_competing: number
  average_position: number
  visibility_score: number
  top_keywords: Array<{
    keyword: string
    position: number
    search_volume: number
  }>
}

type RankTrackingFilters = {
  domain?: string
  country?: string
  tags?: string[]
  position_min?: number
  position_max?: number
  status?: 'improved' | 'declined' | 'unchanged'
}

interface UseRankTrackingReturn {
  // Core data
  keywords: Keyword[]
  rankingStats: RankTrackingStats | null
  competitors: CompetitorAnalysis[]
  
  // State
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  
  // Filters
  filters: RankTrackingFilters
  
  // Actions
  fetchKeywords: (page?: number, limit?: number) => Promise<void>
  addKeyword: (keywordData: Partial<Keyword>) => Promise<{ success: boolean; keywordId?: string; error?: string }>
  updateKeyword: (keywordId: string, updates: Partial<Keyword>) => Promise<{ success: boolean; error?: string }>
  deleteKeyword: (keywordId: string) => Promise<{ success: boolean; error?: string }>
  bulkAddKeywords: (keywords: Partial<Keyword>[]) => Promise<{ success: boolean; added: number; failed: number; errors?: string[] }>
  
  // Ranking operations
  checkRankings: (keywordIds?: string[]) => Promise<{ success: boolean; error?: string }>
  fetchRankingHistory: (keywordId: string, days?: number) => Promise<RankingData[]>
  
  // Analytics
  fetchRankingStats: (domain?: string, dateRange?: { from: string; to: string }) => Promise<void>
  fetchCompetitorAnalysis: (domain: string) => Promise<void>
  exportRankings: (format: 'csv' | 'xlsx', filters?: Record<string, Json>) => Promise<{ success: boolean; downloadUrl?: string; error?: string }>
  
  // Filters and utilities  
  setFilters: (newFilters: Partial<RankTrackingFilters>) => void
  clearFilters: () => void
  getKeywordsByDomain: (domain: string) => Keyword[]
  getKeywordsByTag: (tag: string) => Keyword[]
  getTopPerformingKeywords: (limit?: number) => Keyword[]
  getUnderperformingKeywords: (limit?: number) => Keyword[]
}

// (#119/#138/#134) Query key constants — export so tests or other hooks can invalidate
export const RANK_TRACKING_KEYS = {
  all: ['rank-tracking'] as const,
  keywords: (page: number, limit: number, filters: RankTrackingFilters) =>
    ['rank-tracking', 'keywords', { page, limit, ...filters }] as const,
  stats: (domain?: string, dateRange?: { from: string; to: string }) =>
    ['rank-tracking', 'stats', { domain, dateRange }] as const,
} as const

/**
 * (#119/#138/#134) Rank tracking hook — migrated from manual useState/useEffect
 * to React Query for automatic caching, deduplication, pagination, and retry.
 *
 * - Keywords & stats are `useQuery` (auto-fetch, cache, retry)
 * - CRUD ops are `useMutation` (auto-invalidate keywords cache on success)
 * - Pagination/filters are local state included in queryKey → auto-refetch
 * - On-demand fetches (history, competitors, export) remain manual
 */
export function useRankTracking(): UseRankTrackingReturn {
  const queryClient = useQueryClient()

  // Pagination & filter state — included in queryKey for auto-refetch on change
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [filters, setFiltersState] = useState<RankTrackingFilters>({})

  // Stats params — changing these updates the stats queryKey, triggering refetch
  const [statsParams, setStatsParams] = useState<{
    domain?: string
    dateRange?: { from: string; to: string }
  }>({})

  // Competitors are fetched on-demand, not auto-queried
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([])

  // ─── Keywords Query (#134: proper server-side pagination via queryKey) ───
  const keywordsQuery = useQuery({
    queryKey: RANK_TRACKING_KEYS.keywords(page, limit, filters),
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            ;(value as string[]).forEach(v => queryParams.append(`${key}[]`, v.toString()))
          } else {
            queryParams.append(key, String(value))
          }
        }
      })

      const response = await authenticatedFetch(
        `${RANK_TRACKING_ENDPOINTS.KEYWORDS}?${queryParams}`
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch keywords: ${response.status}`)
      }
      return response.json() as Promise<{
        keywords: Keyword[]
        pagination: { page: number; limit: number; total: number; totalPages: number }
      }>
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // ─── Stats Query ───
  const statsQuery = useQuery({
    queryKey: RANK_TRACKING_KEYS.stats(statsParams.domain, statsParams.dateRange),
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (statsParams.domain) queryParams.append('domain', statsParams.domain)
      if (statsParams.dateRange) {
        queryParams.append('from', statsParams.dateRange.from)
        queryParams.append('to', statsParams.dateRange.to)
      }
      const response = await authenticatedFetch(
        `${RANK_TRACKING_ENDPOINTS.STATS}?${queryParams}`
      )
      if (!response.ok) throw new Error(`Failed to fetch stats: ${response.status}`)
      const data = await response.json()
      return (data.stats as RankTrackingStats) ?? null
    },
    staleTime: 2 * 60 * 1000,
  })

  // ─── Mutations (auto-invalidate keyword cache on success) ───
  const addKeywordMut = useMutation({
    mutationFn: async (keywordData: Partial<Keyword>) => {
      const response = await authenticatedFetch(RANK_TRACKING_ENDPOINTS.KEYWORDS, {
        method: 'POST',
        body: JSON.stringify(keywordData),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `Keyword creation failed: ${response.status}`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RANK_TRACKING_KEYS.all })
    },
  })

  const updateKeywordMut = useMutation({
    mutationFn: async ({ keywordId, updates }: { keywordId: string; updates: Partial<Keyword> }) => {
      const response = await authenticatedFetch(RANK_TRACKING_ENDPOINTS.KEYWORD_BY_ID(keywordId), {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `Keyword update failed: ${response.status}`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RANK_TRACKING_KEYS.all })
    },
  })

  /**
   * Delete mutation. Callers MUST show a confirmation dialog
   * (e.g. ConfirmationDialog with variant="destructive") before invoking,
   * as the deletion is irreversible.
   */
  const deleteKeywordMut = useMutation({
    mutationFn: async (keywordId: string) => {
      const response = await authenticatedFetch(RANK_TRACKING_ENDPOINTS.KEYWORD_BY_ID(keywordId), {
        method: 'DELETE',
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `Keyword deletion failed: ${response.status}`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RANK_TRACKING_KEYS.all })
    },
  })

  const bulkAddMut = useMutation({
    mutationFn: async (keywordsData: Partial<Keyword>[]) => {
      const response = await authenticatedFetch(RANK_TRACKING_ENDPOINTS.KEYWORDS_BULK, {
        method: 'POST',
        body: JSON.stringify({ keywords: keywordsData }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `Bulk operation failed: ${response.status}`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RANK_TRACKING_KEYS.all })
    },
  })

  const checkRankingsMut = useMutation({
    mutationFn: async (keywordIds?: string[]) => {
      const response = await authenticatedFetch(RANK_TRACKING_ENDPOINTS.RANKINGS_CHECK, {
        method: 'POST',
        body: JSON.stringify({ keywordIds }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `Ranking check failed: ${response.status}`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RANK_TRACKING_KEYS.all })
    },
  })

  // ─── Derived data from queries ───
  const keywords: Keyword[] = keywordsQuery.data?.keywords ?? []
  const pagination = {
    page: keywordsQuery.data?.pagination?.page ?? page,
    limit: keywordsQuery.data?.pagination?.limit ?? limit,
    total: keywordsQuery.data?.pagination?.total ?? 0,
    totalPages: keywordsQuery.data?.pagination?.totalPages ?? 0,
  }

  // ─── Interface-compatible action wrappers ───

  // Setting page/limit updates queryKey → React Query auto-refetches
  const fetchKeywords = useCallback(async (newPage = 1, newLimit = 20) => {
    setPage(newPage)
    setLimit(newLimit)
  }, [])

  const addKeyword: UseRankTrackingReturn['addKeyword'] = async (keywordData) => {
    try {
      const data = await addKeywordMut.mutateAsync(keywordData)
      return { success: true, keywordId: data.keyword?.id }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add keyword' }
    }
  }

  const updateKeyword: UseRankTrackingReturn['updateKeyword'] = async (keywordId, updates) => {
    try {
      await updateKeywordMut.mutateAsync({ keywordId, updates })
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update keyword' }
    }
  }

  const deleteKeyword: UseRankTrackingReturn['deleteKeyword'] = async (keywordId) => {
    try {
      await deleteKeywordMut.mutateAsync(keywordId)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete keyword' }
    }
  }

  const bulkAddKeywords: UseRankTrackingReturn['bulkAddKeywords'] = async (keywordsData) => {
    try {
      const data = await bulkAddMut.mutateAsync(keywordsData)
      return {
        success: true,
        added: data.added || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
      }
    } catch (err) {
      return {
        success: false,
        added: 0,
        failed: keywordsData.length,
        errors: [err instanceof Error ? err.message : 'Failed to add keywords'],
      }
    }
  }

  const checkRankings: UseRankTrackingReturn['checkRankings'] = async (keywordIds) => {
    try {
      await checkRankingsMut.mutateAsync(keywordIds)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to check rankings' }
    }
  }

  // ─── On-demand fetches (not auto-cached via useQuery) ───

  const fetchRankingHistory = useCallback(async (keywordId: string, days = 30) => {
    try {
      const response = await authenticatedFetch(
        `${RANK_TRACKING_ENDPOINTS.KEYWORD_HISTORY(keywordId)}?days=${days}`
      )
      if (response.ok) {
        const data = await response.json()
        return data.history || []
      }
      return []
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error fetching ranking history')
      return []
    }
  }, [])

  // Updating statsParams changes the queryKey → React Query auto-refetches stats
  const fetchRankingStats = useCallback(
    async (domain?: string, dateRange?: { from: string; to: string }) => {
      setStatsParams({ domain, dateRange })
    },
    []
  )

  const fetchCompetitorAnalysis = useCallback(async (domain: string) => {
    try {
      const response = await authenticatedFetch(
        `${RANK_TRACKING_ENDPOINTS.COMPETITORS}?domain=${domain}`
      )
      if (response.ok) {
        const data = await response.json()
        setCompetitors(data.competitors || [])
      }
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error fetching competitor analysis')
    }
  }, [])

  const exportRankings: UseRankTrackingReturn['exportRankings'] = async (format, exportFilters) => {
    try {
      const response = await authenticatedFetch(RANK_TRACKING_ENDPOINTS.EXPORT, {
        method: 'POST',
        body: JSON.stringify({ format, filters: exportFilters || filters || {} }),
      })
      if (!response.ok) {
        const errData = await response.json()
        return { success: false, error: errData.error || `Export failed: ${response.status}` }
      }
      const data = await response.json()
      return { success: true, downloadUrl: data.downloadUrl }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to export rankings' }
    }
  }

  // ─── Filter management ───

  const setFilters = useCallback((newFilters: Partial<RankTrackingFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    setPage(1) // Reset to page 1 when filters change
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState({})
    setPage(1)
  }, [])

  // ─── Utility functions — derived from cached keywords data ───

  const getKeywordsByDomain = useCallback(
    (domain: string) => keywords.filter(k => k.domain === domain),
    [keywords]
  )

  const getKeywordsByTag = useCallback(
    (tag: string) => keywords.filter(k => k.tags.includes(tag)),
    [keywords]
  )

  const getTopPerformingKeywords = useCallback(
    (topLimit = 10) =>
      keywords
        .filter(k => k.current_ranking?.position)
        .sort((a, b) => (a.current_ranking?.position || 999) - (b.current_ranking?.position || 999))
        .slice(0, topLimit),
    [keywords]
  )

  const getUnderperformingKeywords = useCallback(
    (bottomLimit = 10) =>
      keywords
        .filter(k => k.current_ranking?.position && k.current_ranking.position > 50)
        .sort((a, b) => (b.current_ranking?.position || 0) - (a.current_ranking?.position || 0))
        .slice(0, bottomLimit),
    [keywords]
  )

  return {
    keywords,
    rankingStats: statsQuery.data ?? null,
    competitors,
    loading: keywordsQuery.isLoading || statsQuery.isLoading,
    error: keywordsQuery.error?.message ?? statsQuery.error?.message ?? null,
    pagination,
    filters,
    fetchKeywords,
    addKeyword,
    updateKeyword,
    deleteKeyword,
    bulkAddKeywords,
    checkRankings,
    fetchRankingHistory,
    fetchRankingStats,
    fetchCompetitorAnalysis,
    exportRankings,
    setFilters,
    clearFilters,
    getKeywordsByDomain,
    getKeywordsByTag,
    getTopPerformingKeywords,
    getUnderperformingKeywords,
  }
}