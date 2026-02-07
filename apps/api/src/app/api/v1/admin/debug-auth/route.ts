import { NextRequest } from 'next/server';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { adminApiWrapper, formatSuccess } from '../../../../../../lib/core/api-response-middleware';
import { logger } from '../../../../../../lib/monitoring/error-handling';

interface UserProfile {
    user_id: string;
    full_name: string;
    role: string;
    email_notifications: boolean;
    updated_at: string;
}

export const GET = adminApiWrapper(async (request: NextRequest, adminUser) => {
    if (!adminUser) {
        return formatSuccess({
            error: 'Not authenticated',
            currentUser: null,
            profile: null
        });
    }

    // Get user profile using secure wrapper
    let profile: UserProfile | null = null;
    let profileError: { message: string } | null = null;

    try {
        const profileContext = {
            userId: adminUser.id,
            operation: 'admin_debug_get_profile',
            reason: 'Admin debug functionality fetching user profile for debugging',
            source: 'admin/debug-auth',
            metadata: {
                targetUserId: adminUser.id,
                endpoint: '/api/v1/admin/debug-auth'
            },
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
        };

        profile = await SecureServiceRoleWrapper.executeSecureOperation<UserProfile>(
            profileContext,
            {
                table: 'indb_auth_user_profiles',
                operationType: 'select',
                columns: ['*'],
                whereConditions: { user_id: adminUser.id }
            },
            async () => {
                const { data, error } = await supabaseAdmin
                    .from('indb_auth_user_profiles')
                    .select('*')
                    .eq('user_id', adminUser.id)
                    .single();

                if (error) {
                    throw new Error(`Failed to fetch user profile: ${error.message}`);
                }

                return data as UserProfile;
            }
        );
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching profile in debug route:');
        profileError = { message: error instanceof Error ? error.message : String(error) };
    }

    return formatSuccess({
        currentUser: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name
        },
        profile: profile || 'No profile found',
        profileError: profileError ? profileError.message : null,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

export const POST = adminApiWrapper(async (request: NextRequest, adminUser) => {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return formatSuccess({
            error: 'This endpoint is only available in development mode'
        });
    }

    const { targetUserId } = await request.json();

    // Use provided target user ID or admin user ID
    const userIdToEscalate = targetUserId || adminUser.id;

    // Update or create user profile with super_admin role using secure wrapper
    const escalationContext = {
        userId: adminUser.id,
        operation: 'admin_debug_escalate_privileges',
        reason: 'Admin debug functionality escalating user privileges to super_admin',
        source: 'admin/debug-auth',
        metadata: {
            targetUserId: userIdToEscalate,
            newRole: 'super_admin',
            endpoint: '/api/v1/admin/debug-auth'
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
    };

    const escalationData = {
        user_id: userIdToEscalate,
        full_name: adminUser.name || adminUser.email?.split('@')[0] || 'Admin User',
        role: 'super_admin',
        email_notifications: true,
        updated_at: new Date().toISOString()
    };

    const profile = await SecureServiceRoleWrapper.executeSecureOperation<UserProfile>(
        escalationContext,
        {
            table: 'indb_auth_user_profiles',
            operationType: 'update',
            data: escalationData
        },
        async () => {
            const { data, error } = await supabaseAdmin
                .from('indb_auth_user_profiles')
                .upsert(escalationData, {
                    onConflict: 'user_id'
                })
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to update profile: ${error.message}`);
            }

            return data as UserProfile;
        }
    );

    // Log the privilege escalation for audit purposes
    logger.info({
        performedBy: adminUser.id,
        targetUser: userIdToEscalate,
        timestamp: new Date().toISOString(),
        environment: 'development'
    }, '⚠️ [SECURITY] Privilege escalation performed in development');

    return formatSuccess({
        message: 'Profile updated to super_admin (development only)',
        profile,
        warning: 'This operation is only allowed in development environment'
    });
});
