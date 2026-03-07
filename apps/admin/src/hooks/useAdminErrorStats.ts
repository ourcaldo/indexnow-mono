import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '@indexnow/shared';
import { validateApiResponse, adminErrorStatsResponseSchema, adminErrorListResponseSchema } from '@indexnow/shared/response-schemas';
import { authenticatedFetch } from '@indexnow/supabase-client';

export interface ErrorStats {
  summary: {
    totalErrors: number;
    criticalErrors: number;
    highErrors: number;
    warningErrors: number;
    infoErrors: number;
    unresolvedErrors: number;
    resolvedErrors: number;
  };
  distributions: {
    bySeverity: Record<string, number>;
    byEndpoint: Array<{ endpoint: string; count: number }>;
  };
  topErrors: Array<{
    message: string;
    error_type: string;
    severity: string;
    count: number;
  }>;
  trend: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    previousPeriodCount: number;
    currentPeriodCount: number;
  };
  timeRange: string;
}

export interface ErrorLogEntry {
  id: string;
  error_type: string;
  severity: string;
  message: string;
  user_message?: string;
  user_id?: string;
  endpoint?: string;
  http_method?: string;
  status_code?: number;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

export type TimeRange = '24h' | '7d' | '30d';
export type SeverityFilter = 'all' | 'critical' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorDashboardData {
  stats: ErrorStats | null;
}

export interface ErrorListData {
  errors: ErrorLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

async function fetchErrorStats(timeRange: TimeRange): Promise<ErrorStats | null> {
  const response = await authenticatedFetch(`${ADMIN_ENDPOINTS.ERROR_STATS}?range=${timeRange}`);
  if (!response.ok) return null;
  const data = await response.json();
  validateApiResponse(data.data, adminErrorStatsResponseSchema, 'admin/errors/stats');
  return data.data ?? null;
}

async function fetchErrorDashboard(timeRange: TimeRange): Promise<ErrorDashboardData> {
  const stats = await fetchErrorStats(timeRange);
  return { stats };
}

export function useAdminErrorStats(
  timeRange: TimeRange
): UseQueryResult<ErrorDashboardData, Error> {
  return useQuery({
    queryKey: ['admin', 'error-stats', timeRange],
    queryFn: () => fetchErrorDashboard(timeRange),
    refetchInterval: 30_000,
  });
}

async function fetchErrorList(
  page: number,
  severity: SeverityFilter,
  timeRange: TimeRange
): Promise<ErrorListData> {
  const params = new URLSearchParams({
    page: String(page),
    limit: '50',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  if (severity !== 'all') {
    params.set('severity', severity);
  }

  // Map time range to dateFrom filter
  const now = new Date();
  const offsetMs =
    timeRange === '24h' ? 24 * 60 * 60 * 1000 :
    timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 :
    30 * 24 * 60 * 60 * 1000;
  params.set('dateFrom', new Date(now.getTime() - offsetMs).toISOString());

  const response = await authenticatedFetch(`${ADMIN_ENDPOINTS.ERRORS}?${params.toString()}`);
  if (!response.ok) return { errors: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
  const data = await response.json();
  validateApiResponse(data.data, adminErrorListResponseSchema, 'admin/errors/list');
  return {
    errors: data.data?.errors ?? [],
    pagination: data.data?.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
  };
}

export function useAdminErrorList(
  page: number,
  severity: SeverityFilter,
  timeRange: TimeRange
): UseQueryResult<ErrorListData, Error> {
  return useQuery({
    queryKey: ['admin', 'error-list', page, severity, timeRange],
    queryFn: () => fetchErrorList(page, severity, timeRange),
    refetchInterval: 30_000,
  });
}
