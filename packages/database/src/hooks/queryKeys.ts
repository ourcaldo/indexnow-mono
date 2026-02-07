/**
 * Centralized Query Keys Factory
 * 
 * This module provides a centralized location for all React Query keys.
 * Using a factory pattern ensures:
 * 1. Consistent cache invalidation across the app
 * 2. Type-safe query keys
 * 3. Easy refactoring and maintenance
 * 
 * Usage:
 * import { queryKeys } from '@indexnow/database'
 * 
 * useQuery({ queryKey: queryKeys.user.profile(), queryFn: ... })
 * queryClient.invalidateQueries({ queryKey: queryKeys.user.all })
 */

/**
 * Filter types for various queries
 */
export interface KeywordFilters {
    status?: 'active' | 'paused' | 'completed' | 'failed';
    domain?: string;
    search?: string;
}

export interface OrderFilters {
    status?: 'pending' | 'completed' | 'cancelled' | 'refunded';
    dateFrom?: string;
    dateTo?: string;
}

export interface UserFilters {
    role?: 'user' | 'admin' | 'super_admin';
    status?: 'active' | 'suspended';
    search?: string;
}

/**
 * Query key factory for consistent cache management
 */
export const queryKeys = {
    // ============================================================
    // User-related queries
    // ============================================================
    user: {
        /** Base key for all user queries - use for broad invalidation */
        all: ['user'] as const,
        /** User profile data */
        profile: () => [...queryKeys.user.all, 'profile'] as const,
        /** User settings/preferences */
        settings: () => [...queryKeys.user.all, 'settings'] as const,
        /** User quota information */
        quota: () => [...queryKeys.user.all, 'quota'] as const,
        /** User notifications */
        notifications: () => [...queryKeys.user.all, 'notifications'] as const,
        /** User activity history */
        activity: () => [...queryKeys.user.all, 'activity'] as const,
    },

    // ============================================================
    // Keywords-related queries
    // ============================================================
    keywords: {
        /** Base key for all keyword queries */
        all: ['keywords'] as const,
        /** List of keywords with optional filters */
        list: (filters?: KeywordFilters) =>
            [...queryKeys.keywords.all, 'list', filters ?? {}] as const,
        /** Single keyword detail */
        detail: (id: string) => [...queryKeys.keywords.all, 'detail', id] as const,
        /** Keyword rank history */
        history: (id: string) => [...queryKeys.keywords.all, 'history', id] as const,
        /** Keyword analytics */
        analytics: (id: string) => [...queryKeys.keywords.all, 'analytics', id] as const,
    },

    // ============================================================
    // Domains-related queries
    // ============================================================
    domains: {
        /** Base key for all domain queries */
        all: ['domains'] as const,
        /** List of domains */
        list: () => [...queryKeys.domains.all, 'list'] as const,
        /** Single domain detail */
        detail: (id: string) => [...queryKeys.domains.all, 'detail', id] as const,
        /** Domain verification status */
        verification: (id: string) => [...queryKeys.domains.all, 'verification', id] as const,
    },

    // ============================================================
    // Packages (subscription plans)
    // ============================================================
    packages: {
        /** Base key for all package queries */
        all: ['packages'] as const,
        /** List of available packages */
        list: () => [...queryKeys.packages.all, 'list'] as const,
        /** Current user's package */
        current: () => [...queryKeys.packages.all, 'current'] as const,
        /** Single package detail */
        detail: (id: string) => [...queryKeys.packages.all, 'detail', id] as const,
    },

    // ============================================================
    // Orders/Transactions
    // ============================================================
    orders: {
        /** Base key for all order queries */
        all: ['orders'] as const,
        /** List of orders with optional filters */
        list: (filters?: OrderFilters) =>
            [...queryKeys.orders.all, 'list', filters ?? {}] as const,
        /** Single order detail */
        detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
    },

    // ============================================================
    // Site Integration/Settings (public settings)
    // ============================================================
    siteSettings: {
        /** Base key for site settings */
        all: ['siteSettings'] as const,
        /** Public site settings */
        public: () => [...queryKeys.siteSettings.all, 'public'] as const,
        /** Payment gateway settings */
        payments: () => [...queryKeys.siteSettings.all, 'payments'] as const,
    },

    // ============================================================
    // Admin-specific queries
    // ============================================================
    admin: {
        /** Base key for all admin queries */
        all: ['admin'] as const,
        /** Admin user list with filters */
        users: (filters?: UserFilters) =>
            [...queryKeys.admin.all, 'users', filters ?? {}] as const,
        /** Admin user detail */
        userDetail: (id: string) => [...queryKeys.admin.all, 'users', id] as const,
        /** Activity logs */
        activityLogs: () => [...queryKeys.admin.all, 'activityLogs'] as const,
        /** Error logs */
        errorLogs: () => [...queryKeys.admin.all, 'errorLogs'] as const,
        /** Dashboard stats */
        dashboardStats: () => [...queryKeys.admin.all, 'dashboardStats'] as const,
    },
} as const;

/**
 * Type helpers for query keys
 */
export type QueryKeys = typeof queryKeys;
export type UserQueryKeys = QueryKeys['user'];
export type KeywordsQueryKeys = QueryKeys['keywords'];
export type DomainsQueryKeys = QueryKeys['domains'];
export type PackagesQueryKeys = QueryKeys['packages'];
export type OrdersQueryKeys = QueryKeys['orders'];
export type AdminQueryKeys = QueryKeys['admin'];
