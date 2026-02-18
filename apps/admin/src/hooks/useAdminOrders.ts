import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS, type AdminOrdersResponse } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';

export interface OrdersParams {
  page: number;
  limit?: number;
  status?: string;
  customer?: string;
  packageId?: string;
}

async function fetchOrders(params: OrdersParams): Promise<AdminOrdersResponse> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: (params.limit ?? 25).toString(),
  });

  if (params.status && params.status !== 'all') searchParams.append('status', params.status);
  if (params.customer) searchParams.append('customer', params.customer);
  if (params.packageId && params.packageId !== 'all')
    searchParams.append('package_id', params.packageId);

  const response = await authenticatedFetch(`${ADMIN_ENDPOINTS.ORDERS}?${searchParams}`);

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch orders');
  }

  return data.data;
}

export function useAdminOrders(params: OrdersParams): UseQueryResult<AdminOrdersResponse, Error> {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => fetchOrders(params),
  });
}
