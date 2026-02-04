/**
 * Comprehensive Activity Logging Service
 * Tracks all user activities across the application
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { InsertSecurityActivityLog, Json } from '@indexnow/shared';
import { logger } from './error-handling';
import { getRequestInfo, formatDeviceInfo, formatLocationData, DeviceInfo, LocationData } from '../utils/ip-device-utils';
import { NextRequest } from 'next/server';

export interface ActivityLogData {
  userId: string;
  eventType: string;
  actionDescription: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo | null;
  locationData?: LocationData | null;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown> | Json;
  request?: NextRequest;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  event_type: string;
  action_description: string;
  target_type?: string;
  target_id?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: DeviceInfo | null;
  location_data?: LocationData | null;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, unknown> | Json;
  created_at: string;
}

export const ActivityEventTypes = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGE: 'password_change',
  PROFILE_UPDATE: 'profile_update',
  SETTINGS_CHANGE: 'settings_change',
  JOB_CREATE: 'job_create',
  JOB_UPDATE: 'job_update',
  JOB_DELETE: 'job_delete',
  API_CALL: 'api_call',
  DASHBOARD_VIEW: 'dashboard_view',
  PAGE_VIEW: 'page_view',
  USER_MANAGEMENT: 'user_management',
  USER_SUSPEND: 'user_suspend',
  USER_UNSUSPEND: 'user_unsuspend',
  USER_PASSWORD_RESET: 'user_password_reset',
  USER_PROFILE_UPDATE: 'user_profile_update',
  USER_ROLE_CHANGE: 'user_role_change',
  USER_QUOTA_RESET: 'user_quota_reset',
  USER_PACKAGE_CHANGE: 'user_package_change',
  USER_SUBSCRIPTION_EXTEND: 'user_subscription_extend',
  USER_SECURITY_VIEW: 'user_security_view',
  USER_ACTIVITY_VIEW: 'user_activity_view'
} as const;

export class ActivityLogger {
  static async logActivity(data: ActivityLogData): Promise<string | null> {
    try {
      let { ipAddress, userAgent, deviceInfo, locationData } = data;

      if (data.request && (!ipAddress || !userAgent || !deviceInfo)) {
        const requestInfo = await getRequestInfo(data.request);
        ipAddress = ipAddress || requestInfo.ipAddress || undefined;
        userAgent = userAgent || requestInfo.userAgent || undefined;
        deviceInfo = deviceInfo || requestInfo.deviceInfo;
        locationData = locationData || requestInfo.locationData;
      }

      // Ensure metadata is an object before spreading
      const sourceMetadata = (data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)) 
        ? data.metadata as Record<string, unknown> 
        : {};

      const enhancedMetadata: Json = {
        ...sourceMetadata,
        deviceFormatted: deviceInfo ? formatDeviceInfo(deviceInfo) : null,
        locationFormatted: locationData ? formatLocationData(locationData) : null,
        timestamp: new Date().toISOString()
      };

      const result = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'log_user_activity',
          reason: 'Activity logger recording user activity',
          source: 'ActivityLogger.logActivity',
          metadata: {
            targetUserId: data.userId,
            eventType: data.eventType,
            success: data.success !== false
          }
        },
        { table: 'indb_security_activity_logs', operationType: 'insert' },
        async () => {
          const insertData: InsertSecurityActivityLog = {
            user_id: data.userId,
            event_type: data.eventType,
            action_description: data.actionDescription,
            target_type: data.targetType || null,
            target_id: data.targetId || null,
            ip_address: ipAddress || null,
            user_agent: userAgent || null,
            device_info: deviceInfo as unknown as Json || null,
            location_data: locationData as unknown as Json || null,
            success: data.success !== false,
            error_message: data.errorMessage || null,
            metadata: enhancedMetadata,
          };

          const { data: result, error } = await supabaseAdmin
            .from('indb_security_activity_logs')
            .insert(insertData)
            .select('id')
            .single();

          if (error) throw error;
          return result;
        }
      );

      return result.id;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage, userId: data.userId, eventType: data.eventType }, 'Failed to log user activity');
      return null;
    }
  }

  static async logAuth(userId: string, eventType: string, success: boolean, request?: NextRequest, errorMessage?: string) {
    const actionDescriptions: Record<string, string> = {
      [ActivityEventTypes.LOGIN]: success ? 'User logged in successfully' : 'Failed login attempt',
      [ActivityEventTypes.LOGOUT]: 'User logged out',
      [ActivityEventTypes.REGISTER]: success ? 'User registered successfully' : 'Failed registration attempt',
    };

    return this.logActivity({
      userId,
      eventType,
      actionDescription: actionDescriptions[eventType] || eventType,
      success,
      errorMessage,
      request,
      metadata: { authenticationEvent: true }
    });
  }

  static async logAdminAction(userId: string, action: string, targetUserId?: string, actionDescription?: string, request?: NextRequest, metadata?: Record<string, unknown>) {
    return this.logActivity({
      userId,
      eventType: ActivityEventTypes.USER_MANAGEMENT,
      actionDescription: actionDescription || `Admin action: ${action}`,
      targetType: targetUserId ? 'user' : undefined,
      targetId: targetUserId,
      request,
      metadata: { adminAction: true, action, ...metadata }
    });
  }
}
