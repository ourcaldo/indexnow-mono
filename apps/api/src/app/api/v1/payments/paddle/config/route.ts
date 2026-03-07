/**
 * Paddle Configuration API Route
 * Returns Paddle client-side configuration loaded from database
 *
 * SECURITY: Only returns client_token (safe for frontend)
 * API key and webhook secret are NEVER exposed to frontend
 */

import { NextRequest } from 'next/server';
import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import {
  ErrorType,
  ErrorSeverity,
  formatSuccess,
  type Database,
} from '@indexnow/shared';
import { buildOperationContext } from '@/lib/services/build-operation-context';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';
import { publicApiWrapper, formatError } from '@/lib/core/api-response-middleware';

export const dynamic = 'force-dynamic';

// Derived types from Database schema
type PaymentGatewayRow = Database['public']['Tables']['indb_payment_gateways']['Row'];

interface GatewayCredentials {
  client_token?: string;
  api_key?: string;
  webhook_secret?: string;
}

interface GatewayConfiguration {
  environment?: 'sandbox' | 'production';
}

export const GET = publicApiWrapper(async (request: NextRequest) => {
  try {
    // Load Paddle gateway configuration using SecureServiceRoleWrapper
    // This is a public operation to get client-safe config
    const gateway = await SecureServiceRoleWrapper.executeSecureOperation<PaymentGatewayRow | null>(
      buildOperationContext(request, 'system', {
        operation: 'get_paddle_gateway_config',
        source: 'paddle/config',
        reason: 'Frontend requesting Paddle client configuration',
      }),
      { table: 'indb_payment_gateways', operationType: 'select' },
      async () => {
        const { data, error } = await supabaseAdmin
          .from('indb_payment_gateways')
          .select('*')
          .eq('slug', 'paddle')
          .eq('is_active', true)
          .is('deleted_at', null)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
      }
    );

    if (!gateway) {
      const notFoundError = await ErrorHandlingService.createError(
        ErrorType.DATABASE,
        'Paddle gateway not found or not active',
        {
          severity: ErrorSeverity.MEDIUM,
          statusCode: 404,
        }
      );
      return formatError(notFoundError);
    }

    // Extract credentials from database
    const apiCredentials = (gateway.api_credentials || {}) as GatewayCredentials;
    const configuration = (gateway.configuration || {}) as GatewayConfiguration;

    // CRITICAL: Only return client_token (safe for frontend)
    // NEVER expose api_key or webhook_secret to frontend
    //
    // Priority: DB api_credentials.client_token → env NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    // The DB stores webhook_secret (server-only); the client token lives in env vars.
    const clientToken =
      apiCredentials.client_token || process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

    if (!clientToken) {
      const tokenError = await ErrorHandlingService.createError(
        ErrorType.DATABASE,
        'Paddle client token not found in database or environment variables',
        {
          severity: ErrorSeverity.HIGH,
          statusCode: 500,
          metadata: {
            gateway_id: gateway.id,
            has_api_credentials: !!apiCredentials,
            has_env_token: !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
          },
        }
      );

      return formatError(tokenError);
    }

    // Resolve environment: DB configuration → env var → default 'sandbox'
    const environment = configuration.environment
      || (process.env.NEXT_PUBLIC_PADDLE_ENV as 'sandbox' | 'production' | undefined)
      || 'sandbox';

    // Return safe configuration for frontend
    return formatSuccess({
      clientToken,
      environment,
      isActive: gateway.is_active,
      isDefault: gateway.is_default,
    });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      '[Paddle Config API] Error loading configuration'
    );

    const configError = await ErrorHandlingService.createError(
      ErrorType.EXTERNAL_API,
      error instanceof Error ? error.message : String(error),
      {
        severity: ErrorSeverity.HIGH,
        statusCode: 500,
        metadata: { source: 'paddle_config_api' },
      }
    );

    return formatError(configError);
  }
});
