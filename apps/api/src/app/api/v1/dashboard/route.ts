import { NextRequest, NextResponse } from 'next/server'
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess, formatError } from '@/lib/core/api-response-formatter'
import { 
  SecureServiceRoleWrapper, 
  type ProfileRow, 
  type PackageRow, 
  type UserSettingsRow, 
  type InsertUserSettings,
  type Database,
  type Json,
  type PostgrestError
} from '@indexnow/database'
import { createServerSupabaseClient } from '@/lib/database'
import { ErrorHandlingService, ErrorType, logger } from '@/lib/monitoring/error-handling'

interface DashboardPackage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  billing_period: string | null;
  features: Json | null;
  quota_limits: {
    keywords_limit?: number;
    [key: string]: Json | undefined;
  } | null;
  pricing_tiers: Record<string, Json | undefined> | null;
  price: number;
  is_popular?: boolean;
}

interface PricingTier {
  promo_price?: number;
  regular_price: number;
}

interface PricingTiers extends Record<string, PricingTier | undefined> {
  monthly?: PricingTier;
  yearly?: PricingTier;
}

interface DashboardProfile extends Partial<ProfileRow> {
  package?: DashboardPackage | null;
  email?: string | null;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
}

interface QuotaSummary {
  total_quota_used: number;
  daily_quota_limit: number;
  is_unlimited: boolean;
  package_name: string | null;
  total_quota_limit: number;
}

interface TrialData {
  has_used_trial: boolean;
  trial_used_at: string | null;
  package_id: string | null;
  subscribed_at: string | null;
  expires_at: string | null;
}

interface DashboardRecentKeyword {
  id: string;
  keyword: string;
  device_type: string;
  domain: {
    id: string;
    domain_name: string;
    display_name: string | null;
  } | null;
  country: {
    name: string;
    iso2_code: string;
  } | null;
  recent_ranking: {
    position: number | null;
    check_date: string;
  }[] | null;
}

