/**
 * Comprehensive Activity Logging Service (Frontend Client)
 * Shared service used by all client applications
 */

import { ACTIVITY_ENDPOINTS } from '../../constants/ApiEndpoints'
import { type Json } from '../../types' // Assuming Json is available or I define it locally if not found

export interface ActivityLogData {
  userId: string
  eventType: string
  actionDescription: string
  targetType?: string
  targetId?: string
  ipAddress?: string
  userAgent?: string
  deviceInfo?: Record<string, Json>
  locationData?: Record<string, Json>
  success?: boolean
  errorMessage?: string
  metadata?: Record<string, Json>
}

// Common event types for consistency
export const ActivityEventTypes = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGE: 'password_change',

  // Profile Management
  PROFILE_UPDATE: 'profile_update',
  SETTINGS_CHANGE: 'settings_change',
  SETTINGS_VIEW: 'settings_view',
  NOTIFICATION_SETTINGS_UPDATE: 'notification_settings_update',

  // Job Management
  JOB_CREATE: 'job_create',
  JOB_UPDATE: 'job_update',
  JOB_DELETE: 'job_delete',
  JOB_START: 'job_start',
  JOB_PAUSE: 'job_pause',
  JOB_RESUME: 'job_resume',
  JOB_CANCEL: 'job_cancel',
  JOB_VIEW: 'job_view',

  // Service Account Management
  SERVICE_ACCOUNT_ADD: 'service_account_add',
  SERVICE_ACCOUNT_UPDATE: 'service_account_update',
  SERVICE_ACCOUNT_DELETE: 'service_account_delete',
  SERVICE_ACCOUNT_VIEW: 'service_account_view',

  // Billing & Payment Events
  CHECKOUT_INITIATED: 'checkout_initiated',
  ORDER_CREATED: 'order_created',
  PAYMENT_PROOF_UPLOADED: 'payment_proof_uploaded',
  SUBSCRIPTION_UPGRADE: 'subscription_upgrade',
  BILLING_VIEW: 'billing_view',
  BILLING_HISTORY_VIEW: 'billing_history_view',
  ORDER_VIEW: 'order_view',
  PACKAGE_SELECTION: 'package_selection',

  // Dashboard Activities
  DASHBOARD_VIEW: 'dashboard_view',
  DASHBOARD_STATS_VIEW: 'dashboard_stats_view',
  QUOTA_VIEW: 'quota_view',
  INDEXNOW_PAGE_VIEW: 'indexnow_page_view',
  MANAGE_JOBS_VIEW: 'manage_jobs_view',

  // API Calls
  API_CALL: 'api_call',
  GOOGLE_API_CALL: 'google_api_call',

  // Admin Activities
  ADMIN_LOGIN: 'admin_login',
  ADMIN_DASHBOARD_VIEW: 'admin_dashboard_view',
  ADMIN_STATS_VIEW: 'admin_stats_view',
  USER_MANAGEMENT: 'user_management',
  USER_SUSPEND: 'user_suspend',
  USER_UNSUSPEND: 'user_unsuspend',
  USER_PASSWORD_RESET: 'user_password_reset',
  USER_PROFILE_UPDATE: 'user_profile_update',
  USER_ROLE_CHANGE: 'user_role_change',
  USER_QUOTA_RESET: 'user_quota_reset',
  USER_PACKAGE_CHANGE: 'user_package_change',
  USER_SUBSCRIPTION_EXTEND: 'user_subscription_extend',

  // Admin Settings
  ADMIN_SETTINGS: 'admin_settings',
  SITE_SETTINGS_UPDATE: 'site_settings_update',
  SITE_SETTINGS_VIEW: 'site_settings_view',
  PAYMENT_GATEWAY_CREATE: 'payment_gateway_create',
  PAYMENT_GATEWAY_UPDATE: 'payment_gateway_update',
  PAYMENT_GATEWAY_DELETE: 'payment_gateway_delete',
  PAYMENT_GATEWAY_VIEW: 'payment_gateway_view',
  PACKAGE_CREATE: 'package_create',
  PACKAGE_UPDATE: 'package_update',
  PACKAGE_DELETE: 'package_delete',
  PACKAGE_VIEW: 'package_view',

  // Admin Orders
  ORDER_MANAGEMENT: 'order_management',
  ORDER_STATUS_UPDATE: 'order_status_update',
  ADMIN_ORDER_VIEW: 'admin_order_view',
  ORDER_APPROVE: 'order_approve',
  ORDER_REJECT: 'order_reject',

  // Page Views & Navigation
  PAGE_VIEW: 'page_view',
  ADMIN_PANEL_ACCESS: 'admin_panel_access',
  USER_SECURITY_VIEW: 'user_security_view',
  USER_ACTIVITY_VIEW: 'user_activity_view',

  // Keyword Tracker Activities
  KEYWORD_ADD: 'keyword_add',
  KEYWORD_DELETE: 'keyword_delete',
  KEYWORD_UPDATE: 'keyword_update',
  KEYWORD_BULK_DELETE: 'keyword_bulk_delete',
  KEYWORD_TAG_ADD: 'keyword_tag_add',
  KEYWORD_TAG_REMOVE: 'keyword_tag_remove',
  DOMAIN_ADD: 'domain_add',
  DOMAIN_DELETE: 'domain_delete',
  DOMAIN_UPDATE: 'domain_update',
  KEYWORD_TRACKER_VIEW: 'keyword_tracker_view',
  RANK_HISTORY_VIEW: 'rank_history_view',

  // System Events
  ERROR_OCCURRED: 'error_occurred',
  SECURITY_VIOLATION: 'security_violation',
  QUOTA_EXCEEDED: 'quota_exceeded',
} as const

