import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { ADMIN_ENDPOINTS, logger } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
  phone_number: string | null;
  package_id?: string;
  subscribed_at?: string;
  expires_at?: string;
  daily_quota_used?: number;
  daily_quota_reset_date?: string;
  package?: {
    id: string;
    name: string;
    slug: string;
    quota_limits: {
      concurrent_jobs: number;
      keywords_limit: number;
    };
  };
  email?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
}

interface UsersResponse {
  users: UserProfile[];
  pagination: {
    total_pages: number;
    total_items: number;
  };
}

async function fetchUsers(page: number, limit: number): Promise<UsersResponse> {
  const response = await authenticatedFetch(`${ADMIN_ENDPOINTS.USERS}?page=${page}&limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  const data = await response.json();
  return {
    users: data.data?.users ?? [],
    pagination: data.data?.pagination ?? { total_pages: 1, total_items: 0 },
  };
}

export function useAdminUsers(page: number, limit: number): UseQueryResult<UsersResponse, Error> {
  return useQuery({
    queryKey: ['admin', 'users', { page, limit }],
    queryFn: () => fetchUsers(page, limit),
  });
}

export function useChangeUserRole(): UseMutationResult<
  void,
  Error,
  { userId: string; newRole: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const response = await authenticatedFetch(ADMIN_ENDPOINTS.USER_ROLE(userId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) throw new Error('Failed to update user role');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error) => {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Failed to update user role'
      );
    },
  });
}

export function useSuspendUser(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authenticatedFetch(ADMIN_ENDPOINTS.USER_BY_ID(userId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'suspended' }),
      });
      if (!response.ok) throw new Error('Failed to suspend user');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error) => {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to suspend user');
    },
  });
}
