import { NextRequest } from 'next/server';
import { publicApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { typedSupabaseAdmin } from '@indexnow/database';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';

/**
 * GET /api/v1/public/settings
 * Public endpoint — returns active packages and site-level settings.
 * No authentication required. Used by the dashboard to display pricing plans.
 */
export const GET = publicApiWrapper(async (request: NextRequest) => {
  try {
    const { data: packages, error } = await typedSupabaseAdmin
      .from('indb_payment_packages')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .limit(50);

    if (error) {
      logger.error({ error }, 'Failed to fetch packages from database');
      const structuredError = await ErrorHandlingService.createError(
        ErrorType.DATABASE,
        new Error(error.message),
        {
          severity: ErrorSeverity.HIGH,
          endpoint: '/api/v1/public/settings',
          method: 'GET',
          statusCode: 500,
        }
      );
      return formatError(structuredError);
    }

    // Transform packages into the shape expected by usePricingData hook:
    //   data.packages.packages → PackageData[]
    const transformedPackages = (packages ?? []).map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description ?? '',
      features: Array.isArray(pkg.features)
        ? pkg.features
        : pkg.features
          ? Object.entries(pkg.features as Record<string, unknown>).map(
              ([key, value]) => {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                if (value === true) return label;
                if (value === -1) return `Unlimited ${label}`;
                return `${value} ${label}`;
              }
            )
          : [],
      quota_limits: {
        max_keywords:
          (pkg.quota_limits as Record<string, number> | null)?.max_keywords ??
          (pkg.quota_limits as Record<string, number> | null)?.keywords_limit ??
          (pkg.features as Record<string, number> | null)?.max_keywords ??
          10,
        max_domains:
          (pkg.quota_limits as Record<string, number> | null)?.max_domains ??
          (pkg.features as Record<string, number> | null)?.max_domains ??
          1,
      },
      pricing_tiers: pkg.pricing_tiers ?? {},
      is_popular: pkg.is_popular ?? false,
      is_active: pkg.is_active ?? true,
      sort_order: pkg.sort_order ?? 0,
    }));

    return formatSuccess({
      packages: {
        packages: transformedPackages,
      },
    });
  } catch (err) {
    logger.error(
      { error: err instanceof Error ? err : undefined },
      'Unexpected error in public settings endpoint'
    );
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      err instanceof Error ? err : new Error(String(err)),
      {
        severity: ErrorSeverity.HIGH,
        endpoint: '/api/v1/public/settings',
        method: 'GET',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
