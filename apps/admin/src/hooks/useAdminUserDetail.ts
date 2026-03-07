import { useQuery } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';
import type { UserProfile } from './useAdminUsers';

async function fetchUserDetail(userId: string): Promise<UserProfile | null> {
  const response = await authenticatedFetch(ADMIN_ENDPOINTS.USER_BY_ID(userId));
  if (!response.ok) throw new Error('Failed to fetch user');
  const data = await response.json();
  return data.data?.user ?? null;
}

export function useAdminUserDetail(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: () => fetchUserDetail(userId),
    enabled: !!userId,
  });
}
