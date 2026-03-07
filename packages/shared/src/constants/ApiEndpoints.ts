import { AppConfig } from '../core/config/AppConfig';

/**
 * API Endpoints for IndexNow Studio
 * Centralized API endpoint definitions.
 *
 * Consumer legend (inline comments):
 *   ✅ = actively consumed by a frontend app
 *   🔧 = backend route exists, no frontend consumer wired yet
 *   🖥️ = system/monitoring — called externally, not by frontend apps
 *   🔌 = internal integration — called by API server only
 */

// Base API paths - normalize URL to avoid double slashes
const normalizeApiBaseUrl = (url: string): string => {
  return url.replace(/\/+$/, ''); // Remove trailing slashes
};
// Use apiBaseUrl (dedicated API server URL) when available,
// otherwise fall back to baseUrl + /api (same-origin deployment)
const API_BASE_URL = normalizeApiBaseUrl(
  AppConfig.app.apiBaseUrl || `${AppConfig.app.baseUrl || ''}/api`
);
export const API_BASE = {
  V1: `${API_BASE_URL}/v1`,
  SYSTEM: `${API_BASE_URL}/system`,
} as const;

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  // Auth flow — API proxy routes (frontend currently uses Supabase SDK directly)
  LOGIN: `${API_BASE.V1}/auth/login`, // 🔧 proxy route ready
  LOGOUT: `${API_BASE.V1}/auth/logout`, // 🔧 proxy route ready
  REGISTER: `${API_BASE.V1}/auth/register`, // 🔧 proxy route ready
  SESSION: `${API_BASE.V1}/auth/session`, // 🔧 proxy route ready
  RESET_PASSWORD: `${API_BASE.V1}/auth/reset-password`, // 🔧 proxy route ready
  MAGIC_LINK: `${API_BASE.V1}/auth/magic-link`, // 🔧 proxy route ready
  REFRESH: `${API_BASE.V1}/auth/refresh`, // 🔧 proxy route ready

  // Active — consumed by user-dashboard
  DETECT_LOCATION: `${API_BASE.V1}/auth/detect-location`, // ✅ register page
  RESEND_VERIFICATION: `${API_BASE.V1}/auth/resend-verification`, // ✅ resend-verification page
  PROFILE: `${API_BASE.V1}/auth/user/profile`, // ✅ hooks.ts
  SETTINGS: `${API_BASE.V1}/auth/user/settings`, // ✅ hooks.ts, notifications
  TRIAL_ELIGIBILITY: `${API_BASE.V1}/auth/user/trial-eligibility`, // ✅ hooks.ts

  // Backend-ready, no frontend consumer yet
  CHANGE_PASSWORD: `${API_BASE.V1}/auth/user/change-password`, // 🔧 no UI wired
  QUOTA: `${API_BASE.V1}/auth/user/quota`, // 🔧 dashboard uses aggregate instead
  TRIAL_STATUS: `${API_BASE.V1}/auth/user/trial-status`, // 🔧 no UI wired
} as const;

