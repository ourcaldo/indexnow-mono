import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { AppConfig, ErrorType, ErrorSeverity } from '@indexnow/shared';
import { publicApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

/**
 * GET /api/v1/auth/user/quota
 * Get current user quota usage
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
        const quota = await SecureServiceRoleWrapper.executeWithUserSession(
            supabase,
            {
                userId: 'user-quota-get',
                operation: 'get_user_quota',
                source: 'auth/user/quota',
                reason: 'User fetching their quota usage',
                metadata: { endpoint: '/api/v1/auth/user/quota', method: 'GET' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_seranking_quota_usage', operationType: 'select' },
            async (userSupabase) => {
                const { data: { user }, error: userError } = await userSupabase.auth.getUser();
                if (userError || !user) throw new Error('User not found');

                // Get quota usage
                const { data, error } = await userSupabase
                    .from('indb_seranking_quota_usage')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code === 'PGRST116') {
                    // No quota record found, return default empty
                    return { used: 0, limit: 100 }; // Default or handle accordingly
                } else if (error) {
                    throw new Error(error.message);
                }

                return data;
            }
        );

        return formatSuccess(quota);
    } catch (error) {
        const err = await ErrorHandlingService.createError(
            ErrorType.AUTHENTICATION,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.MEDIUM, statusCode: 401 }
        );
        return formatError(err);
    }
});
