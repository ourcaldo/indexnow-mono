/**
 * Billing Cycle Service
 * Handles billing cycle calculations, renewals, and subscription management
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database'
import type { 
  Database, 
  UpdateUserProfile, 
  PackagePricingTiers,
  PackagePricingTier
} from '@indexnow/shared'

// Strict types for the joined query result
type UserProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row']

interface PackageInfo {
  id: string
  name: string
  currency: string
  billing_period: string
  pricing_tiers: PackagePricingTier[] | PackagePricingTiers | null
}

interface BillingProfileWithPackage extends UserProfileRow {
  package: PackageInfo | null
}

export interface BillingCycle {
  user_id: string
  package_id: string | null
  current_period_start: Date
  current_period_end: Date
  next_billing_date: Date
  billing_period: 'monthly' | 'annual'
  amount: number
  currency: string
  is_active: boolean
}

export class BillingCycleService {

  /**
   * Calculate next billing date based on current period and billing period
   */
  calculateNextBillingDate(currentDate: Date, billingPeriod: string): Date {
    const nextDate = new Date(currentDate)
    
    // Default to monthly if unknown
    if (billingPeriod === 'annual' || billingPeriod === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1)
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1)
    }
    
    return nextDate
  }

  /**
   * Calculate billing amount from pricing tiers
   */
  calculateBillingAmountFromTiers(
    pricingTiers: PackagePricingTier[] | PackagePricingTiers | null, 
    billingPeriod: string
  ): number {
    if (!pricingTiers) return 0
    
    // Handle the case where pricing_tiers is the record structure (PackagePricingTiers)
    if (!Array.isArray(pricingTiers)) {
       // Normalized billing period key
       const periodKey = (billingPeriod === 'annual' || billingPeriod === 'yearly') ? 'yearly' : 'monthly'
       
       // Try to access with the exact key or normalized key
       const tierData = pricingTiers[billingPeriod] || pricingTiers[periodKey]
       
       if (tierData) {
         return tierData.promo_price || tierData.regular_price
       }
    } else {
      // Handle array structure if needed
      const periodKey = (billingPeriod === 'annual' || billingPeriod === 'yearly') ? 'yearly' : 'monthly'
      const tier = pricingTiers.find(t => t.billing_period === periodKey)
      if (tier) {
        return tier.price
      }
    }
    
    return 0 // Default if no pricing found or incorrect structure
  }

  /**
   * Get user's current billing cycle
   */
  async getCurrentBillingCycle(userId: string): Promise<BillingCycle | null> {
    try {
      const profile = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: userId,
          operation: 'get_user_billing_cycle_info',
          reason: 'Retrieving user billing cycle and package information for billing calculations',
          source: 'services/payments/billing/BillingCycleService',
          metadata: {
            target_user_id: userId,
            operation_type: 'billing_cycle_lookup'
          }
        },
        {
          table: 'indb_auth_user_profiles',
          operationType: 'select',
          columns: ['*'],
          whereConditions: { user_id: userId }
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_auth_user_profiles')
            .select(`
              *,
              package:indb_payment_packages(
                id,
                name,
                currency,
                billing_period,
                pricing_tiers
              )
            `)
            .eq('user_id', userId)
            .single()

          if (error) {
            throw new Error(`Failed to get user billing cycle: ${error.message}`)
          }

          // Use cast for the joined relation which isn't automatically inferred perfectly
          return data as unknown as BillingProfileWithPackage
        }
      )

      if (!profile || !profile.package || !profile.subscription_start_date) {
        return null
      }

      const currentDate = new Date()
      const subscribedAt = new Date(profile.subscription_start_date)
      const expiresAt = profile.subscription_end_date ? new Date(profile.subscription_end_date) : null
      
      const billingPeriod = profile.package.billing_period || 'monthly'

      // Calculate next billing date
      // If active, it's the expiration date. If no expiration, calculate from start.
      const nextBillingDate = expiresAt || this.calculateNextBillingDate(subscribedAt, billingPeriod)
      
      // Current period end is the expiration date or next billing date
      const currentPeriodEnd = expiresAt || nextBillingDate

      return {
        user_id: userId,
        package_id: profile.package_id,
        current_period_start: subscribedAt,
        current_period_end: currentPeriodEnd,
        next_billing_date: nextBillingDate,
        billing_period: (billingPeriod === 'annual' || billingPeriod === 'yearly') ? 'annual' : 'monthly',
        amount: this.calculateBillingAmountFromTiers(profile.package.pricing_tiers, billingPeriod),
        currency: profile.package.currency,
        is_active: !expiresAt || expiresAt > currentDate
      }

    } catch (error) {
      console.error('Error getting billing cycle:', error)
      return null
    }
  }

  /**
   * Update user's billing cycle after successful payment
   */
  async updateBillingCycle(
    userId: string, 
    packageId: string, 
    billingPeriod: 'monthly' | 'annual' | 'yearly'
  ): Promise<boolean> {
    try {
      const currentDate = new Date()
      const nextBillingDate = this.calculateNextBillingDate(currentDate, billingPeriod)

      await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: userId,
          operation: 'update_user_billing_cycle_after_payment',
          reason: 'Updating user billing cycle after successful payment processing',
          source: 'services/payments/billing/BillingCycleService',
          metadata: {
            target_user_id: userId,
            package_id: packageId,
            billing_period: billingPeriod,
            next_billing_date: nextBillingDate.toISOString(),
            operation_type: 'billing_cycle_update'
          }
        },
        {
          table: 'indb_auth_user_profiles',
          operationType: 'update',
          whereConditions: { user_id: userId },
          data: {
            package_id: packageId,
            subscription_start_date: currentDate.toISOString(),
            subscription_end_date: nextBillingDate.toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        async () => {
          const updatePayload: UpdateUserProfile = {
            package_id: packageId,
            subscription_start_date: currentDate.toISOString(),
            subscription_end_date: nextBillingDate.toISOString(),
            updated_at: new Date().toISOString()
          }

          const { error } = await supabaseAdmin
            .from('indb_auth_user_profiles')
            .update(updatePayload)
            .eq('user_id', userId)

          if (error) {
            throw new Error(`Failed to update billing cycle: ${error.message}`)
          }

          return { success: true }
        }
      )

      return true

    } catch (error) {
      console.error('Error updating billing cycle:', error)
      return false
    }
  }

  /**
   * Get users with upcoming renewals (next 3 days)
   */
  async getUpcomingRenewals(daysAhead: number = 3): Promise<BillingCycle[]> {
    try {
      const currentDate = new Date()
      const futureDate = new Date()
      futureDate.setDate(currentDate.getDate() + daysAhead)

      const profiles = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'get_upcoming_billing_renewals',
          reason: 'Retrieving user profiles with upcoming billing renewals for automated billing processing',
          source: 'services/payments/billing/BillingCycleService',
          metadata: {
            days_ahead: daysAhead,
            current_date: currentDate.toISOString(),
            future_date: futureDate.toISOString(),
            operation_type: 'billing_renewal_lookup'
          }
        },
        {
          table: 'indb_auth_user_profiles',
          operationType: 'select',
          columns: ['*'],
          whereConditions: { 
            subscription_end_date_gte: currentDate.toISOString(),
            subscription_end_date_lte: futureDate.toISOString()
          }
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_auth_user_profiles')
            .select(`
              *,
              package:indb_payment_packages(
                id,
                name,
                currency,
                billing_period,
                pricing_tiers
              )
            `)
            .gte('subscription_end_date', currentDate.toISOString())
            .lte('subscription_end_date', futureDate.toISOString())
            .not('package_id', 'is', null)

          if (error) {
            throw new Error(`Failed to get upcoming renewals: ${error.message}`)
          }

          return (data as unknown as BillingProfileWithPackage[]) || []
        }
      )

      if (!profiles) {
        return []
      }

      return profiles
        .filter(p => p.package && p.subscription_start_date && p.subscription_end_date)
        .map(profile => {
          const billingPeriod = profile.package!.billing_period || 'monthly'
          return {
            user_id: profile.user_id,
            package_id: profile.package_id,
            current_period_start: new Date(profile.subscription_start_date!),
            current_period_end: new Date(profile.subscription_end_date!),
            next_billing_date: new Date(profile.subscription_end_date!),
            billing_period: (billingPeriod === 'annual' || billingPeriod === 'yearly') ? 'annual' : 'monthly',
            amount: this.calculateBillingAmountFromTiers(profile.package!.pricing_tiers, billingPeriod),
            currency: profile.package!.currency,
            is_active: true
          }
        })

    } catch (error) {
      console.error('Error getting upcoming renewals:', error)
      return []
    }
  }

  /**
   * Get expired subscriptions
   */
  async getExpiredSubscriptions(): Promise<BillingCycle[]> {
    try {
      const currentDate = new Date()

      const profiles = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'get_expired_subscriptions',
          reason: 'Retrieving user profiles with expired subscriptions for automated subscription management',
          source: 'services/payments/billing/BillingCycleService',
          metadata: {
            current_date: currentDate.toISOString(),
            operation_type: 'expired_subscription_lookup'
          }
        },
        {
          table: 'indb_auth_user_profiles',
          operationType: 'select',
          columns: ['*'],
          whereConditions: { 
            subscription_end_date_lt: currentDate.toISOString()
          }
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_auth_user_profiles')
            .select(`
              *,
              package:indb_payment_packages(
                id,
                name,
                currency,
                billing_period,
                pricing_tiers
              )
            `)
            .lt('subscription_end_date', currentDate.toISOString())
            .not('package_id', 'is', null)

          if (error) {
            throw new Error(`Failed to get expired subscriptions: ${error.message}`)
          }

          return (data as unknown as BillingProfileWithPackage[]) || []
        }
      )

      if (!profiles) {
        return []
      }

      return profiles
        .filter(p => p.package && p.subscription_start_date && p.subscription_end_date)
        .map(profile => {
          const billingPeriod = profile.package!.billing_period || 'monthly'
          return {
            user_id: profile.user_id,
            package_id: profile.package_id,
            current_period_start: new Date(profile.subscription_start_date!),
            current_period_end: new Date(profile.subscription_end_date!),
            next_billing_date: new Date(profile.subscription_end_date!),
            billing_period: (billingPeriod === 'annual' || billingPeriod === 'yearly') ? 'annual' : 'monthly',
            amount: this.calculateBillingAmountFromTiers(profile.package!.pricing_tiers, billingPeriod),
            currency: profile.package!.currency,
            is_active: false
          }
        })

    } catch (error) {
      console.error('Error getting expired subscriptions:', error)
      return []
    }
  }

  /**
   * Suspend expired subscriptions
   */
  async suspendExpiredSubscriptions(): Promise<number> {
    try {
      const currentDate = new Date()

      // Get the free package ID
      const freePackage = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'get_free_package_for_suspension',
          reason: 'Retrieving free package ID for automatic suspension of expired subscriptions',
          source: 'services/payments/billing/BillingCycleService',
          metadata: {
            operation_type: 'package_lookup'
          }
        },
        {
          table: 'indb_payment_packages',
          operationType: 'select',
          columns: ['id'],
          whereConditions: { slug: 'free', is_active: true }
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_payment_packages')
            .select('id')
            .eq('slug', 'free')
            .eq('is_active', true)
            .single()

          if (error) {
            throw new Error(`Failed to get free package: ${error.message}`)
          }

          return data
        }
      )

      if (!freePackage) {
        console.error('Free package not found')
        return 0
      }

      // Update expired subscriptions to free package
      const updatedProfiles = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'suspend_expired_subscriptions_to_free',
          reason: 'Updating expired subscriptions to free package for automated suspension',
          source: 'services/payments/billing/BillingCycleService',
          metadata: {
            free_package_id: freePackage.id,
            current_date: currentDate.toISOString(),
            operation_type: 'bulk_subscription_suspension'
          }
        },
        {
          table: 'indb_auth_user_profiles',
          operationType: 'update',
          whereConditions: { 
            subscription_end_date_lt: currentDate.toISOString()
          },
          data: {
            package_id: freePackage.id,
            subscription_end_date: null,
            updated_at: new Date().toISOString()
          }
        },
        async () => {
          const updatePayload: UpdateUserProfile = {
            package_id: freePackage.id,
            subscription_end_date: null,
            updated_at: new Date().toISOString()
          }

          const { data, error } = await supabaseAdmin
            .from('indb_auth_user_profiles')
            .update(updatePayload)
            .lt('subscription_end_date', currentDate.toISOString())
            .not('package_id', 'eq', freePackage.id)
            .select('user_id')

          if (error) {
            throw new Error(`Failed to suspend expired subscriptions: ${error.message}`)
          }

          return data
        }
      )

      return updatedProfiles?.length || 0

    } catch (error) {
      console.error('Error suspending expired subscriptions:', error)
      return 0
    }
  }
}
