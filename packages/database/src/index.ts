// Main exports - types from shared package
import type { Database } from '@indexnow/shared';

export type {
  Database,
  DbJson as Json,
  DbUserProfile as UserProfile,
  DbUserSettings as UserSettings,
  DbDashboardNotification as DashboardNotification,
  DbRankKeywordRow as RankKeywordRow,
  DbSystemErrorLog as SystemErrorLog,
  // Database column types
  PackageFeatures,
  PackageQuotaLimits,
  PackagePricingTier,
  PackagePricingTiers,
  PaymentGatewayCredentials,
  PaymentGatewayConfiguration,
  TransactionGatewayResponse,
  TransactionMetadata,
  SiteIntegrationRateLimits,
  SiteIntegrationAlertSettings,
} from '@indexnow/shared';

// Derived types for Insert/Update variants not exported by shared
export type InsertUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Insert'];
export type UpdateUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Update'];

export type InsertUserSettings = Database['public']['Tables']['indb_auth_user_settings']['Insert'];
export type UpdateUserSettings = Database['public']['Tables']['indb_auth_user_settings']['Update'];

export type InsertDashboardNotification =
  Database['public']['Tables']['indb_notifications_dashboard']['Insert'];
export type UpdateDashboardNotification =
  Database['public']['Tables']['indb_notifications_dashboard']['Update'];

export type InsertRankKeywordRow = Database['public']['Tables']['indb_rank_keywords']['Insert'];
export type UpdateRankKeywordRow = Database['public']['Tables']['indb_rank_keywords']['Update'];

export type InsertSystemErrorLog = Database['public']['Tables']['indb_system_error_logs']['Insert'];
export type UpdateSystemErrorLog = Database['public']['Tables']['indb_system_error_logs']['Update'];

// Client exports
export {
  createBrowserClient,
  getBrowserClient,
  supabaseBrowser,
  supabase,
} from '@indexnow/supabase-client';

// Typed Supabase client accessors — these preserve the Database generic
// through the re-export chain (unlike direct re-exports which lose it in DTS generation)
import { supabaseBrowser as _supabaseBrowser } from '@indexnow/supabase-client';
import { supabaseAdmin as _supabaseAdmin } from './server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Re-export commonly used Supabase types so consumers don't need a direct @supabase dependency
export type { SupabaseClient } from '@supabase/supabase-js';
export type {
  User as SupabaseUser,
  Session as SupabaseSession,
  AuthChangeEvent,
  Subscription as AuthSubscription,
  PostgrestError,
} from '@supabase/supabase-js';

/**
 * Browser Supabase client with Database generic preserved.
 * C-01: The `as unknown as` cast is required because @supabase/ssr and @supabase/supabase-js
 * resolve different generic arities for SupabaseClient across pnpm workspace dependency versions.
 * The underlying clients ARE created with the correct Database generic in their respective
 * factory functions — only the DTS nominal type is lost in the re-export chain.
 */
export const typedSupabaseBrowser = _supabaseBrowser as unknown as SupabaseClient<Database>;
/** Admin (service role) Supabase client with Database generic preserved (see C-01 note above) */
export const typedSupabaseAdmin = _supabaseAdmin as unknown as SupabaseClient<Database>;

// Server exports
export {
  createServerClient,
  createAdminClient,
  createTokenClient,
  createAnonServerClient,
  createRequestAuthClient,
  supabaseAdmin,
  type CookieStore,
  type AuthRequest,
  type RequestAuthClientOptions,
} from './server';

// Middleware utilities (Edge-compatible, no 'server-only')
export {
  createMiddlewareClient,
  type MiddlewareRequest,
  type MiddlewareResponse,
  type MiddlewareResponseFactory,
} from './middleware-utils';

// Security exports
export {
  SecureServiceRoleWrapper,
  SecureServiceRoleHelpers,
  type ServiceRoleOperationContext,
  type UserOperationContext,
  type ServiceRoleQueryOptions,
} from './security/SecureServiceRoleWrapper';

// Service exports
export { DatabaseService, db } from './DatabaseService';

// Utility exports
export { ApiError } from './utils/api-error';
export { ApiClient, apiClient } from './utils/ApiClient';
export * from './utils/site-settings';
export * from './utils/queryClient';
export { toJson, fromJson, fromJsonOr } from './utils/json-helpers';
export { asTypedClient } from './utils/supabase-compat';

// Hook exports
export * from './hooks';
