'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { authService, AuthUser, logger } from '@indexnow/shared'
import { useRouter } from 'next/navigation'
import { AuthErrorHandler } from '../auth-error-handler'
import { supabase } from '@indexnow/shared'
import { useSessionRefresh } from '../hooks/useSessionRefresh'

// (#34) Removed unused globalAuthState variable — was declared but never written to

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  authChecked: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // (#132) Memoize auth actions to prevent unstable context value
  const signOut = useCallback(async () => {
    try {
      await authService.signOut()
      setUser(null)
      window.location.href = '/login'
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Sign out error')
    }
  }, [])

  const refreshAuth = useCallback(async () => {
    // For the simple pattern, just refetch current user
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Refresh auth error')
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    // Initial session load
    authService.getCurrentUser().then((currentUser) => {
      setUser(currentUser)
      setLoading(false)
      setAuthChecked(true)

      // Only redirect to login if we're not on a public route
      if (!currentUser && typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        
        // Define protected routes that require authentication
        const protectedRoutes = ['/dashboard']
        const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route))
        
        // Admin app handles its own auth via middleware
        if (isProtectedRoute) {
          router.push('/login')
        }
      }
    });

    // Listen for login/logout with refresh token error handling
    const authStateHandler = AuthErrorHandler.createAuthStateChangeHandler(
      (session) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name,
            emailVerification: session.user.email_confirmed_at ? true : false,
          }
          setUser(authUser)
          setLoading(false)
          setAuthChecked(true)
        }
      },
      () => {
        setUser(null)
        setLoading(false)
        setAuthChecked(true)
        
        // Only redirect if on protected route
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          
          // Define protected routes that require authentication
          const protectedRoutes = ['/dashboard']
          const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route))
          
          // Admin app handles its own auth via middleware
          if (isProtectedRoute) {
            router.push('/login')
          }
        }
      }
    )
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(authStateHandler)

    return () => subscription?.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, router]) // (#35) Added router to deps

  const isAuthenticated = authChecked && !loading && !!user

  // (#106) Proactively refresh session tokens before they expire
  // This prevents silent 401 errors when tokens expire during active use
  useSessionRefresh({ enabled: isAuthenticated })

  // (#132) Memoize context value to prevent unnecessary re-renders in consumers
  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    authChecked,
    isAuthenticated,
    signOut,
    refreshAuth,
  }), [user, loading, authChecked, isAuthenticated, signOut, refreshAuth])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}