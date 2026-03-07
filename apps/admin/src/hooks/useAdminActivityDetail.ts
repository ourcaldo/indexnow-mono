import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS, type ActivityDetail } from '@indexnow/shared';
import { validateApiResponse, adminActivityDetailResponseSchema } from '@indexnow/shared/response-schemas';
import { authenticatedFetch } from '@indexnow/supabase-client';

async function fetchActivityDetail(id: string): Promise<ActivityDetail | null> {
  const response = await authenticatedFetch(ADMIN_ENDPOINTS.ACTIVITY_BY_ID(id));

  if (!response.ok) {
    throw new Error('Failed to fetch activity details');
  }

  const data = await response.json();
  validateApiResponse(data.data, adminActivityDetailResponseSchema, 'admin/activity/detail');
  return data.data?.activity ?? null;
}

export function useAdminActivityDetail(id: string): UseQueryResult<ActivityDetail | null, Error> {
  return useQuery({
    queryKey: ['admin', 'activity', id],
    queryFn: () => fetchActivityDetail(id),
    enabled: !!id,
  });
}
