/**
 * Server-side Authentication Utilities
 * Provides authentication functions for API routes and server components
 */

import 'server-only'
import { NextRequest } from 'next/server'
import { createRequestAuthClient, SecureServiceRoleHelpers } from '@indexnow/database'
import { AppConfig, logger } from '@indexnow/shared'

// Define types
export interface ServerAdminUser {
  id: string
  email: string
  name?: string
  role: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

/** @deprecated Use `ServerAdminUser` — kept as alias for backward compatibility */
export type AdminUser = ServerAdminUser

interface UserProfileRole {
  role: string
  full_name: string | null
}

/**
 * Get server-side admin user from request using proper Supabase server client
 */
export async function getServerAdminUser(
  request?: NextRequest,
  options: { forceHeaderAuth?: boolean } = {}
): Promise<ServerAdminUser | null> {
  try {
    if (!request) {
      return null
    }

    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    const forceHeader = options.forceHeaderAuth || isStateChanging;

    const authHeader = request.headers.get('authorization')
    const hasBearer = authHeader && authHeader.startsWith('Bearer ')

    // Create Supabase client using centralized factory
    const supabase = createRequestAuthClient(request, { forceHeaderAuth: forceHeader })

    let user = null;
    let authError = null;

    // 1. Try Authorization header first
    if (hasBearer) {
      const token = authHeader!.substring(7)
      const result = await supabase.auth.getUser(token)
      user = result.data.user
      authError = result.error
    }

    // 2. Fallback to cookies
    if (!user && !forceHeader) {
      const result = await supabase.auth.getUser()
      user = result.data.user
      authError = result.error
    }

    if (authError || !user) {
      return null
    }

    // Get user profile from database using secure wrapper
    const authContext = {
      userId: user.id,
      operation: 'get_user_profile_for_admin_auth',
      reason: 'Server admin auth getting user role for admin authorization check',
      source: '@indexnow/auth.getServerAdminUser',
      metadata: {
        authMethod: hasBearer ? 'bearer_token' : 'server_cookie',
        userEmail: user.email || null,
        operation_type: 'admin_role_verification'
      }
    }

    const profiles = await SecureServiceRoleHelpers.secureSelect(
      authContext,
      'indb_auth_user_profiles',
      ['role', 'full_name'],
      { user_id: user.id }
    )

    const userProfile = profiles.length > 0 ? profiles[0] : null

    const role = userProfile?.role || 'user'
    const isAdmin = role === 'admin' || role === 'super_admin'
    const isSuperAdmin = role === 'super_admin'

    return {
      id: user.id,
      email: user.email || '',
      name: userProfile?.full_name || undefined,
      role,
      isAdmin,
      isSuperAdmin
    }

  } catch (error: unknown) {
    logger.error('Server auth error: ' + (error instanceof Error ? error.message : String(error)))
    return null
  }
}

/**
 * Require super admin authentication for API routes
 */
export async function requireServerSuperAdminAuth(request?: NextRequest): Promise<ServerAdminUser> {
  const serverAdminUser = await getServerAdminUser(request)
  if (!serverAdminUser?.isSuperAdmin) {
    throw new Error('Super admin access required')
  }

  return serverAdminUser
}

/**
 * Require admin authentication for API routes
 */
export async function requireServerAdminAuth(request?: NextRequest): Promise<ServerAdminUser> {
  const serverAdminUser = await getServerAdminUser(request)
  if (!serverAdminUser?.isAdmin) {
    throw new Error('Admin access required')
  }

  return serverAdminUser
}

/**
 * Get authenticated user (no role requirement)
 */
export async function getServerAuthUser(
  request?: NextRequest,
  options: { forceHeaderAuth?: boolean } = {}
): Promise<ServerAdminUser | null> {
  try {
    if (!request) {
      return null
    }

    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    const forceHeader = options.forceHeaderAuth || isStateChanging;

    const authHeader = request.headers.get('authorization')
    const hasBearer = authHeader && authHeader.startsWith('Bearer ')

    // Create Supabase client using centralized factory
    const supabase = createRequestAuthClient(request, { forceHeaderAuth: forceHeader })

    let user = null;
    let authError = null;

    // 1. Try Authorization header first (most secure)
    if (hasBearer) {
      const token = authHeader!.substring(7)
      const result = await supabase.auth.getUser(token)
      user = result.data.user
      authError = result.error
    }

    // 2. Fallback to cookies only if not state-changing or explicitly allowed
    if (!user && !forceHeader) {
      const result = await supabase.auth.getUser()
      user = result.data.user
      authError = result.error
    }

    if (authError || !user) {
      return null
    }

    // Get user profile from database using secure wrapper (but don't require admin role)
    const authContext = {
      userId: user.id,
      operation: 'get_user_profile_for_auth',
      reason: 'Server auth getting user role for authorization check',
      source: '@indexnow/auth.getServerAuthUser',
      metadata: {
        authMethod: hasBearer ? 'bearer_token' : 'server_cookie',
        userEmail: user.email || null
      }
    }

    const profiles = await SecureServiceRoleHelpers.secureSelect(
      authContext,
      'indb_auth_user_profiles',
      ['role', 'full_name'],
      { user_id: user.id }
    )

    const userProfile = profiles.length > 0 ? profiles[0] : null

    const role = userProfile?.role || 'user'
    const isAdmin = role === 'admin' || role === 'super_admin'
    const isSuperAdmin = role === 'super_admin'

    return {
      id: user.id,
      email: user.email || '',
      name: userProfile?.full_name || undefined,
      role,
      isAdmin,
      isSuperAdmin
    }

  } catch (error: unknown) {
    logger.error('Server auth error: ' + (error instanceof Error ? error.message : String(error)))
    return null
  }
}

// -- Backward-compatible aliases --
/** @deprecated Use `requireServerAdminAuth` */
export const requireAdminAuth = requireServerAdminAuth
/** @deprecated Use `requireServerSuperAdminAuth` */
export const requireSuperAdminAuth = requireServerSuperAdminAuth
