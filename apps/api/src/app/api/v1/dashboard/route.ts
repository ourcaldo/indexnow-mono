/**
 * User Dashboard API
 * GET /api/v1/dashboard
 *
 * Aggregates data for the user dashboard: profile, quota, stats, recent activity
 */

import { NextRequest } from 'next/server';
import { SecureServiceRoleWrapper, fromJson, asTypedClient, supabaseAdmin, type Json } from '@indexnow/database';
import { ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { validateQuotaLimits, calculateQuota } from '@/lib/services/quota-calculator';
import { parsePricingTiers, getFirstTier, getDisplayPrice } from '@/lib/services/pricing-utils';

import type { PackagePricingTiers } from '@indexnow/shared';

interface PackageData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  features: string[] | null;
  quota_limits: Record<string, number> | null;
  is_active: boolean;
  pricing_tiers: PackagePricingTiers | string | null;
  price?: number;
}

interface UserProfileWithPackage {
  id: string;
  email?: string | null;
  package?: PackageData | null;
  is_trial_active: boolean;
  trial_ends_at: string | null;
  package_id: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  country: string | null;
  paddle_customer_id: string | null;
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  try {
    const userId = auth.userId;
    const domain = request.nextUrl.searchParams.get('domain');
    const dashboardData = await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      {
        userId: userId,
        operation: 'get_dashboard_data',
        source: 'dashboard',
        reason: 'User fetching complete dashboard data',
        metadata: { endpoint: '/api/v1/dashboard' },
        ipAddress: getClientIP(request) ?? undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
      { table: 'indb_auth_user_profiles', operationType: 'select' },
      async (db) => {
        // Build domain-scoped queries upfront to avoid IIFE issues inside Promise.all
        let kwCountQuery = db
          .from('indb_rank_keywords')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);
        if (domain) kwCountQuery = kwCountQuery.eq('domain', domain);

        let recentKwQuery = db
          .from('indb_rank_keywords')
          .select(
            `
                            id, keyword, device, created_at, domain, country_id, position, last_checked
                        `
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);
        if (domain) recentKwQuery = recentKwQuery.eq('domain', domain);

        return await Promise.all([
          // 1. User Profile with Package
          db
            .from('indb_auth_user_profiles')
            .select(
              `
                            *,
                            package:indb_payment_packages(
                                id, name, slug, description,
                                features, quota_limits, is_active, pricing_tiers
                            )
                        `
            )
            .eq('user_id', userId)
            .single(),

          // 2. Keyword Count (workspace-scoped if domain selected)
          kwCountQuery,

          // 3. Available Packages (for trial/upgrade)
          db
            .from('indb_payment_packages')
            .select('*')
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('sort_order', { ascending: true })
            .limit(50),

          // 4. Domains
          db
            .from('indb_keyword_domains')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100),

          // 5. Notifications (Warnings only)
          db
            .from('indb_notifications_dashboard')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'warning')
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(5),

          // 6. Recent Keywords (workspace-scoped if domain selected)
          recentKwQuery,
        ]);
      }
    );

    const [
      userProfileResult,
      keywordCountResult,
      packagesResult,
      domainsResult,
      notificationsResult,
      recentKeywordsResult,
    ] = dashboardData;

    // Process Profile & Package
    let profile: UserProfileWithPackage | null = null;
    if (userProfileResult.data) {
      // Supabase join typing: .select() returns the join as an array or object,
      // but cannot infer the joined table's shape. We use a deliberate cast here.
      const rawPackage = fromJson<PackageData | null>(
        userProfileResult.data.package as unknown as Json
      );
      let transformedPackage = rawPackage;

      if (rawPackage) {
        const tiers = parsePricingTiers(rawPackage.pricing_tiers);
        const first = getFirstTier(tiers);

        if (first) {
          transformedPackage = {
            ...rawPackage,
            price: getDisplayPrice(first.tier),
            pricing_tiers: tiers,
          };
        }
      }

      // email now lives directly in indb_auth_user_profiles (synced via DB trigger)
      const profileData = userProfileResult.data;
      profile = {
        id: profileData.id ?? profileData.user_id,
        is_trial_active: profileData.is_trial_active,
        trial_ends_at: profileData.trial_ends_at,
        package_id: profileData.package_id,
        subscription_start_date: profileData.subscription_start_date,
        subscription_end_date: profileData.subscription_end_date,
        country: profileData.country,
        paddle_customer_id: profileData.paddle_customer_id ?? null,
        package: transformedPackage,
        email: profileData.email || null,
      };
    }

    // Process Quota — account-level limits from package
    // Users without an active plan get 0 quota (free-tier: can view dashboard, cannot add resources).
    const keywordsUsed = keywordCountResult.count || 0;
    const domainsUsed = domainsResult.count || 0;
    const quotaLimits = profile?.package?.quota_limits ?? null;
    validateQuotaLimits(quotaLimits, !!profile?.package);
    const quota = calculateQuota(quotaLimits, keywordsUsed, domainsUsed);

    // Process Trial Eligibility
    let trialEligibility: {
      eligible: boolean;
      message: string;
      available_packages: typeof packagesResult.data;
    } = {
      eligible: false,
      message: '',
      available_packages: [],
    };
    if (profile) {
      if (profile.is_trial_active) {
        trialEligibility = {
          eligible: false,
          message: `Trial is already active${profile.trial_ends_at ? ` (ends ${new Date(profile.trial_ends_at).toLocaleDateString()})` : ''}`,
          available_packages: [],
        };
      } else {
        const trialPackages = (packagesResult.data || [])
          .filter((p: any) => ['premium', 'pro'].includes(p.slug))
          .sort((a: any, b: any) => a.sort_order - b.sort_order);

        trialEligibility = {
          eligible: true,
          message: 'You are eligible for a 3-day free trial',
          available_packages: trialPackages,
        };
      }
    }

    // Process Recent Keywords (Manual mapping for FE compatibility)
    interface RecentKeywordRow {
      id: string;
      keyword: string;
      device: string | null;
      created_at: string;
      domain: string | null;
      country_id: string | null;
      position: number | null;
      last_checked: string | null;
    }
    const recentKwRaw: RecentKeywordRow[] = (recentKeywordsResult.data || []);

    // Enrich country_id UUIDs → { iso2_code, name }
    const recentCountryIds = [...new Set(recentKwRaw.map((k) => k.country_id).filter((id): id is string => id !== null))];
    let dashCountryMap: Record<string, { iso2_code: string; name: string }> = {};
    if (recentCountryIds.length > 0) {
      const { data: cRows } = await supabaseAdmin
        .from('indb_keyword_countries')
        .select('id, iso2_code, name')
        .in('id', recentCountryIds);
      dashCountryMap = Object.fromEntries((cRows ?? []).map((c) => [c.id, { iso2_code: c.iso2_code, name: c.name }]));
    }

    const recentKeywords = recentKwRaw.map((kw) => ({
      id: kw.id,
      keyword: kw.keyword,
      device_type: kw.device,
      created_at: kw.created_at,
      domain: { domain_name: kw.domain },
      country: (kw.country_id && dashCountryMap[kw.country_id]) ?? { iso2_code: '', name: '' },
      recent_ranking: { position: kw.position, check_date: kw.last_checked },
    }));

    return formatSuccess({
      user: {
        profile,
        quota,
        trial: trialEligibility,
      },
      billing: {
        packages: packagesResult.data || [],
        current_package_id: profile?.package_id,
        expires_at: profile?.subscription_end_date,
      },
      rankTracking: {
        domains: domainsResult.data || [],
        recentKeywords: recentKeywords,
      },
      notifications: notificationsResult.data || [],
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
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
