'use client'

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type Json, AUTH_ENDPOINTS, type DbUserProfile, type DbSubscriptionRow, type DbUserSettings, logger, authenticatedFetch } from '@indexnow/shared'

/** @internal Not yet consumed by any app — reserved for future use */
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

// (#119/#138) Query key constants — export so mutations elsewhere can invalidate
export const USER_PROFILE_KEYS = {
  all: ['user-profile'] as const,
  profile: ['user-profile', 'complete'] as const,
  quota: ['user-profile', 'quota'] as const,
} as const

/**
 * (#119/#138) Enhanced user profile hook — migrated from manual useState/useEffect
 * to React Query for automatic caching, deduplication, and periodic refresh.
 *
 * - Full profile is `useQuery` with 5-min staleTime (auto-fetch on mount, cache)
 * - Quota has its own `useQuery` with 30s refetchInterval (replaces manual setInterval)
 * - CRUD ops are `useMutation` (auto-invalidate profile cache on success)
 * - Utility functions are derived computations from cached data
 */
export function useEnhancedUserProfile(): UseEnhancedUserProfileReturn {
  const queryClient = useQueryClient()

  // ─── Profile Query (full profile: user + subscription + quota + settings) ───
  const profileQuery = useQuery({
    queryKey: USER_PROFILE_KEYS.profile,
    queryFn: async () => {
      const response = await authenticatedFetch(AUTH_ENDPOINTS.PROFILE_COMPLETE)
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`)
      }
      return response.json() as Promise<ProfileCompleteResponse>
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — matches QueryProvider default
  })

  // ─── Quota Query (lightweight, 30s auto-refresh when user is loaded) ───
  const quotaQuery = useQuery({
    queryKey: USER_PROFILE_KEYS.quota,
    queryFn: async () => {
      const response = await authenticatedFetch(AUTH_ENDPOINTS.QUOTA)
      if (!response.ok) throw new Error(`Failed to fetch quota: ${response.status}`)
      const data = (await response.json()) as { quota: UserQuota }
      return data.quota
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,  // Replaces manual setInterval(refreshQuota, 30000)
    enabled: !!profileQuery.data, // Only refresh once profile is loaded
  })

  // ─── Derived data (prefer fresh quota from quotaQuery, fallback to profile) ───
  const user = profileQuery.data?.user ?? null
  const subscription = profileQuery.data?.subscription ?? null
  const quota = quotaQuery.data ?? profileQuery.data?.quota ?? null
  const settings = profileQuery.data?.settings ?? null

  // ─── Mutations ───
  const updateProfileMut = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const response = await authenticatedFetch(AUTH_ENDPOINTS.PROFILE, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `Profile update failed: ${response.status}`)
      }
      return response.json() as Promise<{ user: UserProfile }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEYS.all })
    },
  })

  const updateSettingsMut = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      const response = await authenticatedFetch(AUTH_ENDPOINTS.SETTINGS, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `Settings update failed: ${response.status}`)
      }
      return response.json() as Promise<{ settings: UserSettings }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEYS.all })
    },
  })

  const changePasswordMut = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const response = await authenticatedFetch(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `Password change failed: ${response.status}`)
      }
      return response.json()
    },
  })

  const uploadAvatarMut = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await authenticatedFetch(AUTH_ENDPOINTS.AVATAR, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `Avatar upload failed: ${response.status}`)
      }
      return response.json() as Promise<{ avatarUrl: string }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEYS.all })
    },
  })

  // ─── Interface-compatible action wrappers ───

  const fetchProfile = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEYS.profile })
  }, [queryClient])

  const updateProfile: UseEnhancedUserProfileReturn['updateProfile'] = async (updates) => {
    try {
      await updateProfileMut.mutateAsync(updates)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update profile' }
    }
  }

  const updateSettings: UseEnhancedUserProfileReturn['updateSettings'] = async (updates) => {
    try {
      await updateSettingsMut.mutateAsync(updates)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update settings' }
    }
  }

  const refreshQuota = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEYS.quota })
  }, [queryClient])

  const changePassword: UseEnhancedUserProfileReturn['changePassword'] = async (currentPassword, newPassword) => {
    try {
      await changePasswordMut.mutateAsync({ currentPassword, newPassword })
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to change password' }
    }
  }

  const uploadAvatar: UseEnhancedUserProfileReturn['uploadAvatar'] = async (file) => {
    try {
      const data = await uploadAvatarMut.mutateAsync(file)
      return { success: true, avatarUrl: data.avatarUrl }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to upload avatar' }
    }
  }

  // ─── Utility functions — derived from cached query data ───

  const isAdmin = useCallback(() => user?.role === 'admin' || user?.role === 'super_admin', [user])
  const isSuperAdmin = useCallback(() => user?.role === 'super_admin', [user])
  const isTrialUser = useCallback(() => subscription?.status === 'trial', [subscription])
  const isSubscriptionActive = useCallback(
    () => subscription?.status === 'active' || subscription?.status === 'trial',
    [subscription]
  )
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
  const canPerformAction = useCallback(
    (requiredQuota: number) => {
      if (!quota) return false
      if (quota.is_unlimited) return true
      return quota.daily_quota_remaining >= requiredQuota
    },
    [quota]
  )

  return {
    user,
    subscription,
    quota,
    settings,
    loading: profileQuery.isLoading,
    error: profileQuery.error?.message ?? null,
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
    canPerformAction,
  }
}