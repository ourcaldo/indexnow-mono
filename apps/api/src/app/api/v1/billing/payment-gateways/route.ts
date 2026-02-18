import { NextRequest } from 'next/server';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper, asTypedClient } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity, type Database, getClientIP } from '@indexnow/shared';

// Derived types from Database schema
type PaymentGatewayRow = Database['public']['Tables']['indb_payment_gateways']['Row'];

// Public gateway info (without credentials)
type PublicGatewayInfo = Pick<
  PaymentGatewayRow,
  'id' | 'name' | 'slug' | 'is_active' | 'is_default'
>;

/**
 * GET /api/v1/billing/payment-gateways
 * Get active payment gateways available for payments
 * SECURITY: Requires authentication, does not expose credentials
 */
export const GET = authenticatedApiWrapper(async (request, auth) => {
  try {
    const gateways = await SecureServiceRoleWrapper.executeWithUserSession<PublicGatewayInfo[]>(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'get_active_payment_gateways',
        source: 'billing/payment-gateways',
        reason: 'User fetching available payment gateways',
        metadata: { endpoint: '/api/v1/billing/payment-gateways' },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
      { table: 'indb_payment_gateways', operationType: 'select' },
      async (db) => {
        // Only select public fields, never expose credentials
        const { data, error } = await db
          .from('indb_payment_gateways')
          .select('id, name, slug, is_active, is_default')
          .eq('is_active', true)
          .is('deleted_at', null)
          .order('is_default', { ascending: false })
          .limit(20);

        if (error) throw error;
        return data ?? [];
      }
    );

    return formatSuccess({
      gateways,
    });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/billing/payment-gateways',
        method: 'GET',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
