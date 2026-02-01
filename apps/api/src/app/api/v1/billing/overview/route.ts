import { SecureServiceRoleWrapper } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { logger } from '@/lib/monitoring/error-handling'
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'

import { Json, ProfileRow, PackageRow } from '@indexnow/database';

interface BillingProfile extends ProfileRow {
  package: PackageRow | null;
}

interface BillingSubscription {
  id: string;
  status: string;
  amount_paid: string | number | null;
  subscription_status?: string;
  expires_at?: string | null;
  started_at?: string | null;
  billing_period?: string | null;
  package: {
    id: string;
    name: string;
    slug?: string | null;
  } | null;
}

interface BillingTransaction {
  id: string;
  amount: number | string;
  transaction_type?: string;
  currency?: string;
  transaction_status?: string;
  created_at?: string;
  payment_method?: string;
  billing_period?: string;
  metadata?: Json;
  package: { 
    id: string;
    name: string; 
    slug?: string | null 
  } | null;
  gateway: { 
    id: string;
    name: string 
  } | null;
}

interface BillingStats {
  total_payments: number;
  total_spent: string;
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  let userProfile: BillingProfile | null = null
  try {
    userProfile = await SecureServiceRoleWrapper.executeWithUserSession<BillingProfile | null>(
        auth.supabase,
        {
          userId: auth.userId,
          operation: 'get_billing_user_profile',
          source: 'billing/overview',
          reason: 'User fetching their billing profile with package information',
          metadata: { endpoint: '/api/v1/billing/overview' },
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
          userAgent: request.headers.get('user-agent') || undefined || undefined
        },
        { table: 'indb_auth_user_profiles', operationType: 'select' },
        async (db) => {
          const { data, error } = await db
            .from('indb_auth_user_profiles')
            .select(`
              *,
              package:indb_payment_packages(*)
            `)
            .single()
          
          if (error) throw error
          return data as BillingProfile | null
        }
      )
  } catch (error) {
    throw new Error('Failed to fetch user profile')
  }

  if (!userProfile) {
    throw new Error('User profile not found')
  }

