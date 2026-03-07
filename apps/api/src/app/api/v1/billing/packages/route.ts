import { NextRequest } from 'next/server';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper, asTypedClient } from '@indexnow/database';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';
import {
  ErrorType,
  ErrorSeverity,
  type Database,
  type PackageFeatures,
  type PackageQuotaLimits,
  type PackagePricingTiers,
} from '@indexnow/shared';
import { buildOperationContext } from '@/lib/services/build-operation-context';
import { UserProfileService, type BillingInfoProfile } from '@/lib/services/user-profile-service';

// Derived types from Database schema
type PaymentPackageRow = Database['public']['Tables']['indb_payment_packages']['Row'];

// Transformed package for frontend
interface TransformedPackage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  features: PackageFeatures | null;
  quota_limits: PackageQuotaLimits | null;
  is_popular: boolean;
  is_current: boolean;
  pricing_tiers: PackagePricingTiers | null;
  user_country: string | null;
}

/**
 * GET /api/v1/billing/packages
 * Get available billing packages for subscription selection
 */
export const GET = authenticatedApiWrapper(async (request, auth) => {
  try {
    // Fetch active packages
    const packages = await SecureServiceRoleWrapper.executeWithUserSession<PaymentPackageRow[]>(
      asTypedClient(auth.supabase),
      buildOperationContext(request, auth.userId, {
        operation: 'get_active_billing_packages',
        source: 'billing/packages',
        reason: 'User fetching available billing packages for subscription selection',
        metadata: { packageFilter: 'active_only' },
      }),
      { table: 'indb_payment_packages', operationType: 'select' },
      async (db) => {
        const { data, error } = await db
          .from('indb_payment_packages')
          .select('*')
          .eq('is_active', true)
          .is('deleted_at', null)
          .order('sort_order', { ascending: true })
          .limit(50);

        if (error) throw error;
        return data ?? [];
      }
    );

    if (!packages || packages.length === 0) {
      const error = await ErrorHandlingService.createError(
        ErrorType.NOT_FOUND,
        'No packages found',
        {
          severity: ErrorSeverity.LOW,
          userId: auth.userId,
          endpoint: '/api/v1/billing/packages',
          statusCode: 404,
        }
      );
      return formatError(error);
    }

    // Fetch user profile for current package info
    let userProfile: BillingInfoProfile | null = null;
    try {
      userProfile = await UserProfileService.getBillingInfo(
        auth, request, 'billing/packages',
      );
    } catch (err) {
      logger.warn(
        { error: err instanceof Error ? err : undefined },
        'Failed to fetch user profile for packages'
      );
      userProfile = null;
    }

    // Transform packages for frontend consumption
    const transformedPackages: TransformedPackage[] = packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description,
      features: pkg.features,
      quota_limits: pkg.quota_limits,
      is_popular: pkg.is_popular,
      is_current: userProfile ? pkg.id === userProfile.package_id : false,
      pricing_tiers: pkg.pricing_tiers as PackagePricingTiers | null,
      user_country: userProfile?.country ?? null,
    }));

    return formatSuccess({
      packages: transformedPackages,
      current_package_id: userProfile?.package_id ?? null,
      subscription_end_date: userProfile?.subscription_end_date ?? null,
      currency: 'USD',
      user_country: userProfile?.country ?? null,
    });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/billing/packages',
        method: 'GET',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
