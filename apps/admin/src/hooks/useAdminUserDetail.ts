import { useQuery } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '@indexnow/shared';
import { validateApiResponse, adminUserDetailResponseSchema } from '@indexnow/shared/response-schemas';
import { authenticatedFetch } from '@indexnow/supabase-client';
import type { UserProfile } from './useAdminUsers';

async function fetchUserDetail(userId: string): Promise<UserProfile | null> {
  const response = await authenticatedFetch(ADMIN_ENDPOINTS.USER_BY_ID(userId));
  if (!response.ok) throw new Error('Failed to fetch user');
  const data = await response.json();
  validateApiResponse(data.data, adminUserDetailResponseSchema, 'admin/users/detail');
  return data.data?.user ?? null;
}

export function useAdminUserDetail(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: () => fetchUserDetail(userId),
    enabled: !!userId,
  });
}
