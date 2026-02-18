import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS, type EnrichedActivityLog } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';

interface UserInfo {
  id: string;
  name: string;
}

export interface UserActivityResponse {
  logs: EnrichedActivityLog[];
  user: UserInfo | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchUserActivity(userId: string, page: number): Promise<UserActivityResponse> {
  const params = new URLSearchParams({
    limit: '50',
    page: page.toString(),
  });

  const response = await authenticatedFetch(
    `${ADMIN_ENDPOINTS.USER_BY_ID(userId)}/activity?${params}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch user activity');
  }

  const data = await response.json();
  return {
    logs: data.logs ?? [],
    user: data.user ?? null,
    pagination: data.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 },
  };
}

export function useAdminUserActivity(
  userId: string,
  page: number
): UseQueryResult<UserActivityResponse, Error> {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'activity', { page }],
    queryFn: () => fetchUserActivity(userId, page),
    enabled: !!userId,
  });
}
