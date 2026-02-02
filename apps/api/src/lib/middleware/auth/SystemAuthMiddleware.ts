import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { NextRequest } from 'next/server';
import { AppConfig, USER_ROLES, ROLE_PERMISSIONS, type UserRole } from '@indexnow/shared';

export interface SystemAuthContext {
  isAuthorized: boolean;
  userId?: string;
  userRole?: UserRole;
  isSystemRequest: boolean;
  error?: string;
}

/**
 * Verify system-level authorization for sensitive operations
 * This should be used for SeRanking integration endpoints that consume API quota
 */
export async function verifySystemAuthorization(
  request: NextRequest, 
  requiredPermission?: string
): Promise<SystemAuthContext> {
  try {
    // Check for system API key in headers (for internal system processes)
    const systemApiKey = request.headers.get('X-System-API-Key');
    const expectedSystemKey = AppConfig.security.systemApiKey;
    
    if (systemApiKey && expectedSystemKey && systemApiKey === expectedSystemKey) {
      return {
        isAuthorized: true,
        isSystemRequest: true,
        userId: 'system'
      };
    }

    // Check for user authentication via Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isAuthorized: false,
        isSystemRequest: false,
        error: 'No valid authorization token provided'
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT token with Supabase using secure service role wrapper
    let user = null;
    try {
      const authContext = {
        userId: 'system',
        operation: 'verify_user_auth_token',
        reason: 'System auth middleware verifying user authentication token',
        source: 'lib/middleware/auth/SystemAuthMiddleware',
        metadata: {
          hasToken: !!token,
          tokenLength: token?.length
        }
      };

      const authResult = await SecureServiceRoleWrapper.executeSecureOperation(
        authContext,
        {
          table: 'auth.users',
          operationType: 'select',
          columns: ['id', 'email'],
          whereConditions: { token: token }
        },
        async () => {
          const { data, error } = await supabaseAdmin.auth.getUser(token);
          if (error || !data?.user) {
            throw new Error(error?.message || 'Invalid or expired token');
          }
          return data.user;
        }
      );

      user = authResult;
    } catch (authError) {
      return {
        isAuthorized: false,
        isSystemRequest: false,
        error: 'Invalid or expired token'
      };
    }

    // Verify user role in indb_auth_user_profiles for administrative access
    try {
      const profileContext = {
        userId: user.id,
        operation: 'verify_user_role',
        reason: 'System auth middleware checking user role for system access',
        source: 'lib/middleware/auth/SystemAuthMiddleware',
        metadata: {
          userId: user.id
        }
      };

      const profile = await SecureServiceRoleWrapper.executeSecureOperation(
        profileContext,
        {
          table: 'indb_auth_user_profiles',
          operationType: 'select',
          columns: ['role'],
          whereConditions: { user_id: user.id }
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_auth_user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();
          
          if (error) {
            throw new Error(error.message);
          }
          return data;
        }
      );

      const role = (profile?.role as UserRole) || USER_ROLES.USER;
      
      // Super admin always has access
      if (role === USER_ROLES.SUPER_ADMIN) {
        return {
          isAuthorized: true,
          isSystemRequest: false,
          userId: user.id,
          userRole: role
        };
      }

      // Check for specific permission if required
      if (requiredPermission) {
        const permissions = ROLE_PERMISSIONS[role] || [];
        const hasPermission = (permissions as readonly string[]).includes(requiredPermission);
        
        return {
          isAuthorized: hasPermission,
          isSystemRequest: false,
          userId: user.id,
          userRole: role,
          error: hasPermission ? undefined : `Missing required permission: ${requiredPermission}`
        };
      }

      // Default role-based check for administrative access
      const isAuthorized = role === USER_ROLES.SUPER_ADMIN || role === USER_ROLES.ADMIN;

      return {
        isAuthorized,
        isSystemRequest: false,
        userId: user.id,
        userRole: role,
        error: isAuthorized ? undefined : 'SeRanking API access restricted to administrative users'
      };
    } catch (profileError) {
      return {
        isAuthorized: false,
        isSystemRequest: false,
        userId: user.id,
        userRole: 'user',
        error: 'Failed to verify user permissions'
      };
    }

  } catch (error) {
    console.error('System authorization error:', error);
    return {
      isAuthorized: false,
      isSystemRequest: false,
      error: 'Authorization verification failed'
    };
  }
}

/**
 * Middleware wrapper for system endpoints
 */
export function withSystemAuth<T extends unknown[]>(
  handler: (request: NextRequest, authContext: SystemAuthContext, ...args: T) => Promise<Response>,
  requiredPermission?: string
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const authContext = await verifySystemAuthorization(request, requiredPermission);
    
    if (!authContext.isAuthorized) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'unauthorized',
          message: authContext.error || 'Access denied - system authorization required'
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, authContext, ...args);
  };
}