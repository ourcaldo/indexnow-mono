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
            package:indb_payment_packages(id, name, slug, description, features, quota_limits, is_active, pricing_tiers)
          `
          )
          .eq('user_id', auth.userId)
          .single();
        if (error) {
          throw error;
        }
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

    // email now lives directly in indb_auth_user_profiles (synced via DB trigger).
    // Only fetch authUser for email_confirmed_at and last_sign_in_at which are
    // still exclusive to auth.users.
    const {
      data: { user: authUser },
    } = await auth.supabase.auth.getUser();

    const userProfile = {
      ...profile,
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

/**
 * PUT /api/v1/auth/user/profile
 * Update user profile fields (active_domain, etc.)
 */
export const PUT = authenticatedApiWrapper(async (request, auth) => {
  try {
    const body = await request.json();
    const { active_domain } = body;

    await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'update_user_profile',
        source: 'auth/user/profile',
        reason: 'User updating their own profile preferences',
        metadata: { endpoint: '/api/v1/auth/user/profile', fields: Object.keys(body) },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
      { table: 'indb_auth_user_profiles', operationType: 'update' },
      async (db) => {
        const { error } = await db
          .from('indb_auth_user_profiles')
          .update({ active_domain: active_domain ?? null })
          .eq('user_id', auth.userId);
        if (error) throw error;
        return null;
      }
    );

    return formatSuccess({ ok: true });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/auth/user/profile',
        method: 'PUT',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
