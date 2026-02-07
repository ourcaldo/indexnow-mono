// Enhanced Hook System - P3.1 Implementation
// Centralized exports for all custom hooks

// Data Hooks - Core data fetching and management
// Query Keys Factory - Centralized cache key management for React Query
export { queryKeys } from './queryKeys'
export type { KeywordFilters, OrderFilters, UserFilters } from './queryKeys'

// Note: useJobManagement has been removed - Google indexing feature is no longer supported
export { useEnhancedUserProfile } from './data/useEnhancedUserProfile'
export { usePaymentHistory } from './data/usePaymentHistory'
export { useRankTracking } from './data/useRankTracking'

// Business Logic Hooks - Complex business operations
export { useTrialManager } from './business/useTrialManager'
export { useQuotaManager } from './business/useQuotaManager'
export { usePricingData, type PackageData, type BillingPeriod as PricingBillingPeriod } from './business/usePricingData'
// Note: useServiceAccounts has been removed - Google indexing feature is no longer supported

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