import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS, logger } from '@indexnow/shared';
import { validateApiResponse, adminDashboardResponseSchema } from '@indexnow/shared/response-schemas';
import { authenticatedFetch } from '@indexnow/supabase-client';

export interface DashboardStats {
  users: {
    total: number;
    activeToday: number;
    newThisWeek: number;
  };
  errors: {
    critical: number;
    unresolved: number;
    last24h: number;
  };
  transactions: {
    total: number;
    completedThisMonth: number;
    pendingCount: number;
  };
  keywords: {
    total: number;
    checkedToday: number;
  };
}

async function fetchDashboardStats(): Promise<DashboardStats | null> {
  const response = await authenticatedFetch(ADMIN_ENDPOINTS.DASHBOARD);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(
      { error: undefined },
      `Error fetching dashboard stats (${response.status}): ${errorText}`
    );
    throw new Error('Failed to fetch dashboard stats');
  }

  const data = await response.json();
  validateApiResponse(data.data, adminDashboardResponseSchema, 'admin/dashboard');
  return data.data?.stats ?? null;
}

export function useAdminDashboard(): UseQueryResult<DashboardStats | null, Error> {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchDashboardStats,
    refetchInterval: 60_000,
  });
}
