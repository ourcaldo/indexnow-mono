/**
 * Frontend Activity Logging Hook
 * Provides convenient methods to log user activities from client-side
 */

"use client";

import { useEffect, useRef } from 'react'
import { type Json, authService, ACTIVITY_ENDPOINTS, logger } from '@indexnow/shared'
import { supabase } from '../client'

interface ActivityLogRequest {
  eventType: string
  actionDescription: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, Json>
}

export const useActivityLogger = () => {
  const pageViewLogged = useRef<string | null>(null)

  const logActivity = async (request: ActivityLogRequest) => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) return

      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) return

      await fetch(ACTIVITY_ENDPOINTS.LOG, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include', // Essential for cross-subdomain authentication
        body: JSON.stringify(request)
      })
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to log activity')
    }
  }

  const logPageView = async (pagePath: string, pageTitle?: string, metadata?: Record<string, Json>) => {
    // Avoid duplicate page view logs for the same page
    const currentPage = `${pagePath}-${pageTitle || ''}`
    if (pageViewLogged.current === currentPage) return

    pageViewLogged.current = currentPage

    await logActivity({
      eventType: 'page_view',
      actionDescription: `Visited ${pageTitle || pagePath}`,
      metadata: {
        pagePath,
        pageTitle: pageTitle || null,
        pageView: true,
        ...metadata
      }
    })
  }

  const logDashboardActivity = async (eventType: string, details?: string, metadata?: Record<string, Json>) => {
    await logActivity({
      eventType,
      actionDescription: details || eventType,
      metadata: {
        dashboardActivity: true,
        ...metadata
      }
    })
  }

  const logBillingActivity = async (eventType: string, details: string, metadata?: Record<string, Json>) => {
    await logActivity({
      eventType,
      actionDescription: details,
      metadata: {
        billingActivity: true,
        ...metadata
      }
    })
  }

  const logJobActivity = async (eventType: string, jobId?: string, details?: string, metadata?: Record<string, Json>) => {
    await logActivity({
      eventType,
      actionDescription: details || eventType,
      targetType: jobId ? 'job' : undefined,
      targetId: jobId,
      metadata: {
        jobActivity: true,
        ...metadata
      }
    })
  }

  const logServiceAccountActivity = async (eventType: string, serviceAccountId?: string, details?: string, metadata?: Record<string, Json>) => {
    await logActivity({
      eventType,
      actionDescription: details || eventType,
      targetType: serviceAccountId ? 'service_account' : undefined,
      targetId: serviceAccountId,
      metadata: {
        serviceAccountActivity: true,
        ...metadata
      }
    })
  }

  return {
    logActivity,
    logPageView,
    logDashboardActivity,
    logBillingActivity,
    logJobActivity,
    logServiceAccountActivity
  }
}

/**
 * Hook to automatically log page views when component mounts
 */
export const usePageViewLogger = (pagePath: string, pageTitle?: string, metadata?: Record<string, Json>) => {
  const { logPageView } = useActivityLogger()

  useEffect(() => {
    logPageView(pagePath, pageTitle, metadata)
  }, [pagePath, pageTitle]) // Re-log if page changes

  return { logPageView }
}