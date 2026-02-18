import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { ADMIN_ENDPOINTS, logger, type AdminOrderDetailResponse } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';

async function fetchOrderDetail(orderId: string): Promise<AdminOrderDetailResponse> {
  const response = await authenticatedFetch(ADMIN_ENDPOINTS.ORDER_BY_ID(orderId));

  if (!response.ok) {
    if (response.status === 404) throw new Error('Order not found');
    throw new Error('Failed to fetch order details');
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch order details');
  return data.data;
}

export function useAdminOrderDetail(
  orderId: string
): UseQueryResult<AdminOrderDetailResponse, Error> {
  return useQuery({
    queryKey: ['admin', 'orders', orderId],
    queryFn: () => fetchOrderDetail(orderId),
    enabled: !!orderId,
  });
}

interface UpdateStatusResponse {
  success: boolean;
  message?: string;
}

export function useUpdateOrderStatus(
  orderId: string
): UseMutationResult<UpdateStatusResponse, Error, { status: string; notes?: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      status,
      notes,
    }: {
      status: string;
      notes?: string;
    }): Promise<UpdateStatusResponse> => {
      const response = await authenticatedFetch(ADMIN_ENDPOINTS.ORDER_STATUS(orderId), {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          notes: notes?.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update order status');
      if (!data.success) throw new Error(data.error || 'Failed to update order status');
      return data as UpdateStatusResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: (error) => {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Error updating order status'
      );
    },
  });
}
