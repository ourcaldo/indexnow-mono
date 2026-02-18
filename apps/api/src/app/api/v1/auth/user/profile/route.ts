import { NextRequest } from 'next/server';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper, asTypedClient } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';

/**
 * GET /api/v1/auth/user/profile
 * Get current user profile with package information
 */
export const GET = authenticatedApiWrapper(async (request, auth) => {
  try {
    const profile = await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'get_user_profile',
        source: 'auth/user/profile',
        reason: 'User fetching their own profile with package information',
        metadata: { includePackageInfo: true, endpoint: '/api/v1/auth/user/profile' },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
      { table: 'indb_auth_user_profiles', operationType: 'select' },
      async (db) => {
        const { data, error } = await db
          .from('indb_auth_user_profiles')
          .select(
            `
            *,
            package:indb_payment_packages(id, name, slug, description, currency, billing_period, features, quota_limits, is_active, pricing_tiers)
          `
          )
          .eq('user_id', auth.userId)
          .single();
        if (error) throw error;
        return data;
      }
    );

    if (!profile) {
      const notFoundError = await ErrorHandlingService.createError(
        ErrorType.NOT_FOUND,
        'User profile not found',
        { severity: ErrorSeverity.MEDIUM, userId: auth.userId, statusCode: 404 }
      );
      return formatError(notFoundError);
    }

    const {
      data: { user: authUser },
    } = await auth.supabase.auth.getUser();

    // Build user profile response (counts excluded - tables not in type definitions)
    const userProfile = {
      ...profile,
      email: authUser?.email ?? null,
      email_confirmed_at: authUser?.email_confirmed_at ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    };

    return formatSuccess({ profile: userProfile });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/auth/user/profile',
        method: 'GET',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
