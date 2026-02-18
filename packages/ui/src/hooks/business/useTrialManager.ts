'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { BILLING_ENDPOINTS, logger } from '@indexnow/shared'
import { authenticatedFetch } from '@indexnow/supabase-client'

/** @internal Not yet consumed by any app — reserved for future use */
interface TrialInfo {
  user_id: string
  trial_start_date: string
  trial_end_date: string
  trial_days_total: number
  trial_days_remaining: number
  trial_expired: boolean
  can_extend_trial: boolean
  trial_package_id?: string
  trial_package_name?: string
}

interface TrialUsage {
  quota_used: number
  quota_limit: number
  quota_percentage: number
  features_used: string[]
  last_activity: string
}

interface TrialExtension {
  id: string
  extended_days: number
  reason: string
  extended_at: string
  extended_by: string
}

interface UseTrialManagerReturn {
  // Core data
  trialInfo: TrialInfo | null
  trialUsage: TrialUsage | null
  trialExtensions: TrialExtension[]
  
  // State
  loading: boolean
  error: string | null
  
  // Status checks
  isTrialActive: boolean
  isTrialExpired: boolean
  isTrialExpiringSoon: boolean // Within 3 days
  canUpgrade: boolean
  
  // Actions
  fetchTrialInfo: () => Promise<void>
  extendTrial: (days: number, reason?: string) => Promise<{ success: boolean; error?: string }>
  upgradeToPaid: (packageId: string) => Promise<{ success: boolean; error?: string }>
  
  // Utilities
  getDaysRemaining: () => number
  getUsagePercentage: () => number
  getTrialProgress: () => number // 0-100%
  formatTimeRemaining: () => string
  shouldShowUpgradePrompt: () => boolean
}

export function useTrialManager(): UseTrialManagerReturn {
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [trialUsage, setTrialUsage] = useState<TrialUsage | null>(null)
  const [trialExtensions, setTrialExtensions] = useState<TrialExtension[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const lastFetchTime = useRef<number>(0)
  const trialInfoRef = useRef<TrialInfo | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Fetch trial information
  const fetchTrialInfo = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)

      // Check cache
      const now = Date.now()
      if (now - lastFetchTime.current < CACHE_DURATION && trialInfoRef.current) {
        setLoading(false)
        return
      }

      const response = await authenticatedFetch(`${BILLING_ENDPOINTS.OVERVIEW}/trial/info`, { signal })

      if (signal?.aborted) return
      if (!response.ok) {
        throw new Error(`Failed to fetch trial info: ${response.status}`)
      }

      const data = await response.json()
      setTrialInfo(data.trial)
      trialInfoRef.current = data.trial
      setTrialUsage(data.usage)
      setTrialExtensions(data.extensions || [])
      
      lastFetchTime.current = now
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error fetching trial info')
      setError(err instanceof Error ? err.message : 'Failed to fetch trial info')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  // Extend trial period
  const extendTrial = useCallback(async (days: number, reason?: string) => {
    try {
      const response = await authenticatedFetch(`${BILLING_ENDPOINTS.OVERVIEW}/trial/extend`, {
        method: 'POST',
        body: JSON.stringify({ days, reason })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error || `Trial extension failed: ${response.status}` }
      }

      // Refresh trial info
      await fetchTrialInfo()
      
      return { success: true }
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error extending trial')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to extend trial' }
    }
  }, [fetchTrialInfo])

  // Upgrade to paid subscription
  const upgradeToPaid = useCallback(async (packageId: string) => {
    try {
      const response = await authenticatedFetch(`${BILLING_ENDPOINTS.OVERVIEW}/trial/upgrade`, {
        method: 'POST',
        body: JSON.stringify({ packageId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error || `Upgrade failed: ${response.status}` }
      }

      const data = await response.json()
      
      // If payment URL is returned, redirect user to payment
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
      
      return { success: true }
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error upgrading to paid')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to upgrade' }
    }
  }, [])

  // Computed properties
  const isTrialActive = Boolean(trialInfo && !trialInfo.trial_expired)
  const isTrialExpired = Boolean(trialInfo?.trial_expired)
  const isTrialExpiringSoon = Boolean(trialInfo && trialInfo.trial_days_remaining <= 3 && trialInfo.trial_days_remaining > 0)
  const canUpgrade = isTrialActive || isTrialExpired

  // Utility functions
  const getDaysRemaining = useCallback(() => {
    // (#144) Clamp to 0 to prevent negative day display
    return Math.max(0, trialInfo?.trial_days_remaining || 0)
  }, [trialInfo])

  const getUsagePercentage = useCallback(() => {
    return trialUsage?.quota_percentage || 0
  }, [trialUsage])

  const getTrialProgress = useCallback(() => {
    if (!trialInfo) return 0
    
    const totalDays = trialInfo.trial_days_total
    const remainingDays = trialInfo.trial_days_remaining
    const usedDays = totalDays - remainingDays
    
    return Math.min(100, (usedDays / totalDays) * 100)
  }, [trialInfo])

  const formatTimeRemaining = useCallback(() => {
    if (!trialInfo) return 'No trial info'
    
    const days = trialInfo.trial_days_remaining
    
    if (days <= 0) return 'Trial expired'
    if (days === 1) return '1 day remaining'
    return `${days} days remaining`
  }, [trialInfo])

  const shouldShowUpgradePrompt = useCallback(() => {
    if (!trialInfo) return false
    
    // Show prompt if:
    // 1. Trial is expiring soon (3 days or less)
    // 2. Usage is high (>80%)
    // 3. Trial has expired
    
    const isExpiringSoon = trialInfo.trial_days_remaining <= 3
    const isHighUsage = (trialUsage?.quota_percentage || 0) > 80
    const isExpired = trialInfo.trial_expired
    
    return isExpiringSoon || isHighUsage || isExpired
  }, [trialInfo, trialUsage])

  // Initial load and periodic refresh
  useEffect(() => {
    const controller = new AbortController()
    fetchTrialInfo(controller.signal)
    
    // Refresh trial info every 10 minutes
    const refreshInterval = setInterval(() => fetchTrialInfo(controller.signal), 10 * 60 * 1000)
    
    return () => {
      controller.abort()
      clearInterval(refreshInterval)
    }
  }, [fetchTrialInfo])

  return {
    trialInfo,
    trialUsage,
    trialExtensions,
    loading,
    error,
    isTrialActive,
    isTrialExpired,
    isTrialExpiringSoon,
    canUpgrade,
    fetchTrialInfo,
    extendTrial,
    upgradeToPaid,
    getDaysRemaining,
    getUsagePercentage,
    getTrialProgress,
    formatTimeRemaining,
    shouldShowUpgradePrompt
  }
}