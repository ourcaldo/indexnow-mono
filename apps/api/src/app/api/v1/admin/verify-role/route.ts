import { NextRequest } from 'next/server'
import { adminApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'
import { AdminUser } from '@indexnow/auth'

/**
 * GET /api/v1/admin/verify-role
 * Verifies if the authenticated user has super_admin privileges.
 * This is used by the Admin app middleware to enforce access control.
 */
export const GET = adminApiWrapper(async (request: NextRequest, user) => {
  // adminApiWrapper types user as { id: string; email: string }, but it actually contains the full AdminUser object
  const adminUser = user as unknown as AdminUser

  // Return role information
  return formatSuccess({
    isAdmin: adminUser.isAdmin,
    isSuperAdmin: adminUser.isSuperAdmin,
    role: adminUser.role,
    name: adminUser.name || 'Admin User'
  })
})
