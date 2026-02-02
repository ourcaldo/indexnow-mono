import { SecureServiceRoleHelpers } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { AppConfig } from '@indexnow/shared'
import { ErrorHandlingService } from '@/lib/monitoring/error-handling'
import { supabaseAdmin } from '../database/supabase'

// Define types
interface AdminUser {
  id: string
  email: string
  role: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

/**
 * Get server-side admin user from request using proper Supabase server client
 */
export async function getServerAdminUser(
  request?: NextRequest,
  options: { forceHeaderAuth?: boolean } = {}
): Promise<AdminUser | null> {
  try {
    if (!request) {
      console.log('Server auth: No request provided')
      return null
    }

    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    const forceHeader = options.forceHeaderAuth || isStateChanging;

    const authHeader = request.headers.get('authorization')
    const hasBearer = authHeader && authHeader.startsWith('Bearer ')

    // Create Supabase client
    const supabase = createServerClient(
      AppConfig.supabase.url,
      AppConfig.supabase.anonKey,
      {
        cookies: {
          get(name: string) {
            if (forceHeader) return undefined;
            const cookieHeader = request.headers.get('cookie')
            if (!cookieHeader) return undefined
            const cookies = Object.fromEntries(
              cookieHeader.split(';').map(cookie => {
                const [key, value] = cookie.trim().split('=')
                return [key, decodeURIComponent(value || '')]
              })
            )
            return cookies[name]
          },
          set() {},
          remove() {},
        },
      }
    )

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
      source: 'lib/auth/server-auth.getServerAdminUser',
      metadata: {
        authMethod: 'server_cookie',
        userEmail: user.email,
        operation_type: 'admin_role_verification'
      }
    }

    const profiles = await SecureServiceRoleHelpers.secureSelect(
      authContext,
      'indb_auth_user_profiles',
      ['role'],
      { user_id: user.id }
    )

    const userProfile = profiles.length > 0 ? profiles[0] : null

    const role = userProfile?.role || 'user'
    const isAdmin = role === 'admin' || role === 'super_admin'
    const isSuperAdmin = role === 'super_admin'

    return {
      id: user.id,
      email: user.email || '',
      role,
      isAdmin,
      isSuperAdmin
    }

  } catch (error: unknown) {
    ErrorHandlingService.handle(error, { context: 'getServerAdminUser' });
    return null
  }
}

/**
 * Require super admin authentication for API routes
 */
export async function requireServerSuperAdminAuth(request?: NextRequest): Promise<AdminUser> {
  const serverAdminUser = await getServerAdminUser(request)
  if (!serverAdminUser?.isSuperAdmin) {
    throw new Error('Super admin access required')
  }
  
  return serverAdminUser
}

/**
 * Require admin authentication for API routes
 */
export async function requireServerAdminAuth(request?: NextRequest): Promise<AdminUser> {
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
): Promise<AdminUser | null> {
  try {
    if (!request) {
      console.log('🔐 Server auth: No request provided')
      return null
    }
    
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    const forceHeader = options.forceHeaderAuth || isStateChanging;

    console.log(`🔐 Server auth: Processing ${request.method} request (forceHeader: ${forceHeader})...`)
    
    const authHeader = request.headers.get('authorization')
    const hasBearer = authHeader && authHeader.startsWith('Bearer ')
    
    // Create Supabase client
    const supabase = createServerClient(
      AppConfig.supabase.url,
      AppConfig.supabase.anonKey,
      {
        cookies: {
          get(name: string) {
            // If forcing header auth, ignore cookies
            if (forceHeader) return undefined;
            
            const cookieHeader = request.headers.get('cookie')
            if (!cookieHeader) return undefined
            
            const cookies = Object.fromEntries(
              cookieHeader.split(';').map(cookie => {
                const [key, value] = cookie.trim().split('=')
                return [key, decodeURIComponent(value || '')]
              })
            )

            return cookies[name]
          },
          set() {},
          remove() {},
        },
      }
    )

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
      if (forceHeader && !hasBearer) {
        console.log(`🔐 Authentication failed: Authorization header required for ${request.method}`)
      } else {
        console.log('🔐 Authentication failed:', authError?.message || 'No user found')
      }
      return null
    }

    // Get user profile from database using secure wrapper (but don't require admin role)
    const authContext = {
      userId: user.id,
      operation: 'get_user_profile_for_auth',
      reason: 'Server auth getting user role for authorization check',
      source: 'lib/auth/server-auth',
      metadata: {
        authMethod: 'server_cookie_or_bearer',
        userEmail: user.email
      }
    }

    const profiles = await SecureServiceRoleHelpers.secureSelect(
      authContext,
      'indb_auth_user_profiles',
      ['role'],
      { user_id: user.id }
    )

    const userProfile = profiles.length > 0 ? profiles[0] : null

    const role = userProfile?.role || 'user'
    const isAdmin = role === 'admin' || role === 'super_admin'
    const isSuperAdmin = role === 'super_admin'

    return {
      id: user.id,
      email: user.email || '',
      role,
      isAdmin,
      isSuperAdmin
    }

  } catch (error: unknown) {
    ErrorHandlingService.handle(error, { context: 'getServerAuthUser' });
    return null
  }
}