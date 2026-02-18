import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS, type EnrichedActivityLog } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';

export interface ActivityParams {
  days: string;
  page: number;
  limit?: number;
}

export interface ActivityResponse {
  logs: EnrichedActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchActivityLogs(params: ActivityParams): Promise<ActivityResponse> {
  const searchParams = new URLSearchParams({
    days: params.days,
    limit: (params.limit ?? 50).toString(),
    page: params.page.toString(),
  });

  const response = await authenticatedFetch(`${ADMIN_ENDPOINTS.ACTIVITY}?${searchParams}`);

  if (!response.ok) {
    throw new Error('Failed to fetch activity logs');
  }

  const data = await response.json();
  return {
    logs: data.data?.logs ?? [],
    pagination: data.data?.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 },
  };
}

export function useAdminActivity(params: ActivityParams): UseQueryResult<ActivityResponse, Error> {
  return useQuery({
    queryKey: ['admin', 'activity', params],
    queryFn: () => fetchActivityLogs(params),
  });
}
