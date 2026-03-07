/**
 * Paddle Customer Portal API
 * Returns a portal login URL so the user can manage payment methods and invoices.
 * Uses the direct login URL pattern: no API call needed.
 *   - Sandbox:    https://sandbox-customer-portal.paddle.com/login/{customer_id}
 *   - Production: https://customer-portal.paddle.com/login/{customer_id}
 */

import { NextRequest } from 'next/server';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { UserProfileService } from '@/lib/services/user-profile-service';

const PORTAL_BASE_URLS: Record<string, string> = {
  production: 'https://customer-portal.paddle.com',
  sandbox: 'https://sandbox-customer-portal.paddle.com',
};

function getPortalBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_PADDLE_ENV ?? 'sandbox';
  return PORTAL_BASE_URLS[env] ?? PORTAL_BASE_URLS.sandbox;
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  const profile = await UserProfileService.getPaddleCustomerId(
    auth, request, 'payments/paddle/customer-portal',
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
