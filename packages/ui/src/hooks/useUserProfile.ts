'use client'

import { useState, useEffect, useCallback } from 'react'
import { AUTH_ENDPOINTS, logger } from '@indexnow/shared'
import { authenticatedFetch } from '@indexnow/supabase-client'
import { supabase } from '@indexnow/supabase-client'

/** @internal Not yet consumed by any app — reserved for future use */
export interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  role: string
  email_notifications: boolean
  created_at: string
  updated_at: string
  phone_number: string | null
  package_id?: string
  subscribed_at?: string
  expires_at?: string
  daily_quota_used?: number
  daily_quota_reset_date?: string
}

export interface UserWithRole {
  id: string
  email: string | undefined
  name?: string
  role: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

export interface UseUserProfileReturn {
  user: UserWithRole | null;
  loading: boolean;
  error: string | null;
  refetch: (signal?: AbortSignal) => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserProfile = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)

      // Get current user from Supabase auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        setUser(null)
        return
      }

      // (#107) Get user profile through API layer using authenticatedFetch
      const response = await authenticatedFetch(AUTH_ENDPOINTS.PROFILE, {
        signal
      })

      if (!response.ok || response.status === 404) {
        // Create a basic user object without role information
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name,
          role: 'user',
          isAdmin: false,
          isSuperAdmin: false
        })
        return
      }

      const data = await response.json()
      const profile = data.profile

      // Create full user object with role information
      const userWithRole: UserWithRole = {
        id: authUser.id,
        email: authUser.email,
        name: profile.full_name || authUser.user_metadata?.full_name,
        role: profile.role || 'user',
        isAdmin: profile.role === 'admin' || profile.role === 'super_admin',
        isSuperAdmin: profile.role === 'super_admin'
      }

      setUser(userWithRole)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error fetching user profile')
      setError(err instanceof Error ? err.message : 'Failed to fetch user profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchUserProfile(controller.signal)
    return () => controller.abort()
  }, [fetchUserProfile])

  return { user, loading, error, refetch: fetchUserProfile }
}