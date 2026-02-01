import { SecureServiceRoleWrapper } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { authenticatedApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'
import { logger } from '@/lib/monitoring/error-handling'

import { Json } from '@indexnow/database';

interface PackageInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  billing_period: string | null;
  features: Json | null;
  quota_limits: Json | null;
  is_active: boolean;
  pricing_tiers: Json | null;
  price?: number;
}

interface UserProfileData {
  id: string;
  user_id: string;
  package_id: string | null;
  package: PackageInfo | null;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  has_used_trial: boolean;
  trial_used_at: string | null;
  subscribed_at: string | null;
  expires_at: string | null;
}

interface PricingTier {
  promo_price?: number;
  regular_price: number;
}

interface PricingTiers extends Record<string, PricingTier | undefined> {
  monthly?: PricingTier;
  yearly?: PricingTier;
}

interface CountResult {
  count: number | null;
}

export const GET = authenticatedApiWrapper(async (request, auth) => {
  try {
    const profile = await SecureServiceRoleWrapper.executeWithUserSession<UserProfileData>(
      auth.supabase,
      {
        userId: auth.userId,
        operation: 'get_user_profile',
        source: 'auth/user/profile',
        reason: 'User fetching their own profile with package information',
        metadata: { includePackageInfo: true, endpoint: '/api/v1/auth/user/profile' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || undefined || undefined
      },
      { table: 'indb_auth_user_profiles', operationType: 'select' },
      async (db) => {
        const { data, error } = await db
          .from('indb_auth_user_profiles')
          .select(`
            *,
            package:indb_payment_packages(id, name, slug, description, currency, billing_period, features, quota_limits, is_active, pricing_tiers)
          `)
          .single()
        if (error) throw error
        return data as UserProfileData
      }
    )

    if (!profile) {
      const error = await ErrorHandlingService.createError(
        ErrorType.AUTHORIZATION,
        'User profile not found',
        { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 404 }
      )
      return formatError(error)
    }

    const { data: { user: authUser } } = await auth.supabase.auth.getUser()

    let transformedPackage = profile.package
    
    if (profile.package) {
      const packageData = profile.package
      
      let pricingTiers = packageData.pricing_tiers
      if (typeof pricingTiers === 'string') {
        try {
          pricingTiers = JSON.parse(pricingTiers)
        } catch (e) {
          pricingTiers = null
        }
      }
      
      if (pricingTiers && typeof pricingTiers === 'object') {
        const billingPeriod = packageData.billing_period || 'monthly'
        const tiers = pricingTiers as unknown as PricingTiers
        const tierData = tiers[billingPeriod]
        
        if (tierData) {
          const finalPrice = tierData.promo_price || tierData.regular_price
          
          transformedPackage = {
            ...packageData,
            currency: 'USD',
            price: finalPrice,
            billing_period: billingPeriod,
            pricing_tiers: pricingTiers as Json
          }
        } else {
          transformedPackage = { ...packageData, price: 0, currency: 'USD' }
        }
      }
    }

    const userProfile = {
      ...profile,
      package: transformedPackage,
      email: authUser?.email || null,
      email_confirmed_at: authUser?.email_confirmed_at || null,
      last_sign_in_at: authUser?.last_sign_in_at || null,
    }

    return formatSuccess({ profile: userProfile })
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      { severity: ErrorSeverity.HIGH, userId: auth.userId, endpoint: '/api/v1/auth/user/profile', method: 'GET', statusCode: 500 }
    )
    return formatError(structuredError)
  }
})

