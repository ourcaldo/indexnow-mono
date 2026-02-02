import { supabaseBrowser as supabase } from '@indexnow/shared'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'

export interface AuthErrorContext {
  error: {
    code?: string;
    error_code?: string;
    error?: {
      code?: string;
      message?: string;
      status?: number;
    };
    message?: string;
    status?: number;
  } | null | undefined;
  event?: string;
  session?: Session | null;
}

export class AuthErrorHandler {
  private static readonly REFRESH_TOKEN_ERROR_CODES = [
    'refresh_token_already_used',
    'invalid_refresh_token',
    'refresh_token_not_found',
    'invalid_grant'
  ]

  private static readonly REFRESH_ERROR_INDICATORS = [
    'invalid',
    'already used',
    'not found',
    'revoked',
    'expired',
    'invalid_grant'
  ]

  static isRefreshTokenError(error: AuthErrorContext['error']): boolean {
    if (!error) return false
    
    const errorCode = error?.code || error?.error_code || error?.error?.code
    const errorMessage = (error?.message || error?.error?.message || '').toLowerCase()
    const errorStatus = error?.status || error?.error?.status
    
    const hasRefreshTokenCode = errorCode && this.REFRESH_TOKEN_ERROR_CODES.some(
      code => errorCode.toLowerCase() === code || errorCode.toLowerCase().includes(code)
    )
    
    const messageHasRefresh = errorMessage.includes('refresh')
    const messageHasToken = errorMessage.includes('token')
    const messageHasErrorIndicator = this.REFRESH_ERROR_INDICATORS.some(
      indicator => errorMessage.includes(indicator)
    )
    const hasRefreshTokenMessage = messageHasRefresh && messageHasToken && messageHasErrorIndicator
    
    const hasStatus = errorStatus !== undefined && errorStatus !== null
    const is400or401Status = errorStatus === 400 || errorStatus === 401
    
    if (hasRefreshTokenCode) return true
    
    if (hasRefreshTokenMessage) {
      if (hasStatus) {
        return is400or401Status
      }
      return true
    }
    
    return false
  }

  static async clearAuthState(): Promise<void> {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (e) {
      // Ignore errors during signout
    }

    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      } catch (e) {
        // Ignore localStorage errors
      }

      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key))
      } catch (e) {
        // Ignore sessionStorage errors
      }
    }
  }

  static async handleRefreshTokenError(context: AuthErrorContext): Promise<void> {
    if (!this.isRefreshTokenError(context.error)) {
      return
    }

    await this.clearAuthState()

    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const isAdminRoute = currentPath.startsWith('/backend/admin')
      const loginPath = isAdminRoute ? '/backend/admin/login' : '/login'
      
      if (!currentPath.includes('/login')) {
        window.location.href = loginPath
      }
    }
  }

  static createAuthStateChangeHandler(
    onSuccess?: (session: Session) => void,
    onSignOut?: () => void
  ) {
    let refreshFailCount = 0
    const maxRefreshFails = 3
    const REFRESH_ALREADY_USED = 'refresh_token_already_used'

    return async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'TOKEN_REFRESHED') {
        refreshFailCount = 0
        if (onSuccess && session) {
          onSuccess(session)
        }
        return
      }

      if (event === 'SIGNED_OUT') {
        refreshFailCount = 0
        await this.clearAuthState()
        if (onSignOut) {
          onSignOut()
        } else if (typeof window !== 'undefined') {
          window.location.reload()
        }
        return
      }

      if (event === 'USER_UPDATED' && !session) {
        refreshFailCount++
        if (refreshFailCount >= maxRefreshFails) {
          await this.handleRefreshTokenError({
            error: { code: REFRESH_ALREADY_USED },
            event,
            session
          })
        }
        return
      }
    }
  }
}
