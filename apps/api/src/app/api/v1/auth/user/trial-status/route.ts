import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { AppConfig, ErrorType, ErrorSeverity } from '@indexnow/shared';
import { publicApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

/**
 * GET /api/v1/auth/user/trial-status
 * Get current trial status for user
 */
export const GET = publicApiWrapper(async (request: NextRequest) => {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        AppConfig.supabase.url,
        AppConfig.supabase.anonKey,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll() { } // Read-only for getting session
            },
        }
    );

    try {
        const trialStatus = await SecureServiceRoleWrapper.executeWithUserSession(
            supabase,
            {
                userId: 'user-trial-status',
                operation: 'get_trial_status',
                source: 'auth/user/trial-status',
                reason: 'User fetching their trial status',
                metadata: { endpoint: '/api/v1/auth/user/trial-status', method: 'GET' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_payment_subscriptions', operationType: 'select' },
            async (userSupabase) => {
                const { data: { user }, error: userError } = await userSupabase.auth.getUser();
                if (userError || !user) throw new Error('User not found');

                // Get active subscription that might be a trial
                const { data, error } = await userSupabase
                    .from('indb_payment_subscriptions')
                    .select('*')
                    .eq('user_id', user.id)
                    .in('status', ['trialing', 'active'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (error && error.code === 'PGRST116') {
                    // No active subscription
                    return { active: false, reason: 'No active subscription' };
                } else if (error) {
                    throw new Error(error.message);
                }

                // Check if it's a trial
                const isTrial = data.status === 'trialing';
                const now = new Date();
                const trialEnd = data.trial_end ? new Date(data.trial_end) : null;
                const daysLeft = trialEnd && trialEnd > now
                    ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;

                return {
                    active: isTrial && daysLeft > 0,
                    status: data.status,
                    trialEnd: data.trial_end,
                    daysLeft: isTrial ? daysLeft : 0,
                    packageId: data.package_id
                };
            }
        );

        return formatSuccess(trialStatus);
    } catch (error) {
        const err = await ErrorHandlingService.createError(
            ErrorType.AUTHENTICATION,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.MEDIUM, statusCode: 401 }
        );
        return formatError(err);
    }
});
