import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { AppConfig, ErrorType, ErrorSeverity } from '@indexnow/shared';
import { publicApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

/**
 * GET /api/v1/auth/user/trial-eligibility
 * Check if user is eligible for a free trial
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
        const eligibility = await SecureServiceRoleWrapper.executeWithUserSession(
            supabase,
            {
                userId: 'user-trial-eligibility',
                operation: 'check_trial_eligibility',
                source: 'auth/user/trial-eligibility',
                reason: 'Checking if user is eligible for trial',
                metadata: { endpoint: '/api/v1/auth/user/trial-eligibility', method: 'GET' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_payment_subscriptions', operationType: 'select' },
            async (userSupabase) => {
                const { data: { user }, error: userError } = await userSupabase.auth.getUser();
                if (userError || !user) throw new Error('User not found');

                // Check if user has ANY subscription history (trial or paid)
                // If they have any record, they are likely not eligible for a "new user" trial unless specified otherwise.
                const { count, error } = await userSupabase
                    .from('indb_payment_subscriptions')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (error) throw new Error(error.message);

                const isEligible = count === 0;

                return {
                    isEligible,
                    reason: isEligible ? 'New user' : 'Existing subscription history'
                };
            }
        );

        return formatSuccess(eligibility);
    } catch (error) {
        const err = await ErrorHandlingService.createError(
            ErrorType.AUTHENTICATION,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.MEDIUM, statusCode: 401 }
        );
        return formatError(err);
    }
});