// Admin endpoints
export const ADMIN_ENDPOINTS = {
  DASHBOARD: `${API_BASE.V1}/admin/dashboard`, // ✅ admin
  VERIFY_ROLE: `${API_BASE.V1}/admin/verify-role`, // 🔧 middleware handles role check differently

  // User management — ✅ used by admin hooks
  USERS: `${API_BASE.V1}/admin/users`,
  USER_BY_ID: (id: string) => `${API_BASE.V1}/admin/users/${id}`,
  USER_ROLE: (id: string) => `${API_BASE.V1}/admin/users/${id}/role`,

  // User management — 🔧 backend-ready, no admin UI built yet
  EXTEND_SUBSCRIPTION: (id: string) => `${API_BASE.V1}/admin/users/${id}/extend-subscription`,
  CHANGE_PACKAGE: (id: string) => `${API_BASE.V1}/admin/users/${id}/change-package`,
  USER_SECURITY: (id: string) => `${API_BASE.V1}/admin/users/${id}/security`,
  USER_QUOTA_USAGE: (id: string) => `${API_BASE.V1}/admin/users/${id}/quota-usage`,
  USER_API_STATS: (id: string) => `${API_BASE.V1}/admin/users/${id}/api-stats`,

  // Order management — ✅ used by admin hooks
  ORDERS: `${API_BASE.V1}/admin/orders`,
  ORDER_BY_ID: (id: string) => `${API_BASE.V1}/admin/orders/${id}`,
  ORDER_STATUS: (id: string) => `${API_BASE.V1}/admin/orders/${id}/status`,

  // Package management — ✅ used by admin hooks
  PACKAGES: `${API_BASE.V1}/admin/packages`,
  PACKAGE_BY_ID: (id: string) => `${API_BASE.V1}/admin/settings/packages/${id}`,

  // Activity logs — ✅ used by admin hooks
  ACTIVITY: `${API_BASE.V1}/admin/activity`,
  ACTIVITY_BY_ID: (id: string) => `${API_BASE.V1}/admin/activity/${id}`,

  // Error management — ✅ used by admin hooks (except CRITICAL_ERRORS)
  ERRORS: `${API_BASE.V1}/admin/errors`,
  ERROR_BY_ID: (id: string) => `${API_BASE.V1}/admin/errors/${id}`,
  ERROR_STATS: `${API_BASE.V1}/admin/errors/stats`,
  CRITICAL_ERRORS: `${API_BASE.V1}/admin/errors/critical`, // 🔧 no admin UI

  // Rank Tracker Admin — 🔧 no admin UI
  RANK_TRACKER_TRIGGER_MANUAL_CHECK: `${API_BASE.V1}/admin/rank-tracker/trigger-manual-check`,

  // Settings — ✅ used by admin hooks
  SITE_SETTINGS: `${API_BASE.V1}/admin/settings/site`,
  TEST_EMAIL: `${API_BASE.V1}/admin/settings/site/test-email`,
  PAYMENT_GATEWAYS: `${API_BASE.V1}/admin/settings/payments`,
  PAYMENT_GATEWAY_BY_ID: (id: string) => `${API_BASE.V1}/admin/settings/payments/${id}`,
  PAYMENT_GATEWAY_DEFAULT: (id: string) => `${API_BASE.V1}/admin/settings/payments/${id}/default`,
} as const;

// The application now focuses solely on keyword rank tracking

// Rank tracking endpoints
export const RANK_TRACKING_ENDPOINTS = {
  // ✅ Used by user-dashboard hooks.ts
  KEYWORDS: `${API_BASE.V1}/rank-tracking/keywords`,
  KEYWORD_USAGE: `${API_BASE.V1}/rank-tracking/keyword-usage`,
  BULK_DELETE_KEYWORDS: `${API_BASE.V1}/rank-tracking/keywords/bulk-delete`,
  RANK_HISTORY: `${API_BASE.V1}/rank-tracking/rank-history`,
  DOMAINS: `${API_BASE.V1}/rank-tracking/domains`,
  COUNTRIES: `${API_BASE.V1}/rank-tracking/countries`,

  // 🔧 Backend-ready, no frontend consumer yet
  ADD_KEYWORD_TAG: `${API_BASE.V1}/rank-tracking/keywords/add-tag`,
  CHECK_RANK: `${API_BASE.V1}/rank-tracking/check-rank`,
  WEEKLY_TRENDS: `${API_BASE.V1}/rank-tracking/weekly-trends`,
} as const;

// Billing endpoints
export const BILLING_ENDPOINTS = {
  // ✅ Used by user-dashboard hooks.ts
  OVERVIEW: `${API_BASE.V1}/billing/overview`,
  HISTORY: `${API_BASE.V1}/billing/history`,
  PACKAGE_BY_ID: (id: string) => `${API_BASE.V1}/billing/packages/${id}`,
  ORDER_BY_ID: (id: string) => `${API_BASE.V1}/billing/orders/${id}`,

  // 🔧 Backend-ready, no frontend consumer yet
  PACKAGES: `${API_BASE.V1}/billing/packages`, // listing done via PUBLIC_ENDPOINTS.SETTINGS
  TRANSACTION_BY_ID: (id: string) => `${API_BASE.V1}/billing/transactions/${id}`,
} as const;

// Payment endpoints
export const PAYMENT_ENDPOINTS = {
  PADDLE_CONFIG: `${API_BASE.V1}/payments/paddle/config`, // 🔧 server-side initialization
  // ✅ Used by user-dashboard billing page
  CUSTOMER_PORTAL: `${API_BASE.V1}/payments/paddle/customer-portal`,
  SUBSCRIPTION_CANCEL: `${API_BASE.V1}/payments/paddle/subscription/cancel`,
  SUBSCRIPTION_UPDATE: `${API_BASE.V1}/payments/paddle/subscription/update`,
} as const;

