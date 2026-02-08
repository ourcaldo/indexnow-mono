import { NextRequest } from 'next/server';
import { authenticatedApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity, type Database } from '@indexnow/shared';

// Derived types from Database schema
type UserProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row'];
type PaymentPackageRow = Database['public']['Tables']['indb_payment_packages']['Row'];
type PaymentSubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row'];

// Pick only the columns we select
type UserTrialProfile = Pick<UserProfileRow, 'is_trial_active' | 'trial_ends_at' | 'package_id' | 'subscription_start_date' | 'subscription_end_date'>;
type SubscriptionInfo = Pick<PaymentSubscriptionRow, 'end_date' | 'status'>;

interface TrialStatusResponse {
    has_trial: boolean;
    trial_status: string;
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
    days_remaining?: number;
    hours_remaining?: number;
    trial_package?: PaymentPackageRow;
    next_billing_date?: string;
    subscription_info?: { status: string };
}

/**
 * GET /api/v1/auth/user/trial-status
 * Get current trial status for user
 */
export const GET = authenticatedApiWrapper(async (request, auth) => {
    try {
        const userProfile = await SecureServiceRoleWrapper.executeWithUserSession<UserTrialProfile>(
            auth.supabase,
            {
                userId: auth.userId,
                operation: 'get_user_trial_status',
                source: 'auth/user/trial-status',
                reason: 'User fetching their own trial status information',
                metadata: { endpoint: '/api/v1/auth/user/trial-status', method: 'GET' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') ?? undefined
            },
            { table: 'indb_auth_user_profiles', operationType: 'select' },
            async (db) => {
                const { data, error } = await db
                    .from('indb_auth_user_profiles')
                    .select('is_trial_active, trial_ends_at, package_id, subscription_start_date, subscription_end_date')
                    .eq('user_id', auth.userId)
                    .single();
                if (error) throw error;
                return data;
            }
        );

        const now = new Date();
        const isTrialActive = userProfile.is_trial_active ?? false;
        const trialStatus = isTrialActive ? 'active' : 'none';

        const response: TrialStatusResponse = {
            has_trial: isTrialActive,
            trial_status: trialStatus
        };

        if (isTrialActive && userProfile.trial_ends_at) {
            const trialEndTime = new Date(userProfile.trial_ends_at);
            const timeDiff = trialEndTime.getTime() - now.getTime();

            response.trial_started_at = userProfile.subscription_start_date;
            response.trial_ends_at = userProfile.trial_ends_at;
            response.days_remaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
            response.hours_remaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60)));
        }

        // Fetch package info if available
        if (userProfile.package_id) {
            try {
                const packageInfo = await SecureServiceRoleWrapper.executeWithUserSession<PaymentPackageRow | null>(
                    auth.supabase,
                    {
                        userId: auth.userId,
                        operation: 'get_trial_package_info',
                        source: 'auth/user/trial-status',
                        reason: 'User fetching trial package information for their account',
                        metadata: { packageId: userProfile.package_id },
                        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                        userAgent: request.headers.get('user-agent') ?? undefined
                    },
                    { table: 'indb_payment_packages', operationType: 'select' },
                    async (db) => {
                        const { data, error } = await db
                            .from('indb_payment_packages')
                            .select('*')
                            .eq('id', userProfile.package_id!)
                            .single();
                        if (error && error.code !== 'PGRST116') throw error;
                        return data;
                    }
                );
                if (packageInfo) response.trial_package = packageInfo;
            } catch {
                // Ignore package fetch errors
            }
        }

        // Fetch active subscription info
        try {
            const subscription = await SecureServiceRoleWrapper.executeWithUserSession<SubscriptionInfo | null>(
                auth.supabase,
                {
                    userId: auth.userId,
                    operation: 'get_active_subscription_info',
                    source: 'auth/user/trial-status',
                    reason: 'User fetching active subscription information for trial status details',
                    metadata: {},
                    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                    userAgent: request.headers.get('user-agent') ?? undefined
                },
                { table: 'indb_payment_subscriptions', operationType: 'select' },
                async (db) => {
                    const { data, error } = await db
                        .from('indb_payment_subscriptions')
                        .select('end_date, status')
                        .eq('user_id', auth.userId)
                        .eq('status', 'active')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    if (error && error.code !== 'PGRST116') throw error;
                    return data;
                }
            );
            if (subscription) {
                response.next_billing_date = subscription.end_date ?? undefined;
                response.subscription_info = { status: subscription.status };
            }
        } catch {
            // Ignore subscription fetch errors
        }

        return formatSuccess({ data: response });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.MEDIUM, userId: auth.userId, endpoint: '/api/v1/auth/user/trial-status', method: 'GET', statusCode: 500 }
        );
        return formatError(structuredError);
    }
});
