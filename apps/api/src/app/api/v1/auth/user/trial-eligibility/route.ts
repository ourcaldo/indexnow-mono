import { SecureServiceRoleWrapper } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { authenticatedApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'
import { Database } from '@indexnow/database'

type UserProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row']
type PackageRow = Database['public']['Tables']['indb_payment_packages']['Row']

interface TrialEligibilityProfile {
  has_used_trial: boolean;
  trial_used_at: string | null;
  package_id: string | null;
  subscribed_at: string | null;
  expires_at: string | null;
}

interface TrialPackage extends PackageRow {
  is_active: boolean;
}

export const GET = authenticatedApiWrapper(async (request, auth) => {
  try {
    const userProfile = await SecureServiceRoleWrapper.executeWithUserSession<TrialEligibilityProfile>(
      auth.supabase,
      {
        userId: auth.userId,
        operation: 'get_user_trial_eligibility_profile',
        source: 'auth/user/trial-eligibility',
        reason: 'User checking trial eligibility status and usage history',
        metadata: { endpoint: '/api/v1/auth/user/trial-eligibility', method: 'GET' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || undefined
      },
      { table: 'indb_auth_user_profiles', operationType: 'select', columns: ['has_used_trial', 'trial_used_at', 'package_id', 'subscribed_at', 'expires_at'] },
      async (db) => {
        const { data, error } = await db
          .from('indb_auth_user_profiles')
          .select('has_used_trial, trial_used_at, package_id, subscribed_at, expires_at')
          .single()
        if (error) throw new Error('Unable to verify account eligibility')
        return data as TrialEligibilityProfile
      }
    )

    if (userProfile.has_used_trial) {
      return formatSuccess({
        eligible: false,
        reason: 'already_used',
        trial_used_at: userProfile.trial_used_at as string | null,
        available_packages: [] as TrialPackage[],
        message: `Free trial already used on ${new Date(userProfile.trial_used_at || '').toLocaleDateString()}`
      })
    }

    let packages: TrialPackage[] = []
    try {
      packages = await SecureServiceRoleWrapper.executeWithUserSession<TrialPackage[]>(
        auth.supabase,
        {
          userId: auth.userId,
          operation: 'get_available_trial_packages',
          source: 'auth/user/trial-eligibility',
          reason: 'User fetching available trial packages for eligibility check',
          metadata: { eligible: true },
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
          userAgent: request.headers.get('user-agent') || undefined
        },
        { table: 'indb_payment_packages', operationType: 'select', columns: ['*'] },
        async (db) => {
          const { data, error } = await db
            .from('indb_payment_packages')
            .select('*')
            .eq('free_trial_enabled', true)
            .eq('is_active', true)
            .order('sort_order')
          if (error) throw error
          return (data || []) as TrialPackage[]
        }
      )
    } catch (error) {
      packages = []
    }

    return formatSuccess({
      eligible: true,
      reason: 'eligible',
      trial_used_at: null as string | null,
      available_packages: packages || [],
      message: 'You are eligible for a 3-day free trial'
    })
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error as Error,
      { severity: ErrorSeverity.MEDIUM, userId: auth.userId, endpoint: '/api/v1/auth/user/trial-eligibility', method: 'GET', statusCode: 500 }
    )
    return formatError(structuredError)
  }
})

