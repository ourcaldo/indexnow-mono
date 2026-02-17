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

// In-memory rate limit store for verification resend requests
const rateLimitStore = new Map<string, { count: number; resetTime: number; lastRequest: number }>();

const RATE_LIMIT = {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 15 * 60 * 1000,
    COOLDOWN_MS: 60 * 1000,
};

/**
 * Check rate limit for resend verification requests
 */
function checkRateLimit(email: string, clientIP: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const emailKey = `resend_email_${email.toLowerCase()}`;
    const ipKey = `resend_ip_${clientIP}`;

    // Clear expired entries
    const emailRecord = rateLimitStore.get(emailKey);
    const ipRecord = rateLimitStore.get(ipKey);

    if (emailRecord && now > emailRecord.resetTime) {
        rateLimitStore.delete(emailKey);
    }
    if (ipRecord && now > ipRecord.resetTime) {
        rateLimitStore.delete(ipKey);
    }

    const currentEmailRecord = rateLimitStore.get(emailKey);
    const currentIPRecord = rateLimitStore.get(ipKey);

    // Check cooldown between requests
    if (currentEmailRecord && (now - currentEmailRecord.lastRequest) < RATE_LIMIT.COOLDOWN_MS) {
        const retryAfter = Math.ceil((RATE_LIMIT.COOLDOWN_MS - (now - currentEmailRecord.lastRequest)) / 1000);
        return { allowed: false, retryAfter };
    }

    // Check max attempts by IP
    if (currentIPRecord && currentIPRecord.count >= RATE_LIMIT.MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((currentIPRecord.resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }

    // Check max attempts by email
    if (currentEmailRecord && currentEmailRecord.count >= RATE_LIMIT.MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((currentEmailRecord.resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }

    // Update rate limit records
    const emailCount = currentEmailRecord ? currentEmailRecord.count + 1 : 1;
    const ipCount = currentIPRecord ? currentIPRecord.count + 1 : 1;

    rateLimitStore.set(emailKey, {
        count: emailCount,
        resetTime: currentEmailRecord?.resetTime || (now + RATE_LIMIT.WINDOW_MS),
        lastRequest: now
    });

    rateLimitStore.set(ipKey, {
        count: ipCount,
        resetTime: currentIPRecord?.resetTime || (now + RATE_LIMIT.WINDOW_MS),
        lastRequest: now
    });

    return { allowed: true };
}

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
        const rateCheck = checkRateLimit(normalizedEmail, clientIP);
        if (!rateCheck.allowed) {
            const rateLimitError = await ErrorHandlingService.createError(
                ErrorType.RATE_LIMIT,
                'Too many requests. Please try again later.',
                {
                    severity: ErrorSeverity.LOW,
                    statusCode: 429,
                    metadata: { retryAfter: rateCheck.retryAfter }
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

        // Always return success message to prevent email enumeration
        return formatSuccess({
            message: 'If an account with this email exists and is unverified, a verification email has been sent.',
            canResendAfter: RATE_LIMIT.COOLDOWN_MS / 1000
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