  let currentSubscription: BillingSubscription | null = null
  let subscriptionError = null
  try {
    currentSubscription = await SecureServiceRoleWrapper.executeWithUserSession<BillingSubscription | null>(
        auth.supabase,
        {
          userId: auth.userId,
          operation: 'get_active_subscription',
          source: 'billing/overview',
          reason: 'User fetching their active billing subscription for overview',
          metadata: { endpoint: '/api/v1/billing/overview' },
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
          userAgent: request.headers.get('user-agent') || undefined || undefined
        },
        { table: 'indb_payment_subscriptions', operationType: 'select' },
        async (db) => {
          const { data, error } = await db
            .from('indb_payment_subscriptions')
            .select(`
              *,
              package:indb_payment_packages!indb_payment_subscriptions_package_id_fkey(*)
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (error) throw error
          return data as BillingSubscription | null
        }
      )
  } catch (error) {
    subscriptionError = error
  }

  let billingStats: BillingStats | null = null
  let statsError = null
  try {
    billingStats = await SecureServiceRoleWrapper.executeWithUserSession<BillingStats>(
        auth.supabase,
        {
          userId: auth.userId,
          operation: 'get_billing_statistics',
          source: 'billing/overview',
          reason: 'User fetching their billing statistics for overview',
          metadata: { endpoint: '/api/v1/billing/overview' },
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
          userAgent: request.headers.get('user-agent') || undefined
        },
        { table: 'user_billing_summary', operationType: 'select' },
        async (db) => {
          const { data, error } = await db
            .from('user_billing_summary')
            .select('*')
            .single()
          
          if (error) throw error
          return data as BillingStats
        }
      )
  } catch (error) {
    statsError = error
  }

  let recentTransactions: BillingTransaction[] = []
  let transactionsError = null
  try {
    recentTransactions = await SecureServiceRoleWrapper.executeWithUserSession<BillingTransaction[]>(
        auth.supabase,
        {
          userId: auth.userId,
          operation: 'get_recent_transactions',
          source: 'billing/overview',
          reason: 'User fetching their recent billing transactions for overview',
          metadata: { endpoint: '/api/v1/billing/overview' },
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
          userAgent: request.headers.get('user-agent') || undefined || undefined
        },
        { table: 'indb_payment_transactions', operationType: 'select' },
        async (db) => {
          const { data, error } = await db
            .from('indb_payment_transactions')
            .select(`
              *,
              package:indb_payment_packages(name),
              gateway:indb_payment_gateways(name)
            `)
            .order('created_at', { ascending: false })
            .limit(10)
          
          if (error) throw error
          return (data || []) as BillingTransaction[]
        }
      )
  } catch (error) {
    transactionsError = error
    recentTransactions = []
  }

  let daysRemaining = null
  if (userProfile.expires_at) {
    const expiryDate = new Date(String(userProfile.expires_at))
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  let subscriptionData = null
  
  if (currentSubscription) {
    subscriptionData = {
      package_name: String(currentSubscription.package?.name || 'Unknown'),
      package_slug: String(currentSubscription.package?.slug || ''),
      subscription_status: String(currentSubscription.subscription_status || ''),
      expires_at: String(currentSubscription.expires_at || ''),
      subscribed_at: String(currentSubscription.started_at || ''),
      amount_paid: parseFloat(String(currentSubscription.amount_paid || '0')),
      billing_period: String(currentSubscription.billing_period || 'monthly')
    }
  } else if (userProfile.package_id && userProfile.package) {
    const billingPeriod = String(userProfile.package.billing_period || 'monthly')
    
    let calculatedAmount = 0
    const pricingTiers = userProfile.package.pricing_tiers as Record<string, Json> | null
    if (pricingTiers && pricingTiers[billingPeriod]) {
      const pricingTier = pricingTiers[billingPeriod] as Record<string, Json>
      calculatedAmount = Number(pricingTier.promo_price || pricingTier.regular_price || 0)
    } else {
      calculatedAmount = Number(userProfile.package.price || 0)
    }

    subscriptionData = {
      package_name: String(userProfile.package.name || 'Unknown'),
      package_slug: String(userProfile.package.slug || ''),
      subscription_status: userProfile.expires_at && new Date(String(userProfile.expires_at)) > new Date() ? 'active' : 'expired',
      expires_at: userProfile.expires_at ? String(userProfile.expires_at) : null,
      subscribed_at: userProfile.subscribed_at ? String(userProfile.subscribed_at) : null,
      amount_paid: calculatedAmount,
      billing_period: billingPeriod
    }
  } else if (recentTransactions && recentTransactions.length > 0) {
    const completedTransaction = recentTransactions.find(
      (t) => t.transaction_status === 'completed' || t.transaction_status === 'settlement'
    )
    
    if (completedTransaction && completedTransaction.package) {
      const transactionPackage = completedTransaction.package
      const metadata = completedTransaction.metadata as Record<string, Json> | null
      const billingPeriod = String(metadata?.billing_period || 
                           completedTransaction.billing_period || 
                           'monthly')
      
      let calculatedAmount = parseFloat(String(completedTransaction.amount || '0'))
      
      const now = new Date()
      let calculatedExpiresAt = new Date(now)
      
      switch (billingPeriod) {
        case 'weekly':
          calculatedExpiresAt.setDate(now.getDate() + 7)
          break
        case 'monthly':
          calculatedExpiresAt.setMonth(now.getMonth() + 1)
          break
        case 'quarterly':
          calculatedExpiresAt.setMonth(now.getMonth() + 3)
          break
        case 'annually':
          calculatedExpiresAt.setFullYear(now.getFullYear() + 1)
          break
      }

      subscriptionData = {
        package_name: typeof transactionPackage === 'object' ? transactionPackage.name : 'Unknown',
        package_slug: typeof transactionPackage === 'object' ? transactionPackage.slug || '' : '',
        subscription_status: 'active',
        expires_at: calculatedExpiresAt.toISOString(),
        subscribed_at: completedTransaction.created_at || null,
        amount_paid: calculatedAmount,
        billing_period: billingPeriod
      }
    }
  }

  const responseData = {
    currentSubscription: subscriptionData,
    billingStats: {
      total_payments: billingStats?.total_payments || 0,
      total_spent: parseFloat(billingStats?.total_spent || '0'),
      next_billing_date: userProfile.expires_at,
      days_remaining: daysRemaining
    },
    recentTransactions: (recentTransactions || []).map((transaction) => ({
      id: transaction.id,
      transaction_type: transaction.transaction_type,
      amount: parseFloat(String(transaction.amount || '0')),
      currency: transaction.currency,
      transaction_status: transaction.transaction_status,
      created_at: transaction.created_at,
      package_name: transaction.package?.name || 'Unknown',
      payment_method: transaction.payment_method || 'Unknown'
    }))
  }

  return formatSuccess(responseData)
})

