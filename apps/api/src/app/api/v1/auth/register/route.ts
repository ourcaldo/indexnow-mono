import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { registerSchema, AppConfig } from '@indexnow/shared';
import { 
  publicApiWrapper, 
  formatSuccess, 
  formatError 
} from '../../../../../lib/core/api-response-middleware';
import { 
  ErrorHandlingService, 
  ErrorType, 
  ErrorSeverity 
} from '../../../../../lib/monitoring/error-handling';
import { ActivityLogger, ActivityEventTypes } from '../../../../../lib/monitoring/activity-logger';
import { SecureServiceRoleHelpers } from '@indexnow/database';

/**
 * POST /api/v1/auth/register
 * Handles user registration via Supabase and initializes user profile
 */
export const POST = publicApiWrapper(async (request: NextRequest) => {
  const endpoint = '/api/v1/auth/register';
  const method = 'POST';

  try {
    // 1. Validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Invalid registration data format',
        {
          severity: ErrorSeverity.LOW,
          endpoint,
          method,
          statusCode: 400,
          userMessageKey: 'invalid_format',
          metadata: { errors: validationResult.error.errors }
        }
      );
      return formatError(error);
    }

    const { name, email, password, phoneNumber, country } = validationResult.data;

    // 2. Initialize Supabase client
    const supabase = createServerClient(
      AppConfig.supabase.url,
      AppConfig.supabase.anonKey,
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    // 3. Attempt registration with Supabase
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: name, 
          phone_number: phoneNumber, 
          country 
        } 
      }
    });

    if (authError) {
      // Log failed registration attempt
      await ActivityLogger.logAuth(
        email,
        ActivityEventTypes.REGISTER,
        false,
        request,
        authError.message
      );

      const error = await ErrorHandlingService.createError(
        ErrorType.AUTHENTICATION,
        `Registration failed: ${authError.message}`,
        {
          severity: ErrorSeverity.MEDIUM,
          endpoint,
          method,
          statusCode: 400,
          userMessageKey: 'default',
          metadata: { email, errorCode: authError.code }
        }
      );
      return formatError(error);
    }

    if (!data.user) {
      throw new Error('User creation failed in Supabase');
    }

    const userId = data.user.id;

    // 4. Update user profile with additional details
    // Await the profile update to ensure consistency, removing unreliable setTimeout
    try {
      const operationContext = {
        userId: userId,
        operation: 'registration_profile_update',
        reason: 'Complete user profile after successful registration',
        source: 'auth/register',
        metadata: { hasPhoneNumber: !!phoneNumber, hasCountry: !!country, hasName: !!name },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
      };
      
      // Sanitize and format data
      const updateData = {
        phone_number: phoneNumber?.toString().replace(/[^\d+\-\s\(\)]/g, '') || null,
        country: country?.toString().substring(0, 100) || null,
        full_name: name?.toString().substring(0, 255) || null
      };
      
      await SecureServiceRoleHelpers.secureUpdate(
        operationContext,
        'indb_auth_user_profiles',
        updateData,
        { user_id: userId }
      );
    } catch (profileError) {
      console.error('Failed to update user profile during registration:', profileError);
      // We don't throw here to avoid failing the registration if the user was created
    }

    // 5. Log successful registration activity
    await ActivityLogger.logAuth(
      userId,
      ActivityEventTypes.REGISTER,
      true,
      request
    );

    // 6. Return success response
    return formatSuccess({
      user: {
        id: userId,
        email: data.user.email,
        role: data.user.role
      },
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      } : null,
      message: 'Registration successful. Please check your email to verify your account.'
    }, undefined, 201);

  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.CRITICAL,
        endpoint,
        method,
        statusCode: 500,
        userMessageKey: 'default',
        metadata: { operation: 'user_registration' }
      }
    );
    return formatError(structuredError);
  }
});
