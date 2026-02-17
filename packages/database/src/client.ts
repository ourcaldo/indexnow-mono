/**
 * Client-safe database exports.
 * Import from '@indexnow/database/client' in client components, Edge middleware,
 * and any context where 'server-only' is not allowed.
 *
 * For server-only code (supabaseAdmin, createServerClient, etc.),
 * import from '@indexnow/database' instead.
 */

// Types from shared package
import type { Database } from '@indexnow/shared'

export type {
    Database,
    DbJson as Json,
    DbUserProfile as UserProfile,
    DbUserSettings as UserSettings,
    DbDashboardNotification as DashboardNotification,
    DbRankKeywordRow as RankKeywordRow,
    DbSystemErrorLog as SystemErrorLog,
    PackageFeatures,
    PackageQuotaLimits,
    PackagePricingTier,
    PackagePricingTiers,
    PaymentGatewayCredentials,
    PaymentGatewayConfiguration,
    TransactionGatewayResponse,
    TransactionMetadata,
    SiteIntegrationRateLimits,
    SiteIntegrationAlertSettings
} from '@indexnow/shared'

// Derived types
export type InsertUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Insert']
export type UpdateUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Update']
export type InsertUserSettings = Database['public']['Tables']['indb_auth_user_settings']['Insert']
export type UpdateUserSettings = Database['public']['Tables']['indb_auth_user_settings']['Update']
export type InsertDashboardNotification = Database['public']['Tables']['indb_notifications_dashboard']['Insert']
export type UpdateDashboardNotification = Database['public']['Tables']['indb_notifications_dashboard']['Update']
export type InsertRankKeywordRow = Database['public']['Tables']['indb_rank_keywords']['Insert']
export type UpdateRankKeywordRow = Database['public']['Tables']['indb_rank_keywords']['Update']
export type InsertSystemErrorLog = Database['public']['Tables']['indb_system_error_logs']['Insert']
export type UpdateSystemErrorLog = Database['public']['Tables']['indb_system_error_logs']['Update']

// Client (browser) exports
export { createBrowserClient, getBrowserClient, supabaseBrowser, supabase } from '@indexnow/supabase-client';

// Typed browser client
import { supabaseBrowser as _supabaseBrowser } from '@indexnow/supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';
export const typedSupabaseBrowser = _supabaseBrowser as unknown as SupabaseClient<Database>;

// Re-export Supabase types
export type { SupabaseClient } from '@supabase/supabase-js'
export type { User as SupabaseUser, Session as SupabaseSession, AuthChangeEvent, Subscription as AuthSubscription, PostgrestError } from '@supabase/supabase-js'

// Middleware utilities (Edge-compatible, no 'server-only')
export {
    createMiddlewareClient,
    type MiddlewareRequest,
    type MiddlewareResponse,
    type MiddlewareResponseFactory,
} from './middleware-utils'

// Hook exports
export * from './hooks'

// Utility exports (client-safe)
export {
    ApiClient,
    apiClient,
    ApiError as ClientApiError
} from './utils/ApiClient'
export * from './utils/site-settings'
export * from './utils/queryClient'
