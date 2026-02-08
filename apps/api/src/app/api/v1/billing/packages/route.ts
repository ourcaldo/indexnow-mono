import { NextRequest } from 'next/server';
import { authenticatedApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity, type Database, type PackageFeatures, type PackageQuotaLimits, type PackagePricingTiers } from '@indexnow/shared';

// Derived types from Database schema
type PaymentPackageRow = Database['public']['Tables']['indb_payment_packages']['Row'];
type UserProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row'];

// User profile fields we need
type UserPackageInfo = Pick<UserProfileRow, 'package_id' | 'subscription_end_date' | 'country'>;

// Transformed package for frontend
interface TransformedPackage {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    currency: string;
    billing_period: string;
    features: PackageFeatures | null;
    quota_limits: PackageQuotaLimits | null;
    is_popular: boolean;
    is_current: boolean;
    pricing_tiers: PackagePricingTiers | null;
    user_country: string | null;
    free_trial_enabled: boolean;
}

/**
 * GET /api/v1/billing/packages
 * Get available billing packages for subscription selection
 */
export const GET = authenticatedApiWrapper(async (request, auth) => {
    try {
        // Fetch active packages
        const packages = await SecureServiceRoleWrapper.executeWithUserSession<PaymentPackageRow[]>(
            auth.supabase,
            {
                userId: auth.userId,
                operation: 'get_active_billing_packages',
                source: 'billing/packages',
                reason: 'User fetching available billing packages for subscription selection',
                metadata: { endpoint: '/api/v1/billing/packages', packageFilter: 'active_only' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') ?? undefined
            },
            { table: 'indb_payment_packages', operationType: 'select' },
            async (db) => {
                const { data, error } = await db
                    .from('indb_payment_packages')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true });

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
                    statusCode: 404
                }
            );
            return formatError(error);
        }

        // Fetch user profile for current package info
        let userProfile: UserPackageInfo | null = null;
        try {
            userProfile = await SecureServiceRoleWrapper.executeWithUserSession<UserPackageInfo | null>(
                auth.supabase,
                {
                    userId: auth.userId,
                    operation: 'get_user_billing_profile',
                    source: 'billing/packages',
                    reason: 'User fetching their billing profile information for package display',
                    metadata: { endpoint: '/api/v1/billing/packages', profileFields: 'package_id, subscription_end_date, country' },
                    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                    userAgent: request.headers.get('user-agent') ?? undefined
                },
                { table: 'indb_auth_user_profiles', operationType: 'select' },
                async (db) => {
                    const { data, error } = await db
                        .from('indb_auth_user_profiles')
                        .select('package_id, subscription_end_date, country')
                        .eq('user_id', auth.userId)
                        .single();

                    if (error && error.code !== 'PGRST116') throw error;
                    return data;
                }
            );
        } catch {
            userProfile = null;
        }

        // Transform packages for frontend consumption
        const transformedPackages: TransformedPackage[] = packages.map(pkg => ({
            id: pkg.id,
            name: pkg.name,
            slug: pkg.slug,
            description: pkg.description,
            price: pkg.price,
            currency: pkg.currency,
            billing_period: pkg.billing_period,
            features: pkg.features,
            quota_limits: pkg.quota_limits,
            is_popular: pkg.is_popular,
            is_current: userProfile ? pkg.id === userProfile.package_id : false,
            pricing_tiers: pkg.pricing_tiers as PackagePricingTiers | null,
            user_country: userProfile?.country ?? null,
            free_trial_enabled: pkg.free_trial_enabled
        }));

        return formatSuccess({
            packages: transformedPackages,
            current_package_id: userProfile?.package_id ?? null,
            subscription_end_date: userProfile?.subscription_end_date ?? null,
            currency: 'USD',
            user_country: userProfile?.country ?? null
        });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, userId: auth.userId, endpoint: '/api/v1/billing/packages', method: 'GET', statusCode: 500 }
        );
        return formatError(structuredError);
    }
});