// Activity logging endpoints (non-admin) — 🔧 internal, no frontend consumer
export const ACTIVITY_ENDPOINTS = {
  LOG: `${API_BASE.V1}/activity`,
} as const;

// Notification endpoints — 🔧 backend-ready, no notification center UI yet
export const NOTIFICATION_ENDPOINTS = {
  DISMISS: (id: string) => `${API_BASE.V1}/notifications/dismiss/${id}`,
} as const;

// Dashboard endpoints — ✅ used by user-dashboard hooks.ts
export const DASHBOARD_ENDPOINTS = {
  MAIN: `${API_BASE.V1}/dashboard`,
} as const;

// Public endpoints — ✅ used by user-dashboard hooks.ts
export const PUBLIC_ENDPOINTS = {
  SETTINGS: `${API_BASE.V1}/public/settings`,
} as const;

// System endpoints — 🖥️ external monitoring only, not called by frontend apps
export const SYSTEM_ENDPOINTS = {
  HEALTH: `${API_BASE.V1}/system/health`,
  STATUS: `${API_BASE.V1}/system/status`,
} as const;

// Integration endpoints — 🔌 internal API-to-external-service, not called by frontend apps
export const INTEGRATION_ENDPOINTS = {
  SERANKING_KEYWORD_DATA: `${API_BASE.V1}/integrations/seranking/keyword-data`,
  SERANKING_KEYWORD_DATA_BULK: `${API_BASE.V1}/integrations/seranking/keyword-data/bulk`,
  SERANKING_QUOTA_STATUS: `${API_BASE.V1}/integrations/seranking/quota/status`,
  SERANKING_QUOTA_HISTORY: `${API_BASE.V1}/integrations/seranking/quota/history`,
  SERANKING_HEALTH: `${API_BASE.V1}/integrations/seranking/health`,
  SERANKING_HEALTH_METRICS: `${API_BASE.V1}/integrations/seranking/health/metrics`,
} as const;

/**
 * Recursively collect all static string endpoint values from an endpoint object tree.
 * Skips function-valued entries (dynamic endpoints like USER_BY_ID).
 */
function collectEndpointStrings(obj: Record<string, unknown>): string[] {
  const results: string[] = [];
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      results.push(value);
    } else if (typeof value === 'object' && value !== null) {
      results.push(...collectEndpointStrings(value as Record<string, unknown>));
    }
  }
  return results;
}

/**
 * Validate whether a URL matches any defined API endpoint.
 * Dynamically checks all static string endpoints from every endpoint group.
 */
export const isValidEndpoint = (endpoint: string): boolean => {
  const allEndpoints = collectEndpointStrings({
    AUTH: AUTH_ENDPOINTS,
    ADMIN: ADMIN_ENDPOINTS,
    RANK_TRACKING: RANK_TRACKING_ENDPOINTS,
    BILLING: BILLING_ENDPOINTS,
    PAYMENT: PAYMENT_ENDPOINTS,
    ACTIVITY: ACTIVITY_ENDPOINTS,
    NOTIFICATION: NOTIFICATION_ENDPOINTS,
    DASHBOARD: DASHBOARD_ENDPOINTS,
    PUBLIC: PUBLIC_ENDPOINTS,
    SYSTEM: SYSTEM_ENDPOINTS,
    INTEGRATION: INTEGRATION_ENDPOINTS,
  });

  return allEndpoints.includes(endpoint);
};

// Unified export for backward compatibility
export const ApiEndpoints = {
  BASE: API_BASE,
  V1: API_BASE.V1,
  SYSTEM: API_BASE.SYSTEM,
  AUTH: AUTH_ENDPOINTS,
  ADMIN: ADMIN_ENDPOINTS,
  RANK_TRACKING: RANK_TRACKING_ENDPOINTS,
  BILLING: BILLING_ENDPOINTS,
  PAYMENT: PAYMENT_ENDPOINTS,
  ACTIVITY: ACTIVITY_ENDPOINTS,
  NOTIFICATION: NOTIFICATION_ENDPOINTS,
  DASHBOARD: DASHBOARD_ENDPOINTS,
  PUBLIC: PUBLIC_ENDPOINTS,
  SYSTEM_ENDPOINTS: SYSTEM_ENDPOINTS,
  INTEGRATION: INTEGRATION_ENDPOINTS,
};
