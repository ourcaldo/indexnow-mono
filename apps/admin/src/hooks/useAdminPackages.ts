import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { ADMIN_ENDPOINTS, logger } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';

export interface PricingTier {
  period: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  period_label: string;
  regular_price: number;
  promo_price: number;
  paddle_price_id?: string;
}

export interface PaymentPackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  billing_period: string;
  features: string[];
  quota_limits: {
    concurrent_jobs?: number;
    keywords_limit?: number;
  };
  is_active: boolean;
  is_popular?: boolean;
  sort_order: number;
  pricing_tiers?: PricingTier[];
  created_at: string;
  updated_at: string;
}

async function fetchPackages(): Promise<PaymentPackage[]> {
  const response = await authenticatedFetch(ADMIN_ENDPOINTS.PACKAGES);

  if (!response.ok) {
    throw new Error('Failed to fetch packages');
  }

  const data = await response.json();
  return data.data?.packages ?? [];
}

export function useAdminPackages(): UseQueryResult<PaymentPackage[], Error> {
  return useQuery({
    queryKey: ['admin', 'settings', 'packages'],
    queryFn: fetchPackages,
  });
}

export function useSavePackage(): UseMutationResult<unknown, Error, Partial<PaymentPackage>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (packageData: Partial<PaymentPackage>) => {
      const url = packageData.id
        ? ADMIN_ENDPOINTS.PACKAGE_BY_ID(packageData.id)
        : ADMIN_ENDPOINTS.PACKAGES;
      const method = packageData.id ? 'PATCH' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData),
      });
      if (!response.ok) throw new Error('Failed to save package');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'packages'] });
    },
    onError: (error) => {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to save package');
    },
  });
}

export function useDeletePackage(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(ADMIN_ENDPOINTS.PACKAGE_BY_ID(id), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete package');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'packages'] });
    },
    onError: (error) => {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Failed to delete package'
      );
    },
  });
}
