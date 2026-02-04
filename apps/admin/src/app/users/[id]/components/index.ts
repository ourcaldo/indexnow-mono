import { AdminUserProfile, EnrichedActivityLog } from '@indexnow/shared'

// Exported components for User Detail page
export { UserProfileCard } from './UserProfileCard'
export { UserActionsPanel } from './UserActionsPanel'
export { PackageSubscriptionCard } from './PackageSubscriptionCard'
export { UserActivityCard } from './UserActivityCard'
export { UserSecurityCard } from './UserSecurityCard'
export { PackageChangeModal } from './PackageChangeModal'


// Type definitions
export type UserProfile = AdminUserProfile

export interface UserActions {
  suspend: boolean
  resetPassword: boolean
  editData: boolean
  resetQuota: boolean
  changePackage: boolean
  extendSubscription: boolean
}

export interface DeviceInfo {
  browser?: string
  os?: string
  device?: string
  [key: string]: unknown
}

export interface ActivityLog {
  id: string
  action: string
  created_at: string
  ip_address?: string
  device_info?: DeviceInfo
  metadata?: Record<string, unknown>
}

export interface SecurityData {
  ipAddresses: Array<{
    ip: string
    lastUsed: string
    usageCount: number
  }>
  locations: string[]
  loginAttempts: {
    total: number
    successful: number
    failed: number
    recent: Array<{
      success: boolean
      timestamp: string
      ip_address?: string
      device_info?: any
    }>
  }
  activity: {
    lastActivity: string | null
    firstSeen: string | null
    totalActivities: number
  }
  securityScore: number
  riskLevel: 'low' | 'medium' | 'high'
}
