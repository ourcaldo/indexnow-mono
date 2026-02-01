import { SecureServiceRoleWrapper } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess, formatError } from '@/lib/core/api-response-formatter'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'

import { Json, PackageRow } from '@indexnow/database';

interface BillingPackage extends PackageRow {
  price: number;
}

interface BillingUserProfile {
  package_id: string | null;
  expires_at: string | null;
  country: string | null;
}

export const GET = authenticatedApiWrapper(async (request, auth) => {
  const packages = await SecureServiceRoleWrapper.executeWithUserSession<BillingPackage[]>(
    auth.supabase,
    {
      userId: auth.userId,
      operation: 'get_active_billing_packages',
      source: 'billing/packages',
      reason: 'User fetching available billing packages for subscription selection',
      metadata: { endpoint: '/api/v1/billing/packages', packageFilter: 'active_only' },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') || undefined
    },
    { table: 'indb_payment_packages', operationType: 'select' },
    async (db) => {
      const { data, error } = await db
        .from('indb_payment_packages')
        .select('*')
        .eq('is_active', true)

      if (error) throw error
      return (data || []) as BillingPackage[]
    }
  )

  if (!packages || packages.length === 0) {
    return formatSuccess({ 
      packages: [],
      current_package_id: null as string | null | undefined,
      expires_at: null as string | null | undefined,
      currency: 'USD',
      user_country: 'US'
    })
  }

  packages.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))

  const userProfile = await SecureServiceRoleWrapper.executeWithUserSession<BillingUserProfile | null>(
    auth.supabase,
    {
      userId: auth.userId,
      operation: 'get_user_billing_profile',
      source: 'billing/packages',
      reason: 'User fetching their billing profile information for package display',
      metadata: { endpoint: '/api/v1/billing/packages', profileFields: 'package_id, expires_at, country' },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') || undefined
    },
    { table: 'indb_auth_user_profiles', operationType: 'select' },
    async (db) => {
      const { data, error } = await db
        .from('indb_auth_user_profiles')
        .select('package_id, expires_at, country')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as BillingUserProfile | null
    }
  ).catch(() => null)

  const userCountry = userProfile?.country || 'US'

  const transformedPackages = packages.map(pkg => {
    let finalPrice = Number(pkg.price || 0)
    let finalCurrency = String(pkg.currency || 'USD')
    let billingPeriod = String(pkg.billing_period || 'monthly')

    const pricingTiers = pkg.pricing_tiers as Record<string, Json> | null
    if (pricingTiers && pricingTiers[billingPeriod]) {
      const tierData = pricingTiers[billingPeriod] as Record<string, Json>
      finalPrice = Number(tierData.promo_price || tierData.regular_price || 0)
    }

    return {
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description,
      price: finalPrice,
      currency: finalCurrency,
      billing_period: billingPeriod,
      features: pkg.features || {},
      quota_limits: pkg.quota_limits || {},
      is_popular: !!pkg.is_popular,
      is_current: pkg.id === userProfile?.package_id,
      pricing_tiers: pkg.pricing_tiers || {},
      user_country: userCountry,
      free_trial_enabled: !!pkg.free_trial_enabled
    }
  })

  return formatSuccess({
    packages: transformedPackages,
    current_package_id: userProfile?.package_id,
    expires_at: userProfile?.expires_at,
    currency: 'USD',
    user_country: userCountry
  })
})

