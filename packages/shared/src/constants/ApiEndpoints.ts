import { AppConfig } from '../core/config/AppConfig';

/**
 * API Endpoints for IndexNow Studio
 * Centralized API endpoint definitions
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
  LOGIN: `${API_BASE.V1}/auth/login`,
  LOGOUT: `${API_BASE.V1}/auth/logout`,
  REGISTER: `${API_BASE.V1}/auth/register`,
  SESSION: `${API_BASE.V1}/auth/session`,
  DETECT_LOCATION: `${API_BASE.V1}/auth/detect-location`,
  RESEND_VERIFICATION: `${API_BASE.V1}/auth/resend-verification`,
  RESET_PASSWORD: `${API_BASE.V1}/auth/reset-password`,
  MAGIC_LINK: `${API_BASE.V1}/auth/magic-link`,
  REFRESH: `${API_BASE.V1}/auth/refresh`,
  CHANGE_PASSWORD: `${API_BASE.V1}/auth/user/change-password`,
  PROFILE: `${API_BASE.V1}/auth/user/profile`,
  SETTINGS: `${API_BASE.V1}/auth/user/settings`,
  QUOTA: `${API_BASE.V1}/auth/user/quota`,
  TRIAL_ELIGIBILITY: `${API_BASE.V1}/auth/user/trial-eligibility`,
  TRIAL_STATUS: `${API_BASE.V1}/auth/user/trial-status`,
} as const;

// Admin endpoints
export const ADMIN_ENDPOINTS = {
  DASHBOARD: `${API_BASE.V1}/admin/dashboard`,
  VERIFY_ROLE: `${API_BASE.V1}/admin/verify-role`,

  // User management
  USERS: `${API_BASE.V1}/admin/users`,
  USER_BY_ID: (id: string) => `${API_BASE.V1}/admin/users/${id}`,
  USER_ROLE: (id: string) => `${API_BASE.V1}/admin/users/${id}/role`,
  RESET_USER_PASSWORD: (id: string) => `${API_BASE.V1}/admin/users/${id}/reset-password`,
  EXTEND_SUBSCRIPTION: (id: string) => `${API_BASE.V1}/admin/users/${id}/extend-subscription`,
  CHANGE_PACKAGE: (id: string) => `${API_BASE.V1}/admin/users/${id}/change-package`,
  USER_SECURITY: (id: string) => `${API_BASE.V1}/admin/users/${id}/security`,
  USER_QUOTA_USAGE: (id: string) => `${API_BASE.V1}/admin/users/${id}/quota-usage`,
  USER_API_STATS: (id: string) => `${API_BASE.V1}/admin/users/${id}/api-stats`,

  // Order management
  ORDERS: `${API_BASE.V1}/admin/orders`,
  ORDER_BY_ID: (id: string) => `${API_BASE.V1}/admin/orders/${id}`,
  ORDER_STATUS: (id: string) => `${API_BASE.V1}/admin/orders/${id}/status`,

  // Package management
  PACKAGES: `${API_BASE.V1}/admin/packages`,
  PACKAGE_BY_ID: (id: string) => `${API_BASE.V1}/admin/settings/packages/${id}`,

  // Activity logs
  ACTIVITY: `${API_BASE.V1}/admin/activity`,
  ACTIVITY_BY_ID: (id: string) => `${API_BASE.V1}/admin/activity/${id}`,

  // Error management
  ERRORS: `${API_BASE.V1}/admin/errors`,
  ERROR_BY_ID: (id: string) => `${API_BASE.V1}/admin/errors/${id}`,
  ERROR_STATS: `${API_BASE.V1}/admin/errors/stats`,
  CRITICAL_ERRORS: `${API_BASE.V1}/admin/errors/critical`,

  // Rank Tracker Admin
  RANK_TRACKER_TRIGGER_MANUAL_CHECK: `${API_BASE.V1}/admin/rank-tracker/trigger-manual-check`,

  // Settings
  SITE_SETTINGS: `${API_BASE.V1}/admin/settings/site`,
  TEST_EMAIL: `${API_BASE.V1}/admin/settings/site/test-email`,
  PAYMENT_GATEWAYS: `${API_BASE.V1}/admin/settings/payments`,
  PAYMENT_GATEWAY_BY_ID: (id: string) => `${API_BASE.V1}/admin/settings/payments/${id}`,
  PAYMENT_GATEWAY_DEFAULT: (id: string) => `${API_BASE.V1}/admin/settings/payments/${id}/default`,
} as const;

// The application now focuses solely on keyword rank tracking

// Rank tracking endpoints
export const RANK_TRACKING_ENDPOINTS = {
  KEYWORDS: `${API_BASE.V1}/rank-tracking/keywords`,
  KEYWORD_USAGE: `${API_BASE.V1}/rank-tracking/keyword-usage`,
  BULK_DELETE_KEYWORDS: `${API_BASE.V1}/rank-tracking/keywords/bulk-delete`,
  ADD_KEYWORD_TAG: `${API_BASE.V1}/rank-tracking/keywords/add-tag`,
  CHECK_RANK: `${API_BASE.V1}/rank-tracking/check-rank`,
  RANK_HISTORY: `${API_BASE.V1}/rank-tracking/rank-history`,
  DOMAINS: `${API_BASE.V1}/rank-tracking/domains`,
  COUNTRIES: `${API_BASE.V1}/rank-tracking/countries`,
  WEEKLY_TRENDS: `${API_BASE.V1}/rank-tracking/weekly-trends`,
} as const;

// Billing endpoints
export const BILLING_ENDPOINTS = {
  OVERVIEW: `${API_BASE.V1}/billing/overview`,
  HISTORY: `${API_BASE.V1}/billing/history`,
  PACKAGES: `${API_BASE.V1}/billing/packages`,
  PACKAGE_BY_ID: (id: string) => `${API_BASE.V1}/billing/packages/${id}`,

  // Orders (user-side)
  ORDER_BY_ID: (id: string) => `${API_BASE.V1}/billing/orders/${id}`,

  // Transactions
  TRANSACTION_BY_ID: (id: string) => `${API_BASE.V1}/billing/transactions/${id}`,
} as const;

// Payment endpoints
export const PAYMENT_ENDPOINTS = {
  PADDLE_CONFIG: `${API_BASE.V1}/payments/paddle/config`,
  // Reserved for Paddle webhook endpoints
  CUSTOMER_PORTAL: `${API_BASE.V1}/payments/paddle/customer-portal`,
  SUBSCRIPTION_CANCEL: `${API_BASE.V1}/payments/paddle/subscription/cancel`,
} as const;

// Activity logging endpoints (non-admin)
export const ACTIVITY_ENDPOINTS = {
  LOG: `${API_BASE.V1}/activity`, // For regular users to log their own activities
} as const;

// Notification endpoints
export const NOTIFICATION_ENDPOINTS = {
  DISMISS: (id: string) => `${API_BASE.V1}/notifications/dismiss/${id}`,
} as const;

// Dashboard endpoints
export const DASHBOARD_ENDPOINTS = {
  MAIN: `${API_BASE.V1}/dashboard`,
} as const;

// Blog endpoints removed - CMS feature no longer exists
// Public endpoints for unauthenticated data (packages, site settings)
// These are used by the dashboard for billing/settings, not marketing pages
export const PUBLIC_ENDPOINTS = {
  SETTINGS: `${API_BASE.V1}/public/settings`,
} as const;
// System endpoints
export const SYSTEM_ENDPOINTS = {
  HEALTH: `${API_BASE.V1}/system/health`,
  STATUS: `${API_BASE.V1}/system/status`,
} as const;

// Integration endpoints
export const INTEGRATION_ENDPOINTS = {
  // SeRanking integration
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