export class ActivityLogger {
  /**
   * Log user activity via API
   */
  static async logActivity(data: ActivityLogData): Promise<string | null> {
    try {
      const response = await fetch(ACTIVITY_ENDPOINTS.LOG, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to log activity via API')
      }

      const result = await response.json()
      return result.data?.id || 'success'
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('Exception while logging user activity via API:', message)
      return null
    }
  }

  /**
   * Log authentication activities
   */
  static async logAuth(userId: string, eventType: string, success: boolean, errorMessage?: string) {
    const actionDescriptions = {
      [ActivityEventTypes.LOGIN]: success ? 'User logged in successfully' : 'Failed login attempt',
      [ActivityEventTypes.LOGOUT]: 'User logged out',
      [ActivityEventTypes.REGISTER]: success ? 'User registered successfully' : 'Failed registration attempt',
      [ActivityEventTypes.PASSWORD_RESET]: 'Password reset requested',
      [ActivityEventTypes.PASSWORD_CHANGE]: success ? 'Password changed successfully' : 'Failed password change',
    }

    return this.logActivity({
      userId,
      eventType,
      actionDescription: actionDescriptions[eventType as keyof typeof actionDescriptions] || eventType,
      success,
      errorMessage,
      metadata: { authenticationEvent: true }
    })
  }

