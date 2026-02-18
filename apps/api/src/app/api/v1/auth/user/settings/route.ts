import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper, asTypedClient } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';

// Valid schedule types matching the database enum
const scheduleEnumSchema = z.enum(['one-time', 'hourly', 'daily', 'weekly', 'monthly']);

// User-facing settings schema (excludes legacy Google Indexing fields)
const updateUserSettingsSchema = z.object({
  email_job_completion: z.boolean().optional(),
  email_job_failure: z.boolean().optional(),
  email_quota_alerts: z.boolean().optional(),
  default_schedule: scheduleEnumSchema.optional(),
  email_daily_report: z.boolean().optional(),
});

/**
 * GET /api/v1/auth/user/settings
 * Get current user settings (creates defaults if not exists)
 */
export const GET = authenticatedApiWrapper(async (request, auth) => {
  try {
    const settings = await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'get_user_settings',
        source: 'auth/user/settings',
        reason: 'User retrieving their own settings for display',
        metadata: { endpoint: '/api/v1/auth/user/settings', method: 'GET' },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
      { table: 'indb_auth_user_settings', operationType: 'select' },
      async (db) => {
        const { data: settings, error: settingsError } = await db
          .from('indb_auth_user_settings')
          .select('*')
          .eq('user_id', auth.userId)
          .single();

        if (settingsError) {
          if (settingsError.code === 'PGRST116') {
            // No settings found - create defaults (legacy fields use DB defaults)
            const { data: newSettings, error: createError } = await db
              .from('indb_auth_user_settings')
              .insert({
                user_id: auth.userId,
                email_job_completion: true,
                email_job_failure: true,
                email_quota_alerts: true,
                default_schedule: 'one-time',
                email_daily_report: true,
              })
              .select()
              .single();

            if (createError) throw new Error('Failed to create default settings');
            return newSettings;
          }
          throw new Error('Failed to fetch settings');
        }
        return settings;
      }
    );

    return formatSuccess({ settings });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/auth/user/settings',
        method: 'GET',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});

/**
 * PUT /api/v1/auth/user/settings
 * Update user settings
 */
export const PUT = authenticatedApiWrapper(async (request, auth) => {
  try {
    const body = await request.json();
    const validation = updateUserSettingsSchema.safeParse(body);

    if (!validation.success) {
      const validationError = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Invalid input',
        {
          severity: ErrorSeverity.LOW,
          userId: auth.userId,
          statusCode: 400,
          metadata: { details: validation.error.errors },
        }
      );
      return formatError(validationError);
    }

    const settings = await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'update_user_settings',
        source: 'auth/user/settings',
        reason: 'User updating their own settings',
        metadata: {
          endpoint: '/api/v1/auth/user/settings',
          method: 'PUT',
          updatedFields: Object.keys(validation.data),
        },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
      { table: 'indb_auth_user_settings', operationType: 'update' },
      async (db) => {
        const { data: settings, error: updateError } = await db
          .from('indb_auth_user_settings')
          .update({
            ...validation.data,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', auth.userId)
          .select()
          .single();

        if (updateError) throw new Error('Failed to update settings');
        return settings;
      }
    );

    return formatSuccess({ settings, message: 'Settings updated successfully' });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/auth/user/settings',
        method: 'PUT',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
