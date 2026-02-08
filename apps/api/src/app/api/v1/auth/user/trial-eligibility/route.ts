import { NextRequest } from 'next/server';
import { authenticatedApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity, type Database } from '@indexnow/shared';

// Derived types from Database schema
type UserProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row'];
type PaymentPackageRow = Database['public']['Tables']['indb_payment_packages']['Row'];

// Pick only the columns we need for eligibility check
type UserEligibilityProfile = Pick<UserProfileRow, 'package_id' | 'subscription_start_date' | 'subscription_end_date'>;

// Type for trial package list (only what we select)
type TrialPackageInfo = Pick<PaymentPackageRow, 'id' | 'name' | 'slug' | 'description' | 'is_active'>;

// Response types for trial eligibility
interface TrialEligibilityIneligible {
    eligible: false;
    reason: string;
    trial_used_at: string | null;
    message: string;
}

interface TrialEligibilityEligible {
    eligible: true;
    available_packages: TrialPackageInfo[];
    message: string;
}

type TrialEligibilityResponse = TrialEligibilityIneligible | TrialEligibilityEligible;

/**
 * GET /api/v1/auth/user/trial-eligibility
 * Check if user is eligible for a free trial
 */
export const GET = authenticatedApiWrapper<TrialEligibilityResponse>(async (request, auth) => {
    try {
        // Query available columns from user profile
        const profileResult = await SecureServiceRoleWrapper.executeWithUserSession<UserEligibilityProfile>(
            auth.supabase,
            {
                userId: auth.userId,
                operation: 'get_user_trial_eligibility_profile',
                source: 'auth/user/trial-eligibility',
                reason: 'User checking trial eligibility status and usage history',
                metadata: { endpoint: '/api/v1/auth/user/trial-eligibility', method: 'GET' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') ?? undefined
            },
            { table: 'indb_auth_user_profiles', operationType: 'select' },
            async (db) => {
                const { data, error } = await db
                    .from('indb_auth_user_profiles')
                    .select('package_id, subscription_start_date, subscription_end_date')
                    .eq('user_id', auth.userId)
                    .single();
                if (error) throw new Error('Unable to verify account eligibility');
                return data;
            }
        );

        // Infer trial usage from subscription history
        const hasUsedTrial = profileResult.subscription_start_date !== null;
        const trialUsedAt = profileResult.subscription_start_date;

        if (hasUsedTrial) {
            return formatSuccess<TrialEligibilityResponse>({
                eligible: false,
                reason: 'already_used',
                trial_used_at: trialUsedAt,
                message: trialUsedAt
                    ? `Free trial already used on ${new Date(trialUsedAt).toLocaleDateString()}`
                    : 'Free trial already used'
            });
        }

        // Fetch available trial packages
        let packages: TrialPackageInfo[] = [];
        try {
            packages = await SecureServiceRoleWrapper.executeWithUserSession<TrialPackageInfo[]>(
                auth.supabase,
                {
                    userId: auth.userId,
                    operation: 'get_available_trial_packages',
                    source: 'auth/user/trial-eligibility',
                    reason: 'User fetching available trial packages for eligibility check',
                    metadata: { eligible: true },
                    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                    userAgent: request.headers.get('user-agent') ?? undefined
                },
                { table: 'indb_payment_packages', operationType: 'select' },
                async (db) => {
                    const { data, error } = await db
                        .from('indb_payment_packages')
                        .select('id, name, slug, description, is_active')
                        .eq('is_active', true);
                    if (error) throw error;
                    return data ?? [];
                }
            );
        } catch {
            packages = [];
        }

        return formatSuccess<TrialEligibilityResponse>({
            eligible: true,
            available_packages: packages,
            message: 'You are eligible for a 3-day free trial'
        });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.MEDIUM, userId: auth.userId, endpoint: '/api/v1/auth/user/trial-eligibility', method: 'GET', statusCode: 500 }
        );
        return formatError(structuredError);
    }
});
