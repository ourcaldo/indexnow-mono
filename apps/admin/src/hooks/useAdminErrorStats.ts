import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';

export interface ErrorStats {
  summary: {
    totalErrors: number;
    criticalErrors: number;
    highErrors: number;
    unresolvedErrors: number;
  };
  distributions: {
    byType: Record<string, number>;
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

export interface CriticalError {
  id: string;
  error_type: string;
  severity: string;
  message: string;
  endpoint?: string;
  http_method?: string;
  stack_trace?: string;
  created_at: string;
  user_id?: string;
}

export type TimeRange = '24h' | '7d' | '30d';

export interface ErrorDashboardData {
  stats: ErrorStats | null;
  criticalErrors: CriticalError[];
}

async function fetchErrorStats(timeRange: TimeRange): Promise<ErrorStats | null> {
  const response = await authenticatedFetch(`${ADMIN_ENDPOINTS.ERROR_STATS}?range=${timeRange}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.data ?? null;
}

async function fetchCriticalErrors(): Promise<CriticalError[]> {
  const response = await authenticatedFetch(`${ADMIN_ENDPOINTS.CRITICAL_ERRORS}?limit=20`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.data?.criticalErrors ?? [];
}

async function fetchErrorDashboard(timeRange: TimeRange): Promise<ErrorDashboardData> {
  const [stats, criticalErrors] = await Promise.all([
    fetchErrorStats(timeRange),
    fetchCriticalErrors(),
  ]);
  return { stats, criticalErrors };
}

export function useAdminErrorStats(
  timeRange: TimeRange
): UseQueryResult<ErrorDashboardData, Error> {
  return useQuery({
    queryKey: ['admin', 'error-stats', timeRange],
    queryFn: () => fetchErrorDashboard(timeRange),
    refetchInterval: 30_000, // Auto-refresh every 30 seconds
  });
}
