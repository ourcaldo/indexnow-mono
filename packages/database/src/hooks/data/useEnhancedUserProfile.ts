'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type Json, AUTH_ENDPOINTS, type DbUserProfile, type DbSubscriptionRow, type DbUserSettings, logger } from '@indexnow/shared'
import { supabase } from '../../client'

interface UserProfile extends DbUserProfile {
  email: string
  email_notifications: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  // Ensure optional properties from local interface are compatible or handled
  timezone?: string
  language?: string
  last_sign_in_at?: string
  email_confirmed_at?: string
}

interface UserSubscription {
  id: string
  package_id: string
  package_name: string
  package_slug: string
  daily_quota_limit: number
  daily_quota_used: number
  daily_quota_reset_date: string
  is_unlimited: boolean
  subscribed_at: string
  subscription_ends_at?: string
  trial_ends_at?: string
  status: 'active' | 'trial' | 'expired' | 'cancelled'
  billing_period: 'monthly' | 'yearly'
  package_features: string[]
}

interface UserQuota {
  daily_quota_limit: number
  daily_quota_used: number
  daily_quota_remaining: number
  daily_quota_reset_date: string
  is_unlimited: boolean
  usage_percentage: number
  reset_hours_remaining: number
}

interface UserSettings extends DbUserSettings {
  dashboard_preferences: Record<string, Json>
  notification_preferences: Record<string, boolean>
  // Add missing properties from DbUserSettings if needed, or rely on extension
  // DbUserSettings has timeout_duration, retry_attempts, etc.
}

interface ProfileCompleteResponse {
  user: UserProfile
  subscription: UserSubscription
  quota: UserQuota
  settings: UserSettings
}

interface UseEnhancedUserProfileReturn {
  // Core data
  user: UserProfile | null
  subscription: UserSubscription | null
  quota: UserQuota | null
  settings: UserSettings | null
  
  // State
  loading: boolean
  error: string | null
  
  // Actions
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
  updateSettings: (updates: Partial<UserSettings>) => Promise<{ success: boolean; error?: string }>
  refreshQuota: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  uploadAvatar: (file: File) => Promise<{ success: boolean; avatarUrl?: string; error?: string }>
  
  // Utilities
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  isTrialUser: () => boolean
  isSubscriptionActive: () => boolean
  isQuotaExhausted: () => boolean
  getQuotaUsagePercentage: () => number
  getDaysUntilExpiry: () => number | null
  canPerformAction: (requiredQuota: number) => boolean
}

