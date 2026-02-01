// Enhanced Hook System - P3.1 Implementation
// Centralized exports for all custom hooks

// Data Hooks - Core data fetching and management
// Note: useJobManagement has been removed - Google indexing feature is no longer supported
export { useEnhancedUserProfile } from './data/useEnhancedUserProfile'
export { usePaymentHistory } from './data/usePaymentHistory'
export { useRankTracking } from './data/useRankTracking'

// Business Logic Hooks - Complex business operations
export { useTrialManager } from './business/useTrialManager'
export { useQuotaManager } from './business/useQuotaManager'
export { usePricingData, type PackageData, type BillingPeriod as PricingBillingPeriod } from './business/usePricingData'
// Note: useServiceAccounts has been removed - Google indexing feature is no longer supported

// UI/UX Hooks - User interface state and interactions
export { useModal } from './ui/useModal'
export { useNotification } from './ui/useNotification'

// Legacy Hooks - Existing hooks maintained for compatibility
export { useUserProfile } from './useUserProfile'
export { useGlobalQuotaManager } from './useGlobalQuotaManager'
export { useKeywordUsage } from './useKeywordUsage'
export { useQuotaValidation } from './useQuotaValidation'
export { useActivityLogger, usePageViewLogger } from './useActivityLogger'
export { 
  useSiteSettings, 
  useSiteLogo, 
  useSiteName, 
  useFavicon 
} from './use-site-settings'
export { useDashboardData } from './useDashboardData'
export { useAnalytics } from './useAnalytics'

// Admin Hooks - Admin panel specific functionality
export { 
  useAdminActivityLogger, 
  useAdminPageViewLogger,
  useAdminDashboardLogger,
  useAdminOrderLogger,
  useAdminSettingsLogger,
  useAdminUserLogger
} from './use-admin-activity-logger'

// Type exports for TypeScript support
export type { NotificationType } from './ui/useNotification'