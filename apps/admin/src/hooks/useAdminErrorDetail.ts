import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { ADMIN_ENDPOINTS, type ErrorDetailResponse } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';

async function fetchErrorDetail(errorId: string): Promise<ErrorDetailResponse> {
  const response = await authenticatedFetch(ADMIN_ENDPOINTS.ERROR_BY_ID(errorId));

  if (!response.ok) {
    if (response.status === 404) throw new Error('Error not found');
    throw new Error('Failed to fetch error details');
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch error details');
  return data.data;
}

export function useAdminErrorDetail(errorId: string): UseQueryResult<ErrorDetailResponse, Error> {
  return useQuery({
    queryKey: ['admin', 'errors', errorId],
    queryFn: () => fetchErrorDetail(errorId),
    enabled: !!errorId,
  });
}

export function useErrorAction(
  errorId: string
): UseMutationResult<unknown, Error, 'acknowledge' | 'resolve'> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: 'acknowledge' | 'resolve') => {
      const response = await authenticatedFetch(ADMIN_ENDPOINTS.ERROR_BY_ID(errorId), {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${action} error`);
      if (!data.success) throw new Error(data.error || `Failed to ${action} error`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'errors', errorId] });
    },
  });
}