export function useEnhancedUserProfile(): UseEnhancedUserProfileReturn {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [quota, setQuota] = useState<UserQuota | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const profileCache = useRef<ProfileCompleteResponse | null>(null)
  const lastFetchTime = useRef<number>(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Fetch complete user profile with subscription and quota
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check cache
      const now = Date.now()
      if (now - lastFetchTime.current < CACHE_DURATION && profileCache.current) {
        setUser(profileCache.current.user)
        setSubscription(profileCache.current.subscription)
        setQuota(profileCache.current.quota)
        setSettings(profileCache.current.settings)
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Authentication required')
        setLoading(false)
        return
      }

      // Fetch comprehensive profile data
      const response = await fetch(AUTH_ENDPOINTS.PROFILE_COMPLETE, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Essential for cross-subdomain authentication
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`)
      }

      const data = await response.json() as ProfileCompleteResponse
      
      // Set all profile data
      setUser(data.user)
      setSubscription(data.subscription)
      setQuota(data.quota)
      setSettings(data.settings)
      
      // Update cache
      profileCache.current = {
        user: data.user,
        subscription: data.subscription,
        quota: data.quota,
        settings: data.settings
      }
      lastFetchTime.current = now

    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error fetching user profile')
      setError(err instanceof Error ? err.message : 'Failed to fetch user profile')
    } finally {
      setLoading(false)
    }
  }, [])

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        return { success: false, error: 'Authentication required' }
      }

      const response = await fetch(AUTH_ENDPOINTS.PROFILE, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates),
        credentials: 'include' // Essential for cross-subdomain authentication
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error || `Profile update failed: ${response.status}` }
      }

      const data = await response.json() as { user: UserProfile }
      setUser(data.user)
      
      // Clear cache to force refresh
      profileCache.current = null
      
      return { success: true }
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error updating profile')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update profile' }
    }
  }, [])

  // Update user settings
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        return { success: false, error: 'Authentication required' }
      }

      const response = await fetch(AUTH_ENDPOINTS.SETTINGS, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates),
        credentials: 'include' // Essential for cross-subdomain authentication
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error || `Settings update failed: ${response.status}` }
      }

      const data = await response.json() as { settings: UserSettings }
      setSettings(data.settings)
      
      return { success: true }
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error updating settings')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update settings' }
    }
  }, [])

  // Refresh quota data
  const refreshQuota = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(AUTH_ENDPOINTS.QUOTA, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Essential for cross-subdomain authentication
      })

      if (response.ok) {
        const data = await response.json() as { quota: UserQuota }
        setQuota(data.quota)
      }
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error refreshing quota')
    }
  }, [])

  // Change password
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        return { success: false, error: 'Authentication required' }
      }

      const response = await fetch(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include' // Essential for cross-subdomain authentication
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error || `Password change failed: ${response.status}` }
      }

      return { success: true }
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error changing password')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to change password' }
    }
  }, [])

  // Upload avatar
  const uploadAvatar = useCallback(async (file: File) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        return { success: false, error: 'Authentication required' }
      }

      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(AUTH_ENDPOINTS.AVATAR, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData,
        credentials: 'include' // Essential for cross-subdomain authentication
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error || `Avatar upload failed: ${response.status}` }
      }

      const data = await response.json() as { avatarUrl: string }
      
      // Update user data with new avatar URL
      if (user) {
        setUser({ ...user, avatar_url: data.avatarUrl })
      }
      
      return { success: true, avatarUrl: data.avatarUrl }
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error uploading avatar')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to upload avatar' }
    }
  }, [user])

  // Utility functions
  const isAdmin = useCallback(() => {
    return user?.role === 'admin' || user?.role === 'super_admin'
  }, [user])

  const isSuperAdmin = useCallback(() => {
    return user?.role === 'super_admin'
  }, [user])

  const isTrialUser = useCallback(() => {
    return subscription?.status === 'trial'
  }, [subscription])

  const isSubscriptionActive = useCallback(() => {
    return subscription?.status === 'active' || subscription?.status === 'trial'
  }, [subscription])

  const isQuotaExhausted = useCallback(() => {
    if (!quota || quota.is_unlimited) return false
    return quota.daily_quota_remaining <= 0
  }, [quota])

  const getQuotaUsagePercentage = useCallback(() => {
    if (!quota || quota.is_unlimited) return 0
    return Math.min(100, (quota.daily_quota_used / quota.daily_quota_limit) * 100)
  }, [quota])

  const getDaysUntilExpiry = useCallback(() => {
    if (!subscription?.subscription_ends_at) return null
    
    const expiryDate = new Date(subscription.subscription_ends_at)
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  }, [subscription])

  const canPerformAction = useCallback((requiredQuota: number) => {
    if (!quota) return false
    if (quota.is_unlimited) return true
    return quota.daily_quota_remaining >= requiredQuota
  }, [quota])

  // Initial load
  useEffect(() => {
    fetchProfile()
    
    // Set up periodic quota refresh
    const quotaRefreshInterval = setInterval(refreshQuota, 30000) // Every 30 seconds
    
    return () => {
      clearInterval(quotaRefreshInterval)
    }
  }, [fetchProfile, refreshQuota])

  return {
    user,
    subscription,
    quota,
    settings,
    loading,
    error,
    fetchProfile,
    updateProfile,
    updateSettings,
    refreshQuota,
    changePassword,
    uploadAvatar,
    isAdmin,
    isSuperAdmin,
    isTrialUser,
    isSubscriptionActive,
    isQuotaExhausted,
    getQuotaUsagePercentage,
    getDaysUntilExpiry,
    canPerformAction
  }
}