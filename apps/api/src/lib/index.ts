/**
 * Main library barrel export for IndexNow Studio
 * Provides access to all core functionality, services, and types
 */

// Core exports
export * from './core';

// Services exports
export * from './services';

// Types and Utils from Shared
export { 
  formatDate, formatRelativeTime, formatNumber, truncateString, capitalizeFirstLetter,
  ActivityLogger, ActivityEventTypes
} from '@indexnow/shared';

export type { 
  ApiResponse, SuccessResponse, ErrorResponse,
  ID, UUID, Timestamp, Status, Priority, BaseEntity, AuditableEntity,
  PaginationParams, PaginationMeta, PaginatedResult, SortParam, FilterParam,
  SearchParams, SearchResult, DateRange, FileInfo, Tag, Comment,
  Metric, Setting, Config, Webhook, Task, AppError
} from '@indexnow/shared';

export { AppConfig, DatabaseConfig, PaymentConfig } from './core';

// Re-export specific items to avoid conflicts
export { getCacheService } from './services/infrastructure/CacheService';
export { createEmailServiceFromEnv } from './services/external/EmailService';