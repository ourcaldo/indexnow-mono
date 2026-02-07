import { NextRequest } from 'next/server';
import { supabase } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
    publicApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

/**
 * POST /api/v1/auth/test-login
 * Test login endpoint for development/testing purposes
 */
export const POST = publicApiWrapper(async (request: NextRequest) => {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            const validationError = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                'Email and password are required',
                { severity: ErrorSeverity.LOW, statusCode: 400 }
            );
            return formatError(validationError);
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            const authError = await ErrorHandlingService.createError(
                ErrorType.AUTHENTICATION,
                error.message,
                { severity: ErrorSeverity.MEDIUM, statusCode: 401 }
            );
            return formatError(authError);
        }

        if (!data.session) {
            const sessionError = await ErrorHandlingService.createError(
                ErrorType.AUTHENTICATION,
                'No session created',
                { severity: ErrorSeverity.MEDIUM, statusCode: 401 }
            );
            return formatError(sessionError);
        }

        return formatSuccess({
            user: {
                id: data.user?.id,
                email: data.user?.email
            }
        });
    } catch (error) {
        const systemError = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, statusCode: 500 }
        );
        return formatError(systemError);
    }
});

