/**
 * Paddle Customer Portal API
 * Returns a portal login URL so the user can manage payment methods and invoices.
 * Uses the direct login URL pattern: no API call needed.
 *   - Sandbox:    https://sandbox-customer-portal.paddle.com/login/{customer_id}
 *   - Production: https://customer-portal.paddle.com/login/{customer_id}
 */

import { NextRequest } from 'next/server';
import { SecureServiceRoleWrapper, asTypedClient } from '@indexnow/database';
import { ErrorType, ErrorSeverity, type Database, getClientIP } from '@indexnow/shared';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

type UserProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row'];
type ProfilePortalInfo = Pick<UserProfileRow, 'paddle_customer_id'>;

const PORTAL_BASE_URLS: Record<string, string> = {
  production: 'https://customer-portal.paddle.com',
  sandbox: 'https://sandbox-customer-portal.paddle.com',
};

function getPortalBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_PADDLE_ENV ?? 'sandbox';
  return PORTAL_BASE_URLS[env] ?? PORTAL_BASE_URLS.sandbox;
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  const profile =
    await SecureServiceRoleWrapper.executeWithUserSession<ProfilePortalInfo | null>(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'get_customer_portal_url',
        source: 'paddle/customer-portal',
        reason: 'User requesting Paddle customer portal URL',
        metadata: { endpoint: '/api/v1/payments/paddle/customer-portal' },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
      { table: 'indb_auth_user_profiles', operationType: 'select' },
      async (db) => {
        const { data, error } = await db
          .from('indb_auth_user_profiles')
          .select('paddle_customer_id')
          .eq('user_id', auth.userId)
          .maybeSingle();

        if (error) {
          throw new Error(`Failed to fetch profile: ${error.message}`);
        }
        return data;
      }
    );

  if (!profile?.paddle_customer_id) {
    const error = await ErrorHandlingService.createError(
      ErrorType.BUSINESS_LOGIC,
      'No Paddle customer ID found. Please subscribe to a plan first.',
      { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 404 }
    );
    return formatError(error);
  }

  const portalUrl = `${getPortalBaseUrl()}/login/${profile.paddle_customer_id}`;

  return formatSuccess({ portalUrl });
});
