import type { Package } from '@indexnow/shared';

// Exported components for User Detail page
export { UserProfileCard } from './UserProfileCard';
export { UserActionsPanel } from './UserActionsPanel';
export { PackageSubscriptionCard } from './PackageSubscriptionCard';
export { UserActivityCard } from './UserActivityCard';
export { UserSecurityCard } from './UserSecurityCard';
export { PackageChangeModal } from './PackageChangeModal';

// Type definitions
/**
 * UserProfile type that matches the admin API response shape.
 * Broader than AdminUserProfile to handle nullable fields from the API.
 */
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
  phone_number: string | null;
  package_id?: string;
  subscribed_at?: string | null;
  subscription_ends_at?: string;
  daily_quota_used?: number;
  daily_quota_limit?: number;
  daily_quota_reset_date?: string;
  expires_at?: string | null;
  country?: string;
  package?: Package | null;
  email?: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  [key: string]: unknown;
}

export interface UserActions {
  suspend: boolean;
  resetPassword: boolean;
  editData: boolean;
  resetQuota: boolean;
  changePackage: boolean;
  extendSubscription: boolean;
}

export interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  [key: string]: unknown;
}

export interface ActivityLog {
  id: string;
  action: string;
  event_type: string;
  action_description: string | null;
  created_at: string;
  ip_address?: string;
  user_agent?: string | null;
  device_info?: DeviceInfo;
  metadata?: Record<string, unknown>;
}

export interface SecurityData {
  ipAddresses: Array<{
    ip: string;
    lastUsed: string;
    usageCount: number;
  }>;
  locations: string[];
  loginAttempts: {
    total: number;
    successful: number;
    failed: number;
    recent: Array<{
      success: boolean;
      timestamp: string;
      ip_address?: string;
      device_info?: Record<string, unknown>;
    }>;
  };
  activity: {
    lastActivity: string | null;
    firstSeen: string | null;
    totalActivities: number;
  };
  securityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}
