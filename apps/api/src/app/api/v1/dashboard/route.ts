/**
 * User Dashboard API
 * GET /api/v1/dashboard
 * 
 * Aggregates data for the user dashboard: profile, quota, stats, recent activity
 */

import { NextRequest } from 'next/server';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
    authenticatedApiWrapper,
    formatSuccess,
    formatError
} from '../../../../lib/core/api-response-middleware';
import { ErrorHandlingService } from '../../../../lib/monitoring/error-handling';

interface PricingTiers {
    [key: string]: {
        regular_price: number;
        promo_price?: number;
    } | undefined;
}

interface PackageData {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    currency: string;
    billing_period: string;
    features: string[] | null;
    quota_limits: Record<string, number> | null;
    is_active: boolean;
    pricing_tiers: PricingTiers | string | null;
    price?: number;
}

interface UserProfileWithPackage {
    id: string;
    email?: string | null;
    package?: PackageData | null;
    daily_quota_limit: number;
    daily_quota_used: number;
    has_used_trial: boolean;
    trial_used_at: string | null;
    package_id: string | null;
    subscribed_at: string | null;
    expires_at: string | null;
    country: string | null;
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    try {
        const userId = auth.userId;

        // Execute queries in parallel
        const dashboardData = await SecureServiceRoleWrapper.executeWithUserSession(
            auth.supabase,
            {
                userId: userId,
                operation: 'get_dashboard_data',
                source: 'dashboard',
                reason: 'User fetching complete dashboard data',
                metadata: { endpoint: '/api/v1/dashboard' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_auth_user_profiles', operationType: 'select' },
            async (db) => {
                return await Promise.all([
                    // 1. User Profile with Package
                    db.from('indb_auth_user_profiles')
                        .select(`
                            *,
                            package:indb_payment_packages(
                                id, name, slug, description, currency, billing_period,
                                features, quota_limits, is_active, pricing_tiers
                            )
                        `)
                        .eq('user_id', userId)
                        .single(),

                    // 2. Keyword Count (using indb_rank_keywords)
                    db.from('indb_rank_keywords')
                        .select('id', { count: 'exact', head: true })
                        .eq('user_id', userId)
                        .eq('is_active', true),

                    // 3. Available Packages (for trial/upgrade)
                    db.from('indb_payment_packages')
                        .select('*')
                        .eq('is_active', true)
                        .order('sort_order', { ascending: true }),

                    // 4. Domains (using indb_keyword_domains if it exists, or distinct domains from rank_keywords?)
                    // indb_keyword_domains exists and has user_id, so use it
                    db.from('indb_keyword_domains')
                        .select('*')
                        .eq('user_id', userId)
                        .eq('is_active', true)
                        .order('created_at', { ascending: false }),

                    // 5. Notifications (Warnings only)
                    db.from('indb_notifications_dashboard')
                        .select('*')
                        .eq('user_id', userId)
                        .eq('type', 'warning')
                        .eq('is_read', false)
                        .order('created_at', { ascending: false })
                        .limit(5),

                    // 6. Recent Keywords with Ranking (No joins, use denormalized columns)
                    db.from('indb_rank_keywords')
                        .select(`
                            id, keyword, device, created_at, domain, country, position, last_checked
                        `)
                        .eq('user_id', userId)
                        .eq('is_active', true)
                        .order('created_at', { ascending: false })
                        .limit(20)
                ]);
            }
        );

        const [
            userProfileResult,
            keywordCountResult,
            packagesResult,
            domainsResult,
            notificationsResult,
            recentKeywordsResult
        ] = dashboardData;

        // Process Profile & Package
        let profile: UserProfileWithPackage | null = null;
        if (userProfileResult.data) {
            const rawPackage = userProfileResult.data.package as unknown as PackageData;
            let transformedPackage = rawPackage;

            if (rawPackage) {
                let pricingTiers = rawPackage.pricing_tiers;
                if (typeof pricingTiers === 'string') {
                    try {
                        pricingTiers = JSON.parse(pricingTiers);
                    } catch {
                        pricingTiers = null;
                    }
                }

                if (pricingTiers && typeof pricingTiers === 'object') {
                    const billingPeriod = rawPackage.billing_period || 'monthly';
                    const tierData = (pricingTiers as PricingTiers)[billingPeriod];

                    if (tierData) {
                        transformedPackage = {
                            ...rawPackage,
                            currency: 'USD',
                            price: tierData.promo_price || tierData.regular_price,
                            pricing_tiers: pricingTiers
                        };
                    }
                }
            }

            // Get email from auth object directly to avoid extra call
            const { data: { user } } = await auth.supabase.auth.getUser();

            profile = {
                ...(userProfileResult.data as any),
                package: transformedPackage,
                email: user?.email || null,
                email_confirmed_at: user?.email_confirmed_at || null,
                last_sign_in_at: user?.last_sign_in_at || null
            };
        }

        // Process Quota
        const keywordsUsed = keywordCountResult.count || 0;
        const keywordsLimit = (profile?.package?.quota_limits as any)?.keywords_limit || 10;
        const isKeywordsUnlimited = keywordsLimit === -1;

        const dailyQuotaUsed = profile?.daily_quota_used || 0;
        const dailyQuotaLimit = profile?.daily_quota_limit || 50;
        const isDailyUnlimited = false; // Daily quota usually has a limit

        const quota = {
            keywords: {
                used: keywordsUsed,
                limit: keywordsLimit,
                is_unlimited: isKeywordsUnlimited,
                remaining: isKeywordsUnlimited ? -1 : Math.max(0, keywordsLimit - keywordsUsed)
            },
            daily_checks: {
                used: dailyQuotaUsed,
                limit: dailyQuotaLimit,
                is_unlimited: isDailyUnlimited,
                remaining: Math.max(0, dailyQuotaLimit - dailyQuotaUsed),
                exhausted: dailyQuotaUsed >= dailyQuotaLimit
            }
        };

        // Process Trial Eligibility
        let trialEligibility = { eligible: false, message: '', available_packages: [] as any[] };
        if (profile) {
            if (profile.has_used_trial) {
                trialEligibility = {
                    eligible: false,
                    message: `Free trial already used on ${profile.trial_used_at ? new Date(profile.trial_used_at).toLocaleDateString() : 'unknown date'}`,
                    available_packages: []
                };
            } else {
                const trialPackages = (packagesResult.data || [])
                    .filter((p: any) => ['premium', 'pro'].includes(p.slug))
                    .sort((a: any, b: any) => a.sort_order - b.sort_order);

                trialEligibility = {
                    eligible: true,
                    message: 'You are eligible for a 3-day free trial',
                    available_packages: trialPackages
                };
            }
        }

        // Process Recent Keywords (Manual mapping for FE compatibility)
        const recentKeywords = (recentKeywordsResult.data || []).map((kw: any) => ({
            id: kw.id,
            keyword: kw.keyword,
            device_type: kw.device,
            created_at: kw.created_at,
            domain: { domain_name: kw.domain },
            country: { iso2_code: kw.country },
            recent_ranking: { position: kw.position, check_date: kw.last_checked }
        }));

        return formatSuccess({
            user: {
                profile,
                quota,
                trial: trialEligibility
            },
            billing: {
                packages: packagesResult.data || [],
                current_package_id: profile?.package_id,
                expires_at: profile?.expires_at
            },
            rankTracking: {
                domains: domainsResult.data || [],
                recentKeywords: recentKeywords
            },
            notifications: notificationsResult.data || []
        });

    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.INTERNAL,
            error instanceof Error ? error : new Error(String(error)),
            {
                severity: ErrorSeverity.HIGH,
                userId: auth.userId,
                endpoint: '/api/v1/dashboard',
                method: 'GET',
                statusCode: 500
            }
        );
        return formatError(structuredError);
    }
});
