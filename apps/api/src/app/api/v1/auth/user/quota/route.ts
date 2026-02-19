import { NextRequest } from 'next/server';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper, asTypedClient } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity, type Database, getClientIP } from '@indexnow/shared';

// (#V7 L-13) UserProfileRow removed — was unused (query uses RPC, not direct table select)
type _UserProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row'];

/**
 * GET /api/v1/auth/user/quota
 * Get current user quota information including daily usage, limits, and package details
 */
export const GET = authenticatedApiWrapper(async (request, auth) => {
  try {
    const quotaData = (await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'get_user_quota_summary',
        source: 'auth/user/quota',
        reason: 'User retrieving their own quota information for dashboard display',
        metadata: { endpoint: '/api/v1/auth/user/quota', method: 'GET' },
        ipAddress: getClientIP(request) ?? undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
      { table: 'indb_auth_user_profiles', operationType: 'select' },
      async (db) => {
        // Get user profile with package information
        const { data: profile, error: profileError } = await db
          .from('indb_auth_user_profiles')
          .select(
            `
            user_id,
            daily_quota_used,
            daily_quota_limit,
            quota_reset_date,
            package_id,
            package:indb_payment_packages(
              id,
              name,
              quota_limits
            )
          `
          )
          .eq('user_id', auth.userId)
          .single();

        if (profileError) throw new Error('Failed to fetch quota data');
        if (!profile) throw new Error('User profile not found');

        return profile;
      }
    )) as {
      package: Record<string, any> | Record<string, any>[] | null;
      daily_quota_limit: number;
      daily_quota_used: number;
      quota_reset_date: string | null;
    };

    // Extract package data safely
    const packageData = Array.isArray(quotaData.package) ? quotaData.package[0] : quotaData.package;
    const dailyLimit = packageData?.quota_limits?.daily_urls ?? quotaData.daily_quota_limit ?? 0;
    const isUnlimited = dailyLimit === -1;
    const dailyQuotaUsed = quotaData.daily_quota_used ?? 0;

    // Check if quota needs to be reset (new day)
    const today = new Date().toISOString().split('T')[0];
    const resetDate = quotaData.quota_reset_date;
    let finalQuotaUsed = dailyQuotaUsed;

    if (resetDate !== today) {
      // Reset quota for new day - wrapped in SecureServiceRoleWrapper for audit trail
      await SecureServiceRoleWrapper.executeWithUserSession(
        asTypedClient(auth.supabase),
        {
          userId: auth.userId,
          operation: 'reset_daily_quota',
          source: 'auth/user/quota',
          reason: 'Automatic daily quota reset on new day',
          metadata: {
            endpoint: '/api/v1/auth/user/quota',
            method: 'GET',
            previousDate: resetDate,
            newDate: today,
            quotaReset: true,
          },
          ipAddress: getClientIP(request) ?? undefined,
          userAgent: request.headers.get('user-agent') ?? undefined,
        },
        { table: 'indb_auth_user_profiles', operationType: 'update' },
        async (db) => {
          const { error } = await db
            .from('indb_auth_user_profiles')
            .update({
              daily_quota_used: 0,
              quota_reset_date: today,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', auth.userId);

          if (error) throw new Error('Failed to reset quota');
          return null;
        }
      );

      finalQuotaUsed = 0;
    }

    const remainingQuota = isUnlimited ? -1 : Math.max(0, dailyLimit - finalQuotaUsed);
    const quotaExhausted = !isUnlimited && finalQuotaUsed >= dailyLimit;

    return formatSuccess({
      quota: {
        daily_quota_used: finalQuotaUsed,
        daily_quota_limit: dailyLimit,
        is_unlimited: isUnlimited,
        quota_exhausted: quotaExhausted,
        daily_limit_reached: quotaExhausted,
        package_name: packageData?.name ?? 'Free',
        remaining_quota: remainingQuota,
      },
    });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/auth/user/quota',
        method: 'GET',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
