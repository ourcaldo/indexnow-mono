import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  ADMIN_ENDPOINTS,
  type PaymentGatewayRow,
  type PaymentGatewayConfiguration,
  type PaymentGatewayCredentials,
  logger,
} from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';

export type UI_PaymentGateway = Omit<PaymentGatewayRow, 'configuration' | 'api_credentials'> & {
  configuration: PaymentGatewayConfiguration;
  api_credentials: PaymentGatewayCredentials;
};

async function fetchPaymentGateways(): Promise<UI_PaymentGateway[]> {
  const response = await authenticatedFetch(ADMIN_ENDPOINTS.PAYMENT_GATEWAYS);

  if (!response.ok) {
    throw new Error('Failed to fetch payment gateways');
  }

  const data = await response.json();
  return (data.data?.gateways || []).map((g: PaymentGatewayRow) => ({
    ...g,
    configuration: (g.configuration as PaymentGatewayConfiguration) || {},
    api_credentials: (g.api_credentials as PaymentGatewayCredentials) || {},
  }));
}

export function useAdminPaymentSettings(): UseQueryResult<UI_PaymentGateway[], Error> {
  return useQuery({
    queryKey: ['admin', 'settings', 'payments'],
    queryFn: fetchPaymentGateways,
  });
}

export function useSavePaymentGateway(): UseMutationResult<
  unknown,
  Error,
  Partial<UI_PaymentGateway>
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gateway: Partial<UI_PaymentGateway>) => {
      const url = gateway.id
        ? ADMIN_ENDPOINTS.PAYMENT_GATEWAY_BY_ID(gateway.id)
        : ADMIN_ENDPOINTS.PAYMENT_GATEWAYS;
      const method = gateway.id ? 'PATCH' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gateway),
      });
      if (!response.ok) throw new Error('Failed to save payment gateway');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'payments'] });
    },
    onError: (error) => {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Failed to save payment gateway'
      );
    },
  });
}

export function useDeletePaymentGateway(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(ADMIN_ENDPOINTS.PAYMENT_GATEWAY_BY_ID(id), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete payment gateway');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'payments'] });
    },
    onError: (error) => {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Failed to delete payment gateway'
      );
    },
  });
}

export function useSetDefaultPaymentGateway(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(ADMIN_ENDPOINTS.PAYMENT_GATEWAY_DEFAULT(id), {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to update default gateway');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'payments'] });
    },
    onError: (error) => {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Failed to update default gateway'
      );
    },
  });
}