type DashboardQueryResult = [
  { data: (ProfileRow & { package: DashboardPackage | null }) | null; error: PostgrestError | null }, // Profile
  { count: number | null; error: PostgrestError | null }, // Keywords head count
  { data: QuotaSummary | null; error: PostgrestError | null }, // Quota
  { data: UserSettingsRow | null; error: PostgrestError | null }, // Settings
  { data: TrialData | null; error: PostgrestError | null }, // Trial
  { data: PackageRow[] | null; error: PostgrestError | null }, // Packages
  { data: Database['public']['Tables']['indb_keyword_domains']['Row'][] | null; error: PostgrestError | null }, // Domains
  { data: Database['public']['Tables']['indb_notifications_dashboard']['Row'][] | null; error: PostgrestError | null }, // Notifications
  { data: DashboardRecentKeyword[] | null; error: PostgrestError | null }  // Recent keywords
]

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  try {
    // Use authenticated supabase client from auth wrapper
    const supabase = auth.supabase
    const userId = auth.userId

    // Execute all queries in parallel using user session security wrapper
    const dashboardQueryResult = await SecureServiceRoleWrapper.executeWithUserSession<DashboardQueryResult>(
      supabase,
      {
        userId: userId,
        operation: 'get_dashboard_data',
        source: 'dashboard',
        reason: 'User fetching their complete dashboard data',
        metadata: {
          endpoint: '/api/v1/dashboard',
          queryType: 'parallel_dashboard_queries'
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      },
      { table: 'multiple_tables', operationType: 'select' },
      async (db) => {
        const results = await Promise.all([
          db.from('indb_auth_user_profiles')
            .select(`
              *,
              package:indb_payment_packages(
                id,
                name,
                slug,
                description,
                currency,
                billing_period,
                features,
                quota_limits,
                is_active,
                pricing_tiers
              )
            `)
            .single(),

          db.from('indb_keyword_keywords')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_active', true),

          db.from('user_quota_summary')
            .select('*')
            .single(),

          db.from('indb_auth_user_settings')
            .select('*')
            .single(),

          db.from('indb_auth_user_profiles')
            .select('has_used_trial, trial_used_at, package_id, subscribed_at, expires_at')
            .single(),

          db.from('indb_payment_packages')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),

          db.from('indb_keyword_domains')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false }),

          db.from('indb_notifications_dashboard')
            .select('*')
            .eq('type', 'quota_warning')
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(10),

          db.from('indb_keyword_keywords')
            .select(`
              id,
              keyword,
              device_type,
              domain:indb_keyword_domains(
                id,
                domain_name,
                display_name
              ),
              country:indb_keyword_countries(
                name,
                iso2_code
              ),
              recent_ranking:indb_keyword_rankings(
                position,
                check_date
              )
            `)
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(50)
        ])
        return results as unknown as DashboardQueryResult
      }
    )

    const [
      userProfileResult,
      keywordUsageResult,
      quotaDataResult,
      userSettingsResult,
      trialEligibilityResult,
      packagesResult,
      domainsResult,
      quotaNotificationsResult,
      recentKeywordsResult
    ] = dashboardQueryResult

    // Get user data for email info
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const authUserResult = { data: authUser, error: null }



    let profile: DashboardProfile | null = null
    if (!userProfileResult.error && userProfileResult.data) {
      const rawProfile = userProfileResult.data
      let transformedPackage = rawProfile.package

      if (rawProfile.package) {
        const packageData = rawProfile.package

        let pricingTiers = packageData.pricing_tiers
        if (typeof pricingTiers === 'string') {
          try {
            pricingTiers = JSON.parse(pricingTiers) as Record<string, Json>
          } catch (e) {
            pricingTiers = null
          }
        }

        if (pricingTiers && typeof pricingTiers === 'object') {
          const billingPeriod = (packageData.billing_period as string) || 'monthly'
          const tiers = pricingTiers as unknown as PricingTiers
          const tierData = tiers[billingPeriod]

          if (tierData) {
            const finalPrice = tierData.promo_price || tierData.regular_price

            transformedPackage = {
              ...packageData,
              currency: 'USD',
              price: finalPrice,
              billing_period: billingPeriod,
              pricing_tiers: pricingTiers as Record<string, Json>
            }
          } else {
            transformedPackage = {
              ...packageData,
              price: 0
            }
          }
        }
      }

      profile = {
        ...rawProfile,
        package: transformedPackage,
        email: authUserResult.data?.email || null,
        email_confirmed_at: authUserResult.data?.email_confirmed_at || null,
        last_sign_in_at: authUserResult.data?.last_sign_in_at || null,
      }
    }

    let keywordUsage = null
    if (keywordUsageResult.error) {
      throw new Error('Failed to fetch keyword count', { cause: keywordUsageResult.error })
    }

    const keywordsUsed = keywordUsageResult.count || 0
    const keywordsLimit = profile?.package?.quota_limits?.keywords_limit || 0
    const isUnlimited = keywordsLimit === -1
    const remainingQuota = isUnlimited ? -1 : Math.max(0, keywordsLimit - keywordsUsed)

    keywordUsage = {
      keywords_used: keywordsUsed,
      keywords_limit: keywordsLimit,
      is_unlimited: isUnlimited,
      remaining_quota: remainingQuota,
      period_start: null,
      period_end: null
    }

    let quota = null
    if (!quotaDataResult.error && quotaDataResult.data) {
      const dailyQuotaUsed = quotaDataResult.data.total_quota_used || 0
      const dailyQuotaLimit = quotaDataResult.data.daily_quota_limit || 50
      const isUnlimited = quotaDataResult.data.is_unlimited === true
      const remainingQuota = isUnlimited ? -1 : Math.max(0, dailyQuotaLimit - dailyQuotaUsed)
      const quotaExhausted = !isUnlimited && dailyQuotaUsed >= dailyQuotaLimit
      const package_name = (quotaDataResult.data.package_name as string) || 'Free'

      quota = {
        daily_quota_used: dailyQuotaUsed,
        daily_quota_limit: dailyQuotaLimit,
        is_unlimited: isUnlimited,
        quota_exhausted: quotaExhausted,
        daily_limit_reached: quotaExhausted,
        package_name: package_name,
        remaining_quota: remainingQuota,
        total_quota_used: dailyQuotaUsed,
        total_quota_limit: quotaDataResult.data.total_quota_limit || 0
      }
    }

    let settings = null
    if (userSettingsResult.error && userSettingsResult.error.code === 'PGRST116') {
      settings = await SecureServiceRoleWrapper.executeWithUserSession(
        supabase,
        {
          userId: userId,
          operation: 'create_default_user_settings',
          source: 'dashboard',
          reason: 'Creating default user settings for new user',
          metadata: {
            endpoint: '/api/v1/dashboard',
            settingsCreation: 'default_settings'
          },
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
          userAgent: request.headers.get('user-agent') || undefined
        },
        { table: 'indb_auth_user_settings', operationType: 'insert' },
        async (db) => {
          const { data: newSettings, error: createError } = await db
            .from('indb_auth_user_settings')
            .insert({
              user_id: userId,
              timeout_duration: 30000,
              retry_attempts: 3,
              email_job_completion: true,
              email_job_failure: true,
              email_quota_alerts: true,
              default_schedule: 'one-time',
              email_daily_report: true,
            } as InsertUserSettings)
            .select()
            .single()
          
          if (createError) throw createError
          return newSettings
        }
      )
    } else if (!userSettingsResult.error) {
      settings = userSettingsResult.data
    }

    let trialEligibility = null
    if (!trialEligibilityResult.error && trialEligibilityResult.data) {
      const trialData = trialEligibilityResult.data
      if (trialData.has_used_trial) {
        trialEligibility = {
          eligible: false,
          reason: 'already_used',
          trial_used_at: trialData.trial_used_at,
          message: `Free trial already used on ${new Date(trialData.trial_used_at || '').toLocaleDateString()}`
        }
      } else {
        const trialPackages = await SecureServiceRoleWrapper.executeWithUserSession(
          supabase,
          {
            userId: userId,
            operation: 'get_trial_packages',
            source: 'dashboard',
            reason: 'User checking available trial packages',
            metadata: {
              endpoint: '/api/v1/dashboard',
              packageQuery: 'trial_packages'
            },
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
            userAgent: request.headers.get('user-agent') || undefined
          },
          { table: 'indb_payment_packages', operationType: 'select' },
          async (db) => {
            const { data } = await db
              .from('indb_payment_packages')
              .select('*')
              .in('slug', ['premium', 'pro'])
              .eq('is_active', true)
              .order('sort_order')
            return data
          }
        )

        trialEligibility = {
          eligible: true,
          available_packages: trialPackages || [],
          message: 'You are eligible for a 3-day free trial'
        }
      }
    }

    let billingPackages = null
    if (!packagesResult.error && packagesResult.data) {
      const userCountry = profile?.country as string | undefined
      const packages = packagesResult.data

      billingPackages = {
        packages: packages.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          slug: pkg.slug,
          description: pkg.description,
          price: 0,
          currency: 'USD',
          billing_period: pkg.billing_period,
          features: (pkg.features as Json[]) || [],
          quota_limits: (pkg.quota_limits as Record<string, Json>) || {},
          is_popular: pkg.is_popular || false,
          is_current: pkg.id === profile?.package_id,
          pricing_tiers: (pkg.pricing_tiers as Record<string, Json>) || {},
          user_currency: 'USD',
          user_country: userCountry
        })),
        current_package_id: profile?.package_id,
        expires_at: profile?.expires_at,
        user_currency: 'USD',
        user_country: userCountry
      }
    }

    let recentKeywords: DashboardRecentKeyword[] = []
    if (!recentKeywordsResult.error && recentKeywordsResult.data) {
      recentKeywords = recentKeywordsResult.data
    }

    const dashboardData = {
      user: {
        profile: profile,
        quota: quota,
        settings: settings,
        trial: trialEligibility
      },
      billing: billingPackages,
      rankTracking: {
        usage: keywordUsage,
        domains: domainsResult.data || [],
        recentKeywords: recentKeywords
      },
      notifications: quotaNotificationsResult.data || []
    }

    return formatSuccess(dashboardData)

  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error) {
      const apiError = error as { type: ErrorType; message?: string; statusCode?: number; details?: Json }
      const structuredError = await ErrorHandlingService.createError(
        apiError.type,
        apiError.message || 'API Error',
        { 
          statusCode: apiError.statusCode || 500, 
          metadata: apiError.details as Record<string, any> | undefined,
          endpoint: '/api/v1/dashboard'
        }
      )
      return formatError(structuredError)
    }

    const structuredError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      { statusCode: 500, endpoint: '/api/v1/dashboard' }
    )
    return formatError(structuredError)
  }
})

