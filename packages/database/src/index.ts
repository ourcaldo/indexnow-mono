// Main exports - types from shared package
export type { 
    Database, 
    Json,
    UserProfile, 
    UserSettings,
    DashboardNotification,
    DailyStats,
    KeywordCountry,
    KeywordDomain,
    KeywordKeyword,
    KeywordRanking,
    KeywordUsage,
    SiteIntegration,
    SeRankingIntegration,
    SeRankingUsageLog,
    SecurityAuditLog,
    SecurityActivityLog,
    PackageRow,
    SubscriptionRow,
    TransactionRow,
    ProfileRow,
    UserSettingsRow,
    InsertUserProfile,
    InsertUserSettings,
    InsertDashboardNotification,
    InsertKeywordCountry,
    InsertKeywordDomain,
    InsertKeywordKeyword,
    InsertKeywordRanking,
    InsertKeywordUsage,
    InsertSiteIntegration,
    InsertSeRankingIntegration,
    InsertSeRankingUsageLog,
    InsertSecurityAuditLog,
    InsertSecurityActivityLog,
    InsertSubscription,
    UpdateUserProfile,
    UpdateUserSettings,
    UpdateKeywordDomain,
    UpdateKeywordKeyword,
    UpdateKeywordRanking,
    UpdateKeywordUsage,
    UpdateSiteIntegration,
    UpdateSeRankingIntegration,
    UpdateSeRankingUsageLog,
    UpdateDashboardNotification,
    UpdateTransaction,
    UpdateSubscription,
    UpdatePackage,
    PostgrestError
} from '@indexnow/shared'

// Client exports
export { createBrowserClient, getBrowserClient, supabaseBrowser as supabase, supabaseBrowser } from '@indexnow/shared'

// Server exports
export { createClient as createServerClient, createAdminClient, supabaseAdmin, type CookieStore } from './server'

// Security exports
export { 
    SecureServiceRoleWrapper, 
    SecureServiceRoleHelpers,
    type ServiceRoleOperationContext,
    type UserOperationContext,
    type ServiceRoleQueryOptions
} from './security/SecureServiceRoleWrapper'
