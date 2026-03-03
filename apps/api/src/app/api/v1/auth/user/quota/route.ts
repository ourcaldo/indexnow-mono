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
 * GET /api/v1/auth/user/quota
 * Get current user quota information — account-level limits from their package.
 * Limits: max_keywords, max_domains (permanent for the subscription duration).
 */
export const GET = authenticatedApiWrapper(async (request, auth) => {
  try {
    const quotaData = await SecureServiceRoleWrapper.executeWithUserSession(
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

        // Count actual keyword usage
        const { count: keywordCount, error: kwError } = await db
          .from('indb_rank_keywords')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', auth.userId);

        if (kwError) throw new Error('Failed to count keywords');

        // Count actual domain usage
        const { count: domainCount, error: domError } = await db
          .from('indb_keyword_domains')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', auth.userId);

        if (domError) throw new Error('Failed to count domains');

        return { profile, keywordCount: keywordCount || 0, domainCount: domainCount || 0 };
      }
    );

    // Extract package data safely
    const packageData = Array.isArray(quotaData.profile.package)
      ? quotaData.profile.package[0]
      : quotaData.profile.package;

    const quotaLimits = packageData?.quota_limits as Record<string, number> | null;
    if (!quotaLimits || quotaLimits.max_keywords == null || quotaLimits.max_domains == null) {
      throw new Error('User package is missing quota_limits configuration');
    }
    const maxKeywords = quotaLimits.max_keywords;
    const maxDomains = quotaLimits.max_domains;
    const isKeywordsUnlimited = maxKeywords === -1;
    const isDomainsUnlimited = maxDomains === -1;

    return formatSuccess({
      quota: {
        keywords: {
          used: quotaData.keywordCount,
          limit: maxKeywords,
          remaining: isKeywordsUnlimited ? -1 : Math.max(0, maxKeywords - quotaData.keywordCount),
          is_unlimited: isKeywordsUnlimited,
        },
        domains: {
          used: quotaData.domainCount,
          limit: maxDomains,
          remaining: isDomainsUnlimited ? -1 : Math.max(0, maxDomains - quotaData.domainCount),
          is_unlimited: isDomainsUnlimited,
        },
        package_name: packageData?.name ?? 'Free',
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
