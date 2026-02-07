import { supabaseAdmin, supabase, SecureServiceRoleWrapper, SecureServiceRoleHelpers, type UserProfile, type Database } from '@indexnow/database'
import { authService, type Json, AppConfig } from '@indexnow/shared'
import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'

export interface AdminUser {
  id: string
  email: string | undefined
  name?: string
  role: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

// Define the partial profile type for role verification to ensure we only access what we requested
type AdminProfileData = Pick<UserProfile, 'role' | 'full_name'>

export class AdminAuthService {
  /**
   * Get current user with admin role information
   */
  async getCurrentAdminUser(): Promise<AdminUser | null> {
    try {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) {
        return null
      }

      // Try to get user profile with role information using direct API call
      try {
        // Use Supabase client instead of direct REST API call
        const { data: profiles, error } = await supabase
          .from('indb_auth_user_profiles')
          .select('role, full_name')
          .eq('user_id', currentUser.id)
          .limit(1)

        if (!error && profiles && profiles.length > 0) {
          const profile = profiles[0]
          const role = profile.role || 'user'
          return {
            id: currentUser.id,
            email: currentUser.email,
            name: profile.full_name || currentUser.name,
            role,
            isAdmin: role === 'admin' || role === 'super_admin',
            isSuperAdmin: role === 'super_admin'
          }
        }
      } catch (apiError) {
        // Silent failure for profile fetch
      }

      // No profile found and no fallback - return null for security
      return null

    } catch (error) {
      return null
    }
  }

  /**
   * Check if current user has admin access
   */
  async hasAdminAccess(): Promise<boolean> {
    const adminUser = await this.getCurrentAdminUser()
    return adminUser?.isAdmin || false
  }

  /**
   * Check if current user has super admin access
   */
  async hasSuperAdminAccess(): Promise<boolean> {
    const adminUser = await this.getCurrentAdminUser()
    return adminUser?.isSuperAdmin || false
  }

  /**
   * Log admin activity
   */
  async logAdminActivity(
    actionType: string,
    actionDescription: string,
    targetType?: string,
    targetId?: string,
    metadata?: Record<string, Json>
  ): Promise<void> {
    try {
      const adminUser = await this.getCurrentAdminUser()
      if (!adminUser?.isAdmin) {
        return
      }

      const logContext = {
        userId: adminUser.id,
        operation: 'admin_log_activity',
        reason: 'Logging admin activity for audit trail',
        source: 'lib/auth/admin-auth',
        metadata: {
          actionType,
          actionDescription,
          targetType: targetType || null,
          targetId: targetId || null,
          originalMetadata: JSON.stringify(metadata || {})
        }
      }

      await SecureServiceRoleHelpers.secureInsert(
        logContext,
        'indb_admin_activity_logs',
        {
          admin_id: adminUser.id,
          action_type: actionType,
          action_description: actionDescription,
          target_type: targetType || null,
          target_id: targetId || null,
          metadata: metadata || {}
        }
      )
    } catch (error) {
      // Fail silently for logging errors to not block main flow
    }
  }
}

export const adminAuthService = new AdminAuthService()

/**
 * Get authenticated user from server-side API route with admin role information
 */
async function getServerAdminUser(request?: NextRequest): Promise<AdminUser | null> {
  try {
    if (!request) {
      return null
    }

    // Try to get JWT token from Authorization header first
    const authHeader = request.headers.get('authorization')
    let user: { id: string; email?: string } | null = null
    let userError: Error | { message: string } | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7) // Remove 'Bearer ' prefix

      // Verify JWT token using secure service role wrapper
      try {
        const authContext = {
          userId: 'system',
          operation: 'verify_admin_auth_token',
          reason: 'Admin auth service verifying user authentication token',
          source: 'lib/auth/admin-auth',
          metadata: {
            hasToken: !!token,
            tokenLength: token?.length ? token.length : 0
          }
        };

        const authResult = await SecureServiceRoleWrapper.executeSecureOperation<{ id: string; email?: string }>(
          authContext,
          {
            table: 'auth.users',
            operationType: 'select',
            columns: ['id', 'email'],
            whereConditions: { token }
          },
          async () => {
            const { data: userData, error: tokenError } = await supabaseAdmin.auth.getUser(token);
            if (tokenError || !userData?.user) {
              throw new Error(tokenError?.message || 'Invalid or expired token');
            }
            return userData.user;
          }
        );

        user = authResult;
        userError = null;

      } catch (error) {
        user = null;
        userError = error instanceof Error ? error : { message: String(error) };
      }
    }

    // Fallback to cookies if no valid Bearer token
    if (!user) {
      // Create Supabase client using request cookies
      const supabaseServer = createServerClient(
        AppConfig.supabase.url,
        AppConfig.supabase.anonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // Cannot set cookies in API routes
            },
          },
        }
      )

      const { data: { user: cookieUser }, error: cookieError } = await supabaseServer.auth.getUser()
      user = cookieUser
      userError = cookieError
    }

    if (userError || !user) {
      return null
    }


    // Get user profile with role information using secure wrapper
    let profile: AdminProfileData | null = null
    try {
      const profileContext = {
        userId: 'system',
        operation: 'get_user_profile_for_auth',
        reason: 'Server-side auth checking user profile for role verification',
        source: 'lib/auth/admin-auth',
        metadata: {
          targetUserId: user.id,
          authType: 'profile_lookup'
        }
      }

      // Explicitly type the expected return and the table being accessed
      profile = await SecureServiceRoleWrapper.executeSecureOperation<AdminProfileData, 'indb_auth_user_profiles'>(
        profileContext,
        {
          table: 'indb_auth_user_profiles',
          operationType: 'select',
          columns: ['role', 'full_name'],
          whereConditions: { user_id: user.id }
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_auth_user_profiles')
            .select('role, full_name')
            .eq('user_id', user.id)
            .single()

          if (error) {
            throw new Error(`Failed to get user profile: ${error.message}`)
          }

          // Safe cast because we explicitly selected these fields
          return data as AdminProfileData
        }
      )
    } catch (error) {
      return null
    }

    if (!profile) {
      return null
    }

    const isAdmin = profile.role === 'admin' || profile.role === 'super_admin'
    const isSuperAdmin = profile.role === 'super_admin'

    return {
      id: user.id,
      email: user.email,
      name: profile.full_name || undefined,
      role: profile.role || 'user',
      isAdmin,
      isSuperAdmin
    }

  } catch (error: unknown) {
    return null
  }
}

/**
 * Middleware for admin route protection (server-side)
 */
export async function requireAdminAuth(request?: NextRequest): Promise<AdminUser | null> {
  const serverAdminUser = await getServerAdminUser(request)
  if (!serverAdminUser?.isAdmin) {
    throw new Error('Admin access required')
  }

  return serverAdminUser
}

/**
 * Middleware for super admin route protection (server-side)
 */
export async function requireSuperAdminAuth(request?: NextRequest): Promise<AdminUser | null> {
  const serverAdminUser = await getServerAdminUser(request)
  if (!serverAdminUser?.isSuperAdmin) {
    throw new Error('Super admin access required')
  }

  return serverAdminUser
}
