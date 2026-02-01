/**
 * Services barrel export for IndexNow Studio
 * Centralized export for all service modules
 * Note: Google and Indexing services have been removed
 */

// External services
export * from './external/SupabaseService';
export * from './external/EmailService';

// Business services
export * from './business/RankTrackingService';
export * from './business/UserManagementService';

// Infrastructure services
export * from './infrastructure/CacheService';

// Service factory functions
export { getSupabaseService } from './external/SupabaseService';
export { getCacheService } from './infrastructure/CacheService';
export { createEmailServiceFromEnv } from './external/EmailService';