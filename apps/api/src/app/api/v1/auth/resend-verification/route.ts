import { NextRequest, NextResponse } from 'next/server';
import { SecureServiceRoleWrapper, createAnonServerClient } from '@indexnow/database';
import { ErrorType, ErrorSeverity , getClientIP} from '@indexnow/shared';
import {
    publicApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';
import { z } from 'zod';
import { redisRateLimiter } from '@/lib/rate-limiting/redis-rate-limiter';

const RESEND_RATE_LIMIT = { maxAttempts: 3, windowMs: 15 * 60 * 1000 };
const RESEND_COOLDOWN = { maxAttempts: 1, windowMs: 60 * 1000 };

// Type for resend result
interface ResendResult {
    error: { message?: string } | null;
}

const resendVerificationSchema = z.object({
    email: z.string().email(),
});

/**
 * POST /api/v1/auth/resend-verification
 * Resend verification email to user
 */
export const POST = publicApiWrapper(async (request: NextRequest) => {
    try {
        const body = await request.json();
        const parseResult = resendVerificationSchema.safeParse(body);
        if (!parseResult.success) {
            const validationError = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                parseResult.error.errors[0]?.message || 'Invalid request body',
                { severity: ErrorSeverity.LOW, statusCode: 400 }
            );
            return formatError(validationError);
        }
        const { email } = parseResult.data;

        const normalizedEmail = email.trim().toLowerCase();
        const clientIP = getClientIP(request)
            || request.headers.get('cf-connecting-ip')
            || '127.0.0.1';

        // Check rate limits
        const emailKey = `resend_email_${normalizedEmail}`;
        const ipKey = `resend_ip_${clientIP}`;
        const cooldownKey = `resend_cooldown_${normalizedEmail}`;

        const [cooldownCheck, emailCheck, ipCheck] = await Promise.all([
            redisRateLimiter.check(cooldownKey, RESEND_COOLDOWN),
            redisRateLimiter.check(emailKey, RESEND_RATE_LIMIT),
            redisRateLimiter.check(ipKey, RESEND_RATE_LIMIT),
        ]);

        if (!cooldownCheck.allowed) {
            const rateLimitError = await ErrorHandlingService.createError(
                ErrorType.RATE_LIMIT,
                'Please wait before requesting another verification email.',
                {
                    severity: ErrorSeverity.LOW,
                    statusCode: 429,
                    metadata: { retryAfter: cooldownCheck.retryAfter }
                }
            );
            return formatError(rateLimitError);
        }
        if (!emailCheck.allowed || !ipCheck.allowed) {
            const retryAfter = Math.max(emailCheck.retryAfter, ipCheck.retryAfter);
            const rateLimitError = await ErrorHandlingService.createError(
                ErrorType.RATE_LIMIT,
                'Too many requests. Please try again later.',
                {
                    severity: ErrorSeverity.LOW,
                    statusCode: 429,
                    metadata: { retryAfter }
                }
            );
            return formatError(rateLimitError);
        }

        // Create Supabase client
        const supabase = createAnonServerClient();

        const resendResult = await SecureServiceRoleWrapper.executeWithUserSession<ResendResult>(
            supabase,
            {
                userId: 'anonymous',
                operation: 'resend_verification_email',
                reason: 'User requesting email verification resend',
                source: 'auth/resend-verification',
                metadata: { email: normalizedEmail },
                ipAddress: clientIP,
                userAgent: request.headers.get('user-agent') || 'unknown'
            },
            { table: 'auth.users', operationType: 'update' },
            async (userSupabase) => {
                const { error: resendError } = await userSupabase.auth.resend({
                    type: 'signup',
                    email: normalizedEmail,
                    options: { emailRedirectTo: `${request.nextUrl.origin}/auth/callback` }
                });
                return { error: resendError };
            }
        );

        const { error: resendError } = resendResult;

        if (resendError) {
            if (resendError.message?.includes('rate limit') || resendError.message?.includes('too_many_requests')) {
                const rateLimitError = await ErrorHandlingService.createError(
                    ErrorType.RATE_LIMIT,
                    'Email sending rate limit exceeded. Please try again in a few minutes.',
                    {
                        severity: ErrorSeverity.LOW,
                        statusCode: 429,
                        metadata: { retryAfter: 300 }
                    }
                );
                return formatError(rateLimitError);
            }
            // Log error but don't expose to user for security
            logger.warn({ message: 'Resend verification error (hidden from user)', error: resendError.message });
        }

        // Increment rate limit counters after successful processing
        await Promise.all([
            redisRateLimiter.increment(emailKey, RESEND_RATE_LIMIT),
            redisRateLimiter.increment(ipKey, RESEND_RATE_LIMIT),
            redisRateLimiter.increment(cooldownKey, RESEND_COOLDOWN),
        ]);

        // Always return success message to prevent email enumeration
        return formatSuccess({
            message: 'If an account with this email exists and is unverified, a verification email has been sent.',
            canResendAfter: RESEND_COOLDOWN.windowMs / 1000
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

/**
 * OPTIONS /api/v1/auth/resend-verification
 * CORS preflight handler
 */
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Allow': 'POST, OPTIONS',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

