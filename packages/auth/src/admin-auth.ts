import { supabase as _supabase, authService, type Json, type Database, logger } from '@indexnow/shared'
import type { SupabaseClient } from '@indexnow/database'

// Re-assert the Database generic lost through the external package re-export chain during DTS generation
const supabase = _supabase as unknown as SupabaseClient<Database>

// AdminUser type is now defined in server-auth.ts and exported from index.ts

/**
 * Client-side admin auth service.
 * Uses the browser Supabase client (cookies) to check the current user's role.
 */
export class AdminAuthService {
  /**
   * Get current user with admin role information (client-side)
   */
  async getCurrentAdminUser() {
    try {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) {
        return null
      }

      try {
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
      } catch {
        // Silent failure for profile fetch
      }

      return null
    } catch {
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

      // Dynamic import to avoid pulling server-only modules into client bundle
      const { SecureServiceRoleHelpers } = await import('@indexnow/database')

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
      console.error('[AdminAuth] Failed to log admin activity:', error instanceof Error ? error.message : String(error))
      // (#36) Also log via shared logger for structured monitoring
      logger.error({ error: error instanceof Error ? error : undefined }, '[AdminAuth] Failed to log admin activity')
    }
  }
}

export const adminAuthService = new AdminAuthService()