  /**
   * Log job management activities
   */
  static async logJobActivity(userId: string, eventType: string, jobId: string, jobName: string, metadata?: Record<string, Json>) {
    const actionDescriptions = {
      [ActivityEventTypes.JOB_CREATE]: `Created new job: ${jobName}`,
      [ActivityEventTypes.JOB_UPDATE]: `Updated job: ${jobName}`,
      [ActivityEventTypes.JOB_DELETE]: `Deleted job: ${jobName}`,
      [ActivityEventTypes.JOB_START]: `Started job: ${jobName}`,
      [ActivityEventTypes.JOB_PAUSE]: `Paused job: ${jobName}`,
      [ActivityEventTypes.JOB_RESUME]: `Resumed job: ${jobName}`,
      [ActivityEventTypes.JOB_CANCEL]: `Cancelled job: ${jobName}`,
    }

    return this.logActivity({
      userId,
      eventType,
      actionDescription: actionDescriptions[eventType as keyof typeof actionDescriptions] || eventType,
      targetType: 'jobs',
      targetId: jobId,
      metadata: {
        jobName,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log user dashboard activities
   */
  static async logUserDashboardActivity(userId: string, action: string, details?: string, metadata?: Record<string, Json>) {
    return this.logActivity({
      userId,
      eventType: ActivityEventTypes.DASHBOARD_VIEW,
      actionDescription: details ? `${action}: ${details}` : action,
      metadata: {
        userDashboard: true,
        ...metadata
      }
    })
  }

  /**
   * Log page view activities
   */
  static async logPageView(userId: string, pagePath: string, pageTitle?: string, metadata?: Record<string, Json>) {
    return this.logActivity({
      userId,
      eventType: ActivityEventTypes.PAGE_VIEW,
      actionDescription: `Visited ${pageTitle || pagePath}`,
      metadata: {
        pagePath,
        pageTitle,
        pageView: true,
        ...metadata
      }
    })
  }

  /**
   * Log billing and payment activities
   */
  static async logBillingActivity(userId: string, eventType: string, details: string, metadata?: Record<string, Json>) {
    const actionDescriptions = {
      [ActivityEventTypes.CHECKOUT_INITIATED]: `Initiated checkout: ${details}`,
      [ActivityEventTypes.ORDER_CREATED]: `Created order: ${details}`,
      [ActivityEventTypes.PAYMENT_PROOF_UPLOADED]: `Uploaded payment proof: ${details}`,
      [ActivityEventTypes.SUBSCRIPTION_UPGRADE]: `Upgraded subscription: ${details}`,
      [ActivityEventTypes.BILLING_VIEW]: `Viewed billing dashboard: ${details}`,
      [ActivityEventTypes.BILLING_HISTORY_VIEW]: `Viewed billing history: ${details}`,
      [ActivityEventTypes.ORDER_VIEW]: `Viewed order details: ${details}`,
      [ActivityEventTypes.PACKAGE_SELECTION]: `Selected package: ${details}`,
    }

    return this.logActivity({
      userId,
      eventType,
      actionDescription: actionDescriptions[eventType as keyof typeof actionDescriptions] || `Billing activity: ${details}`,
      metadata: {
        billingActivity: true,
        ...metadata
      }
    })
  }

  /**
   * Log profile and settings activities
   */
  static async logProfileActivity(userId: string, eventType: string, details: string, metadata?: Record<string, Json>) {
    const actionDescriptions = {
      [ActivityEventTypes.PROFILE_UPDATE]: `Updated profile: ${details}`,
      [ActivityEventTypes.SETTINGS_CHANGE]: `Changed settings: ${details}`,
      [ActivityEventTypes.SETTINGS_VIEW]: `Viewed settings page: ${details}`,
      [ActivityEventTypes.NOTIFICATION_SETTINGS_UPDATE]: `Updated notification settings: ${details}`,
    }

    return this.logActivity({
      userId,
      eventType,
      actionDescription: actionDescriptions[eventType as keyof typeof actionDescriptions] || `Profile activity: ${details}`,
      metadata: {
        profileActivity: true,
        ...metadata
      }
    })
  }

  /**
   * Log keyword tracker activities
   */
  static async logKeywordActivity(userId: string, eventType: string, details: string, metadata?: Record<string, Json>) {
    const actionDescriptions = {
      [ActivityEventTypes.KEYWORD_ADD]: `Added keyword: ${details}`,
      [ActivityEventTypes.KEYWORD_DELETE]: `Deleted keyword: ${details}`,
      [ActivityEventTypes.KEYWORD_UPDATE]: `Updated keyword: ${details}`,
      [ActivityEventTypes.KEYWORD_BULK_DELETE]: `Bulk deleted keywords: ${details}`,
      [ActivityEventTypes.KEYWORD_TAG_ADD]: `Added tag to keywords: ${details}`,
      [ActivityEventTypes.KEYWORD_TAG_REMOVE]: `Removed tag from keywords: ${details}`,
      [ActivityEventTypes.DOMAIN_ADD]: `Added domain: ${details}`,
      [ActivityEventTypes.DOMAIN_DELETE]: `Deleted domain: ${details}`,
      [ActivityEventTypes.DOMAIN_UPDATE]: `Updated domain: ${details}`,
      [ActivityEventTypes.KEYWORD_TRACKER_VIEW]: `Viewed keyword tracker: ${details}`,
      [ActivityEventTypes.RANK_HISTORY_VIEW]: `Viewed rank history: ${details}`,
    }

    return this.logActivity({
      userId,
      eventType,
      actionDescription: actionDescriptions[eventType as keyof typeof actionDescriptions] || `Keyword tracker activity: ${details}`,
      metadata: {
        keywordTrackerActivity: true,
        ...metadata
      }
    })
  }
}
