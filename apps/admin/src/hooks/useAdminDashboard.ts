import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS, logger } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';

export interface DashboardStats {
  total_users: number;
  regular_users: number;
  admin_users: number;
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
  return data.data?.stats ?? null;
}

export function useAdminDashboard(): UseQueryResult<DashboardStats | null, Error> {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchDashboardStats,
  });
}
