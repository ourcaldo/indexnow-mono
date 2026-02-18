import {
  SecureServiceRoleHelpers,
  SecureServiceRoleWrapper,
  supabaseAdmin,
  type Json,
} from '@indexnow/database';
import { NextRequest } from 'next/server';
import {
  adminApiWrapper,
  createStandardError,
  formatError,
} from '@/lib/core/api-response-middleware';
import { formatSuccess } from '@/lib/core/api-response-formatter';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';
import { logger } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';
import { z } from 'zod';

export const GET = adminApiWrapper(async (request: NextRequest, adminUser, context) => {
  const { id: userId } = (await context.params) as Record<string, string>;

  const operationContext = {
    userId: adminUser.id,
    operation: 'admin_get_user_profile',
    reason: `Admin fetching detailed user profile for user ID: ${userId}`,
    source: 'admin/users/[id]',
    metadata: {
      requestedUserId: userId,
      includePackageInfo: true,
      endpoint: '/api/v1/admin/users/[id]',
    },
    ipAddress: getClientIP(request) ?? 'unknown',
    userAgent: request.headers.get('user-agent') || undefined || 'unknown',
  };

  const profileWithPackage = await SecureServiceRoleWrapper.executeSecureOperation(
    operationContext,
    {
      table: 'indb_auth_user_profiles',
      operationType: 'select',
      columns: ['*'],
      whereConditions: { user_id: userId },
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('indb_auth_user_profiles')
        .select(
          `
          *,
          package:indb_payment_packages(
            id,
            name,
            slug,
            description,
            pricing_tiers,
            currency,
            billing_period,
            features,
            quota_limits,
            is_active
          )
        `
        )
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    }
  );

  if (!profileWithPackage) {
    logger.error(
      {
        userId: adminUser.id,
        endpoint: '/api/v1/admin/users/[id]',
        method: 'GET',
        targetUserId: userId,
      },
      'Admin user lookup - Profile not found for user'
    );

    return formatError(
      await createStandardError(ErrorType.NOT_FOUND, 'User not found', {
        statusCode: 404,
        severity: ErrorSeverity.MEDIUM,
        metadata: { userId },
      })
    );
  }

  const profile = profileWithPackage;

  let authUser = null;

  try {
    const authContext = {
      userId: adminUser.id,
      operation: 'admin_get_user_auth_details',
      reason: 'Admin fetching user auth details for profile display',
      source: 'admin/users/[id]',
      metadata: {
        targetUserId: userId,
        endpoint: '/api/v1/admin/users/[id]',
      },
    };

    authUser = await SecureServiceRoleWrapper.executeSecureOperation(
      authContext,
      {
        table: 'auth.users',
        operationType: 'select',
        columns: ['id', 'email', 'email_confirmed_at', 'created_at', 'last_sign_in_at'],
        whereConditions: { id: userId },
      },
      async () => {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (error || !data?.user) {
          throw error || new Error('User not found');
        }
        return data;
      }
    );
  } catch (error) {
    logger.error(
      {
        userId: adminUser.id,
        endpoint: '/api/v1/admin/users/[id]',
        method: 'GET',
        targetUserId: userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Auth user fetch error'
    );
  }

  const userWithAuthData = {
    ...profile,
    email: authUser?.user?.email || null,
    email_confirmed_at: authUser?.user?.email_confirmed_at || null,
    last_sign_in_at: authUser?.user?.last_sign_in_at || null,
  };

  await ActivityLogger.logAdminAction(
    adminUser.id,
    'user_profile_view',
    userId,
    `Viewed detailed profile for ${profile.full_name || authUser?.user?.email || 'User'}`,
    request,
    {
      profileView: true,
      userRole: profile.role,
      userEmail: authUser?.user?.email,
      lastSignIn: authUser?.user?.last_sign_in_at,
    }
  );

  return formatSuccess({ user: userWithAuthData });
});

const updateUserSchema = z
  .object({
    full_name: z.string().max(200).optional(),
    role: z.enum(['user', 'admin', 'super_admin']).optional(),
    email_notifications: z.boolean().optional(),
    phone_number: z
      .string()
      .max(20)
      .regex(/^[+\d\s()-]*$/, 'Invalid phone number format')
      .optional(),
    status: z.enum(['active', 'suspended']).optional(),
  })
  .strict();

export const PATCH = adminApiWrapper(async (request: NextRequest, adminUser, context) => {
  const { id: userId } = (await context.params) as Record<string, string>;
  const body = await request.json();
  const parseResult = updateUserSchema.safeParse(body);
  if (!parseResult.success) {
    return formatError(
      await createStandardError(
        ErrorType.VALIDATION,
        parseResult.error.errors[0]?.message || 'Invalid request body',
        { statusCode: 400, severity: ErrorSeverity.LOW }
      )
    );
  }
  const { full_name, role, email_notifications, phone_number, status } = parseResult.data;

  if (status === 'suspended' || status === 'active') {
    const isSuspending = status === 'suspended';
    const banDuration = isSuspending ? '10000h' : 'none';
    const action = isSuspending ? 'ban' : 'unban';

    const statusUpdateContext = {
      userId: adminUser.id,
      operation: isSuspending ? 'admin_suspend_user' : 'admin_unsuspend_user',
      reason: `Admin ${isSuspending ? 'suspending' : 'unsuspending'} user account via profile update`,
      source: 'admin/users/[id]',
      metadata: {
        targetUserId: userId,
        suspensionAction: action,
        banDuration,
        endpoint: '/api/v1/admin/users/[id]',
      },
      ipAddress: getClientIP(request) ?? 'unknown',
      userAgent: request.headers.get('user-agent') || undefined || 'unknown',
    };

    await SecureServiceRoleWrapper.executeSecureOperation(
      statusUpdateContext,
      {
        table: 'supabase_auth_users',
        operationType: 'update',
        whereConditions: { id: userId },
      },
      async () => {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: banDuration,
        });
        if (error) throw error;
        return { success: true };
      }
    );

    await ActivityLogger.logAdminAction(
      adminUser.id,
      isSuspending ? 'suspend' : 'unsuspend',
      userId,
      `${isSuspending ? 'Suspended' : 'Unsuspended'} user ${full_name || 'User'}`,
      request,
      {
        suspensionAction: true,
        action,
        newStatus: status,
      }
    );
  }

  const currentProfile = await SecureServiceRoleHelpers.secureSelect(
    {
      userId: adminUser.id,
      operation: 'get_current_user_profile',
      reason: `Getting current profile before update for user: ${userId}`,
      source: 'admin/users/[id]',
      metadata: { requestedUserId: userId },
    },
    'indb_auth_user_profiles',
    ['role', 'full_name'],
    { user_id: userId }
  );

  const updateOperationContext = {
    userId: adminUser.id,
    operation: 'admin_update_user_profile',
    reason: `Admin updating user profile for user ID: ${userId}`,
    source: 'admin/users/[id]',
    metadata: {
      requestedUserId: userId,
      updatedFields: { full_name, role, email_notifications, phone_number },
      roleChanged: currentProfile.length > 0 ? currentProfile[0].role !== role : false,
      endpoint: '/api/v1/admin/users/[id]',
    } as Record<string, Json>,
    ipAddress: getClientIP(request) ?? 'unknown',
    userAgent: request.headers.get('user-agent') || undefined || 'unknown',
  };

  const updateData = {
    full_name,
    role,
    email_notifications,
    phone_number,
    updated_at: new Date().toISOString(),
  };

  const updatedProfiles = await SecureServiceRoleHelpers.secureUpdate(
    updateOperationContext,
    'indb_auth_user_profiles',
    updateData,
    { user_id: userId }
  );

  if (!updatedProfiles || updatedProfiles.length === 0) {
    logger.error(
      {
        userId: adminUser.id,
        endpoint: '/api/v1/admin/users/[id]',
        method: 'PATCH',
        targetUserId: userId,
      },
      'Profile update failed - no rows returned'
    );

    return formatError(
      await createStandardError(ErrorType.DATABASE, 'Failed to update user profile', {
        statusCode: 500,
        severity: ErrorSeverity.HIGH,
        metadata: { userId },
      })
    );
  }

  const updatedProfile = updatedProfiles[0];

  await ActivityLogger.logAdminAction(
    adminUser.id,
    'profile_update',
    userId,
    `Updated profile for ${full_name || 'User'} - Role: ${role}`,
    request,
    {
      profileUpdate: true,
      updatedFields: { full_name, role, email_notifications, phone_number },
      newRole: role,
      previousRole: currentProfile.length > 0 ? currentProfile[0].role : 'unknown',
      roleChanged: currentProfile.length > 0 ? currentProfile[0].role !== role : false,
    }
  );

  return formatSuccess({ user: updatedProfile }, undefined, 202);
});
