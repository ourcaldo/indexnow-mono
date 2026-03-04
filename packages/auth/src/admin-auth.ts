import { authService, authenticatedFetch } from '@indexnow/supabase-client';
import { type Json, logger, AUTH_ENDPOINTS } from '@indexnow/shared';

/**
 * Client-side admin auth service.
 * Uses API proxy calls (never direct DB queries) to check admin role.
 */
export class AdminAuthService {
  /**
   * Get current user with admin role information (client-side)
   * Routes through AUTH_ENDPOINTS.PROFILE — no direct Supabase DB calls.
   */
  async getCurrentAdminUser() {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return null;
      }

      try {
        // Fetch profile via API proxy — includes role and full_name
        const response = await authenticatedFetch(AUTH_ENDPOINTS.PROFILE);
        if (!response.ok) return null;

        const result = await response.json();
        const profile = result?.data?.profile;
        if (!profile) return null;

        const role = profile.role || 'user';
        return {
          id: currentUser.id,
          email: currentUser.email,
          name: profile.full_name || currentUser.name,
          role,
          isAdmin: role === 'admin' || role === 'super_admin',
          isSuperAdmin: role === 'super_admin',
        };
      } catch (err) {
        logger.warn(
          { error: err instanceof Error ? err : undefined },
          'Failed to fetch admin profile'
        );
      }

      return null;
    } catch (err) {
      logger.warn({ error: err instanceof Error ? err : undefined }, 'Admin auth check failed');
      return null;
    }
  }

  /**
   * Check if current user has admin access
   */
  async hasAdminAccess(): Promise<boolean> {
    const adminUser = await this.getCurrentAdminUser();
    return adminUser?.isAdmin || false;
  }

  /**
   * Check if current user has super admin access
   */
  async hasSuperAdminAccess(): Promise<boolean> {
    const adminUser = await this.getCurrentAdminUser();
    return adminUser?.isSuperAdmin || false;
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
      const adminUser = await this.getCurrentAdminUser();
      if (!adminUser?.isAdmin) {
        return;
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
          originalMetadata: JSON.stringify(metadata || {}),
        },
      };

      // (#V7 H-09) Dynamic import to avoid pulling server-only modules into client bundle.
      // This is intentional — logAdminActivity is only called from server-side routes.
      // The service-role key is only available server-side and never sent to the browser.
      const { SecureServiceRoleHelpers } = await import('@indexnow/database');

      await SecureServiceRoleHelpers.secureInsert(logContext, 'indb_admin_activity_logs', {
        admin_id: adminUser.id,
        action_type: actionType,
        action_description: actionDescription,
        target_type: targetType || null,
        target_id: targetId || null,
        metadata: metadata || {},
      });
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        '[AdminAuth] Failed to log admin activity'
      );
    }
  }
}

export const adminAuthService = new AdminAuthService();
