import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SecureServiceRoleWrapper, createServerClient, asTypedClient } from '@indexnow/database';
import { AppConfig, ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';
import { publicApiWrapper } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

/**
 * Get base domain for cross-subdomain cookie sharing
 */
function getBaseDomain(): string {
  try {
    return new URL(AppConfig.app.baseUrl).hostname;
  } catch {
    /* URL parse fallback */
    return '';
  }
}

/**
 * GET /api/v1/auth/verify
 * Supabase Email Verification Route
 * Handles verification URLs from Supabase with different types:
 * - type=signup: Email confirmation for new registration
 * - type=recovery: Password reset verification
 * - type=magiclink: Magic link authentication
 *
 * Note: This route returns redirects (not JSON) as it's accessed via email links
 */
export const GET = publicApiWrapper(async (request: NextRequest) => {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get('token_hash') ?? searchParams.get('token');
  const type = searchParams.get('type');
  const rawRedirectTo = searchParams.get('redirect_to') ?? '/dashboard';
  // Ensure redirect URL is a safe path (starts with /) to prevent open redirects
  const redirectTo = rawRedirectTo.startsWith('/') ? rawRedirectTo : '/dashboard';

  // Validate required parameters
  if (!token) {
    await ErrorHandlingService.createError(ErrorType.VALIDATION, 'Missing verification token', {
      severity: ErrorSeverity.MEDIUM,
      statusCode: 400,
      userMessageKey: 'missing_required',
      endpoint: '/api/v1/auth/verify',
      method: 'GET',
    });
    // Return redirect with error (verification routes redirect, not JSON)
    return NextResponse.redirect(`${origin}/login?error=missing_verification_token`);
  }

  if (!type) {
    await ErrorHandlingService.createError(ErrorType.VALIDATION, 'Missing verification type', {
      severity: ErrorSeverity.MEDIUM,
      statusCode: 400,
      userMessageKey: 'missing_required',
      endpoint: '/api/v1/auth/verify',
      method: 'GET',
    });
    return NextResponse.redirect(`${origin}/login?error=missing_verification_type`);
  }

  const cookieStore = await cookies();
  const baseDomain = getBaseDomain();

  const supabase = createServerClient(
    cookieStore,
    baseDomain ? { domain: `.${baseDomain}` } : undefined
  );

  try {
    // Handle different verification types
    switch (type) {
      case 'signup': {
        // Handle email confirmation for new registration using secure wrapper
        try {
          await SecureServiceRoleWrapper.executeWithUserSession(
            asTypedClient(supabase),
            {
              userId: 'pending_verification',
              operation: 'verify_otp_signup',
              source: 'auth/verify',
              reason: 'User email verification for account signup',
              metadata: {
                endpoint: '/api/v1/auth/verify',
                verificationType: 'signup',
                hasToken: !!token,
                redirectTo,
                tokenType: 'token_hash',
              },
              ipAddress: getClientIP(request),
              userAgent: request.headers.get('user-agent') || undefined,
            },
            { table: 'auth.users', operationType: 'update' },
            async (db) => {
              const { error } = await db.auth.verifyOtp({
                token_hash: token,
                type: 'signup',
              });

              if (error) {
                throw new Error(`Email verification failed: ${error.message}`);
              }
              return { success: true };
            }
          );

          // Successful email verification - redirect to dashboard
          return NextResponse.redirect(`${origin}/dashboard?message=email_verified`);
        } catch (error) {
          await ErrorHandlingService.createError(
            ErrorType.AUTHENTICATION,
            error instanceof Error ? error : new Error(String(error)),
            {
              severity: ErrorSeverity.MEDIUM,
              statusCode: 400,
              userMessageKey: 'default',
              endpoint: '/api/v1/auth/verify',
              method: 'GET',
              metadata: { verificationType: 'signup' },
            }
          );
          return NextResponse.redirect(`${origin}/login?error=email_verification_failed`);
        }
      }

      case 'recovery': {
        // Handle password reset verification using secure wrapper
        try {
          await SecureServiceRoleWrapper.executeWithUserSession(
            asTypedClient(supabase),
            {
              userId: 'pending_verification',
              operation: 'verify_otp_recovery',
              source: 'auth/verify',
              reason: 'User password recovery verification',
              metadata: {
                endpoint: '/api/v1/auth/verify',
                verificationType: 'recovery',
                hasToken: !!token,
                redirectTo,
                tokenType: 'token_hash',
              },
              ipAddress: getClientIP(request),
              userAgent: request.headers.get('user-agent') || undefined,
            },
            { table: 'auth.users', operationType: 'update' },
            async (db) => {
              const { error } = await db.auth.verifyOtp({
                token_hash: token,
                type: 'recovery',
              });

              if (error) {
                throw new Error(`Password recovery verification failed: ${error.message}`);
              }
              return { success: true };
            }
          );

          // Successful password reset verification - redirect to reset password page
          return NextResponse.redirect(`${origin}/reset-password`);
        } catch (error) {
          await ErrorHandlingService.createError(
            ErrorType.AUTHENTICATION,
            error instanceof Error ? error : new Error(String(error)),
            {
              severity: ErrorSeverity.MEDIUM,
              statusCode: 400,
              userMessageKey: 'default',
              endpoint: '/api/v1/auth/verify',
              method: 'GET',
              metadata: { verificationType: 'recovery' },
            }
          );
          return NextResponse.redirect(`${origin}/login?error=recovery_verification_failed`);
        }
      }

      case 'magiclink': {
        // Handle magic link authentication using secure wrapper
        try {
          await SecureServiceRoleWrapper.executeWithUserSession(
            asTypedClient(supabase),
            {
              userId: 'pending_verification',
              operation: 'verify_otp_magiclink',
              source: 'auth/verify',
              reason: 'User magic link authentication verification',
              metadata: {
                endpoint: '/api/v1/auth/verify',
                verificationType: 'magiclink',
                hasToken: !!token,
                redirectTo,
                tokenType: 'token_hash',
              },
              ipAddress: getClientIP(request),
              userAgent: request.headers.get('user-agent') || undefined,
            },
            { table: 'auth.users', operationType: 'update' },
            async (db) => {
              const { error } = await db.auth.verifyOtp({
                token_hash: token,
                type: 'magiclink',
              });

              if (error) {
                throw new Error(`Magic link verification failed: ${error.message}`);
              }
              return { success: true };
            }
          );

          // Successful magic link authentication - redirect to requested page or dashboard
          return NextResponse.redirect(`${origin}${redirectTo}`);
        } catch (error) {
          await ErrorHandlingService.createError(
            ErrorType.AUTHENTICATION,
            error instanceof Error ? error : new Error(String(error)),
            {
              severity: ErrorSeverity.MEDIUM,
              statusCode: 400,
              userMessageKey: 'default',
              endpoint: '/api/v1/auth/verify',
              method: 'GET',
              metadata: { verificationType: 'magiclink' },
            }
          );
          return NextResponse.redirect(`${origin}/login?error=magiclink_verification_failed`);
        }
      }

      default: {
        await ErrorHandlingService.createError(
          ErrorType.VALIDATION,
          `Unknown verification type: ${type}`,
          {
            severity: ErrorSeverity.MEDIUM,
            statusCode: 400,
            userMessageKey: 'invalid_format',
            endpoint: '/api/v1/auth/verify',
            method: 'GET',
            metadata: { verificationType: type },
          }
        );
        return NextResponse.redirect(`${origin}/login?error=unknown_verification_type`);
      }
    }
  } catch (error) {
    await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        statusCode: 500,
        userMessageKey: 'default',
        endpoint: '/api/v1/auth/verify',
        method: 'GET',
      }
    );
    return NextResponse.redirect(`${origin}/login?error=verification_exception`);
  }
});
