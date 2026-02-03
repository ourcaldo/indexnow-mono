/**
 * Types barrel export for IndexNow Studio
 * P4.1 Enhanced Type System - Centralized type definitions
 */

// P4.1 Enhanced Type System - New organized structure
export * from './global';
export * from './api';
export * from './components';
export * from './services';
export * from './monitoring/ErrorTrackingTypes';
export * from './queues/QueueTypes';
// export * from './business/SeRankingTypes'; // Conflicts with api
export * from './business/KeywordBankTypes';
export * from './business/EnrichmentJobTypes';
export * from './business/ServiceTypes';
// export * from './business/RankTrackingTypes'; // Conflicts with common types

// Export unique types from RankTrackingTypes to avoid conflicts (e.g. Location)
export type {
  Device, SearchEngine, CountryCode,
  RankKeyword, RankHistory, SerchResult, SearchFeature, RankTrackingDomain,
  CreateKeywordRequest, UpdateKeywordRequest, BulkKeywordRequest, RankCheckRequest, RankCheckResult,
  DashboardRecentKeyword, KeywordAnalytics, DomainAnalytics,
  Competitor, CompetitorAnalysis,
  RankReport, GenerateReportRequest,
  RankTrackingQuota, RankTrackingLimits, RankTrackingSettings,
  AvailableLocation
} from './business/RankTrackingTypes';

// Export unique types from UserTypes to avoid conflicts with global/User
export type {
  UserManagementAction,
  UserStats,
  TeamInvitation,
  Session,
  LoginAttempt,
  AuthTokens,
  PhoneVerification
} from './business/UserTypes';

// Export unique types from PaymentTypes to avoid conflicts with services/Payments
export type {
  SavedPaymentMethod,
  Dispute,
  PaymentWebhook
} from './business/PaymentTypes';

// Explicitly export all types from database with aliases where appropriate
export type {
  PostgrestError,
  Json as DbJson,
  
  // Database JSON types
  PackageFeatures,
  PackageQuotaLimits,
  PackagePricingTier,
  PricingTierDetails,
  PackagePricingTiers,
  SiteIntegrationRateLimits,
  SiteIntegrationAlertSettings,
  PaymentGatewayCredentials,
  PaymentGatewayConfiguration,
  TransactionGatewayResponse,
  TransactionMetadata,

  // Main Database Type
  Database,

  // Row Types (Aliased to avoid conflicts)
  UserProfile as DbUserProfile,
  UserSettings as DbUserSettings,
  DashboardNotification as DbDashboardNotification,
  DailyStats as DbDailyStats,
  KeywordCountry as DbKeywordCountry,
  KeywordDomain as DbKeywordDomain,
  KeywordKeyword as DbKeywordKeyword,
  KeywordRanking as DbKeywordRanking,
  KeywordUsage as DbKeywordUsage,
  RankKeywordRow as DbRankKeywordRow,
  SiteIntegration as DbSiteIntegration,
  SeRankingIntegration as DbSeRankingIntegration,
  SeRankingUsageLog as DbSeRankingUsageLog,
  SecurityAuditLog as DbSecurityAuditLog,
  SecurityActivityLog as DbSecurityActivityLog,
  SystemErrorLog as DbSystemErrorLog,
  PackageRow as DbPackageRow,
  SubscriptionRow as DbSubscriptionRow,
  TransactionRow as DbTransactionRow,
  ProfileRow as DbProfileRow,
  UserSettingsRow as DbUserSettingsRow,

  // Insert Types
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
  InsertTransaction,
  InsertPackage,

  // Update Types
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
  UpdatePackage
} from './database';

// Common utility types
export {
  type Nullable, type Optional, type Maybe, type ID, type UUID, type Timestamp,
  type Status, type Priority, type Visibility, type BaseEntity, type AuditableEntity,
  type SoftDeletableEntity, type PaginationParams, type PaginationMeta,
  type PaginatedResult, type SortParam, type SortOptions, type FilterParam,
  type FilterOperator, type SearchParams, type SearchResult, type DateRange,
  type TimeRange, type Period, type Coordinates, type Address, type Location,
  type FileInfo, type FileUpload, type FileDownload, type ImageInfo, type VideoInfo,
  type AudioInfo, type Notification, type NotificationType, type Tag, type TaggedEntity,
  type Comment, type CommentableEntity, type Metric, type MetricGroup, type Setting,
  type SettingsGroup, type Config, type HealthStatus, type HealthCheck, type Webhook,
  type WebhookEvent, type Task, type TaskResult, type CacheEntry, type CacheStats,
  type Prettify, type DeepPartial, type RequiredFields, type OptionalFields,
  type KeysOfType
} from './common/CommonTypes';
export * from './common/ErrorTypes';
export { 
  type ApiStatus, 
  type ApiMetadata, 
  type BaseResponse, 
  type ErrorResponse, 
  type SuccessResponse 
} from './common/ResponseTypes';
export * from './common/Json';
