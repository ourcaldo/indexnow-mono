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

export type ActivityLog = EnrichedActivityLog

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
