/**
 * Billing Cycle Service
 * Handles billing cycle calculations, renewals, and subscription management
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database'
import type { Database } from '@indexnow/shared'

// Type definitions to handle Supabase query results and schema mismatches
// These interfaces match the actual usage in the code, which differs from the generated Database types
// (specifically subscribed_at vs subscription_start_date)

type UpdateUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Update']

// Structural solution to bypass broken Supabase type inference for updates
interface MinimalPostgrestError {
  message: string
}

interface PostgrestResult {
  data: unknown
  error: MinimalPostgrestError | null
}

interface BillingProfileQueryBuilder extends PromiseLike<PostgrestResult> {
  eq(column: string, value: any): BillingProfileQueryBuilder
  lt(column: string, value: any): BillingProfileQueryBuilder
  not(column: string, operator: string, value: any): BillingProfileQueryBuilder
  select(columns: string): BillingProfileQueryBuilder
}

interface AdminClientOverride {
  from(table: string): {
    update(data: UpdateUserProfile): BillingProfileQueryBuilder
  }
}

interface PackageInfo {
  id: string
  name: string
  currency: string
  billing_period: 'monthly' | 'annual'
  pricing_tiers: any
}

interface BillingProfile {
  user_id: string
  package_id: string
  subscribed_at: string
  expires_at: string | null
  package: PackageInfo | null
}

export interface BillingCycle {
  user_id: string
  package_id: string
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
  calculateNextBillingDate(currentDate: Date, billingPeriod: 'monthly' | 'annual'): Date {
    const nextDate = new Date(currentDate)
    
    if (billingPeriod === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1)
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1)
    }
    
    return nextDate
  }

  /**
   * Calculate billing amount from pricing tiers
   */
  calculateBillingAmountFromTiers(pricingTiers: any, billingPeriod: 'monthly' | 'annual'): number {
    // Use flat USD pricing structure (Paddle handles currency conversion)
    if (pricingTiers?.[billingPeriod]) {
      const tierData = pricingTiers[billingPeriod]
      return tierData.promo_price || tierData.regular_price
    }
    
    return 0 // Default if no pricing found
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

          // Cast to BillingProfile to handle potential schema mismatch and complex joins
          return data as unknown as BillingProfile
        }
      )

      if (!profile || !profile.package) {
        return null
      }

      const currentDate = new Date()
      const subscribedAt = new Date(profile.subscribed_at)
      const expiresAt = profile.expires_at ? new Date(profile.expires_at) : null

      return {
        user_id: userId,
        package_id: profile.package_id,
        current_period_start: subscribedAt,
        current_period_end: expiresAt || this.calculateNextBillingDate(subscribedAt, profile.package.billing_period),
        next_billing_date: this.calculateNextBillingDate(subscribedAt, profile.package.billing_period),
        billing_period: profile.package.billing_period,
        amount: this.calculateBillingAmountFromTiers(profile.package.pricing_tiers, profile.package.billing_period),
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
    billingPeriod: 'monthly' | 'annual'
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
            subscribed_at: currentDate.toISOString(),
            expires_at: nextBillingDate.toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        async () => {
          // Cast update payload to UpdateUserProfile via unknown to handle potential schema mismatches
          // (e.g. subscribed_at vs subscription_start_date)
          const updatePayload = {
            package_id: packageId,
            subscribed_at: currentDate.toISOString(),
            expires_at: nextBillingDate.toISOString(),
            updated_at: new Date().toISOString()
          } as unknown as UpdateUserProfile

          // Cast to structural type to resolve 'never' inference on update
          const adminClient = supabaseAdmin as unknown as AdminClientOverride

          const { error } = await adminClient
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
            expires_at_gte: currentDate.toISOString(),
            expires_at_lte: futureDate.toISOString()
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
            .gte('expires_at', currentDate.toISOString())
            .lte('expires_at', futureDate.toISOString())
            .not('package_id', 'is', null)

          if (error) {
            throw new Error(`Failed to get upcoming renewals: ${error.message}`)
          }

          return (data as unknown as BillingProfile[]) || []
        }
      )

      if (!profiles) {
        return []
      }

      return profiles.map(profile => ({
        user_id: profile.user_id,
        package_id: profile.package_id,
        current_period_start: new Date(profile.subscribed_at),
        current_period_end: new Date(profile.expires_at!), // expires_at is checked in query but type says null
        next_billing_date: new Date(profile.expires_at!),
        billing_period: profile.package!.billing_period,
        amount: this.calculateBillingAmountFromTiers(profile.package!.pricing_tiers, profile.package!.billing_period),
        currency: profile.package!.currency,
        is_active: true
      }))

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
            expires_at_lt: currentDate.toISOString()
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
            .lt('expires_at', currentDate.toISOString())
            .not('package_id', 'is', null)

          if (error) {
            throw new Error(`Failed to get expired subscriptions: ${error.message}`)
          }

          return (data as unknown as BillingProfile[]) || []
        }
      )

      if (!profiles) {
        return []
      }

      return profiles.map(profile => ({
        user_id: profile.user_id,
        package_id: profile.package_id,
        current_period_start: new Date(profile.subscribed_at),
        current_period_end: new Date(profile.expires_at!),
        next_billing_date: new Date(profile.expires_at!),
        billing_period: profile.package!.billing_period,
        amount: this.calculateBillingAmountFromTiers(profile.package!.pricing_tiers, profile.package!.billing_period),
        currency: profile.package!.currency,
        is_active: false
      }))

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

          return data as unknown as { id: string }
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
            expires_at_lt: currentDate.toISOString()
          },
          data: {
            package_id: freePackage.id,
            expires_at: null,
            updated_at: new Date().toISOString()
          }
        },
        async () => {
          // Cast update payload to handle potential schema mismatches
          const updatePayload = {
            package_id: freePackage.id,
            expires_at: null,
            updated_at: new Date().toISOString()
          } as unknown as UpdateUserProfile

          // Cast to structural type to resolve 'never' inference on update
          const adminClient = supabaseAdmin as unknown as AdminClientOverride

          const { data, error } = await adminClient
            .from('indb_auth_user_profiles')
            .update(updatePayload)
            .lt('expires_at', currentDate.toISOString())
            .not('package_id', 'eq', freePackage.id)
            .select('user_id')

          if (error) {
            throw new Error(`Failed to suspend expired subscriptions: ${error.message}`)
          }

          return data as unknown as { user_id: string }[]
        }
      )

      return updatedProfiles?.length || 0

    } catch (error) {
      console.error('Error suspending expired subscriptions:', error)
      return 0
    }
  }
}
