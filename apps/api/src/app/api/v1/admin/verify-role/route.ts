import { NextRequest } from 'next/server'
import { adminApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'

/**
 * GET /api/v1/admin/verify-role
 * Verifies if the authenticated user has super_admin privileges.
 * This is used by the Admin app middleware to enforce access control.
 */
export const GET = adminApiWrapper(async (request: NextRequest, user) => {
  // Return role information
  return formatSuccess({
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin,
    role: user.role,
    name: user.name || 'Admin User'
  })
})
