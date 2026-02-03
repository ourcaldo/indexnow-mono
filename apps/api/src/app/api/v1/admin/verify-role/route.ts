import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdminAuth } from '@indexnow/auth'
import { logger } from '@indexnow/shared'

/**
 * GET /api/v1/admin/verify-role
 * Verifies if the authenticated user has super_admin privileges.
 * This is used by the Admin app middleware to enforce access control.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify super admin access
    const adminUser = await requireSuperAdminAuth(request)

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Super admin access required' },
        { status: 403 }
      )
    }

    // 2. Return role information
    return NextResponse.json({
      success: true,
      data: {
        isAdmin: adminUser.isAdmin,
        isSuperAdmin: adminUser.isSuperAdmin,
        role: adminUser.role,
        name: adminUser.name || 'Admin User'
      }
    })
  } catch (error) {
    logger.error({ error }, 'Error in verify-role endpoint')
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message === 'Super admin access required') {
      return NextResponse.json(
        { error: 'Forbidden', message: error.message },
        { status: 403 }
      )
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden', message: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to verify admin role' },
      { status: 500 }
    )
  }
}
