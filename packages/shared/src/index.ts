// (#V7 L-02) SchemaPaginatedResponse is an intentional public alias of PaginatedResponse
// from the schema module, kept for backward compatibility with existing consumers.
export {
  type PaginatedResponse as SchemaPaginatedResponse,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserProfileSchema,
  updateUserSettingsSchema,
  changePasswordSchema,
  updateSiteSettingsSchema,
  apiRequestSchemas,
  type DashboardStats,
} from './schema';
// ── Constants ──
export * from './constants/ValidationRules';
export * from './constants/ApiEndpoints';
export * from './constants/ErrorMessages';
export {
  APP_METADATA,
  USER_ROLES,
  ROLE_PERMISSIONS,
  JOB_STATUS,
  SCHEDULE_TYPES,
  JOB_TYPES,
  RANK_TRACKING,
  PAGINATION,
  FILE_UPLOAD,
  NOTIFICATION_TYPES,
  EMAIL_TEMPLATES,
  CACHE_KEYS,
  CACHE_TTL,
  RATE_LIMITS,
  DEFAULT_SETTINGS,
  REGEX_PATTERNS,
  HTTP_STATUS,
  TIME,
} from './constants/AppConstants';

// ── Types (barrel) ──
// Wildcard re-export: covers Database, Row/Insert/Update types, global/api/component/service types,
// ErrorTypes, QueueTypes, RankTrackingTypes (named), UserTypes (named), CommonTypes, ResponseTypes, Json.
// Changing to named exports would require updating 50+ consumer files — left as wildcard intentionally.
export * from './types';

// ── Utilities ──
export * from './utils/logger';
// NOTE: env-validator is available via direct import '@indexnow/shared/utils/env-validator' if needed.
// Removed from barrel — no current consumers.
export {
  formatDate,
  formatRelativeTime,
  formatNumber,
  truncateString,
  capitalizeFirstLetter,
} from './utils/formatters';
export * from './utils/ui';
export * from './utils/resilience';
export * from './utils/currency-utils';
export * from './utils/url-utils';
export * from './utils/ip-device-utils';
export * from './utils/countries';
export * from './utils/rate-limiter';
// NOTE: pii-sanitizer is available via direct import '@indexnow/shared/utils/pii-sanitizer' if needed.
// Removed from barrel — no current consumers.
export * from './utils/sql-utils';
export * from './utils/async-utils';

// ── Core ──
export {
  formatSuccess,
  formatError,
  type ApiResponse,
  type ApiSuccessResponse,
  type ApiErrorResponse,
} from './core/api-response';
export * from './core/activity/ActivityLogger';
export * from './core/config/AppConfig';
