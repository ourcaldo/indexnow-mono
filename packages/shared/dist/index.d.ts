import { J as Json$1, c as changePasswordSchema, l as loginSchema, r as registerSchema, u as updateUserSettingsSchema } from './schema-8zTZSpg6.js';
export { C as ChangePasswordRequest, D as DashboardStats, L as LoginRequest, R as RegisterRequest, a as ResetPasswordRequest, P as SchemaPaginatedResponse, U as UpdateUserSettingsRequest, b as apiRequestSchemas, f as forgotPasswordSchema, d as resetPasswordSchema, e as updateSiteSettingsSchema, g as updateUserProfileSchema } from './schema-8zTZSpg6.js';
import { z } from 'zod';
import React$1 from 'react';
import { ClassValue } from 'clsx';
import { NextRequest } from 'next/server';
export { PostgrestError } from '@supabase/supabase-js';

/**
 * Validation Rules for IndexNow Studio
 * Centralized validation rules and schemas
 */

declare const VALIDATION_PATTERNS: {
    readonly EMAIL: RegExp;
    readonly URL: RegExp;
    readonly PHONE: RegExp;
    readonly PASSWORD: RegExp;
    readonly DOMAIN: RegExp;
    readonly UUID: RegExp;
    readonly CRON: RegExp;
    readonly SLUG: RegExp;
    readonly HEX_COLOR: RegExp;
};
declare const FIELD_LIMITS: {
    readonly EMAIL: {
        readonly min: 5;
        readonly max: 254;
    };
    readonly PASSWORD: {
        readonly min: 8;
        readonly max: 128;
    };
    readonly NAME: {
        readonly min: 1;
        readonly max: 100;
    };
    readonly TITLE: {
        readonly min: 1;
        readonly max: 200;
    };
    readonly DESCRIPTION: {
        readonly min: 0;
        readonly max: 1000;
    };
    readonly URL: {
        readonly min: 10;
        readonly max: 2048;
    };
    readonly PHONE: {
        readonly min: 8;
        readonly max: 20;
    };
    readonly TAG: {
        readonly min: 1;
        readonly max: 50;
    };
    readonly SLUG: {
        readonly min: 1;
        readonly max: 100;
    };
    readonly MESSAGE: {
        readonly min: 1;
        readonly max: 5000;
    };
    readonly KEYWORD: {
        readonly min: 1;
        readonly max: 100;
    };
    readonly DOMAIN: {
        readonly min: 3;
        readonly max: 253;
    };
    readonly JOB_NAME: {
        readonly min: 1;
        readonly max: 100;
    };
    readonly PACKAGE_NAME: {
        readonly min: 1;
        readonly max: 50;
    };
};
declare const NUMERIC_LIMITS: {
    readonly PAGINATION: {
        readonly min: 1;
        readonly max: 1000;
    };
    readonly QUOTA: {
        readonly min: 0;
        readonly max: 999999999;
    };
    readonly PRICE: {
        readonly min: 0;
        readonly max: 999999999;
    };
    readonly PERCENTAGE: {
        readonly min: 0;
        readonly max: 100;
    };
    readonly POSITION: {
        readonly min: 1;
        readonly max: 100;
    };
    readonly RETRY_ATTEMPTS: {
        readonly min: 0;
        readonly max: 10;
    };
    readonly TIMEOUT: {
        readonly min: 1000;
        readonly max: 300000;
    };
    readonly FILE_SIZE: {
        readonly min: 1;
        readonly max: number;
    };
    readonly BULK_OPERATIONS: {
        readonly min: 1;
        readonly max: 1000;
    };
};
declare const BaseSchemas: {
    readonly email: z.ZodString;
    readonly password: z.ZodString;
    readonly url: z.ZodString;
    readonly domain: z.ZodString;
    readonly phone: z.ZodString;
    readonly uuid: z.ZodString;
    readonly cron: z.ZodString;
    readonly slug: z.ZodString;
    readonly pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
    }>;
    readonly dateRange: z.ZodObject<{
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        startDate?: string | undefined;
        endDate?: string | undefined;
    }, {
        startDate?: string | undefined;
        endDate?: string | undefined;
    }>;
    readonly tags: z.ZodArray<z.ZodString, "many">;
};
declare const UserSchemas: {
    readonly register: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        fullName: z.ZodString;
        phoneNumber: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
        fullName: string;
        phoneNumber?: string | undefined;
        country?: string | undefined;
    }, {
        email: string;
        password: string;
        fullName: string;
        phoneNumber?: string | undefined;
        country?: string | undefined;
    }>;
    readonly login: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
    readonly profile: z.ZodObject<{
        fullName: z.ZodString;
        phoneNumber: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        emailNotifications: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        fullName: string;
        emailNotifications: boolean;
        phoneNumber?: string | undefined;
        country?: string | undefined;
    }, {
        fullName: string;
        phoneNumber?: string | undefined;
        country?: string | undefined;
        emailNotifications?: boolean | undefined;
    }>;
    readonly changePassword: z.ZodEffects<z.ZodObject<{
        currentPassword: z.ZodString;
        newPassword: z.ZodString;
        confirmPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }, {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }>, {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }, {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }>;
    readonly settings: z.ZodObject<{
        timeoutDuration: z.ZodDefault<z.ZodNumber>;
        retryAttempts: z.ZodDefault<z.ZodNumber>;
        emailJobCompletion: z.ZodDefault<z.ZodBoolean>;
        emailJobFailure: z.ZodDefault<z.ZodBoolean>;
        emailQuotaAlerts: z.ZodDefault<z.ZodBoolean>;
        emailDailyReport: z.ZodDefault<z.ZodBoolean>;
        defaultSchedule: z.ZodDefault<z.ZodEnum<["one-time", "hourly", "daily", "weekly", "monthly"]>>;
    }, "strip", z.ZodTypeAny, {
        timeoutDuration: number;
        retryAttempts: number;
        emailJobCompletion: boolean;
        emailJobFailure: boolean;
        emailQuotaAlerts: boolean;
        emailDailyReport: boolean;
        defaultSchedule: "one-time" | "hourly" | "daily" | "weekly" | "monthly";
    }, {
        timeoutDuration?: number | undefined;
        retryAttempts?: number | undefined;
        emailJobCompletion?: boolean | undefined;
        emailJobFailure?: boolean | undefined;
        emailQuotaAlerts?: boolean | undefined;
        emailDailyReport?: boolean | undefined;
        defaultSchedule?: "one-time" | "hourly" | "daily" | "weekly" | "monthly" | undefined;
    }>;
};
declare const RankTrackingSchemas: {
    readonly keyword: z.ZodObject<{
        keyword: z.ZodString;
        domain: z.ZodString;
        country: z.ZodString;
        device: z.ZodDefault<z.ZodEnum<["desktop", "mobile", "tablet"]>>;
        searchEngine: z.ZodDefault<z.ZodEnum<["google", "bing", "yahoo"]>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        targetUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        country: string;
        keyword: string;
        domain: string;
        device: "desktop" | "mobile" | "tablet";
        searchEngine: "google" | "bing" | "yahoo";
        tags?: string[] | undefined;
        targetUrl?: string | undefined;
    }, {
        country: string;
        keyword: string;
        domain: string;
        device?: "desktop" | "mobile" | "tablet" | undefined;
        searchEngine?: "google" | "bing" | "yahoo" | undefined;
        tags?: string[] | undefined;
        targetUrl?: string | undefined;
    }>;
    readonly bulkKeywords: z.ZodObject<{
        keywords: z.ZodArray<z.ZodObject<{
            keyword: z.ZodString;
            domain: z.ZodString;
            country: z.ZodString;
            device: z.ZodDefault<z.ZodEnum<["desktop", "mobile", "tablet"]>>;
            searchEngine: z.ZodDefault<z.ZodEnum<["google", "bing", "yahoo"]>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            targetUrl: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            country: string;
            keyword: string;
            domain: string;
            device: "desktop" | "mobile" | "tablet";
            searchEngine: "google" | "bing" | "yahoo";
            tags?: string[] | undefined;
            targetUrl?: string | undefined;
        }, {
            country: string;
            keyword: string;
            domain: string;
            device?: "desktop" | "mobile" | "tablet" | undefined;
            searchEngine?: "google" | "bing" | "yahoo" | undefined;
            tags?: string[] | undefined;
            targetUrl?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        keywords: {
            country: string;
            keyword: string;
            domain: string;
            device: "desktop" | "mobile" | "tablet";
            searchEngine: "google" | "bing" | "yahoo";
            tags?: string[] | undefined;
            targetUrl?: string | undefined;
        }[];
    }, {
        keywords: {
            country: string;
            keyword: string;
            domain: string;
            device?: "desktop" | "mobile" | "tablet" | undefined;
            searchEngine?: "google" | "bing" | "yahoo" | undefined;
            tags?: string[] | undefined;
            targetUrl?: string | undefined;
        }[];
    }>;
    readonly domain: z.ZodObject<{
        domain: z.ZodString;
        name: z.ZodString;
        isActive: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        domain: string;
        name: string;
        isActive: boolean;
    }, {
        domain: string;
        name: string;
        isActive?: boolean | undefined;
    }>;
    readonly rankCheck: z.ZodObject<{
        keywordIds: z.ZodArray<z.ZodString, "many">;
        forceRefresh: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        keywordIds: string[];
        forceRefresh: boolean;
    }, {
        keywordIds: string[];
        forceRefresh?: boolean | undefined;
    }>;
};
declare const PaymentSchemas: {
    readonly customerInfo: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
        phone: z.ZodString;
        address: z.ZodString;
        city: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        country: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: string;
        city: string;
        postalCode: string;
    }, {
        email: string;
        country: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: string;
        city: string;
        postalCode: string;
    }>;
    readonly paymentRequest: z.ZodObject<{
        packageId: z.ZodString;
        billingPeriod: z.ZodEnum<["monthly", "quarterly", "biannual", "annual"]>;
        paymentMethod: z.ZodEnum<["paddle", "credit-card"]>;
        customerInfo: z.ZodObject<{
            firstName: z.ZodString;
            lastName: z.ZodString;
            email: z.ZodString;
            phone: z.ZodString;
            address: z.ZodString;
            city: z.ZodString;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            email: string;
            country: string;
            firstName: string;
            lastName: string;
            phone: string;
            address: string;
            city: string;
            postalCode: string;
        }, {
            email: string;
            country: string;
            firstName: string;
            lastName: string;
            phone: string;
            address: string;
            city: string;
            postalCode: string;
        }>;
        promoCode: z.ZodOptional<z.ZodString>;
        isTrialToSubscription: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        packageId: string;
        billingPeriod: "monthly" | "quarterly" | "biannual" | "annual";
        paymentMethod: "paddle" | "credit-card";
        customerInfo: {
            email: string;
            country: string;
            firstName: string;
            lastName: string;
            phone: string;
            address: string;
            city: string;
            postalCode: string;
        };
        isTrialToSubscription: boolean;
        promoCode?: string | undefined;
    }, {
        packageId: string;
        billingPeriod: "monthly" | "quarterly" | "biannual" | "annual";
        paymentMethod: "paddle" | "credit-card";
        customerInfo: {
            email: string;
            country: string;
            firstName: string;
            lastName: string;
            phone: string;
            address: string;
            city: string;
            postalCode: string;
        };
        promoCode?: string | undefined;
        isTrialToSubscription?: boolean | undefined;
    }>;
    readonly webhookPayload: z.ZodObject<{
        order_id: z.ZodString;
        status_code: z.ZodString;
        transaction_status: z.ZodString;
        fraud_status: z.ZodOptional<z.ZodString>;
        payment_type: z.ZodOptional<z.ZodString>;
        gross_amount: z.ZodString;
        signature_key: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        order_id: string;
        status_code: string;
        transaction_status: string;
        gross_amount: string;
        signature_key: string;
        fraud_status?: string | undefined;
        payment_type?: string | undefined;
    }, {
        order_id: string;
        status_code: string;
        transaction_status: string;
        gross_amount: string;
        signature_key: string;
        fraud_status?: string | undefined;
        payment_type?: string | undefined;
    }>;
};
declare const AdminSchemas: {
    readonly userManagement: z.ZodObject<{
        userId: z.ZodString;
        action: z.ZodEnum<["suspend", "activate", "reset-password", "reset-quota", "extend-subscription", "change-package"]>;
        reason: z.ZodString;
        additionalData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        action: "suspend" | "activate" | "reset-password" | "reset-quota" | "extend-subscription" | "change-package";
        reason: string;
        additionalData?: Record<string, any> | undefined;
    }, {
        userId: string;
        action: "suspend" | "activate" | "reset-password" | "reset-quota" | "extend-subscription" | "change-package";
        reason: string;
        additionalData?: Record<string, any> | undefined;
    }>;
    readonly packageManagement: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        price: z.ZodNumber;
        quotaLimits: z.ZodObject<{
            dailyUrls: z.ZodNumber;
            keywords: z.ZodNumber;
            concurrentJobs: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            keywords: number;
            dailyUrls: number;
            concurrentJobs: number;
        }, {
            keywords: number;
            dailyUrls: number;
            concurrentJobs: number;
        }>;
        features: z.ZodArray<z.ZodString, "many">;
        isActive: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        isActive: boolean;
        description: string;
        price: number;
        quotaLimits: {
            keywords: number;
            dailyUrls: number;
            concurrentJobs: number;
        };
        features: string[];
    }, {
        name: string;
        description: string;
        price: number;
        quotaLimits: {
            keywords: number;
            dailyUrls: number;
            concurrentJobs: number;
        };
        features: string[];
        isActive?: boolean | undefined;
    }>;
    readonly siteSettings: z.ZodObject<{
        siteName: z.ZodString;
        siteDescription: z.ZodString;
        contactEmail: z.ZodOptional<z.ZodString>;
        supportEmail: z.ZodOptional<z.ZodString>;
        maintenanceMode: z.ZodDefault<z.ZodBoolean>;
        registrationEnabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        siteName: string;
        siteDescription: string;
        maintenanceMode: boolean;
        registrationEnabled: boolean;
        contactEmail?: string | undefined;
        supportEmail?: string | undefined;
    }, {
        siteName: string;
        siteDescription: string;
        contactEmail?: string | undefined;
        supportEmail?: string | undefined;
        maintenanceMode?: boolean | undefined;
        registrationEnabled?: boolean | undefined;
    }>;
};
declare const FileValidation: {
    readonly validateFileType: (fileName: string, allowedTypes: string[]) => boolean;
    readonly validateFileSize: (fileSize: number, maxSize?: number) => boolean;
    readonly validateUrlList: (content: string) => string[];
};
declare const CustomValidators: {
    readonly isStrongPassword: (password: string) => boolean;
    readonly isValidCronExpression: (cron: string) => boolean;
    readonly isValidDomain: (domain: string) => boolean;
    readonly isBusinessEmail: (email: string) => boolean;
    readonly sanitizeInput: (input: string) => string;
};

declare const API_BASE: {
    readonly V1: `${string}/v1`;
    readonly SYSTEM: `${string}/system`;
    readonly PUBLIC: `${string}/v1/public`;
};
declare const AUTH_ENDPOINTS: {
    readonly LOGIN: `${string}/v1/auth/login`;
    readonly LOGOUT: `${string}/v1/auth/logout`;
    readonly REGISTER: `${string}/v1/auth/register`;
    readonly SESSION: `${string}/v1/auth/session`;
    readonly DETECT_LOCATION: `${string}/v1/auth/detect-location`;
    readonly RESEND_VERIFICATION: `${string}/v1/auth/resend-verification`;
    readonly CHANGE_PASSWORD: `${string}/v1/auth/user/change-password`;
    readonly AVATAR: `${string}/v1/auth/user/avatar`;
    readonly PROFILE: `${string}/v1/auth/user/profile`;
    readonly PROFILE_COMPLETE: `${string}/v1/auth/user/profile/complete`;
    readonly SETTINGS: `${string}/v1/auth/user/settings`;
    readonly QUOTA: `${string}/v1/auth/user/quota`;
    readonly QUOTA_HISTORY: (days: number) => string;
    readonly QUOTA_ALERTS: `${string}/v1/auth/user/quota/alerts`;
    readonly QUOTA_ALERT_ACKNOWLEDGE: (alertId: string) => string;
    readonly QUOTA_INCREASE_REQUEST: `${string}/v1/auth/user/quota/increase-request`;
    readonly TRIAL_ELIGIBILITY: `${string}/v1/auth/user/trial-eligibility`;
    readonly TRIAL_STATUS: `${string}/v1/auth/user/trial-status`;
};
declare const ADMIN_ENDPOINTS: {
    readonly DASHBOARD: `${string}/v1/admin/dashboard`;
    readonly VERIFY_ROLE: `${string}/v1/admin/verify-role`;
    readonly USERS: `${string}/v1/admin/users`;
    readonly USER_BY_ID: (id: string) => string;
    readonly USER_ROLE: (id: string) => string;
    readonly SUSPEND_USER: (id: string) => string;
    readonly RESET_USER_PASSWORD: (id: string) => string;
    readonly RESET_USER_QUOTA: (id: string) => string;
    readonly EXTEND_SUBSCRIPTION: (id: string) => string;
    readonly CHANGE_PACKAGE: (id: string) => string;
    readonly USER_SECURITY: (id: string) => string;
    readonly USER_QUOTA_USAGE: (id: string) => string;
    readonly USER_API_STATS: (id: string) => string;
    readonly ORDERS: `${string}/v1/admin/orders`;
    readonly ORDER_BY_ID: (id: string) => string;
    readonly ORDER_STATUS: (id: string) => string;
    readonly PACKAGES: `${string}/v1/admin/packages`;
    readonly PACKAGE_BY_ID: (id: string) => string;
    readonly ACTIVITY: `${string}/v1/admin/activity`;
    readonly ACTIVITY_BY_ID: (id: string) => string;
    readonly ERRORS: `${string}/v1/admin/errors`;
    readonly ERROR_BY_ID: (id: string) => string;
    readonly ERROR_STATS: `${string}/v1/admin/errors/stats`;
    readonly CRITICAL_ERRORS: `${string}/v1/admin/errors/critical`;
    readonly QUOTA_STATUS: `${string}/v1/admin/quota/status`;
    readonly QUOTA_HEALTH: `${string}/v1/admin/quota/health`;
    readonly QUOTA_REPORT: `${string}/v1/admin/quota/report`;
    readonly RANK_TRACKER_TRIGGER_MANUAL_CHECK: `${string}/v1/admin/rank-tracker/trigger-manual-check`;
    readonly SITE_SETTINGS: `${string}/v1/admin/settings/site`;
    readonly TEST_EMAIL: `${string}/v1/admin/settings/site/test-email`;
    readonly PAYMENT_GATEWAYS: `${string}/v1/admin/settings/payments`;
    readonly PAYMENT_GATEWAY_BY_ID: (id: string) => string;
    readonly PAYMENT_GATEWAY_DEFAULT: (id: string) => string;
    readonly SMTP_SETTINGS: `${string}/v1/admin/settings/smtp`;
    readonly API_KEYS: `${string}/v1/admin/settings/api-keys`;
};
declare const RANK_TRACKING_ENDPOINTS: {
    readonly KEYWORDS: `${string}/v1/rank-tracking/keywords`;
    readonly KEYWORD_BY_ID: (id: string) => string;
    readonly KEYWORD_HISTORY: (id: string) => string;
    readonly KEYWORD_USAGE: `${string}/v1/rank-tracking/keyword-usage`;
    readonly KEYWORDS_BULK: `${string}/v1/rank-tracking/keywords/bulk`;
    readonly BULK_DELETE_KEYWORDS: `${string}/v1/rank-tracking/keywords/bulk-delete`;
    readonly ADD_KEYWORD_TAG: `${string}/v1/rank-tracking/keywords/add-tag`;
    readonly CHECK_RANK: `${string}/v1/rank-tracking/check-rank`;
    readonly RANKINGS_CHECK: `${string}/v1/rank-tracking/rankings/check`;
    readonly RANK_HISTORY: `${string}/v1/rank-tracking/rank-history`;
    readonly STATS: `${string}/v1/rank-tracking/stats`;
    readonly COMPETITORS: `${string}/v1/rank-tracking/competitors`;
    readonly EXPORT: `${string}/v1/rank-tracking/export`;
    readonly DOMAINS: `${string}/v1/rank-tracking/domains`;
    readonly COUNTRIES: `${string}/v1/rank-tracking/countries`;
    readonly WEEKLY_TRENDS: `${string}/v1/rank-tracking/weekly-trends`;
};
declare const BILLING_ENDPOINTS: {
    readonly OVERVIEW: `${string}/v1/billing/overview`;
    readonly HISTORY: `${string}/v1/billing/history`;
    readonly PACKAGES: `${string}/v1/billing/packages`;
    readonly PACKAGE_BY_ID: (id: string) => string;
    readonly PAYMENT: `${string}/v1/billing/payment`;
    readonly PAYMENT_GATEWAYS: `${string}/v1/billing/payment-gateways`;
    readonly UPLOAD_PROOF: `${string}/v1/billing/upload-proof`;
    readonly CANCEL_TRIAL: `${string}/v1/billing/cancel-trial`;
    readonly ORDER_BY_ID: (id: string) => string;
    readonly TRANSACTIONS: `${string}/v1/billing/transactions`;
    readonly TRANSACTION_BY_ID: (id: string) => string;
};
declare const PAYMENT_ENDPOINTS: {
    readonly PADDLE_CONFIG: `${string}/v1/payments/paddle/config`;
    readonly CUSTOMER_PORTAL: `${string}/v1/payments/paddle/customer-portal`;
};
declare const ACTIVITY_ENDPOINTS: {
    readonly LOG: `${string}/v1/activity`;
};
declare const NOTIFICATION_ENDPOINTS: {
    readonly DISMISS: (id: string) => string;
};
declare const DASHBOARD_ENDPOINTS: {
    readonly MAIN: `${string}/v1/dashboard`;
};
declare const PUBLIC_ENDPOINTS: {
    readonly PACKAGES: `${string}/v1/public/packages`;
    readonly SITE_SETTINGS: `${string}/v1/public/site-settings`;
    readonly SETTINGS: `${string}/v1/public/settings`;
};
declare const SYSTEM_ENDPOINTS: {
    readonly HEALTH: `${string}/v1/system/health`;
    readonly STATUS: `${string}/v1/system/status`;
};
declare const ERROR_ENDPOINTS: {
    readonly LOG: `${string}/v1/errors/log`;
};
declare const EXTERNAL_ENDPOINTS: {
    readonly EXCHANGE_RATE_API: "https://api.exchangerate-api.com/v4/latest/USD";
};
declare const INTEGRATION_ENDPOINTS: {
    readonly SERANKING_KEYWORD_DATA: `${string}/v1/integrations/seranking/keyword-data`;
    readonly SERANKING_KEYWORD_DATA_BULK: `${string}/v1/integrations/seranking/keyword-data/bulk`;
    readonly SERANKING_QUOTA_STATUS: `${string}/v1/integrations/seranking/quota/status`;
    readonly SERANKING_QUOTA_HISTORY: `${string}/v1/integrations/seranking/quota/history`;
    readonly SERANKING_HEALTH: `${string}/v1/integrations/seranking/health`;
    readonly SERANKING_HEALTH_METRICS: `${string}/v1/integrations/seranking/health/metrics`;
};
declare const LEGACY_ENDPOINTS: {};
declare const buildEndpoint: (endpoint: string, params?: Record<string, string | number | boolean>) => string;
declare const isValidEndpoint: (endpoint: string) => boolean;
declare const ApiEndpoints: {
    BASE: {
        readonly V1: `${string}/v1`;
        readonly SYSTEM: `${string}/system`;
        readonly PUBLIC: `${string}/v1/public`;
    };
    V1: `${string}/v1`;
    SYSTEM: `${string}/system`;
    PUBLIC_BASE: `${string}/v1/public`;
    AUTH: {
        readonly LOGIN: `${string}/v1/auth/login`;
        readonly LOGOUT: `${string}/v1/auth/logout`;
        readonly REGISTER: `${string}/v1/auth/register`;
        readonly SESSION: `${string}/v1/auth/session`;
        readonly DETECT_LOCATION: `${string}/v1/auth/detect-location`;
        readonly RESEND_VERIFICATION: `${string}/v1/auth/resend-verification`;
        readonly CHANGE_PASSWORD: `${string}/v1/auth/user/change-password`;
        readonly AVATAR: `${string}/v1/auth/user/avatar`;
        readonly PROFILE: `${string}/v1/auth/user/profile`;
        readonly PROFILE_COMPLETE: `${string}/v1/auth/user/profile/complete`;
        readonly SETTINGS: `${string}/v1/auth/user/settings`;
        readonly QUOTA: `${string}/v1/auth/user/quota`;
        readonly QUOTA_HISTORY: (days: number) => string;
        readonly QUOTA_ALERTS: `${string}/v1/auth/user/quota/alerts`;
        readonly QUOTA_ALERT_ACKNOWLEDGE: (alertId: string) => string;
        readonly QUOTA_INCREASE_REQUEST: `${string}/v1/auth/user/quota/increase-request`;
        readonly TRIAL_ELIGIBILITY: `${string}/v1/auth/user/trial-eligibility`;
        readonly TRIAL_STATUS: `${string}/v1/auth/user/trial-status`;
    };
    ADMIN: {
        readonly DASHBOARD: `${string}/v1/admin/dashboard`;
        readonly VERIFY_ROLE: `${string}/v1/admin/verify-role`;
        readonly USERS: `${string}/v1/admin/users`;
        readonly USER_BY_ID: (id: string) => string;
        readonly USER_ROLE: (id: string) => string;
        readonly SUSPEND_USER: (id: string) => string;
        readonly RESET_USER_PASSWORD: (id: string) => string;
        readonly RESET_USER_QUOTA: (id: string) => string;
        readonly EXTEND_SUBSCRIPTION: (id: string) => string;
        readonly CHANGE_PACKAGE: (id: string) => string;
        readonly USER_SECURITY: (id: string) => string;
        readonly USER_QUOTA_USAGE: (id: string) => string;
        readonly USER_API_STATS: (id: string) => string;
        readonly ORDERS: `${string}/v1/admin/orders`;
        readonly ORDER_BY_ID: (id: string) => string;
        readonly ORDER_STATUS: (id: string) => string;
        readonly PACKAGES: `${string}/v1/admin/packages`;
        readonly PACKAGE_BY_ID: (id: string) => string;
        readonly ACTIVITY: `${string}/v1/admin/activity`;
        readonly ACTIVITY_BY_ID: (id: string) => string;
        readonly ERRORS: `${string}/v1/admin/errors`;
        readonly ERROR_BY_ID: (id: string) => string;
        readonly ERROR_STATS: `${string}/v1/admin/errors/stats`;
        readonly CRITICAL_ERRORS: `${string}/v1/admin/errors/critical`;
        readonly QUOTA_STATUS: `${string}/v1/admin/quota/status`;
        readonly QUOTA_HEALTH: `${string}/v1/admin/quota/health`;
        readonly QUOTA_REPORT: `${string}/v1/admin/quota/report`;
        readonly RANK_TRACKER_TRIGGER_MANUAL_CHECK: `${string}/v1/admin/rank-tracker/trigger-manual-check`;
        readonly SITE_SETTINGS: `${string}/v1/admin/settings/site`;
        readonly TEST_EMAIL: `${string}/v1/admin/settings/site/test-email`;
        readonly PAYMENT_GATEWAYS: `${string}/v1/admin/settings/payments`;
        readonly PAYMENT_GATEWAY_BY_ID: (id: string) => string;
        readonly PAYMENT_GATEWAY_DEFAULT: (id: string) => string;
        readonly SMTP_SETTINGS: `${string}/v1/admin/settings/smtp`;
        readonly API_KEYS: `${string}/v1/admin/settings/api-keys`;
    };
    RANK_TRACKING: {
        readonly KEYWORDS: `${string}/v1/rank-tracking/keywords`;
        readonly KEYWORD_BY_ID: (id: string) => string;
        readonly KEYWORD_HISTORY: (id: string) => string;
        readonly KEYWORD_USAGE: `${string}/v1/rank-tracking/keyword-usage`;
        readonly KEYWORDS_BULK: `${string}/v1/rank-tracking/keywords/bulk`;
        readonly BULK_DELETE_KEYWORDS: `${string}/v1/rank-tracking/keywords/bulk-delete`;
        readonly ADD_KEYWORD_TAG: `${string}/v1/rank-tracking/keywords/add-tag`;
        readonly CHECK_RANK: `${string}/v1/rank-tracking/check-rank`;
        readonly RANKINGS_CHECK: `${string}/v1/rank-tracking/rankings/check`;
        readonly RANK_HISTORY: `${string}/v1/rank-tracking/rank-history`;
        readonly STATS: `${string}/v1/rank-tracking/stats`;
        readonly COMPETITORS: `${string}/v1/rank-tracking/competitors`;
        readonly EXPORT: `${string}/v1/rank-tracking/export`;
        readonly DOMAINS: `${string}/v1/rank-tracking/domains`;
        readonly COUNTRIES: `${string}/v1/rank-tracking/countries`;
        readonly WEEKLY_TRENDS: `${string}/v1/rank-tracking/weekly-trends`;
    };
    BILLING: {
        readonly OVERVIEW: `${string}/v1/billing/overview`;
        readonly HISTORY: `${string}/v1/billing/history`;
        readonly PACKAGES: `${string}/v1/billing/packages`;
        readonly PACKAGE_BY_ID: (id: string) => string;
        readonly PAYMENT: `${string}/v1/billing/payment`;
        readonly PAYMENT_GATEWAYS: `${string}/v1/billing/payment-gateways`;
        readonly UPLOAD_PROOF: `${string}/v1/billing/upload-proof`;
        readonly CANCEL_TRIAL: `${string}/v1/billing/cancel-trial`;
        readonly ORDER_BY_ID: (id: string) => string;
        readonly TRANSACTIONS: `${string}/v1/billing/transactions`;
        readonly TRANSACTION_BY_ID: (id: string) => string;
    };
    PAYMENT: {
        readonly PADDLE_CONFIG: `${string}/v1/payments/paddle/config`;
        readonly CUSTOMER_PORTAL: `${string}/v1/payments/paddle/customer-portal`;
    };
    ACTIVITY: {
        readonly LOG: `${string}/v1/activity`;
    };
    NOTIFICATION: {
        readonly DISMISS: (id: string) => string;
    };
    DASHBOARD: {
        readonly MAIN: `${string}/v1/dashboard`;
    };
    PUBLIC: {
        readonly PACKAGES: `${string}/v1/public/packages`;
        readonly SITE_SETTINGS: `${string}/v1/public/site-settings`;
        readonly SETTINGS: `${string}/v1/public/settings`;
    };
    SYSTEM_ENDPOINTS: {
        readonly HEALTH: `${string}/v1/system/health`;
        readonly STATUS: `${string}/v1/system/status`;
    };
    ERROR: {
        readonly LOG: `${string}/v1/errors/log`;
    };
    EXTERNAL: {
        readonly EXCHANGE_RATE_API: "https://api.exchangerate-api.com/v4/latest/USD";
    };
    INTEGRATION: {
        readonly SERANKING_KEYWORD_DATA: `${string}/v1/integrations/seranking/keyword-data`;
        readonly SERANKING_KEYWORD_DATA_BULK: `${string}/v1/integrations/seranking/keyword-data/bulk`;
        readonly SERANKING_QUOTA_STATUS: `${string}/v1/integrations/seranking/quota/status`;
        readonly SERANKING_QUOTA_HISTORY: `${string}/v1/integrations/seranking/quota/history`;
        readonly SERANKING_HEALTH: `${string}/v1/integrations/seranking/health`;
        readonly SERANKING_HEALTH_METRICS: `${string}/v1/integrations/seranking/health/metrics`;
    };
    LEGACY: {};
};

/**
 * User-friendly error messages mapping
 * Centralized for consistent messaging across API and Frontend
 */
declare const USER_ERROR_MESSAGES: Record<string, Record<string, string>>;

/**
 * Application Constants for IndexNow Studio
 * Centralized application-wide constants
 */
declare const APP_METADATA: {
    readonly NAME: "IndexNow Studio";
    readonly DESCRIPTION: "Professional URL indexing automation platform";
    readonly VERSION: "1.0.0";
    readonly AUTHOR: "IndexNow Studio Team";
    readonly COPYRIGHT: "© 2025 IndexNow Studio. All rights reserved.";
};
declare const USER_ROLES: {
    readonly USER: "user";
    readonly ADMIN: "admin";
    readonly SUPER_ADMIN: "super_admin";
};
type UserRole$1 = typeof USER_ROLES[keyof typeof USER_ROLES];
declare const ROLE_PERMISSIONS: {
    readonly user: readonly ["read:profile", "update:profile", "read:rank_tracking", "create:rank_tracking", "update:rank_tracking", "delete:rank_tracking", "read:billing", "create:payment"];
    readonly admin: readonly ["read:all_users", "update:user", "suspend:user", "read:all_jobs", "manage:system_settings", "read:analytics", "manage:packages", "read:system_health"];
    readonly super_admin: readonly ["delete:user", "manage:admin_users", "manage:system_config", "access:debug_tools", "manage:payment_gateways", "read:system_logs", "manage:database"];
};
declare const JOB_STATUS: {
    readonly PENDING: "pending";
    readonly PROCESSING: "processing";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
    readonly SCHEDULED: "scheduled";
};
declare const SCHEDULE_TYPES: {
    readonly ONE_TIME: "one-time";
    readonly HOURLY: "hourly";
    readonly DAILY: "daily";
    readonly WEEKLY: "weekly";
    readonly MONTHLY: "monthly";
    readonly CUSTOM: "custom";
};
declare const JOB_TYPES: {
    readonly URL_LIST: "url-list";
    readonly SINGLE_URL: "single-url";
    readonly BULK_UPLOAD: "bulk-upload";
};
declare const RANK_TRACKING: {
    readonly COUNTRIES: {
        readonly US: "United States";
        readonly GB: "United Kingdom";
        readonly CA: "Canada";
        readonly AU: "Australia";
        readonly ID: "Indonesia";
        readonly SG: "Singapore";
        readonly MY: "Malaysia";
        readonly TH: "Thailand";
        readonly PH: "Philippines";
        readonly VN: "Vietnam";
    };
    readonly DEVICES: {
        readonly DESKTOP: "desktop";
        readonly MOBILE: "mobile";
        readonly TABLET: "tablet";
    };
    readonly SEARCH_ENGINES: {
        readonly GOOGLE: "google";
        readonly BING: "bing";
        readonly YAHOO: "yahoo";
    };
    readonly MAX_POSITION: 100;
    readonly DEFAULT_CHECK_FREQUENCY: "0 2 * * *";
};
declare const PAGINATION: {
    readonly DEFAULT_PAGE_SIZE: 10;
    readonly MAX_PAGE_SIZE: 100;
    readonly MIN_PAGE_SIZE: 5;
};
declare const FILE_UPLOAD: {
    readonly MAX_FILE_SIZE: number;
    readonly ALLOWED_TYPES: {
        readonly URL_LIST: readonly [".txt", ".csv"];
        readonly IMAGE: readonly [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    };
    readonly MAX_URLS_PER_FILE: 10000;
};
declare const NOTIFICATION_TYPES: {
    readonly INFO: "info";
    readonly SUCCESS: "success";
    readonly WARNING: "warning";
    readonly ERROR: "error";
};
type NotificationType$1 = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
declare const EMAIL_TEMPLATES: {
    readonly JOB_COMPLETION: "job-completion";
    readonly JOB_FAILURE: "job-failure";
    readonly QUOTA_ALERT: "quota-alert";
    readonly DAILY_REPORT: "daily-report";
    readonly PAYMENT_RECEIVED: "payment-received";
    readonly LOGIN_NOTIFICATION: "login-notification";
    readonly PACKAGE_ACTIVATED: "package-activated";
    readonly ORDER_EXPIRED: "order-expired";
    readonly BILLING_CONFIRMATION: "billing-confirmation";
};
declare const CACHE_KEYS: {
    readonly USER_PROFILE: "user:profile";
    readonly USER_SETTINGS: "user:settings";
    readonly USER_QUOTA: "user:quota";
    readonly JOBS: "user:jobs";
    readonly PACKAGES: "packages";
    readonly SITE_SETTINGS: "site:settings";
    readonly RANK_TRACKING: "rank_tracking";
    readonly PAYMENT_GATEWAYS: "payment:gateways";
};
declare const CACHE_TTL: {
    readonly SHORT: 300;
    readonly MEDIUM: 3600;
    readonly LONG: 86400;
    readonly VERY_LONG: 604800;
};
declare const RATE_LIMITS: {
    readonly API_REQUESTS: {
        readonly WINDOW_MS: number;
        readonly MAX_REQUESTS: 100;
    };
    readonly LOGIN_ATTEMPTS: {
        readonly WINDOW_MS: number;
        readonly MAX_ATTEMPTS: 5;
    };
    readonly PASSWORD_RESET: {
        readonly WINDOW_MS: number;
        readonly MAX_ATTEMPTS: 3;
    };
    readonly PAYMENT_REQUESTS: {
        readonly WINDOW_MS: number;
        readonly MAX_REQUESTS: 5;
    };
};
declare const DEFAULT_SETTINGS: {
    readonly USER: {
        readonly TIMEOUT_DURATION: 30000;
        readonly RETRY_ATTEMPTS: 3;
        readonly EMAIL_JOB_COMPLETION: true;
        readonly EMAIL_JOB_FAILURE: true;
        readonly EMAIL_QUOTA_ALERTS: true;
        readonly EMAIL_DAILY_REPORT: true;
        readonly DEFAULT_SCHEDULE: "one-time";
    };
    readonly SYSTEM: {
        readonly SITE_NAME: "IndexNow Studio";
        readonly SITE_DESCRIPTION: "Professional URL indexing automation platform";
        readonly SMTP_PORT: 465;
        readonly SMTP_SECURE: true;
        readonly SMTP_ENABLED: false;
        readonly MAINTENANCE_MODE: false;
        readonly REGISTRATION_ENABLED: true;
    };
};
declare const REGEX_PATTERNS: {
    readonly EMAIL: RegExp;
    readonly URL: RegExp;
    readonly PHONE: RegExp;
    readonly PASSWORD: RegExp;
    readonly CRON: RegExp;
    readonly DOMAIN: RegExp;
};
declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly METHOD_NOT_ALLOWED: 405;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
declare const TIME: {
    readonly SECOND: 1000;
    readonly MINUTE: number;
    readonly HOUR: number;
    readonly DAY: number;
    readonly WEEK: number;
    readonly MONTH: number;
    readonly YEAR: number;
};

/**
 * Global application-level type definitions for IndexNow Studio
 */

type Environment = 'development' | 'production' | 'testing';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface ApplicationConfig {
    environment: Environment;
    version: string;
    buildDate: string;
    logLevel: LogLevel;
    features: FeatureFlags;
    limits: ApplicationLimits;
}
interface FeatureFlags {
    enableRankTracking: boolean;
    enablePaymentGateways: boolean;
    enableBulkOperations: boolean;
    enableAdvancedAnalytics: boolean;
    enableApiAccess: boolean;
    enableWebhooks: boolean;
    enableSSO: boolean;
    enableTrials: boolean;
    maintenanceMode: boolean;
}
interface ApplicationLimits {
    maxJobsPerUser: number;
    maxUrlsPerJob: number;
    maxKeywordsPerUser: number;
    maxConcurrentJobs: number;
    rateLimitPerMinute: number;
    fileSizeLimit: number;
    sessionTimeout: number;
}
interface NavigationItem {
    id: string;
    label: string;
    path: string;
    icon?: string;
    children?: NavigationItem[];
    isActive?: boolean;
    isDisabled?: boolean;
    badge?: string | number;
    requiredRole?: string[];
}
type ThemeMode = 'light' | 'dark' | 'auto';
type UISize = 'sm' | 'md' | 'lg';
type UIVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
interface ThemeConfig {
    mode: ThemeMode;
    primaryColor: string;
    accentColor: string;
    fontSize: UISize;
    compactMode: boolean;
}
interface ErrorContext {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    url?: string;
    timestamp: Date;
    environment?: Environment;
    buildVersion?: string;
}
type SystemStatus = 'operational' | 'degraded' | 'maintenance' | 'outage';
interface SystemHealth {
    status: SystemStatus;
    services: ServiceHealth[];
    lastUpdated: Date;
    incidents?: Incident[];
}
interface ServiceHealth {
    name: string;
    status: SystemStatus;
    responseTime?: number;
    uptime?: number;
    lastCheck: Date;
    details?: Record<string, Json$1>;
}
interface Incident {
    id: string;
    title: string;
    description: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedServices: string[];
    startedAt: Date;
    resolvedAt?: Date;
    updates: IncidentUpdate[];
}
interface IncidentUpdate {
    id: string;
    message: string;
    timestamp: Date;
    status: string;
}
interface AnalyticsEvent {
    event: string;
    properties?: Record<string, Json$1>;
    userId?: string;
    sessionId?: string;
    timestamp: Date;
}
interface PerformanceMetrics {
    pageLoadTime: number;
    apiResponseTime: number;
    errorRate: number;
    activeUsers: number;
    timestamp: Date;
}

/**
 * Payment-related type definitions for IndexNow Studio (business/camelCase layer)
 *
 * @deprecated Most types overlap with `types/services/Payments.ts` (DB/snake_case layer).
 * Only `Package` is still actively imported (by User.ts). Avoid adding new types here —
 * use `types/services/Payments.ts` instead.
 */

type Currency$1 = 'USD';
interface Package$1 {
    id: string;
    name: string;
    description: string;
    features: string[];
    pricing: {
        monthly: number;
        annual?: number;
        currency: Currency$1;
    };
    quotas: {
        dailyUrls: number;
        keywords: number;
        rankChecks: number;
        apiCalls: number;
        storage: number;
        concurrentJobs: number;
        historicalData: number;
    };
    features_flags: {
        bulkOperations: boolean;
        advancedAnalytics: boolean;
        apiAccess: boolean;
        prioritySupport: boolean;
        customReports: boolean;
        webhooks: boolean;
        sso: boolean;
    };
    trial: {
        enabled: boolean;
        days: number;
    };
    isPopular: boolean;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Global user-related type definitions for IndexNow Studio
 */

type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned';
type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing' | 'expired';
interface User {
    id: string;
    email: string;
    role: UserRole$1;
    status: UserStatus;
    created_at: Date;
    updated_at: Date;
}
interface AppUserProfile {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    phone_number?: string;
    country?: string;
    role: UserRole$1;
    is_active: boolean;
    subscription_status: SubscriptionStatus;
    package_name?: string;
    package?: Package$1;
    created_at: Date;
    updated_at: Date;
}
interface AppUserSettings {
    id: string;
    user_id: string;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    security: SecuritySettings;
    preferences: Record<string, Json$1>;
    updated_at: Date;
}
interface NotificationSettings {
    email: boolean;
    push: boolean;
    sms: boolean;
    quotaAlerts: boolean;
    systemUpdates: boolean;
}
interface PrivacySettings {
    shareUsageData: boolean;
    allowAnalytics: boolean;
    showInDirectory: boolean;
}
interface SecuritySettings {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    passwordChangeRequired: boolean;
    allowedIpAddresses?: string[];
}
interface UserQuota {
    rankTrackingChecks: number;
    apiCalls: number;
}
interface UserQuotaUsage {
    rank_tracking_checks: number;
    api_calls: number;
    is_unlimited?: boolean;
    keywords_used?: number;
    keywords_limit?: number;
}
interface UserQuotaLimits {
    rank_tracking_checks: number;
    api_calls: number;
}
interface QuotaUsageEntry {
    id?: string;
    timestamp: Date;
    user_id?: string;
    operation_type: string;
    quota_consumed: number;
    quota_remaining: number;
    quota_limit: number;
    usage_percentage: number;
    session_id?: string;
    endpoint?: string;
    country_code?: string;
    keywords_count?: number;
    cost_per_request?: number;
    metadata?: Record<string, Json$1>;
}
interface UserSubscription {
    id: string;
    user_id: string;
    package_id: string;
    current_package_id?: string;
    status: SubscriptionStatus;
    start_date: Date;
    end_date: Date;
    auto_renewal: boolean;
    created_at: Date;
    updated_at: Date;
}
interface TrialEligibility {
    isEligible: boolean;
    hasUsedTrial: boolean;
    trialLength: number;
    restrictions?: string[];
}
interface ApiKey {
    id: string;
    user_id: string;
    name: string;
    key_hash: string;
    permissions: string[];
    is_active: boolean;
    last_used?: Date;
    expires_at?: Date;
    created_at: Date;
}
interface EmailVerification {
    id: string;
    user_id: string;
    email: string;
    token: string;
    verified: boolean;
    expires_at: Date;
    created_at: Date;
}
interface TwoFactorAuth {
    id: string;
    user_id: string;
    secret: string;
    enabled: boolean;
    backup_codes: string[];
    last_used?: Date;
    created_at: Date;
}
interface UserActivity {
    id: string;
    user_id: string;
    action: string;
    details: Record<string, Json$1>;
    ip_address: string;
    user_agent: string;
    created_at: Date;
}
interface UserSession {
    id: string;
    userId: string;
    token: string;
    refreshToken?: string;
    ipAddress: string;
    userAgent: string;
    location?: GeoLocation;
    isActive: boolean;
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
}
interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    compactMode: boolean;
    autoRefresh: boolean;
}
interface UserInvitation {
    id: string;
    email: string;
    role: string;
    token: string;
    invitedBy: string;
    isAccepted: boolean;
    expiresAt: Date;
    createdAt: Date;
    acceptedAt?: Date;
}
interface UserContext {
    user: AppUserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    permissions: string[];
    subscription: UserSubscription | null;
    quota: UserQuotaUsage;
    limits: UserQuotaLimits;
    trial: TrialEligibility | null;
}
interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: AppUserProfile | null;
    token: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
    lastActivity: Date | null;
}
interface SessionInfo {
    id: string;
    userId: string;
    ipAddress: string;
    userAgent: string;
    location?: GeoLocation;
    isActive: boolean;
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
}
interface GeoLocation {
    country: string;
    region?: string;
    city?: string;
    timezone?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}
interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    component?: string;
    isCompleted: boolean;
    isOptional: boolean;
    order: number;
}
interface OnboardingState {
    isActive: boolean;
    currentStep: number;
    totalSteps: number;
    steps: OnboardingStep[];
    canSkip: boolean;
}
interface UserActivityLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, Json$1>;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    metadata?: Record<string, Json$1>;
}
interface UserFeedback {
    id: string;
    userId: string;
    type: 'bug' | 'feature' | 'general' | 'compliment' | 'complaint';
    category: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    attachments?: FileAttachment[];
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
}
interface FileAttachment {
    id: string;
    filename: string;
    size: number;
    mimeType: string;
    url: string;
    uploadedAt: Date;
}
interface TeamMember {
    userId: string;
    email: string;
    fullName: string;
    role: UserRole$1;
    permissions: string[];
    joinedAt: Date;
    lastActivity?: Date;
    isActive: boolean;
}
interface Team {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    members: TeamMember[];
    settings: TeamSettings;
    createdAt: Date;
    updatedAt: Date;
}
interface TeamSettings {
    allowMemberInvites: boolean;
    requireOwnerApproval: boolean;
    defaultRole: UserRole$1;
    maxMembers: number;
}

/**
 * Global system-level type definitions for IndexNow Studio
 */
interface SystemConfig {
    database: DatabaseConfig;
    redis: RedisConfig;
    email: EmailConfig;
    storage: StorageConfig;
    monitoring: MonitoringConfig;
    security: SecurityConfig;
}
interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    ssl: boolean;
    poolSize: number;
    timeout: number;
    retryAttempts: number;
}
interface RedisConfig {
    host: string;
    port: number;
    database: number;
    password?: string;
    ttl: number;
    maxConnections: number;
}
interface EmailConfig {
    provider: 'smtp' | 'sendgrid' | 'ses';
    host?: string;
    port?: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: {
        name: string;
        email: string;
    };
    replyTo?: string;
}
interface StorageConfig {
    provider: 'local' | 's3' | 'gcs';
    bucket?: string;
    region?: string;
    endpoint?: string;
    maxFileSize: number;
    allowedTypes: string[];
}
interface MonitoringConfig {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsInterval: number;
    alertThresholds: AlertThresholds;
}
interface AlertThresholds {
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
}
interface SecurityConfig {
    jwtSecret: string;
    jwtExpiry: string;
    refreshTokenExpiry: string;
    bcryptRounds: number;
    corsOrigins: string[];
    rateLimiting: RateLimitConfig;
    encryption: EncryptionConfig;
}
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
}
interface EncryptionConfig {
    algorithm: string;
    keyLength: number;
    ivLength: number;
}
interface SystemMetrics {
    timestamp: Date;
    cpu: CPUMetrics;
    memory: MemoryMetrics;
    disk: DiskMetrics;
    network: NetworkMetrics;
    database: DatabaseMetrics;
    application: ApplicationMetrics;
}
interface CPUMetrics {
    usage: number;
    cores: number;
    loadAverage: number[];
}
interface MemoryMetrics {
    total: number;
    used: number;
    free: number;
    usage: number;
}
interface DiskMetrics {
    total: number;
    used: number;
    free: number;
    usage: number;
}
interface NetworkMetrics {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
}
interface DatabaseMetrics {
    connections: {
        active: number;
        idle: number;
        total: number;
    };
    queries: {
        total: number;
        slow: number;
        failed: number;
        averageTime: number;
    };
    size: number;
}
interface ApplicationMetrics {
    requests: {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number;
    };
    jobs: {
        active: number;
        completed: number;
        failed: number;
        queued: number;
    };
    users: {
        active: number;
        online: number;
        registered: number;
    };
}
interface SystemJob {
    id: string;
    name: string;
    type: 'cron' | 'queue' | 'immediate';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'critical';
    payload?: Record<string, unknown>;
    result?: Record<string, unknown>;
    error?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    retryCount: number;
    maxRetries: number;
    nextRetryAt?: Date;
}
interface JobQueue {
    name: string;
    size: number;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
}
interface BackupJob {
    id: string;
    type: 'full' | 'incremental' | 'differential';
    status: 'pending' | 'running' | 'completed' | 'failed';
    size?: number;
    location: string;
    createdAt: Date;
    completedAt?: Date;
    error?: string;
    metadata?: Record<string, unknown>;
}
interface MaintenanceWindow {
    id: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    isActive: boolean;
    affectedServices: string[];
    notificationSent: boolean;
    createdAt: Date;
}
interface ExternalService {
    name: string;
    type: 'api' | 'webhook' | 'database' | 'storage';
    url: string;
    status: 'connected' | 'disconnected' | 'error';
    lastCheck: Date;
    responseTime?: number;
    credentials?: Record<string, unknown>;
    configuration?: Record<string, unknown>;
}
interface WebhookEndpoint {
    id: string;
    url: string;
    events: string[];
    isActive: boolean;
    secret?: string;
    headers?: Record<string, string>;
    retryAttempts: number;
    timeout: number;
    createdAt: Date;
    lastTriggered?: Date;
}
interface SystemLog {
    id: string;
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    context?: Record<string, unknown>;
    timestamp: Date;
    source: string;
    userId?: string;
    requestId?: string;
    correlationId?: string;
}
interface AuditEvent {
    id: string;
    action: string;
    resource: string;
    resourceId?: string;
    userId?: string;
    userRole?: string;
    ipAddress: string;
    userAgent: string;
    details?: Record<string, unknown>;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}

/**
 * User-related API request types for IndexNow Studio
 */

declare const createApiKeySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    scopes: z.ZodArray<z.ZodString, "many">;
    expiresAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    scopes: string[];
    description?: string | undefined;
    expiresAt?: Date | undefined;
}, {
    name: string;
    scopes: string[];
    description?: string | undefined;
    expiresAt?: Date | undefined;
}>;

interface ResetPasswordEmailRequest {
    email: string;
    redirectUrl?: string;
}
interface ConfirmPasswordResetRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}
interface RefreshTokenRequest {
    refreshToken: string;
}
interface LogoutRequest {
    everywhere?: boolean;
}
interface SendVerificationEmailRequest {
    email?: string;
}
interface VerifyEmailRequest {
    token: string;
    email: string;
}
interface Enable2FARequest {
    password: string;
}
interface Confirm2FARequest {
    secret: string;
    code: string;
}
interface Disable2FARequest {
    password: string;
    code: string;
}
interface Verify2FARequest {
    code: string;
}
interface CreateApiKeyRequest {
    name: string;
    description?: string;
    scopes: string[];
    expiresAt?: Date;
}
interface UpdateApiKeyRequest {
    name?: string;
    description?: string;
    scopes?: string[];
    isActive?: boolean;
}
interface RevokeApiKeyRequest {
    keyId: string;
}
interface InviteUserRequest {
    email: string;
    role: string;
    message?: string;
    expiresIn?: number;
}
interface AcceptInvitationRequest {
    token: string;
    password?: string;
    name?: string;
}
interface UpdateUserRoleRequest {
    userId: string;
    role: string;
    reason?: string;
}
interface DeleteAccountRequest {
    password: string;
    reason?: string;
    feedback?: string;
}
interface SuspendAccountRequest {
    userId: string;
    reason: string;
    duration?: number;
    notifyUser?: boolean;
}
interface ReactivateAccountRequest {
    userId: string;
    reason?: string;
}
interface ExportUserDataRequest {
    format: 'json' | 'csv' | 'pdf';
    includePersonalData?: boolean;
    includeActivityData?: boolean;
    includeJobData?: boolean;
    dateRange?: {
        from: Date;
        to: Date;
    };
}
type LoginRequestBody = z.infer<typeof loginSchema>;
type RegisterRequestBody = z.infer<typeof registerSchema>;
type ChangePasswordRequestBody = z.infer<typeof changePasswordSchema>;
type UpdateUserSettingsRequestBody = z.infer<typeof updateUserSettingsSchema>;
type CreateApiKeyRequestBody = z.infer<typeof createApiKeySchema>;

/**
 * Payment service-related type definitions for IndexNow Studio
 */

type PaymentMethod = 'paddle' | 'credit-card';
type BillingPeriod = 'monthly' | 'annual' | 'lifetime' | 'one-time';
type Currency = 'USD';
type PaymentStatus = 'pending' | 'proof_uploaded' | 'completed' | 'failed' | 'cancelled' | 'refunded';
interface PricingTier {
    promo_price: number;
    regular_price: number;
    period_label: string;
    paddle_price_id?: string;
}
interface PricingTiers {
    monthly?: PricingTier;
    annual?: PricingTier;
    [key: string]: PricingTier | undefined;
}
interface Package {
    id: string;
    name: string;
    slug: string;
    description: string;
    currency: string;
    billing_period: string;
    features: string[];
    pricing_tiers?: PricingTiers;
    sort_order?: number;
    is_active?: boolean;
    quota_limits?: Record<string, Json$1>;
    created_at?: Date | string;
    updated_at?: Date | string;
}
interface Order {
    id: string;
    user_id: string;
    package_id: string;
    amount: number;
    currency: Currency;
    status: PaymentStatus;
    billing_period: BillingPeriod;
    payment_method: PaymentMethod;
    created_at: Date;
    updated_at: Date;
}
interface Transaction {
    id: string;
    order_id: string;
    amount: number;
    currency: Currency;
    status: PaymentStatus;
    gateway: string;
    gateway_transaction_id?: string;
    created_at: Date;
    updated_at: Date;
}
interface CustomerInfo {
    email: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    address?: {
        line1: string;
        line2?: string;
        city: string;
        state?: string;
        postal_code?: string;
        country: string;
    };
}
interface Subscription {
    id: string;
    user_id: string;
    package_id: string;
    status: 'active' | 'inactive' | 'expired' | 'cancelled';
    start_date: Date;
    end_date: Date;
    billing_period: BillingPeriod;
    auto_renewal: boolean;
    created_at: Date;
    updated_at: Date;
}
interface Invoice {
    id: string;
    subscription_id: string;
    amount: number;
    currency: Currency;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    due_date: Date;
    created_at: Date;
    updated_at: Date;
}
interface PromoCode {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_uses?: number;
    used_count: number;
    valid_from: Date;
    valid_until: Date;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
interface Refund {
    id: string;
    transaction_id: string;
    amount: number;
    currency: Currency;
    reason: string;
    status: 'pending' | 'completed' | 'failed';
    created_at: Date;
    updated_at: Date;
}
interface PaymentGateway {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    configuration: Record<string, Json$1>;
    created_at: Date;
    updated_at: Date;
}
interface PaymentData {
    packageId: string;
    billingPeriod: BillingPeriod;
    customerInfo: CustomerInfo;
    user: {
        id: string;
        email: string;
        fullName: string;
    };
    isTrial: boolean;
    promoCode?: string;
    metadata?: Record<string, Json$1>;
}
interface PaymentResult {
    success: boolean;
    redirectUrl?: string;
    data?: Json$1;
    requiresRedirect: boolean;
    error?: PaymentError;
    transaction?: Transaction;
    order?: Order;
}
interface PaymentError {
    code: string;
    message: string;
    type: 'validation' | 'gateway' | 'network' | 'security' | 'business';
    retryable: boolean;
    details?: Record<string, Json$1>;
    timestamp: Date;
}
interface PaymentAnalytics {
    period: {
        start: Date;
        end: Date;
    };
    revenue: {
        total: number;
        currency: Currency;
        growth: number;
        recurring: number;
        oneTime: number;
    };
    transactions: {
        total: number;
        successful: number;
        failed: number;
        refunded: number;
        successRate: number;
    };
    averages: {
        orderValue: number;
        processingTime: number;
        refundTime: number;
    };
    breakdown: {
        byMethod: Array<{
            method: PaymentMethod;
            count: number;
            amount: number;
            percentage: number;
        }>;
        byPackage: Array<{
            packageId: string;
            packageName: string;
            count: number;
            amount: number;
            percentage: number;
        }>;
        byCountry: Array<{
            country: string;
            count: number;
            amount: number;
            percentage: number;
        }>;
    };
    trends: {
        daily: Array<{
            date: Date;
            amount: number;
            count: number;
        }>;
        weekly: Array<{
            week: Date;
            amount: number;
            count: number;
        }>;
        monthly: Array<{
            month: Date;
            amount: number;
            count: number;
        }>;
    };
}
interface SubscriptionManager {
    createSubscription: (data: CreateSubscriptionData) => Promise<Subscription>;
    updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<Subscription>;
    cancelSubscription: (id: string, reason: string) => Promise<void>;
    pauseSubscription: (id: string) => Promise<void>;
    resumeSubscription: (id: string) => Promise<void>;
    getSubscription: (id: string) => Promise<Subscription>;
    getSubscriptions: (userId: string) => Promise<Subscription[]>;
    processRecurringPayment: (subscriptionId: string) => Promise<PaymentResult>;
}
interface CreateSubscriptionData {
    userId: string;
    packageId: string;
    billingPeriod: BillingPeriod;
    paymentMethodId: string;
    startDate: Date;
    trialDays?: number;
    promoCode?: string;
    metadata?: Record<string, Json$1>;
}
interface InvoiceManager {
    createInvoice: (data: CreateInvoiceData) => Promise<Invoice>;
    updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<Invoice>;
    sendInvoice: (id: string, options: SendInvoiceOptions) => Promise<void>;
    markInvoiceAsPaid: (id: string, paymentData: PaymentData) => Promise<void>;
    getInvoice: (id: string) => Promise<Invoice>;
    getInvoices: (filters: InvoiceFilters) => Promise<Invoice[]>;
    generatePDF: (id: string) => Promise<Buffer>;
}
interface CreateInvoiceData {
    orderId: string;
    customerId: string;
    items: InvoiceItem[];
    discounts?: InvoiceDiscount[];
    taxes?: InvoiceTax[];
    notes?: string;
    dueDate: Date;
    currency: Currency;
}
interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    metadata?: Record<string, Json$1>;
}
interface InvoiceDiscount {
    description: string;
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
}
interface InvoiceTax {
    description: string;
    rate: number;
    amount: number;
    country?: string;
}
interface SendInvoiceOptions {
    email?: string;
    subject?: string;
    message?: string;
    attachPDF?: boolean;
    sendReminder?: boolean;
}
interface InvoiceFilters {
    userId?: string;
    status?: string[];
    dateRange?: {
        from: Date;
        to: Date;
    };
    amountRange?: {
        min: number;
        max: number;
    };
    currency?: Currency;
    page?: number;
    limit?: number;
}
interface FraudDetection {
    checkTransaction: (transaction: Transaction, customerInfo: CustomerInfo) => Promise<FraudScore>;
    updateRules: (rules: FraudRule[]) => Promise<void>;
    getRules: () => Promise<FraudRule[]>;
    blockCustomer: (customerId: string, reason: string) => Promise<void>;
    unblockCustomer: (customerId: string) => Promise<void>;
}
interface FraudScore {
    score: number;
    risk: 'low' | 'medium' | 'high';
    factors: FraudFactor[];
    recommendation: 'approve' | 'review' | 'decline';
    blocked: boolean;
}
interface FraudFactor {
    type: string;
    description: string;
    weight: number;
    triggered: boolean;
}
interface FraudRule {
    id: string;
    name: string;
    type: 'amount' | 'location' | 'velocity' | 'device' | 'email' | 'custom';
    condition: string;
    action: 'flag' | 'block' | 'review';
    weight: number;
    isActive: boolean;
}
interface ComplianceReporting {
    generateTaxReport: (period: {
        start: Date;
        end: Date;
    }) => Promise<TaxReport>;
    generateRevenueReport: (period: {
        start: Date;
        end: Date;
    }) => Promise<RevenueReport>;
    getRefundReport: (period: {
        start: Date;
        end: Date;
    }) => Promise<RefundReport>;
    exportTransactions: (filters: TransactionFilters, format: 'csv' | 'xlsx' | 'pdf') => Promise<Buffer>;
}
interface TaxReport {
    period: {
        start: Date;
        end: Date;
    };
    totalRevenue: number;
    taxableRevenue: number;
    taxCollected: number;
    currency: Currency;
    breakdown: Array<{
        country: string;
        revenue: number;
        taxRate: number;
        taxAmount: number;
    }>;
}
interface RevenueReport {
    period: {
        start: Date;
        end: Date;
    };
    totalRevenue: number;
    netRevenue: number;
    fees: number;
    refunds: number;
    currency: Currency;
    breakdown: {
        byMonth: Array<{
            month: Date;
            revenue: number;
        }>;
        byPackage: Array<{
            packageId: string;
            revenue: number;
        }>;
        byCountry: Array<{
            country: string;
            revenue: number;
        }>;
    };
}
interface RefundReport {
    period: {
        start: Date;
        end: Date;
    };
    totalRefunds: number;
    refundCount: number;
    refundRate: number;
    currency: Currency;
    reasons: Array<{
        reason: string;
        count: number;
        amount: number;
    }>;
}
interface TransactionFilters {
    status?: PaymentStatus[];
    methods?: PaymentMethod[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    amountRange?: {
        min: number;
        max: number;
    };
    userId?: string;
    orderId?: string;
    currency?: Currency;
    page?: number;
    limit?: number;
}

/**
 * Payment-related API request types for IndexNow Studio
 */

interface CreatePaymentRequest {
    packageId: string;
    billingPeriod: 'monthly' | 'quarterly' | 'biannual' | 'annual';
    paymentMethod: 'paddle' | 'credit-card';
    customerInfo: CustomerInfo;
    promoCode?: string;
    isTrialToSubscription?: boolean;
    returnUrl?: string;
    metadata?: Record<string, unknown>;
}
interface ProcessPaymentRequest {
    orderId: string;
    paymentMethod: string;
    paymentData?: Record<string, unknown>;
    customerInfo?: Partial<CustomerInfo>;
}
interface CreateSubscriptionRequest {
    packageId: string;
    billingPeriod: 'monthly' | 'quarterly' | 'biannual' | 'annual';
    customerInfo: CustomerInfo;
    paymentMethod: string;
    tokenId?: string;
    startDate?: Date;
    trialDays?: number;
    promoCode?: string;
}
interface UpdateSubscriptionRequest {
    subscriptionId: string;
    packageId?: string;
    billingPeriod?: 'monthly' | 'quarterly' | 'biannual' | 'annual';
    isActive?: boolean;
    endDate?: Date;
    metadata?: Record<string, unknown>;
}
interface CancelSubscriptionRequest {
    subscriptionId: string;
    reason: 'user_requested' | 'payment_failed' | 'fraud' | 'other';
    reasonDetails?: string;
    cancelAtPeriodEnd?: boolean;
    immediateCancel?: boolean;
}
interface CreateRefundRequest {
    transactionId: string;
    amount?: number;
    reason: 'duplicate' | 'fraud' | 'requested_by_customer' | 'other';
    reasonDetails?: string;
    notifyCustomer?: boolean;
}
interface ProcessRefundRequest {
    refundId: string;
    gatewayTransactionId?: string;
    metadata?: Record<string, unknown>;
}
interface CreatePromoCodeRequest {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    description?: string;
    isActive: boolean;
    maxUses?: number;
    usesPerCustomer?: number;
    validFrom: Date;
    validUntil: Date;
    applicablePackages?: string[];
    minOrderAmount?: number;
    metadata?: Record<string, unknown>;
}
interface UpdatePromoCodeRequest {
    promoCodeId: string;
    code?: string;
    type?: 'percentage' | 'fixed';
    value?: number;
    description?: string;
    isActive?: boolean;
    maxUses?: number;
    usesPerCustomer?: number;
    validFrom?: Date;
    validUntil?: Date;
    applicablePackages?: string[];
    minOrderAmount?: number;
}
interface ValidatePromoCodeRequest {
    code: string;
    packageId: string;
    billingPeriod: string;
    userId?: string;
}
interface CreateInvoiceRequest {
    orderId: string;
    customerId: string;
    items: InvoiceItem[];
    discounts?: InvoiceDiscount[];
    taxes?: InvoiceTax[];
    notes?: string;
    dueDate?: Date;
    sendToCustomer?: boolean;
}
interface UpdateInvoiceRequest {
    invoiceId: string;
    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    notes?: string;
    dueDate?: Date;
}
interface SendInvoiceRequest {
    invoiceId: string;
    email?: string;
    subject?: string;
    message?: string;
}
interface AddPaymentMethodRequest {
    type: 'credit_card' | 'bank_account' | 'digital_wallet';
    tokenId: string;
    isDefault?: boolean;
    billingAddress?: CustomerInfo['address'];
    metadata?: Record<string, unknown>;
}
interface UpdatePaymentMethodRequest {
    paymentMethodId: string;
    isDefault?: boolean;
    billingAddress?: CustomerInfo['address'];
    isActive?: boolean;
}
interface RemovePaymentMethodRequest {
    paymentMethodId: string;
    replacementMethodId?: string;
}
interface UpdateBillingAddressRequest {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
}
interface CreateWebhookRequest {
    url: string;
    events: string[];
    isActive?: boolean;
    secret?: string;
    headers?: Record<string, string>;
}
interface UpdateWebhookRequest {
    webhookId: string;
    url?: string;
    events?: string[];
    isActive?: boolean;
    secret?: string;
    headers?: Record<string, string>;
}
declare const customerInfoSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    address: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        country: string;
        city: string;
        postalCode: string;
        street: string;
        state?: string | undefined;
    }, {
        country: string;
        city: string;
        postalCode: string;
        street: string;
        state?: string | undefined;
    }>;
    company: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        taxId: z.ZodOptional<z.ZodString>;
        industry: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        taxId?: string | undefined;
        industry?: string | undefined;
    }, {
        name: string;
        taxId?: string | undefined;
        industry?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: {
        country: string;
        city: string;
        postalCode: string;
        street: string;
        state?: string | undefined;
    };
    company?: {
        name: string;
        taxId?: string | undefined;
        industry?: string | undefined;
    } | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: {
        country: string;
        city: string;
        postalCode: string;
        street: string;
        state?: string | undefined;
    };
    company?: {
        name: string;
        taxId?: string | undefined;
        industry?: string | undefined;
    } | undefined;
}>;
declare const createPaymentSchema: z.ZodObject<{
    packageId: z.ZodString;
    billingPeriod: z.ZodEnum<["monthly", "quarterly", "biannual", "annual"]>;
    paymentMethod: z.ZodEnum<["paddle", "credit-card"]>;
    customerInfo: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
        phone: z.ZodString;
        address: z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            country: string;
            city: string;
            postalCode: string;
            street: string;
            state?: string | undefined;
        }, {
            country: string;
            city: string;
            postalCode: string;
            street: string;
            state?: string | undefined;
        }>;
        company: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            taxId: z.ZodOptional<z.ZodString>;
            industry: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            taxId?: string | undefined;
            industry?: string | undefined;
        }, {
            name: string;
            taxId?: string | undefined;
            industry?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: {
            country: string;
            city: string;
            postalCode: string;
            street: string;
            state?: string | undefined;
        };
        company?: {
            name: string;
            taxId?: string | undefined;
            industry?: string | undefined;
        } | undefined;
    }, {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: {
            country: string;
            city: string;
            postalCode: string;
            street: string;
            state?: string | undefined;
        };
        company?: {
            name: string;
            taxId?: string | undefined;
            industry?: string | undefined;
        } | undefined;
    }>;
    promoCode: z.ZodOptional<z.ZodString>;
    isTrialToSubscription: z.ZodOptional<z.ZodBoolean>;
    returnUrl: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    packageId: string;
    billingPeriod: "monthly" | "quarterly" | "biannual" | "annual";
    paymentMethod: "paddle" | "credit-card";
    customerInfo: {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: {
            country: string;
            city: string;
            postalCode: string;
            street: string;
            state?: string | undefined;
        };
        company?: {
            name: string;
            taxId?: string | undefined;
            industry?: string | undefined;
        } | undefined;
    };
    promoCode?: string | undefined;
    isTrialToSubscription?: boolean | undefined;
    returnUrl?: string | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    packageId: string;
    billingPeriod: "monthly" | "quarterly" | "biannual" | "annual";
    paymentMethod: "paddle" | "credit-card";
    customerInfo: {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: {
            country: string;
            city: string;
            postalCode: string;
            street: string;
            state?: string | undefined;
        };
        company?: {
            name: string;
            taxId?: string | undefined;
            industry?: string | undefined;
        } | undefined;
    };
    promoCode?: string | undefined;
    isTrialToSubscription?: boolean | undefined;
    returnUrl?: string | undefined;
    metadata?: Record<string, any> | undefined;
}>;
declare const createSubscriptionSchema: z.ZodObject<{
    packageId: z.ZodString;
    billingPeriod: z.ZodEnum<["monthly", "quarterly", "biannual", "annual"]>;
    customerInfo: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
        phone: z.ZodString;
        address: z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            country: string;
            city: string;
            postalCode: string;
            street: string;
            state?: string | undefined;
        }, {
            country: string;
            city: string;
            postalCode: string;
            street: string;
            state?: string | undefined;
        }>;
        company: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            taxId: z.ZodOptional<z.ZodString>;
            industry: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            taxId?: string | undefined;
            industry?: string | undefined;
        }, {
            name: string;
            taxId?: string | undefined;
            industry?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: {
            country: string;
            city: string;
            postalCode: string;
            street: string;
            state?: string | undefined;
        };
        company?: {
            name: string;
            taxId?: string | undefined;
            industry?: string | undefined;
        } | undefined;
    }, {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: {
            country: string;
            city: string;
            postalCode: string;
            street: string;
            state?: string | undefined;
        };
        company?: {
            name: string;
            taxId?: string | undefined;
            industry?: string | undefined;
        } | undefined;
    }>;
    paymentMethod: z.ZodString;
    tokenId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodDate>;
    trialDays: z.ZodOptional<z.ZodNumber>;
    promoCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    packageId: string;
    billingPeriod: "monthly" | "quarterly" | "biannual" | "annual";
    paymentMethod: string;
    customerInfo: {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: {
            country: string;
            city: string;
            postalCode: string;
            street: string;
            state?: string | undefined;
        };
        company?: {
            name: string;
            taxId?: string | undefined;
            industry?: string | undefined;
        } | undefined;
    };
    startDate?: Date | undefined;
    promoCode?: string | undefined;
    tokenId?: string | undefined;
    trialDays?: number | undefined;
}, {
    packageId: string;
    billingPeriod: "monthly" | "quarterly" | "biannual" | "annual";
    paymentMethod: string;
    customerInfo: {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: {
            country: string;
            city: string;
            postalCode: string;
            street: string;
            state?: string | undefined;
        };
        company?: {
            name: string;
            taxId?: string | undefined;
            industry?: string | undefined;
        } | undefined;
    };
    startDate?: Date | undefined;
    promoCode?: string | undefined;
    tokenId?: string | undefined;
    trialDays?: number | undefined;
}>;
declare const createRefundSchema: z.ZodObject<{
    transactionId: z.ZodString;
    amount: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodEnum<["duplicate", "fraud", "requested_by_customer", "other"]>;
    reasonDetails: z.ZodOptional<z.ZodString>;
    notifyCustomer: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    reason: "fraud" | "other" | "duplicate" | "requested_by_customer";
    transactionId: string;
    amount?: number | undefined;
    reasonDetails?: string | undefined;
    notifyCustomer?: boolean | undefined;
}, {
    reason: "fraud" | "other" | "duplicate" | "requested_by_customer";
    transactionId: string;
    amount?: number | undefined;
    reasonDetails?: string | undefined;
    notifyCustomer?: boolean | undefined;
}>;
declare const validatePromoCodeSchema: z.ZodObject<{
    code: z.ZodString;
    packageId: z.ZodString;
    billingPeriod: z.ZodEnum<["monthly", "quarterly", "biannual", "annual"]>;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    packageId: string;
    billingPeriod: "monthly" | "quarterly" | "biannual" | "annual";
    userId?: string | undefined;
}, {
    code: string;
    packageId: string;
    billingPeriod: "monthly" | "quarterly" | "biannual" | "annual";
    userId?: string | undefined;
}>;
type CreatePaymentRequestBody = z.infer<typeof createPaymentSchema>;
type CustomerInfoRequestBody = z.infer<typeof customerInfoSchema>;
type CreateSubscriptionRequestBody = z.infer<typeof createSubscriptionSchema>;
type CreateRefundRequestBody = z.infer<typeof createRefundSchema>;
type ValidatePromoCodeRequestBody = z.infer<typeof validatePromoCodeSchema>;

/**
 * Response type definitions for IndexNow Studio
 */

type ApiStatus = 'success' | 'error' | 'loading' | 'idle';
interface ApiMetadata {
    timestamp: string;
    requestId?: string;
    duration?: number;
}
interface BaseResponse {
    success: boolean;
    metadata?: ApiMetadata;
}
interface SuccessResponse<T> extends BaseResponse {
    success: true;
    data: T;
    message?: string;
}
interface ErrorResponse extends BaseResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Json$1;
    };
}
/** @deprecated Use ApiResponse from core/api-response for standardized responses */
interface SimpleApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
}
/** @deprecated - Alias for backward compat. Use ApiResponse from core/api-response */
type ApiResponse$1<T> = SimpleApiResponse<T>;
interface PaginatedResponse<T> extends SimpleApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

/**
 * User-related API response types for IndexNow Studio
 */

interface LoginResponse {
    user: AppUserProfile;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    twoFactorRequired?: boolean;
    session: UserSession;
}
interface RegisterResponse {
    user: AppUserProfile;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    verificationEmailSent: boolean;
    trial: {
        isActive: boolean;
        endsAt: Date;
        daysRemaining: number;
    };
}
interface RefreshTokenResponse {
    token: string;
    refreshToken: string;
    expiresAt: Date;
    user: AppUserProfile;
}
interface LogoutResponse {
    message: string;
    sessionsClosed: number;
}
interface GetUserProfileResponse extends ApiResponse$1<AppUserProfile> {
}
interface UpdateUserProfileResponse extends ApiResponse$1<AppUserProfile> {
}
interface GetUserSettingsResponse extends ApiResponse$1<AppUserSettings> {
}
interface UpdateUserSettingsResponse extends ApiResponse$1<AppUserSettings> {
}
interface ChangePasswordResponse extends ApiResponse$1<{
    message: string;
    passwordChangedAt: Date;
    sessionsClosed: number;
}> {
}
interface SendVerificationEmailResponse extends ApiResponse$1<{
    emailSent: boolean;
    email: string;
    expiresAt: Date;
}> {
}
interface VerifyEmailResponse extends ApiResponse$1<{
    verified: boolean;
    verifiedAt: Date;
    user: AppUserProfile;
}> {
}
interface Enable2FAResponse extends ApiResponse$1<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
    setupKey: string;
}> {
}
interface Confirm2FAResponse extends ApiResponse$1<{
    enabled: boolean;
    enabledAt: Date;
    backupCodes: string[];
}> {
}
interface Disable2FAResponse extends ApiResponse$1<{
    disabled: boolean;
    disabledAt: Date;
}> {
}
interface Verify2FAResponse extends ApiResponse$1<{
    verified: boolean;
    token?: string;
    expiresAt?: Date;
}> {
}
interface GetUserQuotaResponse extends ApiResponse$1<{
    usage: UserQuotaUsage;
    limits: UserQuotaLimits;
    resetDate: Date;
    percentageUsed: Record<string, number>;
}> {
}
interface GetUserQuotaHistoryResponse extends PaginatedResponse<{
    date: Date;
    usage: UserQuotaUsage;
    limits: UserQuotaLimits;
}> {
}
interface CreateApiKeyResponse extends ApiResponse$1<{
    apiKey: ApiKey;
    token: string;
}> {
}
interface GetApiKeysResponse extends PaginatedResponse<ApiKey> {
}
interface UpdateApiKeyResponse extends ApiResponse$1<ApiKey> {
}
interface RevokeApiKeyResponse extends ApiResponse$1<{
    revoked: boolean;
    revokedAt: Date;
    keyId: string;
}> {
}
interface GetUserActivityResponse extends PaginatedResponse<UserActivity> {
}
interface GetUserSessionsResponse extends PaginatedResponse<UserSession> {
}
interface TerminateSessionResponse extends ApiResponse$1<{
    terminated: boolean;
    sessionId: string;
    terminatedAt: Date;
}> {
}
interface GetTrialStatusResponse extends ApiResponse$1<{
    isTrialActive: boolean;
    trialStartedAt?: Date;
    trialEndsAt?: Date;
    daysRemaining?: number;
    isEligible: boolean;
    hasUsedTrial: boolean;
}> {
}
interface StartTrialResponse extends ApiResponse$1<{
    trialStarted: boolean;
    trialStartedAt: Date;
    trialEndsAt: Date;
    daysRemaining: number;
    package: {
        id: string;
        name: string;
        features: string[];
    };
}> {
}
interface GetUserSubscriptionResponse extends ApiResponse$1<{
    isActive: boolean;
    packageId?: string;
    packageName?: string;
    status: string;
    startedAt?: Date;
    endsAt?: Date;
    autoRenew: boolean;
    paymentMethod?: string;
    nextBillingDate?: Date;
}> {
}
interface InviteUserResponse extends ApiResponse$1<{
    invitationSent: boolean;
    invitationId: string;
    email: string;
    expiresAt: Date;
}> {
}
interface AcceptInvitationResponse extends ApiResponse$1<{
    accepted: boolean;
    user: AppUserProfile;
    token?: string;
    refreshToken?: string;
    expiresAt?: Date;
}> {
}
interface GetInvitationsResponse extends PaginatedResponse<{
    id: string;
    email: string;
    role: string;
    token: string;
    invitedBy: string;
    isAccepted: boolean;
    expiresAt: Date;
    createdAt: Date;
    acceptedAt?: Date;
}> {
}
interface DeleteAccountResponse extends ApiResponse$1<{
    deleted: boolean;
    deletedAt: Date;
    dataRetentionPeriod: number;
    finalDeletionDate: Date;
}> {
}
interface SuspendAccountResponse extends ApiResponse$1<{
    suspended: boolean;
    suspendedAt: Date;
    reason: string;
    unsuspendAt?: Date;
}> {
}
interface ReactivateAccountResponse extends ApiResponse$1<{
    reactivated: boolean;
    reactivatedAt: Date;
    user: AppUserProfile;
}> {
}
interface ExportUserDataResponse extends ApiResponse$1<{
    exportId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    format: 'json' | 'csv' | 'pdf';
    estimatedCompletionTime?: Date;
    downloadUrl?: string;
    expiresAt?: Date;
    fileSize?: number;
}> {
}
interface GetDataExportsResponse extends PaginatedResponse<{
    id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
    format: 'json' | 'csv' | 'pdf';
    requestedAt: Date;
    completedAt?: Date;
    downloadUrl?: string;
    expiresAt?: Date;
    fileSize?: number;
    error?: string;
}> {
}
interface GetUserAnalyticsResponse extends ApiResponse$1<{
    overview: {
        totalJobs: number;
        completedJobs: number;
        failedJobs: number;
        totalUrls: number;
        successfulUrls: number;
        quotaUsage: UserQuotaUsage;
    };
    trends: {
        jobsCreated: Array<{
            date: Date;
            count: number;
        }>;
        urlsSubmitted: Array<{
            date: Date;
            count: number;
        }>;
        quotaUsage: Array<{
            date: Date;
            usage: UserQuotaUsage;
        }>;
    };
    topDomains: Array<{
        domain: string;
        jobCount: number;
        urlCount: number;
        successRate: number;
    }>;
    recentActivity: UserActivity[];
}> {
}
interface GetUsersResponse extends PaginatedResponse<AppUserProfile> {
}
interface GetUserDetailsResponse extends ApiResponse$1<{
    profile: AppUserProfile;
    settings: AppUserSettings;
    quota: {
        usage: UserQuotaUsage;
        limits: UserQuotaLimits;
    };
    statistics: {
        totalJobs: number;
        completedJobs: number;
        failedJobs: number;
        totalUrls: number;
        successfulUrls: number;
        accountAge: number;
        lastActivity: Date;
    };
    subscription: {
        isActive: boolean;
        packageId?: string;
        packageName?: string;
        status: string;
        startedAt?: Date;
        endsAt?: Date;
    };
    security: {
        twoFactorEnabled: boolean;
        lastPasswordChange: Date;
        activeSessions: number;
        recentIps: string[];
    };
}> {
}
interface UpdateUserRoleResponse extends ApiResponse$1<{
    updated: boolean;
    user: AppUserProfile;
    previousRole: string;
    newRole: string;
    updatedAt: Date;
}> {
}
interface UserErrorResponse {
    success: false;
    error: string;
    code: string;
    details?: {
        field?: string;
        validation?: string[];
        suggestion?: string;
    };
    timestamp: string;
}
type UserApiResponse<T = any> = ApiResponse$1<T>;
type UserPaginatedResponse<T = any> = PaginatedResponse<T>;
type UserResponse<T> = ApiResponse$1<T> | UserErrorResponse;

/**
 * Payment-related API response types for IndexNow Studio
 */

interface CreatePaymentResponse extends ApiResponse$1<{
    order: Order;
    paymentUrl?: string;
    redirectUrl?: string;
    requiresRedirect: boolean;
    paymentToken?: string;
    qrCode?: string;
    expiresAt?: Date;
}> {
}
interface ProcessPaymentResponse extends ApiResponse$1<{
    success: boolean;
    transaction: Transaction;
    order: Order;
    subscription?: Subscription;
    nextAction?: {
        type: 'redirect' | '3ds_authentication' | 'complete';
        url?: string;
        data?: Record<string, unknown>;
    };
}> {
}
interface PaymentStatusResponse extends ApiResponse$1<{
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    transaction?: Transaction;
    order: Order;
    failureReason?: string;
    lastUpdated: Date;
    timeline: PaymentTimeline[];
}> {
}
interface PaymentTimeline {
    status: string;
    timestamp: Date;
    description: string;
    metadata?: Record<string, unknown>;
}
interface CreateSubscriptionResponse extends ApiResponse$1<{
    subscription: Subscription;
    transaction?: Transaction;
    trial?: {
        isActive: boolean;
        endsAt: Date;
        daysRemaining: number;
    };
    nextBillingDate: Date;
}> {
}
interface GetSubscriptionResponse extends ApiResponse$1<{
    subscription: Subscription;
    package: Package;
    usage: {
        current: Record<string, number>;
        limits: Record<string, number>;
        resetDate: Date;
    };
    billing: {
        nextBillingDate: Date;
        lastPayment?: Transaction;
        paymentMethod?: PaymentMethodDetails;
    };
}> {
}
interface PaymentMethodDetails {
    id: string;
    type: 'credit_card' | 'bank_account' | 'digital_wallet';
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    bankName?: string;
    isDefault: boolean;
    isActive: boolean;
}
interface UpdateSubscriptionResponse extends ApiResponse$1<{
    subscription: Subscription;
    changes: {
        packageChanged: boolean;
        billingPeriodChanged: boolean;
        proration?: {
            amount: number;
            currency: string;
            description: string;
        };
    };
    nextBillingDate: Date;
}> {
}
interface CancelSubscriptionResponse extends ApiResponse$1<{
    cancelled: boolean;
    cancelledAt: Date;
    refund?: {
        amount: number;
        currency: string;
        refundId: string;
        processedAt?: Date;
    };
    accessUntil: Date;
}> {
}
interface GetPackagesResponse extends ApiResponse$1<{
    packages: Package[];
    currentPackage?: {
        id: string;
        name: string;
        expiresAt?: Date;
        isActive: boolean;
    };
    recommendations?: {
        packageId: string;
        reason: string;
        savings?: number;
    }[];
}> {
}
interface GetPackageDetailsResponse extends ApiResponse$1<{
    package: Package;
    pricing: {
        monthly: number;
        quarterly?: number;
        biannual?: number;
        annual?: number;
        currency: string;
        savings?: Record<string, number>;
    };
    comparison: {
        features: string[];
        otherPackages: Array<{
            id: string;
            name: string;
            hasFeature: boolean;
        }>;
    };
}> {
}
interface CreateInvoiceResponse extends ApiResponse$1<{
    invoice: Invoice;
    downloadUrl: string;
    emailSent: boolean;
}> {
}
interface GetInvoicesResponse extends PaginatedResponse<Invoice> {
}
interface GetInvoiceDetailsResponse extends ApiResponse$1<{
    invoice: Invoice;
    order: Order;
    downloadUrl: string;
    paymentHistory: Transaction[];
}> {
}
interface SendInvoiceResponse extends ApiResponse$1<{
    sent: boolean;
    sentAt: Date;
    recipient: string;
    deliveryStatus?: 'delivered' | 'failed' | 'pending';
}> {
}
interface CreateRefundResponse extends ApiResponse$1<{
    refund: Refund;
    processing: boolean;
    estimatedCompletionTime?: Date;
    refundMethod: string;
}> {
}
interface GetRefundsResponse extends PaginatedResponse<Refund> {
}
interface ProcessRefundResponse extends ApiResponse$1<{
    processed: boolean;
    refund: Refund;
    processedAt: Date;
    gatewayResponse?: Record<string, unknown>;
}> {
}
interface ValidatePromoCodeResponse extends ApiResponse$1<{
    valid: boolean;
    promoCode?: PromoCode;
    discount?: {
        type: 'percentage' | 'fixed';
        value: number;
        amount: number;
        description: string;
    };
    restrictions?: {
        minOrderAmount?: number;
        applicablePackages?: string[];
        maxUses?: number;
        usesRemaining?: number;
    };
    error?: string;
}> {
}
interface ApplyPromoCodeResponse extends ApiResponse$1<{
    applied: boolean;
    discount: {
        type: 'percentage' | 'fixed';
        value: number;
        amount: number;
        description: string;
    };
    newTotal: number;
    originalTotal: number;
    savings: number;
}> {
}
interface GetPromoCodesResponse extends PaginatedResponse<PromoCode> {
}
interface GetBillingHistoryResponse extends PaginatedResponse<Transaction> {
}
interface GetBillingStatisticsResponse extends ApiResponse$1<{
    summary: {
        totalPaid: number;
        totalRefunded: number;
        averageOrderValue: number;
        currency: string;
    };
    monthly: Array<{
        month: string;
        year: number;
        totalPaid: number;
        orderCount: number;
        averageValue: number;
    }>;
    byPaymentMethod: Array<{
        method: string;
        count: number;
        totalAmount: number;
        percentage: number;
    }>;
    recentTransactions: Transaction[];
}> {
}
interface AddPaymentMethodResponse extends ApiResponse$1<{
    paymentMethod: PaymentMethodDetails;
    isDefault: boolean;
    verificationRequired?: boolean;
}> {
}
interface GetPaymentMethodsResponse extends ApiResponse$1<{
    paymentMethods: PaymentMethodDetails[];
    defaultMethodId?: string;
}> {
}
interface UpdatePaymentMethodResponse extends ApiResponse$1<PaymentMethodDetails> {
}
interface RemovePaymentMethodResponse extends ApiResponse$1<{
    removed: boolean;
    removedAt: Date;
    paymentMethodId: string;
    newDefaultMethodId?: string;
}> {
}
interface CreateWebhookResponse extends ApiResponse$1<{
    webhook: {
        id: string;
        url: string;
        events: string[];
        isActive: boolean;
        secret: string;
        createdAt: Date;
    };
    testUrl: string;
}> {
}
interface GetWebhooksResponse extends PaginatedResponse<{
    id: string;
    url: string;
    events: string[];
    isActive: boolean;
    createdAt: Date;
    lastTriggered?: Date;
    deliveryStats: {
        successful: number;
        failed: number;
        total: number;
        successRate: number;
    };
}> {
}
interface TestWebhookResponse extends ApiResponse$1<{
    tested: boolean;
    responseCode?: number;
    responseTime?: number;
    error?: string;
    testedAt: Date;
}> {
}
interface GetPaymentAnalyticsResponse extends ApiResponse$1<{
    overview: {
        totalRevenue: number;
        totalOrders: number;
        averageOrderValue: number;
        successRate: number;
        currency: string;
        period: string;
    };
    trends: {
        revenue: Array<{
            date: Date;
            amount: number;
        }>;
        orders: Array<{
            date: Date;
            count: number;
        }>;
        successRate: Array<{
            date: Date;
            rate: number;
        }>;
    };
    breakdown: {
        byPackage: Array<{
            packageId: string;
            packageName: string;
            revenue: number;
            orders: number;
            percentage: number;
        }>;
        byPaymentMethod: Array<{
            method: string;
            revenue: number;
            orders: number;
            percentage: number;
        }>;
        byCountry: Array<{
            country: string;
            revenue: number;
            orders: number;
            percentage: number;
        }>;
    };
}> {
}
interface PaymentErrorResponse {
    success: false;
    error: string;
    code: string;
    details?: {
        field?: string;
        gatewayError?: string;
        retryable?: boolean;
        suggestion?: string;
    };
    timestamp: string;
}
type PaymentApiResponse<T = any> = ApiResponse$1<T>;
type PaymentPaginatedResponse<T = any> = PaginatedResponse<T>;
type PaymentResponse<T> = ApiResponse$1<T> | PaymentErrorResponse;
/** Current subscription block inside BillingOverviewResponse */
interface BillingCurrentSubscription {
    package_name: string;
    package_slug: string;
    subscription_status: string;
    subscription_end_date: string | null;
    /** Alias for subscription_end_date — some older components may reference this field */
    expires_at?: string | null;
    subscription_start_date: string | null;
    amount_paid: number;
    billing_period: string;
}
/** Billing stats block inside BillingOverviewResponse */
interface BillingStats {
    total_payments: number;
    total_spent: number;
    next_billing_date: string | null;
    days_remaining: number | null;
}
/** Recent transaction summary inside BillingOverviewResponse */
interface BillingRecentTransaction {
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    package_name: string;
    payment_method: string;
}
/**
 * Full response payload for GET /api/v1/billing/overview.
 * Consumed by `useBillingOverview()` in the user-dashboard.
 */
interface BillingOverviewResponse {
    currentSubscription: BillingCurrentSubscription | null;
    billingStats: BillingStats;
    recentTransactions: BillingRecentTransaction[];
}
/** Individual transaction row in billing history */
interface BillingHistoryTransaction {
    id: string;
    order_id: string;
    source: string;
    transaction_type: string;
    transaction_status: string;
    amount: number;
    currency: string;
    payment_method: string;
    created_at: string;
    updated_at: string;
    notes: string | null;
    proof_url: string | null;
    external_transaction_id: string | null;
    package_name: string;
    /** Optional package object — present in some response shapes for backward compat */
    package?: {
        name?: string;
        slug?: string;
    } | null;
    billing_period: string;
    gateway_name: string | null;
    gateway_slug: string | null;
}
/** Summary block in billing history */
interface BillingHistorySummary {
    total_transactions: number;
    completed_transactions: number;
    pending_transactions: number;
    failed_transactions: number;
    total_amount_spent: number;
}
/** Pagination block in billing history */
interface BillingHistoryPaginationInfo {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
}
/**
 * Full response payload for GET /api/v1/billing/history.
 * Consumed by `useBillingHistory()` in the user-dashboard.
 */
interface BillingHistoryResponse {
    transactions: BillingHistoryTransaction[];
    summary: BillingHistorySummary;
    pagination: BillingHistoryPaginationInfo;
}
/** Package info embedded inside an order */
interface OrderPackageInfo {
    id: string;
    name: string;
    description: string;
    features: string[];
    quota_limits?: unknown;
}
/**
 * Full response payload for GET /api/v1/billing/orders/[id].
 * Consumed by `useOrderDetails()` in the user-dashboard.
 */
interface OrderDetailsResponse {
    order_id: string;
    transaction_id?: string;
    status: string;
    payment_status: string;
    amount: number;
    currency: string;
    payment_method: string;
    billing_period: string;
    created_at: string;
    updated_at: string;
    package: OrderPackageInfo | null;
    customer_info: Record<string, unknown>;
    payment_details: Record<string, unknown>;
}

interface EnrichmentJobConfig {
    batchSize: number;
    maxRetries: number;
    retryDelayMs: number;
    timeoutMs: number;
    priority: number;
    preserveOrder: boolean;
    enableRateLimiting: boolean;
    quotaThreshold: number;
    notifyOnCompletion: boolean;
}
interface JobResult {
    jobId: string;
    status: string;
    results: unknown[];
    summary: {
        totalKeywords: number;
        successfulEnrichments: number;
        failedEnrichments: number;
        skippedKeywords: number;
        cacheHits: number;
        apiCallsMade: number;
        quotaUsed: number;
        processingTime: number;
        averageTimePerKeyword: number;
    };
    startedAt: Date;
    completedAt?: Date;
    error?: string;
    metadata?: Record<string, unknown>;
}

type Json = string | number | boolean | null | {
    [key: string]: Json;
} | Json[];
/**
 * Strict JSON types for database columns
 */
/**
 * Package features — display-only string array shown in pricing UI.
 * e.g. ["10 Keywords", "1 Domain", "Daily rank checks"]
 */
type PackageFeatures = string[];
interface PackageQuotaLimits {
    max_keywords?: number;
    max_domains?: number;
    [key: string]: number | undefined;
}
/** @deprecated Use PricingTierDetails with PackagePricingTiers (Record<string, PricingTierDetails>) instead */
interface PackagePricingTier {
    name: string;
    price: number;
    currency: string;
    billing_period: 'monthly' | 'annual' | 'lifetime' | 'one-time';
}
interface PricingTierDetails {
    regular_price: number;
    promo_price?: number;
    period_label?: string;
    paddle_price_id?: string;
}
type PackagePricingTiers = Record<string, PricingTierDetails | undefined>;
interface SiteIntegrationRateLimits {
    requests_per_second?: number;
    requests_per_minute?: number;
    requests_per_day?: number;
    concurrent_requests?: number;
    [key: string]: number | undefined;
}
interface SiteIntegrationAlertSettings {
    quota_threshold_percent?: number;
    error_rate_threshold?: number;
    latency_threshold_ms?: number;
    notify_email?: boolean;
    notify_webhook?: boolean;
    [key: string]: boolean | number | string | undefined;
}
interface PaymentGatewayCredentials {
    api_key?: string;
    client_token?: string;
    secret_key?: string;
    webhook_secret?: string;
    vendor_id?: string;
    auth_code?: string;
    [key: string]: string | undefined;
}
interface PaymentGatewayConfiguration {
    environment?: 'sandbox' | 'production' | 'test';
    sandbox_mode?: boolean;
    return_url?: string;
    cancel_url?: string;
    currency?: string;
    [key: string]: string | boolean | number | undefined;
}
interface TransactionGatewayResponse {
    transaction_id?: string;
    status?: string;
    amount?: number;
    currency?: string;
    [key: string]: Json | undefined;
}
interface TransactionMetadata {
    original_amount?: number;
    original_currency?: string;
    customer_info?: Json;
    user_id?: string;
    user_email?: string;
    package_id?: string;
    billing_period?: 'monthly' | 'annual' | 'lifetime' | 'one-time';
    created_at?: string;
    payment_type?: string;
    custom_data?: Json;
    items?: Json[];
    transactionId?: string;
    gatewayTransactionId?: string;
    paymentStatus?: string;
    mappedStatus?: string;
    hasGatewayResponse?: boolean;
    [key: string]: Json | undefined;
}
/** M-01: indb_notifications_dashboard.type */
type NotificationDashboardType = 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'system' | 'marketing';
/** M-02: indb_security_activity_logs.event_type — extensive list, see ActivityEventTypes constant. */
type SecurityActivityEventType = 'login' | 'logout' | 'register' | 'password_reset' | 'password_change' | 'profile_update' | 'settings_change' | 'settings_view' | 'settings_update' | 'notification_settings_update' | 'job_create' | 'job_update' | 'job_delete' | 'job_start' | 'job_pause' | 'job_resume' | 'job_cancel' | 'job_view' | 'checkout_initiated' | 'order_created' | 'payment_proof_uploaded' | 'subscription_upgrade' | 'billing_view' | 'billing_history_view' | 'order_view' | 'package_selection' | 'subscription_success' | 'subscription_failed' | 'subscription_cancelled' | 'dashboard_view' | 'dashboard_stats_view' | 'dashboard_data_loaded_from_merged_api' | 'dashboard_data_error' | 'quota_view' | 'indexnow_page_view' | 'manage_jobs_view' | 'api_call' | 'google_api_call' | 'admin_login' | 'admin_dashboard_view' | 'admin_stats_view' | 'admin_page_view' | 'user_management' | 'user_suspend' | 'user_unsuspend' | 'user_password_reset' | 'user_profile_update' | 'user_role_change' | 'user_quota_reset' | 'user_package_change' | 'user_subscription_extend' | 'admin_settings' | 'site_settings_update' | 'site_settings_view' | 'payment_gateway_create' | 'payment_gateway_update' | 'payment_gateway_delete' | 'payment_gateway_view' | 'package_create' | 'package_update' | 'package_delete' | 'package_view' | 'order_management' | 'order_status_update' | 'admin_order_view' | 'order_approve' | 'order_reject' | 'page_view' | 'admin_panel_access' | 'user_security_view' | 'user_activity_view' | 'keyword_add' | 'keyword_delete' | 'keyword_update' | 'keyword_bulk_delete' | 'keyword_tag_add' | 'keyword_tag_remove' | 'domain_add' | 'domain_delete' | 'domain_update' | 'keyword_tracker_view' | 'rank_history_view' | 'error_occurred' | 'security_violation' | 'quota_exceeded' | 'unauthorized_access' | 'session_established' | 'system_action' | 'paddle_overlay_opened' | 'checkout_error' | (string & {});
/** M-03: indb_security_audit_logs.event_type */
type SecurityAuditEventType = 'service_role_operation' | 'user_operation';
/** M-04: indb_admin_activity_logs.action_type — mirrors ActivityEventTypes admin subset.
 * (#V7 M-01) Uses `(string & {})` intentionally for extensibility, allowing dynamic patterns
 * like `${settingsType}_settings_view` while providing IntelliSense for known values.
 */
type AdminActionType = 'admin_page_view' | 'admin_dashboard_view' | 'admin_stats_view' | 'admin_order_view' | 'order_status_update' | 'order_approve' | 'order_reject' | 'package_create' | 'package_update' | 'payment_gateway_create' | 'user_management' | 'user_role_change' | 'user_suspend' | 'user_quota_reset' | (string & {});
/** M-04: indb_admin_activity_logs.target_type
 * (#V7 M-01) Uses `(string & {})` intentionally — same extensibility pattern as AdminActionType.
 */
type AdminTargetType = 'order' | 'user' | (string & {});
/** M-05: indb_site_integration.quota_reset_interval */
type QuotaResetInterval = 'daily' | 'monthly';
/** M-06: indb_seranking_usage_logs.operation_type */
type SeRankingOperationType = 'quota_usage_tracking' | 'quota_reset' | 'usage_report_generation' | 'api_request' | 'connectivity_test' | 'stale_keyword_lookup' | 'keyword_data_update' | 'job_enqueue' | 'job_dequeue' | 'job_lock' | 'integration_config_lookup' | 'keyword_enrichment_lookup' | 'keyword_enrichment_update' | 'smtp_config_lookup' | 'quota_usage_history_lookup' | 'keyword_export';
/** L-01: indb_keyword_bank.keyword_intent */
type KeywordIntentType = 'commercial' | 'informational' | 'navigational' | 'transactional';
/** L-02: indb_rank_keywords.search_engine */
type SearchEngineType = 'google' | 'bing' | 'yahoo';
type Database = {
    public: {
        Tables: {
            indb_auth_user_profiles: {
                Row: {
                    id: string;
                    user_id: string;
                    full_name: string | null;
                    phone_number: string | null;
                    country: string | null;
                    role: 'user' | 'admin' | 'super_admin';
                    email_verified: boolean;
                    avatar_url: string | null;
                    package_id: string | null;
                    subscription_start_date: string | null;
                    subscription_end_date: string | null;
                    daily_quota_limit: number;
                    daily_quota_used: number;
                    quota_reset_date: string | null;
                    is_active: boolean;
                    is_suspended: boolean;
                    is_trial_active: boolean;
                    trial_ends_at: string | null;
                    suspension_reason: string | null;
                    suspended_at: string | null;
                    last_login_at: string | null;
                    last_login_ip: string | null;
                    must_change_password: boolean;
                    active_domain: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    full_name?: string | null;
                    phone_number?: string | null;
                    country?: string | null;
                    role?: 'user' | 'admin' | 'super_admin';
                    email_verified?: boolean;
                    avatar_url?: string | null;
                    package_id?: string | null;
                    subscription_start_date?: string | null;
                    subscription_end_date?: string | null;
                    daily_quota_limit?: number;
                    daily_quota_used?: number;
                    quota_reset_date?: string | null;
                    is_active?: boolean;
                    is_suspended?: boolean;
                    is_trial_active?: boolean;
                    trial_ends_at?: string | null;
                    suspension_reason?: string | null;
                    suspended_at?: string | null;
                    last_login_at?: string | null;
                    last_login_ip?: string | null;
                    must_change_password?: boolean;
                    active_domain?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    full_name?: string | null;
                    phone_number?: string | null;
                    country?: string | null;
                    role?: 'user' | 'admin' | 'super_admin';
                    email_verified?: boolean;
                    avatar_url?: string | null;
                    package_id?: string | null;
                    subscription_start_date?: string | null;
                    subscription_end_date?: string | null;
                    daily_quota_limit?: number;
                    daily_quota_used?: number;
                    quota_reset_date?: string | null;
                    is_active?: boolean;
                    is_suspended?: boolean;
                    is_trial_active?: boolean;
                    trial_ends_at?: string | null;
                    suspension_reason?: string | null;
                    suspended_at?: string | null;
                    last_login_at?: string | null;
                    last_login_ip?: string | null;
                    must_change_password?: boolean;
                    active_domain?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'indb_auth_user_profiles_package_id_fkey';
                        columns: ['package_id'];
                        isOneToOne: false;
                        referencedRelation: 'indb_payment_packages';
                        referencedColumns: ['id'];
                    }
                ];
            };
            indb_auth_user_settings: {
                Row: {
                    id: string;
                    user_id: string;
                    timeout_duration: number;
                    retry_attempts: number;
                    email_job_completion: boolean;
                    email_job_failure: boolean;
                    email_quota_alerts: boolean;
                    default_schedule: 'one-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
                    email_daily_report: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    timeout_duration?: number;
                    retry_attempts?: number;
                    email_job_completion?: boolean;
                    email_job_failure?: boolean;
                    email_quota_alerts?: boolean;
                    default_schedule?: 'one-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
                    email_daily_report?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    timeout_duration?: number;
                    retry_attempts?: number;
                    email_job_completion?: boolean;
                    email_job_failure?: boolean;
                    email_quota_alerts?: boolean;
                    default_schedule?: 'one-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
                    email_daily_report?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'indb_auth_user_profiles_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: true;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    }
                ];
            };
            indb_keyword_countries: {
                Row: {
                    id: string;
                    name: string;
                    iso2_code: string;
                    iso3_code: string | null;
                    numeric_code: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    iso2_code: string;
                    iso3_code?: string | null;
                    numeric_code?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    iso2_code?: string;
                    iso3_code?: string | null;
                    numeric_code?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            indb_keyword_bank: {
                Row: {
                    id: string;
                    keyword: string;
                    country_id: string | null;
                    language_code: string;
                    is_data_found: boolean;
                    volume: number | null;
                    cpc: number | null;
                    competition: number | null;
                    difficulty: number | null;
                    history_trend: Json | null;
                    keyword_intent: KeywordIntentType | null;
                    data_updated_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    keyword: string;
                    country_id?: string | null;
                    language_code?: string;
                    is_data_found?: boolean;
                    volume?: number | null;
                    cpc?: number | null;
                    competition?: number | null;
                    difficulty?: number | null;
                    history_trend?: Json | null;
                    keyword_intent?: KeywordIntentType | null;
                    data_updated_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    keyword?: string;
                    country_id?: string;
                    language_code?: string;
                    is_data_found?: boolean;
                    volume?: number | null;
                    cpc?: number | null;
                    competition?: number | null;
                    difficulty?: number | null;
                    history_trend?: Json | null;
                    keyword_intent?: KeywordIntentType | null;
                    data_updated_at?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            indb_keyword_domains: {
                Row: {
                    id: string;
                    user_id: string;
                    domain_name: string;
                    display_name: string | null;
                    is_active: boolean;
                    verification_status: 'pending' | 'verified' | 'failed';
                    verification_code: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    domain_name: string;
                    display_name?: string | null;
                    is_active?: boolean;
                    verification_status?: 'pending' | 'verified' | 'failed';
                    verification_code?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    domain_name?: string;
                    display_name?: string | null;
                    is_active?: boolean;
                    verification_status?: 'pending' | 'verified' | 'failed';
                    verification_code?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            indb_keyword_rankings: {
                Row: {
                    id: string;
                    keyword_id: string;
                    position: number | null;
                    url: string | null;
                    search_volume: number | null;
                    difficulty_score: number | null;
                    check_date: string;
                    device_type: 'desktop' | 'mobile' | 'tablet' | null;
                    country_id: string | null;
                    tags: string[] | null;
                    metadata: Json | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    keyword_id: string;
                    position?: number | null;
                    url?: string | null;
                    search_volume?: number | null;
                    difficulty_score?: number | null;
                    check_date?: string;
                    device_type?: 'desktop' | 'mobile' | 'tablet' | null;
                    country_id?: string | null;
                    tags?: string[] | null;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    keyword_id?: string;
                    position?: number | null;
                    url?: string | null;
                    search_volume?: number | null;
                    difficulty_score?: number | null;
                    check_date?: string;
                    device_type?: 'desktop' | 'mobile' | 'tablet' | null;
                    country_id?: string | null;
                    tags?: string[] | null;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            indb_rank_keywords: {
                Row: {
                    id: string;
                    user_id: string;
                    keyword: string;
                    domain: string | null;
                    device: 'desktop' | 'mobile' | 'tablet' | null;
                    country_id: string | null;
                    search_engine: SearchEngineType | null;
                    target_url: string | null;
                    tags: string[] | null;
                    position: number | null;
                    previous_position: number | null;
                    is_active: boolean;
                    last_checked: string | null;
                    created_at: string;
                    keyword_bank_id: string | null;
                    intelligence_updated_at: string | null;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    keyword: string;
                    domain?: string | null;
                    device?: 'desktop' | 'mobile' | 'tablet' | null;
                    country_id?: string | null;
                    search_engine?: SearchEngineType | null;
                    target_url?: string | null;
                    tags?: string[] | null;
                    position?: number | null;
                    previous_position?: number | null;
                    is_active?: boolean;
                    last_checked?: string | null;
                    created_at?: string;
                    keyword_bank_id?: string | null;
                    intelligence_updated_at?: string | null;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    keyword?: string;
                    domain?: string | null;
                    device?: 'desktop' | 'mobile' | 'tablet' | null;
                    country_id?: string | null;
                    position?: number | null;
                    previous_position?: number | null;
                    last_checked?: string | null;
                    created_at?: string;
                    tags?: string[] | null;
                    target_url?: string | null;
                    search_engine?: SearchEngineType | null;
                    is_active?: boolean;
                    keyword_bank_id?: string | null;
                    intelligence_updated_at?: string | null;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'indb_rank_keywords_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    }
                ];
            };
            indb_notifications_dashboard: {
                Row: {
                    id: string;
                    user_id: string;
                    type: NotificationDashboardType;
                    title: string;
                    message: string | null;
                    is_read: boolean;
                    action_url: string | null;
                    metadata: Json | null;
                    expires_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type: NotificationDashboardType;
                    title: string;
                    message?: string | null;
                    is_read?: boolean;
                    action_url?: string | null;
                    metadata?: Json | null;
                    expires_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    type?: NotificationDashboardType;
                    title?: string;
                    message?: string | null;
                    is_read?: boolean;
                    action_url?: string | null;
                    metadata?: Json | null;
                    expires_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            indb_site_integration: {
                Row: {
                    id: string;
                    user_id: string | null;
                    service_name: string | null;
                    api_key: string | null;
                    api_url: string | null;
                    api_quota_limit: number;
                    api_quota_used: number;
                    quota_reset_date: string | null;
                    quota_reset_interval: QuotaResetInterval | null;
                    is_active: boolean;
                    rate_limits: Json | null;
                    alert_settings: Json | null;
                    last_health_check: string | null;
                    health_status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    service_name?: string | null;
                    api_key?: string | null;
                    api_url?: string | null;
                    api_quota_limit?: number;
                    api_quota_used?: number;
                    quota_reset_date?: string | null;
                    quota_reset_interval?: QuotaResetInterval | null;
                    is_active?: boolean;
                    rate_limits?: SiteIntegrationRateLimits | null;
                    alert_settings?: SiteIntegrationAlertSettings | null;
                    last_health_check?: string | null;
                    health_status?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    service_name?: string | null;
                    api_key?: string | null;
                    api_url?: string | null;
                    api_quota_limit?: number;
                    api_quota_used?: number;
                    quota_reset_date?: string | null;
                    quota_reset_interval?: QuotaResetInterval | null;
                    is_active?: boolean;
                    rate_limits?: SiteIntegrationRateLimits | null;
                    alert_settings?: SiteIntegrationAlertSettings | null;
                    last_health_check?: string | null;
                    health_status?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            indb_admin_activity_logs: {
                Row: {
                    id: string;
                    admin_id: string;
                    action_type: AdminActionType;
                    action_description: string | null;
                    target_type: AdminTargetType | null;
                    target_id: string | null;
                    metadata: Json | null;
                    ip_address: string | null;
                    user_agent: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    admin_id: string;
                    action_type: AdminActionType;
                    action_description?: string | null;
                    target_type?: AdminTargetType | null;
                    target_id?: string | null;
                    metadata?: Json | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    admin_id?: string;
                    action_type?: AdminActionType;
                    action_description?: string | null;
                    target_type?: AdminTargetType | null;
                    target_id?: string | null;
                    metadata?: Json | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            indb_admin_user_summary: {
                Row: {
                    id: string;
                    summary_date: string;
                    total_users: number;
                    new_users: number;
                    active_users: number;
                    paying_users: number;
                    total_revenue: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    summary_date: string;
                    total_users?: number;
                    new_users?: number;
                    active_users?: number;
                    paying_users?: number;
                    total_revenue?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    summary_date?: string;
                    total_users?: number;
                    new_users?: number;
                    active_users?: number;
                    paying_users?: number;
                    total_revenue?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            indb_security_activity_logs: {
                Row: {
                    id: string;
                    user_id: string | null;
                    event_type: SecurityActivityEventType;
                    action_description: string | null;
                    target_type: string | null;
                    target_id: string | null;
                    device_info: Json | null;
                    location_data: Json | null;
                    success: boolean;
                    error_message: string | null;
                    metadata: Json | null;
                    details: Json | null;
                    severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
                    ip_address: string | null;
                    user_agent: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    event_type: SecurityActivityEventType;
                    action_description?: string | null;
                    target_type?: string | null;
                    target_id?: string | null;
                    device_info?: Json | null;
                    location_data?: Json | null;
                    success?: boolean;
                    error_message?: string | null;
                    metadata?: Json | null;
                    details?: Json | null;
                    severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
                    ip_address?: string | null;
                    user_agent?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    event_type?: SecurityActivityEventType;
                    action_description?: string | null;
                    target_type?: string | null;
                    target_id?: string | null;
                    device_info?: Json | null;
                    location_data?: Json | null;
                    success?: boolean;
                    error_message?: string | null;
                    metadata?: Json | null;
                    details?: Json | null;
                    severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
                    ip_address?: string | null;
                    user_agent?: string | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            indb_security_audit_logs: {
                Row: {
                    id: string;
                    user_id: string | null;
                    event_type: SecurityAuditEventType;
                    description: string;
                    success: boolean | null;
                    metadata: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    event_type: SecurityAuditEventType;
                    description: string;
                    success?: boolean | null;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    event_type?: SecurityAuditEventType;
                    description?: string;
                    success?: boolean | null;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            indb_seranking_usage_logs: {
                Row: {
                    id: string;
                    integration_id: string;
                    operation_type: SeRankingOperationType;
                    request_count: number;
                    successful_requests: number;
                    failed_requests: number;
                    response_time_ms: number | null;
                    timestamp: string;
                    date: string;
                    metadata: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    integration_id: string;
                    operation_type: SeRankingOperationType;
                    request_count?: number;
                    successful_requests?: number;
                    failed_requests?: number;
                    response_time_ms?: number | null;
                    timestamp?: string;
                    date?: string;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    integration_id?: string;
                    operation_type?: SeRankingOperationType;
                    request_count?: number;
                    successful_requests?: number;
                    failed_requests?: number;
                    response_time_ms?: number | null;
                    timestamp?: string;
                    date?: string;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            indb_payment_gateways: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    is_active: boolean;
                    is_default: boolean;
                    api_credentials: Json | null;
                    configuration: Json | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    is_active?: boolean;
                    is_default?: boolean;
                    api_credentials?: PaymentGatewayCredentials | null;
                    configuration?: PaymentGatewayConfiguration | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    is_active?: boolean;
                    is_default?: boolean;
                    api_credentials?: Json | null;
                    configuration?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Relationships: never[];
            };
            indb_payment_packages: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    description: string | null;
                    features: PackageFeatures | null;
                    quota_limits: PackageQuotaLimits | null;
                    pricing_tiers: PackagePricingTier[] | PackagePricingTiers | null;
                    free_trial_enabled: boolean;
                    is_active: boolean;
                    is_popular: boolean;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    description?: string | null;
                    features?: PackageFeatures | null;
                    quota_limits?: PackageQuotaLimits | null;
                    pricing_tiers?: PackagePricingTier[] | PackagePricingTiers | null;
                    free_trial_enabled?: boolean;
                    is_active?: boolean;
                    is_popular?: boolean;
                    sort_order?: number;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    description?: string | null;
                    features?: PackageFeatures | null;
                    quota_limits?: PackageQuotaLimits | null;
                    pricing_tiers?: PackagePricingTier[] | PackagePricingTiers | null;
                    free_trial_enabled?: boolean;
                    is_active?: boolean;
                    is_popular?: boolean;
                    sort_order?: number;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Relationships: never[];
            };
            indb_payment_transactions: {
                Row: {
                    id: string;
                    user_id: string | null;
                    package_id: string | null;
                    gateway_id: string | null;
                    amount: number;
                    currency: string;
                    status: 'pending' | 'proof_uploaded' | 'completed' | 'failed' | 'cancelled' | 'refunded';
                    /** Gateway-specific status string (e.g. Paddle/Stripe raw status). Unconstrained VARCHAR(100) — no SQL CHECK. */
                    transaction_status: string | null;
                    /** Gateway-specific payment state (e.g. 'paid', 'refunded'). Unconstrained VARCHAR(100) — no SQL CHECK. */
                    payment_status: string | null;
                    error_message: string | null;
                    transaction_id: string | null;
                    external_transaction_id: string | null;
                    payment_method: string | null;
                    proof_url: string | null;
                    gateway_response: TransactionGatewayResponse | null;
                    metadata: TransactionMetadata | null;
                    notes: string | null;
                    user_email: string | null;
                    customer_name: string | null;
                    order_id: string | null;
                    package_name: string | null;
                    billing_period: 'monthly' | 'annual' | 'lifetime' | 'one-time' | null;
                    gross_amount: number | null;
                    verified_by: string | null;
                    verified_at: string | null;
                    processed_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    package_id?: string | null;
                    gateway_id?: string | null;
                    amount: number;
                    currency?: string;
                    status?: 'pending' | 'proof_uploaded' | 'completed' | 'failed' | 'cancelled' | 'refunded';
                    transaction_status?: string | null;
                    payment_status?: string | null;
                    error_message?: string | null;
                    transaction_id?: string | null;
                    external_transaction_id?: string | null;
                    payment_method?: string | null;
                    proof_url?: string | null;
                    gateway_response?: TransactionGatewayResponse | null;
                    metadata?: TransactionMetadata | null;
                    notes?: string | null;
                    user_email?: string | null;
                    customer_name?: string | null;
                    order_id?: string | null;
                    package_name?: string | null;
                    billing_period?: 'monthly' | 'annual' | 'lifetime' | 'one-time' | null;
                    gross_amount?: number | null;
                    verified_by?: string | null;
                    verified_at?: string | null;
                    processed_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    package_id?: string | null;
                    gateway_id?: string | null;
                    amount?: number;
                    currency?: string;
                    status?: 'pending' | 'proof_uploaded' | 'completed' | 'failed' | 'cancelled' | 'refunded';
                    transaction_status?: string | null;
                    payment_status?: string | null;
                    error_message?: string | null;
                    transaction_id?: string | null;
                    external_transaction_id?: string | null;
                    payment_method?: string | null;
                    proof_url?: string | null;
                    gateway_response?: TransactionGatewayResponse | null;
                    metadata?: TransactionMetadata | null;
                    notes?: string | null;
                    user_email?: string | null;
                    customer_name?: string | null;
                    order_id?: string | null;
                    package_name?: string | null;
                    billing_period?: 'monthly' | 'annual' | 'lifetime' | 'one-time' | null;
                    gross_amount?: number | null;
                    verified_by?: string | null;
                    verified_at?: string | null;
                    processed_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'indb_payment_transactions_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'indb_auth_user_profiles';
                        referencedColumns: ['user_id'];
                    },
                    {
                        foreignKeyName: 'indb_payment_transactions_package_id_fkey';
                        columns: ['package_id'];
                        isOneToOne: false;
                        referencedRelation: 'indb_payment_packages';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'indb_payment_transactions_gateway_id_fkey';
                        columns: ['gateway_id'];
                        isOneToOne: false;
                        referencedRelation: 'indb_payment_gateways';
                        referencedColumns: ['id'];
                    }
                ];
            };
            indb_payment_subscriptions: {
                Row: {
                    id: string;
                    user_id: string | null;
                    package_id: string | null;
                    status: 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing' | 'expired';
                    start_date: string;
                    end_date: string | null;
                    canceled_at: string | null;
                    cancel_at_period_end: boolean | null;
                    paused_at: string | null;
                    current_period_end: string | null;
                    paddle_subscription_id: string | null;
                    paddle_price_id: string | null;
                    stripe_subscription_id: string | null;
                    cancel_reason: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    package_id?: string | null;
                    status?: 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing' | 'expired';
                    start_date: string;
                    end_date?: string | null;
                    canceled_at?: string | null;
                    cancel_at_period_end?: boolean | null;
                    paused_at?: string | null;
                    current_period_end?: string | null;
                    paddle_subscription_id?: string | null;
                    paddle_price_id?: string | null;
                    stripe_subscription_id?: string | null;
                    cancel_reason?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    package_id?: string | null;
                    status?: 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing' | 'expired';
                    start_date?: string;
                    end_date?: string | null;
                    canceled_at?: string | null;
                    cancel_at_period_end?: boolean | null;
                    paused_at?: string | null;
                    current_period_end?: string | null;
                    paddle_subscription_id?: string | null;
                    paddle_price_id?: string | null;
                    stripe_subscription_id?: string | null;
                    cancel_reason?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'indb_payment_subscriptions_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'indb_auth_user_profiles';
                        referencedColumns: ['user_id'];
                    },
                    {
                        foreignKeyName: 'indb_payment_subscriptions_package_id_fkey';
                        columns: ['package_id'];
                        isOneToOne: false;
                        referencedRelation: 'indb_payment_packages';
                        referencedColumns: ['id'];
                    }
                ];
            };
            indb_paddle_transactions: {
                Row: {
                    id: string;
                    transaction_id: string | null;
                    paddle_transaction_id: string;
                    paddle_subscription_id: string | null;
                    paddle_customer_id: string | null;
                    event_type: string | null;
                    event_data: Json | null;
                    status: string | null;
                    amount: number | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    transaction_id?: string | null;
                    paddle_transaction_id: string;
                    paddle_subscription_id?: string | null;
                    paddle_customer_id?: string | null;
                    event_type?: string | null;
                    event_data?: Json | null;
                    status?: string | null;
                    amount?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    transaction_id?: string | null;
                    paddle_transaction_id?: string;
                    paddle_subscription_id?: string | null;
                    paddle_customer_id?: string | null;
                    event_type?: string | null;
                    event_data?: Json | null;
                    status?: string | null;
                    amount?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            indb_paddle_webhook_events: {
                Row: {
                    id: string;
                    event_id: string;
                    event_type: string;
                    payload: Json;
                    processed: boolean;
                    processed_at: string | null;
                    error_message: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    event_id: string;
                    event_type: string;
                    payload: Json;
                    processed?: boolean;
                    processed_at?: string | null;
                    error_message?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    event_id?: string;
                    event_type?: string;
                    payload?: Json;
                    processed?: boolean;
                    processed_at?: string | null;
                    error_message?: string | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            indb_site_settings: {
                Row: {
                    id: string;
                    site_name: string | null;
                    site_description: string | null;
                    site_logo_url: string | null;
                    site_icon_url: string | null;
                    site_favicon_url: string | null;
                    contact_email: string | null;
                    support_email: string | null;
                    maintenance_mode: boolean;
                    registration_enabled: boolean;
                    smtp_host: string | null;
                    smtp_port: number | null;
                    smtp_user: string | null;
                    smtp_pass: string | null;
                    smtp_from_name: string | null;
                    smtp_from_email: string | null;
                    smtp_secure: boolean;
                    smtp_enabled: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    site_name?: string;
                    site_description?: string | null;
                    site_logo_url?: string | null;
                    site_icon_url?: string | null;
                    site_favicon_url?: string | null;
                    contact_email?: string | null;
                    support_email?: string | null;
                    maintenance_mode?: boolean;
                    registration_enabled?: boolean;
                    smtp_host?: string | null;
                    smtp_port?: number | null;
                    smtp_user?: string | null;
                    smtp_pass?: string | null;
                    smtp_from_name?: string | null;
                    smtp_from_email?: string | null;
                    smtp_secure?: boolean;
                    smtp_enabled?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    site_name?: string;
                    site_description?: string | null;
                    site_logo_url?: string | null;
                    site_icon_url?: string | null;
                    site_favicon_url?: string | null;
                    contact_email?: string | null;
                    support_email?: string | null;
                    maintenance_mode?: boolean;
                    registration_enabled?: boolean;
                    smtp_host?: string | null;
                    smtp_port?: number | null;
                    smtp_user?: string | null;
                    smtp_pass?: string | null;
                    smtp_from_name?: string | null;
                    smtp_from_email?: string | null;
                    smtp_secure?: boolean;
                    smtp_enabled?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            indb_system_error_logs: {
                Row: {
                    id: string;
                    user_id: string | null;
                    error_type: string;
                    severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
                    message: string;
                    user_message: string | null;
                    endpoint: string | null;
                    http_method: string | null;
                    status_code: number | null;
                    metadata: Json | null;
                    stack_trace: string | null;
                    resolved_at: string | null;
                    resolved_by: string | null;
                    acknowledged_at: string | null;
                    acknowledged_by: string | null;
                    sentry_event_id: string | null;
                    sentry_issue_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    error_type: string;
                    severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
                    message: string;
                    user_message?: string | null;
                    endpoint?: string | null;
                    http_method?: string | null;
                    status_code?: number | null;
                    metadata?: Json | null;
                    stack_trace?: string | null;
                    resolved_at?: string | null;
                    resolved_by?: string | null;
                    acknowledged_at?: string | null;
                    acknowledged_by?: string | null;
                    sentry_event_id?: string | null;
                    sentry_issue_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    error_type?: string;
                    severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
                    message?: string;
                    user_message?: string | null;
                    endpoint?: string | null;
                    http_method?: string | null;
                    status_code?: number | null;
                    metadata?: Json | null;
                    stack_trace?: string | null;
                    resolved_at?: string | null;
                    resolved_by?: string | null;
                    acknowledged_at?: string | null;
                    acknowledged_by?: string | null;
                    sentry_event_id?: string | null;
                    sentry_issue_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            indb_enrichment_jobs: {
                Row: {
                    id: string;
                    user_id: string | null;
                    name: string | null;
                    job_type: string;
                    status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused' | 'retrying';
                    priority: number;
                    config: EnrichmentJobConfig | null;
                    source_data: Json | null;
                    progress_data: Json | null;
                    result_data: Json | null;
                    results: JobResult | null;
                    error_message: string | null;
                    retry_count: number;
                    metadata: Json | null;
                    next_retry_at: string | null;
                    last_retry_at: string | null;
                    worker_id: string | null;
                    locked_at: string | null;
                    started_at: string | null;
                    completed_at: string | null;
                    cancelled_at: string | null;
                    total_keywords: number | null;
                    processed_keywords: number | null;
                    enriched_keywords: number | null;
                    failed_keywords: number | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    name?: string | null;
                    job_type: string;
                    status?: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused' | 'retrying';
                    priority?: number;
                    config?: EnrichmentJobConfig | null;
                    source_data?: Json | null;
                    progress_data?: Json | null;
                    result_data?: Json | null;
                    results?: JobResult | null;
                    error_message?: string | null;
                    retry_count?: number;
                    metadata?: Json | null;
                    next_retry_at?: string | null;
                    last_retry_at?: string | null;
                    worker_id?: string | null;
                    locked_at?: string | null;
                    started_at?: string | null;
                    completed_at?: string | null;
                    cancelled_at?: string | null;
                    total_keywords?: number | null;
                    processed_keywords?: number | null;
                    enriched_keywords?: number | null;
                    failed_keywords?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    name?: string | null;
                    job_type?: string;
                    status?: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused' | 'retrying';
                    priority?: number;
                    config?: EnrichmentJobConfig | null;
                    source_data?: Json | null;
                    progress_data?: Json | null;
                    result_data?: Json | null;
                    results?: JobResult | null;
                    error_message?: string | null;
                    retry_count?: number;
                    metadata?: Json | null;
                    next_retry_at?: string | null;
                    last_retry_at?: string | null;
                    worker_id?: string | null;
                    locked_at?: string | null;
                    started_at?: string | null;
                    completed_at?: string | null;
                    cancelled_at?: string | null;
                    total_keywords?: number | null;
                    processed_keywords?: number | null;
                    enriched_keywords?: number | null;
                    failed_keywords?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            indb_api_keys: {
                Row: {
                    id: string;
                    service_name: string;
                    key_value: string;
                    is_active: boolean;
                    last_used_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    service_name: string;
                    key_value: string;
                    is_active?: boolean;
                    last_used_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    service_name?: string;
                    key_value?: string;
                    is_active?: boolean;
                    last_used_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            indb_system_activity_logs: {
                Row: {
                    id: string;
                    user_id: string | null;
                    event_type: string;
                    description: string | null;
                    metadata: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    event_type: string;
                    description?: string | null;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    event_type?: string;
                    description?: string | null;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            indb_seranking_metrics_raw: {
                Row: {
                    id: string;
                    timestamp: string;
                    endpoint: string;
                    method: string;
                    status: 'success' | 'error' | 'timeout' | 'rate_limited';
                    duration_ms: number;
                    request_size: number | null;
                    response_size: number | null;
                    cache_hit: boolean;
                    error_type: string | null;
                    error_message: string | null;
                    user_id: string | null;
                    quota_remaining: number | null;
                    rate_limit_remaining: number | null;
                    retry_attempt: number;
                    country_code: string | null;
                    keyword_count: number | null;
                    metadata: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    timestamp?: string;
                    endpoint: string;
                    method?: string;
                    status: 'success' | 'error' | 'timeout' | 'rate_limited';
                    duration_ms: number;
                    request_size?: number | null;
                    response_size?: number | null;
                    cache_hit?: boolean;
                    error_type?: string | null;
                    error_message?: string | null;
                    user_id?: string | null;
                    quota_remaining?: number | null;
                    rate_limit_remaining?: number | null;
                    retry_attempt?: number;
                    country_code?: string | null;
                    keyword_count?: number | null;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    timestamp?: string;
                    endpoint?: string;
                    method?: string;
                    status?: 'success' | 'error' | 'timeout' | 'rate_limited';
                    duration_ms?: number;
                    request_size?: number | null;
                    response_size?: number | null;
                    cache_hit?: boolean;
                    error_type?: string | null;
                    error_message?: string | null;
                    user_id?: string | null;
                    quota_remaining?: number | null;
                    rate_limit_remaining?: number | null;
                    retry_attempt?: number;
                    country_code?: string | null;
                    keyword_count?: number | null;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            indb_seranking_metrics_aggregated: {
                Row: {
                    id: string;
                    period: string;
                    period_type: 'hour' | 'day' | 'week' | 'month';
                    total_requests: number;
                    successful_requests: number;
                    failed_requests: number;
                    average_response_time: number;
                    cache_hit_rate: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    period: string;
                    period_type: 'hour' | 'day' | 'week' | 'month';
                    total_requests?: number;
                    successful_requests?: number;
                    failed_requests?: number;
                    average_response_time?: number;
                    cache_hit_rate?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    period?: string;
                    period_type?: 'hour' | 'day' | 'week' | 'month';
                    total_requests?: number;
                    successful_requests?: number;
                    failed_requests?: number;
                    average_response_time?: number;
                    cache_hit_rate?: number;
                    created_at?: string;
                };
                Relationships: never[];
            };
            indb_seranking_quota_usage: {
                Row: {
                    id: string;
                    timestamp: string;
                    user_id: string | null;
                    operation_type: string;
                    quota_consumed: number;
                    quota_remaining: number;
                    quota_limit: number;
                    usage_percentage: number;
                    session_id: string | null;
                    service_account_id: string | null;
                    endpoint: string | null;
                    country_code: string | null;
                    keywords_count: number | null;
                    cost_per_request: number | null;
                    metadata: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    timestamp?: string;
                    user_id?: string | null;
                    operation_type?: string;
                    quota_consumed: number;
                    quota_remaining: number;
                    quota_limit: number;
                    usage_percentage: number;
                    session_id?: string | null;
                    service_account_id?: string | null;
                    endpoint?: string | null;
                    country_code?: string | null;
                    keywords_count?: number | null;
                    cost_per_request?: number | null;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    timestamp?: string;
                    user_id?: string | null;
                    operation_type?: string;
                    quota_consumed?: number;
                    quota_remaining?: number;
                    quota_limit?: number;
                    usage_percentage?: number;
                    session_id?: string | null;
                    service_account_id?: string | null;
                    endpoint?: string | null;
                    country_code?: string | null;
                    keywords_count?: number | null;
                    cost_per_request?: number | null;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            indb_seranking_health_checks: {
                Row: {
                    id: string;
                    timestamp: string;
                    service_name: string;
                    check_type: 'api' | 'database' | 'cache' | 'queue' | 'dependency' | 'custom';
                    dependency_level: 'critical' | 'important' | 'optional';
                    status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
                    response_time: number;
                    error_message: string | null;
                    metrics: Json;
                    diagnostics: Json;
                    recommendations: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    timestamp?: string;
                    service_name: string;
                    check_type: 'api' | 'database' | 'cache' | 'queue' | 'dependency' | 'custom';
                    dependency_level: 'critical' | 'important' | 'optional';
                    status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
                    response_time: number;
                    error_message?: string | null;
                    metrics?: Json;
                    diagnostics?: Json;
                    recommendations?: Json;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    timestamp?: string;
                    service_name?: string;
                    check_type?: 'api' | 'database' | 'cache' | 'queue' | 'dependency' | 'custom';
                    dependency_level?: 'critical' | 'important' | 'optional';
                    status?: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
                    response_time?: number;
                    error_message?: string | null;
                    metrics?: Json;
                    diagnostics?: Json;
                    recommendations?: Json;
                    created_at?: string;
                };
                Relationships: never[];
            };
            indb_payment_transactions_history: {
                Row: {
                    id: string;
                    transaction_id: string;
                    old_status: string | null;
                    new_status: string;
                    action_type: string;
                    action_description: string;
                    changed_by: string | null;
                    changed_by_type: string;
                    old_values: Json | null;
                    new_values: Json | null;
                    notes: string | null;
                    metadata: Json | null;
                    ip_address: string | null;
                    user_agent: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    transaction_id: string;
                    old_status?: string | null;
                    new_status: string;
                    action_type: string;
                    action_description: string;
                    changed_by?: string | null;
                    changed_by_type: string;
                    old_values?: Json | null;
                    new_values?: Json | null;
                    notes?: string | null;
                    metadata?: Json | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    transaction_id?: string;
                    old_status?: string | null;
                    new_status?: string;
                    action_type?: string;
                    action_description?: string;
                    changed_by?: string | null;
                    changed_by_type?: string;
                    old_values?: Json | null;
                    new_values?: Json | null;
                    notes?: string | null;
                    metadata?: Json | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            'auth.users': {
                Row: {
                    id: string;
                    email: string | null;
                    created_at: string | null;
                };
                Insert: {
                    id: string;
                    email?: string | null;
                    created_at?: string | null;
                };
                Update: {
                    id?: string;
                    email?: string | null;
                    created_at?: string | null;
                };
                Relationships: never[];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            update_keyword_position_atomic: {
                Args: {
                    target_keyword_id: string;
                    new_rank_position: number;
                };
                Returns: void;
            };
            add_tags_to_keywords_atomic: {
                Args: {
                    target_keyword_ids: string[];
                    target_user_id: string;
                    new_tags: string[];
                };
                Returns: number;
            };
            get_user_domain_stats: {
                Args: {
                    target_user_id: string;
                };
                Returns: {
                    domain: string;
                    keyword_count: number;
                }[];
            };
            consume_user_quota: {
                Args: {
                    target_user_id: string;
                    quota_amount: number;
                };
                Returns: boolean;
            };
            activate_order_with_plan: {
                Args: {
                    p_transaction_id: string;
                    p_new_status: string;
                    p_admin_user_id: string;
                    p_notes: string | null;
                };
                Returns: Json;
            };
            get_user_emails_by_ids: {
                Args: {
                    p_user_ids: string[];
                };
                Returns: {
                    id: string;
                    email: string;
                }[];
            };
            increment_user_quota: {
                Args: {
                    target_user_id: string;
                    resource_type: string;
                    amount: number;
                };
                Returns: undefined;
            };
            get_total_revenue: {
                Args: Record<string, never>;
                Returns: number;
            };
            get_revenue_by_period: {
                Args: {
                    start_date: string;
                    end_date: string;
                };
                Returns: number;
            };
            bulk_delete_keywords_service: {
                Args: {
                    p_keyword_ids: string[];
                    p_user_id: string;
                };
                Returns: number;
            };
            set_default_payment_gateway_service: {
                Args: {
                    p_gateway_id: string;
                };
                Returns: undefined;
            };
            save_rank_check_result_service: {
                Args: {
                    p_keyword_id: string;
                    p_user_id: string;
                    p_position: number;
                    p_url: string | null;
                    p_check_date: string;
                    p_device_type: 'desktop' | 'mobile' | 'tablet' | null;
                    p_country_iso: string | null;
                };
                Returns: undefined;
            };
            get_user_completed_amount: {
                Args: {
                    p_user_id: string;
                };
                Returns: number;
            };
            get_error_type_distribution: {
                Args: {
                    p_since: string;
                };
                Returns: Json;
            };
            get_error_severity_distribution: {
                Args: {
                    p_since: string;
                };
                Returns: Json;
            };
            get_error_endpoint_distribution: {
                Args: {
                    p_since: string;
                    p_limit: number;
                };
                Returns: {
                    endpoint: string;
                    count: number;
                }[];
            };
            get_domain_keyword_counts: {
                Args: {
                    p_user_id: string;
                };
                Returns: Json;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
type UserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Row'];
type UserSettings = Database['public']['Tables']['indb_auth_user_settings']['Row'];
type DashboardNotification = Database['public']['Tables']['indb_notifications_dashboard']['Row'];
type KeywordCountry = Database['public']['Tables']['indb_keyword_countries']['Row'];
type KeywordDomain = Database['public']['Tables']['indb_keyword_domains']['Row'];
/** @deprecated (#V7 M-03) Use RankKeywordRow instead */
type KeywordKeyword = Database['public']['Tables']['indb_rank_keywords']['Row'];
type KeywordRanking = Database['public']['Tables']['indb_keyword_rankings']['Row'];
type RankKeywordRow = Database['public']['Tables']['indb_rank_keywords']['Row'];
type SiteIntegration = Database['public']['Tables']['indb_site_integration']['Row'];
/** (#V7 M-04) Maps to indb_site_integration, not a separate SE Ranking table */
type SeRankingIntegration = Database['public']['Tables']['indb_site_integration']['Row'];
type SeRankingUsageLog = Database['public']['Tables']['indb_seranking_usage_logs']['Row'];
type SecurityAuditLog = Database['public']['Tables']['indb_security_audit_logs']['Row'];
type SecurityActivityLog = Database['public']['Tables']['indb_security_activity_logs']['Row'];
type SystemErrorLog = Database['public']['Tables']['indb_system_error_logs']['Row'];
type PackageRow = Database['public']['Tables']['indb_payment_packages']['Row'];
type SubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row'];
type TransactionRow = Database['public']['Tables']['indb_payment_transactions']['Row'];
type ProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row'];
type UserSettingsRow = Database['public']['Tables']['indb_auth_user_settings']['Row'];
type PaymentGatewayRow = Database['public']['Tables']['indb_payment_gateways']['Row'];
type InsertUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Insert'];
type InsertUserSettings = Database['public']['Tables']['indb_auth_user_settings']['Insert'];
type InsertDashboardNotification = Database['public']['Tables']['indb_notifications_dashboard']['Insert'];
type InsertKeywordCountry = Database['public']['Tables']['indb_keyword_countries']['Insert'];
type InsertKeywordDomain = Database['public']['Tables']['indb_keyword_domains']['Insert'];
/** @deprecated (#V7 M-03) Use InsertRankKeyword instead */
type InsertKeywordKeyword = Database['public']['Tables']['indb_rank_keywords']['Insert'];
type InsertKeywordRanking = Database['public']['Tables']['indb_keyword_rankings']['Insert'];
type InsertSiteIntegration = Database['public']['Tables']['indb_site_integration']['Insert'];
type InsertSeRankingIntegration = Database['public']['Tables']['indb_site_integration']['Insert'];
type InsertSeRankingUsageLog = Database['public']['Tables']['indb_seranking_usage_logs']['Insert'];
type InsertSecurityAuditLog = Database['public']['Tables']['indb_security_audit_logs']['Insert'];
type InsertSecurityActivityLog = Database['public']['Tables']['indb_security_activity_logs']['Insert'];
type InsertSubscription = Database['public']['Tables']['indb_payment_subscriptions']['Insert'];
type InsertTransaction = Database['public']['Tables']['indb_payment_transactions']['Insert'];
type InsertPackage = Database['public']['Tables']['indb_payment_packages']['Insert'];
type InsertPaymentGateway = Database['public']['Tables']['indb_payment_gateways']['Insert'];
type UpdateUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Update'];
type UpdateUserSettings = Database['public']['Tables']['indb_auth_user_settings']['Update'];
type UpdateKeywordDomain = Database['public']['Tables']['indb_keyword_domains']['Update'];
/** @deprecated (#V7 M-03) Use UpdateRankKeyword instead */
type UpdateKeywordKeyword = Database['public']['Tables']['indb_rank_keywords']['Update'];
type UpdateKeywordRanking = Database['public']['Tables']['indb_keyword_rankings']['Update'];
type UpdateSiteIntegration = Database['public']['Tables']['indb_site_integration']['Update'];
type UpdateSeRankingIntegration = Database['public']['Tables']['indb_site_integration']['Update'];
type UpdateSeRankingUsageLog = Database['public']['Tables']['indb_seranking_usage_logs']['Update'];
type UpdateDashboardNotification = Database['public']['Tables']['indb_notifications_dashboard']['Update'];
type UpdateTransaction = Database['public']['Tables']['indb_payment_transactions']['Update'];
type UpdateSubscription = Database['public']['Tables']['indb_payment_subscriptions']['Update'];
type UpdatePackage = Database['public']['Tables']['indb_payment_packages']['Update'];
type UpdatePaymentGateway = Database['public']['Tables']['indb_payment_gateways']['Update'];
type SiteSettingsRow = Database['public']['Tables']['indb_site_settings']['Row'];

/**
 * Common type definitions used across IndexNow Studio
 */
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type Maybe<T> = T | null | undefined;
type ID = string;
type UUID = string;
type Timestamp = string;
type Status = 'active' | 'inactive' | 'pending' | 'suspended' | 'deleted';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Visibility = 'public' | 'private' | 'restricted';
interface BaseEntity {
    id: ID;
    createdAt: Date;
    updatedAt: Date;
}
interface AuditableEntity extends BaseEntity {
    createdBy?: ID;
    updatedBy?: ID;
    version?: number;
}
interface SoftDeletableEntity extends BaseEntity {
    deletedAt?: Date;
    deletedBy?: ID;
    isDeleted: boolean;
}
interface PaginationParams {
    page: number;
    limit: number;
    offset?: number;
}
interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    offset: number;
}
interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}
interface SortParam {
    field: string;
    direction: 'asc' | 'desc';
}
interface SortOptions {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
interface FilterParam {
    field: string;
    operator: FilterOperator;
    value: Json$1;
    condition?: 'AND' | 'OR';
}
type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike' | 'regex' | 'exists' | 'null' | 'between' | 'range';
interface SearchParams {
    query?: string;
    filters?: FilterParam[];
    sort?: SortParam[];
    pagination?: PaginationParams;
}
interface SearchResult$1<T> extends PaginatedResult<T> {
    query: string;
    searchTime: number;
    suggestions?: string[];
}
interface DateRange {
    from: Date;
    to: Date;
}
interface TimeRange {
    start: string;
    end: string;
}
interface Period {
    type: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
    value: number;
}
interface Coordinates {
    latitude: number;
    longitude: number;
}
interface Address {
    street?: string;
    city?: string;
    state?: string;
    country: string;
    postalCode?: string;
    coordinates?: Coordinates;
}
interface Location {
    name: string;
    address: Address;
    timezone?: string;
}
interface FileInfo {
    name: string;
    size: number;
    type: string;
    lastModified: Date;
    path?: string;
    url?: string;
    checksum?: string;
}
interface FileUpload {
    file: File;
    destination?: string;
    metadata?: Record<string, Json$1>;
}
interface FileDownload {
    filename: string;
    contentType: string;
    size: number;
    stream: ReadableStream;
}
interface ImageInfo extends FileInfo {
    width: number;
    height: number;
    format: string;
    quality?: number;
}
interface VideoInfo extends FileInfo {
    duration: number;
    resolution: {
        width: number;
        height: number;
    };
    bitrate?: number;
    codec?: string;
}
interface AudioInfo extends FileInfo {
    duration: number;
    bitrate?: number;
    sampleRate?: number;
    channels?: number;
}
interface Notification$1 {
    id: ID;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, Json$1>;
    userId?: ID;
    isRead: boolean;
    priority: Priority;
    expiresAt?: Date;
    createdAt: Date;
}
type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'system' | 'marketing';
interface Tag {
    id: ID;
    name: string;
    color?: string;
    description?: string;
    category?: string;
    usage: number;
    createdAt: Date;
}
interface TaggedEntity {
    tags: Tag[];
}
interface Comment {
    id: ID;
    content: string;
    authorId: ID;
    authorName: string;
    parentId?: ID;
    replies?: Comment[];
    likes: number;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface CommentableEntity {
    comments: Comment[];
    commentCount: number;
}
interface Metric {
    name: string;
    value: number;
    unit?: string;
    timestamp: Date;
    metadata?: Record<string, Json$1>;
}
interface MetricGroup {
    name: string;
    metrics: Metric[];
    period: Period;
    aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}
interface Setting {
    key: string;
    value: Json$1;
    type: 'string' | 'number' | 'boolean' | 'json' | 'array';
    description?: string;
    category?: string;
    isRequired: boolean;
    isSecret: boolean;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        enum?: Json$1[];
    };
}
interface SettingsGroup {
    name: string;
    description?: string;
    settings: Setting[];
}
interface Config {
    environment: 'development' | 'staging' | 'production';
    version: string;
    features: Record<string, boolean>;
    settings: Record<string, Json$1>;
    secrets: Record<string, string>;
}
interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheck[];
    timestamp: Date;
    uptime: number;
    version: string;
}
interface HealthCheck {
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    message?: string;
    details?: Record<string, Json$1>;
    timestamp: Date;
}
interface Webhook {
    id: ID;
    url: string;
    events: string[];
    headers?: Record<string, string>;
    secret?: string;
    isActive: boolean;
    retryConfig: {
        maxRetries: number;
        retryDelay: number;
        backoffMultiplier: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
interface WebhookEvent {
    id: ID;
    webhookId: ID;
    event: string;
    payload: Record<string, Json$1>;
    status: 'pending' | 'delivered' | 'failed' | 'cancelled';
    attempts: number;
    lastAttempt?: Date;
    nextAttempt?: Date;
    response?: {
        statusCode: number;
        headers: Record<string, string>;
        body: string;
    };
    createdAt: Date;
}
interface Task {
    id: ID;
    type: string;
    payload: Record<string, Json$1>;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    priority: Priority;
    attempts: number;
    maxAttempts: number;
    delay?: number;
    timeout?: number;
    retryBackoff?: 'fixed' | 'exponential';
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    error?: string;
}
interface TaskResult {
    success: boolean;
    data?: Json$1;
    error?: string;
    metadata?: Record<string, Json$1>;
}
interface CacheEntry<T = Json$1> {
    key: string;
    value: T;
    ttl: number;
    tags?: string[];
    createdAt: Date;
    accessedAt: Date;
    accessCount: number;
}
interface CacheStats {
    totalKeys: number;
    hits: number;
    misses: number;
    hitRate: number;
    memoryUsage: number;
    evictions: number;
}
type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type KeysOfType<T, U> = {
    [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

interface EnrichedActivityLog {
    id: string;
    user_id: string | null;
    user_name: string;
    user_email: string;
    event_type: string;
    action_description: string | null;
    target_type?: string | null;
    target_id?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    success: boolean;
    error_message?: string;
    metadata?: Json;
    created_at: string;
}
interface GetActivityLogsResponse {
    logs: EnrichedActivityLog[];
    pagination: PaginationMeta;
}
interface ActivityDetail extends EnrichedActivityLog {
    related_activities: EnrichedActivityLog[];
}
interface GetActivityDetailResponse {
    activity: ActivityDetail;
}
interface EnrichedSystemErrorLog extends SystemErrorLog {
}
interface ErrorDetailResponse {
    error: EnrichedSystemErrorLog;
    userInfo?: {
        email: string;
        full_name?: string;
    };
    relatedErrors: SystemErrorLog[];
}
interface VerifyRoleResponse extends ApiResponse$1<{
    isSuperAdmin: boolean;
    isAdmin: boolean;
    role: string;
}> {
}
interface AdminUserProfile {
    id: string;
    user_id: string;
    full_name: string;
    role: string;
    email: string;
    phone_number: string | null;
    created_at: string;
    updated_at: string;
    email_notifications: boolean;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
    daily_quota_limit?: number;
    daily_quota_used?: number;
    daily_quota_reset_date?: string;
    subscription_ends_at?: string;
    subscribed_at?: string | null;
    expires_at?: string | null;
    country?: string;
    package: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        pricing_tiers: Json;
        currency: string;
        billing_period: string;
        features: Json;
        subscribed_at?: string | null;
        expires_at?: string | null;
    } | null;
}
interface AdminOrderTransaction {
    id: string;
    user_id: string;
    package_id: string;
    gateway_id: string;
    transaction_type: string;
    transaction_status: string;
    amount: number;
    currency: string;
    billing_period: string | null;
    payment_method: string | null;
    payment_proof_url: string | null;
    gateway_transaction_id: string | null;
    verified_by: string | null;
    verified_at: string | null;
    processed_at: string | null;
    notes: string | null;
    metadata: Json;
    created_at: string;
    updated_at: string;
    package: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        pricing_tiers: Json;
        features: Json;
    } | null;
    gateway: {
        id: string;
        name: string;
        slug: string;
    } | null;
    user: {
        user_id: string;
        full_name: string;
        role: string;
        email: string;
        created_at: string;
        package_id?: string | null;
        subscribed_at?: string | null;
        expires_at?: string | null;
        phone_number?: string | null;
    };
    verifier?: {
        user_id: string;
        full_name: string;
        role: string;
    } | null;
}
interface AdminTransactionHistory {
    id: string;
    transaction_id: string;
    old_status: string | null;
    new_status: string;
    action_type: string;
    action_description: string;
    changed_by: string | null;
    changed_by_type: string;
    old_values: Json | null;
    new_values: Json | null;
    notes: string | null;
    metadata: Json | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user?: {
        user_id: string;
        full_name: string;
        email: string;
        role: string;
    } | null;
}
interface AdminOrderActivityLog {
    id: string;
    admin_id: string;
    action_type: string;
    action_description: string;
    target_type: string | null;
    target_id: string | null;
    metadata: Json | null;
    created_at: string;
    user?: {
        user_id: string;
        full_name: string;
        email: string;
        role: string;
    } | null;
}
interface AdminOrderDetailResponse {
    order: AdminOrderTransaction;
    transaction_history: AdminTransactionHistory[];
    activity_history: AdminOrderActivityLog[];
}
interface AdminOrderSummary {
    total_orders: number;
    pending_orders: number;
    proof_uploaded_orders: number;
    completed_orders: number;
    failed_orders: number;
    total_revenue: number;
    recent_activity: number;
}
interface AdminOrdersResponse {
    orders: AdminOrderTransaction[];
    summary: AdminOrderSummary;
    pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        items_per_page: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

/**
 * Dashboard-related API response DTOs for IndexNow Studio.
 *
 * These are the canonical shared types for:
 *  - GET /api/v1/dashboard   → DashboardAggregateResponse
 *  - GET /api/v1/public/settings → PublicSettingsResponse
 *
 * Both the API route (apps/api) and the frontend layer (apps/user-dashboard)
 * must use these DTOs so TypeScript enforces shape consistency at compile time.
 */
/** Pricing tier entry for a billing package */
interface DashboardPackagePricingTier {
    regular_price: number;
    promo_price?: number;
    paddle_price_id?: string;
}
/** Billing package as embedded in the dashboard profile */
interface DashboardPackageInfo {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    currency: string;
    billing_period: string;
    features: string[] | null;
    quota_limits: Record<string, number> | null;
    is_active: boolean;
    pricing_tiers: Record<string, DashboardPackagePricingTier> | null;
    /** Resolved price for the current billing period, derived from pricing_tiers */
    price?: number;
}
/** User profile section of the dashboard aggregate */
interface DashboardProfileInfo {
    id: string;
    email: string | null;
    package: DashboardPackageInfo | null;
    daily_quota_limit: number;
    daily_quota_used: number;
    is_trial_active: boolean;
    trial_ends_at: string | null;
    package_id: string | null;
    subscription_start_date: string | null;
    subscription_end_date: string | null;
    country: string | null;
}
/** Quota usage counters returned in the dashboard aggregate */
interface DashboardQuota {
    keywords: {
        used: number;
        limit: number;
        is_unlimited: boolean;
        /** -1 when unlimited */
        remaining: number;
    };
    daily_checks: {
        used: number;
        limit: number;
        is_unlimited: boolean;
        remaining: number;
        exhausted: boolean;
    };
}
/** Trial eligibility section of the dashboard aggregate */
interface DashboardTrialInfo {
    eligible: boolean;
    message: string;
    /** Packages eligible for trial activation (shape matches indb_payment_packages rows) */
    available_packages: unknown[];
}
/** Keyword domain row as returned in the dashboard aggregate  */
interface DashboardDomainInfo {
    id: string;
    user_id: string;
    domain_name: string;
    display_name: string | null;
    is_active: boolean;
    created_at: string;
    [key: string]: unknown;
}
/** Recent keyword entry returned in the dashboard aggregate */
interface DashboardRecentKeywordInfo {
    id: string;
    keyword: string;
    /** Top-level domain FK (may be absent in aggregate projection) */
    domain_id?: string;
    device_type: string;
    created_at: string;
    domain: {
        id?: string;
        domain_name: string;
        display_name?: string | null;
    };
    country: {
        id?: string;
        name?: string;
        iso2_code: string;
    };
    recent_ranking: {
        position: number | null;
        check_date: string | null;
    } | Array<{
        position: number | null;
        check_date: string | null;
        url?: string;
    }>;
    current_position?: number | null;
    tags?: string[];
    is_active?: boolean;
}
/**
 * Full response payload for GET /api/v1/dashboard.
 * This is what `api<DashboardAggregateResponse>` resolves to inside the
 * `useDashboardAggregate()` query hook (after envelope unwrap by `api<T>`).
 */
interface DashboardAggregateResponse {
    user: {
        profile: DashboardProfileInfo | null;
        quota: DashboardQuota;
        trial: DashboardTrialInfo;
    };
    billing: {
        /** All active billing packages (for trial/upgrade CTAs) */
        packages: unknown[];
        current_package_id: string | null;
        expires_at: string | null;
    };
    rankTracking: {
        domains: DashboardDomainInfo[];
        recentKeywords: DashboardRecentKeywordInfo[];
    };
    notifications: unknown[];
}
/** Single package entry as returned by the public settings endpoint */
interface PublicSettingsPackage {
    id: string;
    name: string;
    slug: string;
    description: string;
    features: string[];
    quota_limits: {
        daily_urls: number;
        keywords_limit: number;
        concurrent_jobs: number;
    };
    pricing_tiers: Record<string, unknown>;
    is_popular: boolean;
    is_active: boolean;
    sort_order: number;
}
/**
 * Full response payload for GET /api/v1/public/settings.
 * This is what `api<PublicSettingsResponse>` resolves to inside the
 * `usePublicSettings()` query hook.
 */
interface PublicSettingsResponse {
    packages: {
        packages: PublicSettingsPackage[];
    };
}

/**
 * Component prop types for IndexNow Studio
 */

interface BaseComponentProps {
    className?: string;
    children?: React$1.ReactNode;
    testId?: string;
}
interface LoadingProps extends BaseComponentProps {
    isLoading: boolean;
    fallback?: React$1.ReactNode;
    error?: string | null;
}
interface LayoutProps extends BaseComponentProps {
    title?: string;
    description?: string;
    hideNavigation?: boolean;
    fullWidth?: boolean;
}
interface SidebarProps extends BaseComponentProps {
    isCollapsed: boolean;
    onToggle: () => void;
    navigationItems: ComponentNavigationItem[];
    currentPath: string;
}
interface ComponentNavigationItem {
    id: string;
    label: string;
    path: string;
    icon?: React$1.ComponentType<{
        className?: string;
    }>;
    children?: ComponentNavigationItem[];
    isActive?: boolean;
    isDisabled?: boolean;
    badge?: string | number;
    requiredRole?: string[];
}
interface HeaderProps extends BaseComponentProps {
    title?: string;
    subtitle?: string;
    actions?: React$1.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}
interface BreadcrumbItem {
    label: string;
    path?: string;
    isActive?: boolean;
}
interface DashboardPreviewProps extends BaseComponentProps {
    title: string;
    subtitle: string;
    variant?: 'login' | 'register' | 'forgot';
}
interface StatsCardProps extends BaseComponentProps {
    title: string;
    value: string | number;
    change?: {
        value: number;
        type: 'increase' | 'decrease';
        period: string;
    };
    icon?: React$1.ComponentType<{
        className?: string;
    }>;
    color?: 'default' | 'primary' | 'success' | 'warning' | 'error';
    isLoading?: boolean;
}
interface ChartProps extends BaseComponentProps {
    data: Record<string, Json$1>[];
    type: 'line' | 'bar' | 'area' | 'pie' | 'donut';
    xAxis?: string;
    yAxis?: string;
    title?: string;
    height?: number;
    colors?: string[];
    isLoading?: boolean;
}
interface TableProps<T = Record<string, Json$1>> extends BaseComponentProps {
    data: T[];
    columns: TableColumn<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
    selection?: {
        selectedRows: T[];
        onSelectionChange: (rows: T[]) => void;
        selectionKey: keyof T;
    };
    sorting?: {
        sortBy?: keyof T;
        sortOrder?: 'asc' | 'desc';
        onSort: (column: keyof T) => void;
    };
    pagination?: PaginationProps;
}
interface TableColumn<T = Record<string, Json$1>> {
    key: keyof T;
    title: string;
    width?: string;
    sortable?: boolean;
    render?: (value: Json$1, row: T, index: number) => React$1.ReactNode;
    className?: string;
}
interface PaginationProps extends BaseComponentProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    showPageSize?: boolean;
    pageSizeOptions?: number[];
}
interface FormProps extends BaseComponentProps {
    onSubmit: (data: Record<string, Json$1>) => void | Promise<void>;
    isLoading?: boolean;
    disabled?: boolean;
    resetOnSubmit?: boolean;
    validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
}
interface InputProps extends BaseComponentProps {
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
    label?: string;
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    maxLength?: number;
    autoComplete?: string;
    leftIcon?: React$1.ComponentType<{
        className?: string;
    }>;
    rightIcon?: React$1.ComponentType<{
        className?: string;
    }>;
}
interface SelectProps extends BaseComponentProps {
    label?: string;
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    options: SelectOption[];
    error?: string;
    required?: boolean;
    disabled?: boolean;
    searchable?: boolean;
    multiple?: boolean;
    clearable?: boolean;
}
interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    group?: string;
}
interface TextareaProps extends BaseComponentProps {
    label?: string;
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    rows?: number;
    maxLength?: number;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}
interface CheckboxProps extends BaseComponentProps {
    label?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    description?: string;
}
interface RadioGroupProps extends BaseComponentProps {
    label?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    options: RadioOption[];
    disabled?: boolean;
    required?: boolean;
    error?: string;
    orientation?: 'horizontal' | 'vertical';
}
interface RadioOption {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
}
interface ButtonProps extends BaseComponentProps {
    variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    isLoading?: boolean;
    loadingText?: string;
    leftIcon?: React$1.ComponentType<{
        className?: string;
    }>;
    rightIcon?: React$1.ComponentType<{
        className?: string;
    }>;
    onClick?: () => void | Promise<void>;
    type?: 'button' | 'submit' | 'reset';
    fullWidth?: boolean;
}
interface IconButtonProps extends BaseComponentProps {
    icon: React$1.ComponentType<{
        className?: string;
    }>;
    variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    isLoading?: boolean;
    onClick?: () => void | Promise<void>;
    tooltip?: string;
    'aria-label': string;
}
interface ModalProps extends BaseComponentProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    footer?: React$1.ReactNode;
}
interface AlertDialogProps extends BaseComponentProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    variant?: 'default' | 'destructive';
    isLoading?: boolean;
}
interface DrawerProps extends BaseComponentProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    side?: 'left' | 'right' | 'top' | 'bottom';
    size?: 'sm' | 'md' | 'lg';
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
}
interface ToastProps extends BaseComponentProps {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message?: string;
    duration?: number;
    persistent?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
    onClose: () => void;
}
interface AlertProps extends BaseComponentProps {
    type: 'info' | 'success' | 'warning' | 'error';
    title?: string;
    message: string;
    dismissible?: boolean;
    onDismiss?: () => void;
    actions?: Array<{
        label: string;
        onClick: () => void;
        variant?: 'default' | 'primary' | 'outline';
    }>;
}
interface ProgressProps extends BaseComponentProps {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'error';
    showValue?: boolean;
    label?: string;
    isIndeterminate?: boolean;
}
interface AdvancedNeonCardProps extends BaseComponentProps {
    intensity?: 'low' | 'medium' | 'high';
    mousePosition: {
        x: number;
        y: number;
    };
    isTracking: boolean;
}
interface ClientOnlyWrapperProps extends BaseComponentProps {
    fallback?: React$1.ReactNode;
}
interface FileUploadProps extends BaseComponentProps {
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    onFilesChange: (files: File[]) => void;
    disabled?: boolean;
    dragAndDrop?: boolean;
    showPreview?: boolean;
    error?: string;
}
interface DatePickerProps extends BaseComponentProps {
    label?: string;
    value?: Date;
    defaultValue?: Date;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    minDate?: Date;
    maxDate?: Date;
    format?: string;
}
interface ColorPickerProps extends BaseComponentProps {
    label?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (color: string) => void;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    format?: 'hex' | 'rgb' | 'hsl';
    showInput?: boolean;
    presets?: string[];
}
interface TabsProps extends BaseComponentProps {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    orientation?: 'horizontal' | 'vertical';
    variant?: 'default' | 'pills' | 'underline';
}
interface TabProps extends BaseComponentProps {
    value: string;
    disabled?: boolean;
    icon?: React$1.ComponentType<{
        className?: string;
    }>;
}
interface StepsProps extends BaseComponentProps {
    current: number;
    steps: StepItem[];
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg';
    showDescription?: boolean;
}
interface NavItem extends ComponentNavigationItem {
}
interface SidebarItem extends ComponentNavigationItem {
}
interface UserMenuProps extends BaseComponentProps {
    user: AppUserProfile;
    onLogout: () => void;
}
interface FormField extends BaseComponentProps {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
}
interface StepItem {
    title: string;
    description?: string;
    status?: 'pending' | 'current' | 'completed' | 'error';
    icon?: React$1.ComponentType<{
        className?: string;
    }>;
}

/**
 * Component state types for IndexNow Studio
 */

interface ModalState {
    isOpen: boolean;
    title?: string;
    description?: string;
    content?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    type?: 'default' | 'alert' | 'confirm' | 'custom';
    data?: Json$1;
    onConfirm?: (data?: Json$1) => void | Promise<void>;
    onCancel?: () => void;
    onClose?: () => void;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
}
interface ModalActions {
    openModal: (modal: Partial<ModalState>) => void;
    closeModal: () => void;
    updateModal: (updates: Partial<ModalState>) => void;
    setLoading: (isLoading: boolean) => void;
}

interface Notification {
    id: string;
    type: NotificationType$1;
    title: string;
    message?: string;
    duration?: number;
    persistent?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
    timestamp: number;
}
interface NotificationState {
    notifications: Notification[];
}
interface NotificationActions {
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
    clearNotificationsByType: (type: NotificationType$1) => void;
}
interface FormState<T = Record<string, Json$1>> {
    data: T;
    errors: Record<string, string>;
    isSubmitting: boolean;
    isValid: boolean;
    isDirty: boolean;
    touchedFields: Record<string, boolean>;
}
interface FormActions<T = Record<string, Json$1>> {
    setFieldValue: (field: keyof T, value: Json$1) => void;
    setFieldError: (field: keyof T, error: string) => void;
    clearFieldError: (field: keyof T) => void;
    setTouched: (field: keyof T, touched?: boolean) => void;
    reset: (data?: T) => void;
    submit: () => Promise<void>;
}
interface TableState<T = Record<string, Json$1>> {
    data: T[];
    filteredData: T[];
    selectedRows: T[];
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    sortBy?: keyof T;
    sortOrder: 'asc' | 'desc';
    searchTerm: string;
    filters: Record<string, Json$1>;
    isLoading: boolean;
}
interface TableActions<T = Record<string, Json$1>> {
    setData: (data: T[]) => void;
    setSelectedRows: (rows: T[]) => void;
    selectRow: (row: T) => void;
    deselectRow: (row: T) => void;
    selectAllRows: () => void;
    deselectAllRows: () => void;
    setCurrentPage: (page: number) => void;
    setItemsPerPage: (itemsPerPage: number) => void;
    setSorting: (column: keyof T, order?: 'asc' | 'desc') => void;
    setSearchTerm: (term: string) => void;
    setFilter: (key: string, value: Json$1) => void;
    clearFilters: () => void;
    setLoading: (isLoading: boolean) => void;
}
interface SidebarState {
    isCollapsed: boolean;
    isMobile: boolean;
    activePath: string;
    openSubmenus: string[];
}
interface SidebarActions {
    toggleSidebar: () => void;
    collapseSidebar: () => void;
    expandSidebar: () => void;
    setActivePath: (path: string) => void;
    toggleSubmenu: (menuId: string) => void;
    setMobileMode: (isMobile: boolean) => void;
}
interface ThemeState {
    mode: ThemeMode;
    resolvedMode: 'light' | 'dark';
    isSystemMode: boolean;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        surface: string;
        text: string;
    };
}
interface ThemeActions {
    setMode: (mode: ThemeMode) => void;
    toggleMode: () => void;
    setCustomColors: (colors: Partial<ThemeState['colors']>) => void;
    resetColors: () => void;
}
interface LoadingState {
    isLoading: boolean;
    loadingText?: string;
    progress?: number;
    error?: string;
}
interface LoadingActions {
    setLoading: (isLoading: boolean, text?: string) => void;
    setProgress: (progress: number) => void;
    setError: (error: string) => void;
    clearError: () => void;
}
interface SearchState {
    query: string;
    results: Record<string, Json$1>[];
    isSearching: boolean;
    hasSearched: boolean;
    totalResults: number;
    filters: Record<string, Json$1>;
    sort: {
        field: string;
        order: 'asc' | 'desc';
    };
    pagination: {
        currentPage: number;
        totalPages: number;
        itemsPerPage: number;
    };
}
interface SearchActions {
    setQuery: (query: string) => void;
    search: (query?: string) => Promise<void>;
    clearSearch: () => void;
    setFilter: (key: string, value: Json$1) => void;
    clearFilters: () => void;
    setSort: (field: string, order?: 'asc' | 'desc') => void;
    setPage: (page: number) => void;
}
interface UploadState {
    files: File[];
    uploadedFiles: UploadedFile[];
    isUploading: boolean;
    progress: Record<string, number>;
    errors: Record<string, string>;
}
interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedAt: Date;
}
interface UploadActions {
    addFiles: (files: File[]) => void;
    removeFile: (index: number) => void;
    clearFiles: () => void;
    uploadFiles: () => Promise<void>;
    setProgress: (fileIndex: number, progress: number) => void;
    setError: (fileIndex: number, error: string) => void;
}
interface ValidationState {
    isValid: boolean;
    errors: ComponentValidationError[];
    warnings: ComponentValidationError[];
    isValidating: boolean;
}
interface ComponentValidationError {
    field: string;
    message: string;
    type: 'error' | 'warning';
    value?: Json$1;
}
interface ValidationActions {
    validateField: (field: string, value: Json$1) => Promise<void>;
    validateAll: () => Promise<void>;
    clearErrors: () => void;
    clearFieldErrors: (field: string) => void;
    addError: (error: ComponentValidationError) => void;
    removeError: (field: string) => void;
}
interface WizardState {
    currentStep: number;
    totalSteps: number;
    steps: WizardStep[];
    isCompleted: boolean;
    canGoNext: boolean;
    canGoPrevious: boolean;
    data: Record<string, Json$1>;
}
interface WizardStep {
    id: string;
    title: string;
    description?: string;
    isCompleted: boolean;
    isValid: boolean;
    isOptional: boolean;
    component?: React.ComponentType<Record<string, Json$1>>;
}
interface WizardActions {
    nextStep: () => void;
    previousStep: () => void;
    goToStep: (step: number) => void;
    setStepData: (stepId: string, data: Json$1) => void;
    setStepValid: (stepId: string, isValid: boolean) => void;
    completeStep: (stepId: string) => void;
    reset: () => void;
}
interface DashboardState {
    stats: {
        totalJobs: number;
        activeJobs: number;
        completedJobs: number;
        failedJobs: number;
        totalUrls: number;
        successfulUrls: number;
        quotaUsage: Record<string, number>;
    };
    recentActivity: Record<string, Json$1>[];
    charts: {
        jobsOverTime: Record<string, Json$1>[];
        urlsOverTime: Record<string, Json$1>[];
        successRate: Record<string, Json$1>[];
        quotaUsage: Record<string, Json$1>[];
    };
    isLoading: boolean;
    lastUpdated?: Date;
}
interface PaymentState {
    selectedPackage?: {
        id: string;
        name: string;
        price: number;
        currency: string;
    };
    billingPeriod: 'monthly' | 'quarterly' | 'biannual' | 'annual';
    customerInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address: {
            street: string;
            city: string;
            state?: string;
            postalCode: string;
            country: string;
        };
    };
    paymentMethod: string;
    promoCode?: string;
    discount?: {
        type: 'percentage' | 'fixed';
        value: number;
        amount: number;
    };
    total: number;
    isProcessing: boolean;
    error?: string;
}
interface RankTrackingState {
    keywords: Record<string, Json$1>[];
    domains: Record<string, Json$1>[];
    selectedKeywords: string[];
    selectedDomain: string;
    selectedDevice: string;
    selectedCountry: string;
    selectedTags: string[];
    searchTerm: string;
    isLoading: boolean;
    showActionsMenu: boolean;
    showDeleteConfirm: boolean;
    showTagModal: boolean;
    newTag: string;
    isDeleting: boolean;
    isAddingTag: boolean;
}

/**
 * Error type definitions for IndexNow Studio
 */

declare enum ErrorType {
    VALIDATION = "VALIDATION_ERROR",
    AUTHENTICATION = "AUTHENTICATION_ERROR",
    AUTHORIZATION = "AUTHORIZATION_ERROR",
    NOT_FOUND = "NOT_FOUND_ERROR",
    DATABASE = "DATABASE_ERROR",
    EXTERNAL_API = "EXTERNAL_API_ERROR",
    BUSINESS_LOGIC = "BUSINESS_LOGIC_ERROR",
    INTERNAL = "INTERNAL_ERROR",
    RATE_LIMIT = "RATE_LIMIT_ERROR",
    SYSTEM = "SYSTEM_ERROR",
    NETWORK = "NETWORK_ERROR",
    PAYMENT = "PAYMENT_ERROR",
    ENCRYPTION = "ENCRYPTION_ERROR"
}
declare enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
interface ApiError {
    code: string;
    message: string;
    details?: Json$1;
    statusCode: number;
}
interface ValidationError {
    field: string;
    message: string;
    value?: Json$1;
}
declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string, isOperational?: boolean);
}

/**
 * Error tracking and monitoring type definitions for IndexNow Studio
 */

interface StructuredError {
    id: string;
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    userMessage: string;
    userId?: string;
    endpoint?: string;
    method?: string;
    statusCode: number;
    metadata?: Record<string, Json$1>;
    stack?: string;
    timestamp: Date;
}
interface RankCheckError {
    keywordId: string;
    userId: string;
    errorType: 'quota_exceeded' | 'api_error' | 'parsing_error' | 'network_error' | 'authentication_error';
    errorMessage: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: Record<string, Json$1>;
}
interface ErrorStats {
    errorType: string;
    count: number;
    severity: string;
    lastOccurrence: Date;
    affectedUsers: number;
    affectedKeywords: number;
}
interface SystemErrorStats {
    totalErrors: number;
    errorsByType: ErrorStats[];
    criticalErrors: number;
    affectedUsers: number;
    trends: Record<string, number>;
}

declare const ImmediateRankCheckJobSchema: z.ZodObject<{
    keywordId: z.ZodString;
    userId: z.ZodString;
    domainId: z.ZodString;
    keyword: z.ZodString;
    countryCode: z.ZodString;
    device: z.ZodEnum<["desktop", "mobile", "tablet"]>;
}, "strip", z.ZodTypeAny, {
    keyword: string;
    device: "desktop" | "mobile" | "tablet";
    userId: string;
    keywordId: string;
    domainId: string;
    countryCode: string;
}, {
    keyword: string;
    device: "desktop" | "mobile" | "tablet";
    userId: string;
    keywordId: string;
    domainId: string;
    countryCode: string;
}>;
type ImmediateRankCheckJob = z.infer<typeof ImmediateRankCheckJobSchema>;
declare const EmailJobSchema: z.ZodObject<{
    to: z.ZodString;
    subject: z.ZodString;
    template: z.ZodEnum<["billing_confirmation", "payment_received", "package_activated", "order_expired", "trial_expiring", "login_notification", "contact_form"]>;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    data: Record<string, any>;
    to: string;
    subject: string;
    template: "billing_confirmation" | "payment_received" | "package_activated" | "order_expired" | "trial_expiring" | "login_notification" | "contact_form";
}, {
    data: Record<string, any>;
    to: string;
    subject: string;
    template: "billing_confirmation" | "payment_received" | "package_activated" | "order_expired" | "trial_expiring" | "login_notification" | "contact_form";
}>;
type EmailJob = z.infer<typeof EmailJobSchema>;
declare const PaymentWebhookJobSchema: z.ZodObject<{
    orderId: z.ZodString;
    transactionId: z.ZodString;
    status: z.ZodEnum<["pending", "settlement", "expire", "cancel", "deny"]>;
    paymentType: z.ZodString;
    webhookData: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "settlement" | "expire" | "cancel" | "deny";
    transactionId: string;
    orderId: string;
    paymentType: string;
    webhookData: Record<string, any>;
}, {
    status: "pending" | "settlement" | "expire" | "cancel" | "deny";
    transactionId: string;
    orderId: string;
    paymentType: string;
    webhookData: Record<string, any>;
}>;
type PaymentWebhookJob = z.infer<typeof PaymentWebhookJobSchema>;
declare const AutoCancelJobSchema: z.ZodObject<{
    scheduledAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    scheduledAt: string;
}, {
    scheduledAt: string;
}>;
type AutoCancelJob = z.infer<typeof AutoCancelJobSchema>;
declare const KeywordEnrichmentJobSchema: z.ZodObject<{
    scheduledAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    scheduledAt: string;
}, {
    scheduledAt: string;
}>;
type KeywordEnrichmentJob = z.infer<typeof KeywordEnrichmentJobSchema>;

/**
 * Rank tracking type definitions for IndexNow Studio
 */

type Device = 'desktop' | 'mobile' | 'tablet';
type SearchEngine = 'google' | 'bing' | 'yahoo';
type CountryCode = string;
interface Domain {
    id: string;
    domain_name: string;
    display_name?: string | null;
}
interface Country {
    id: string;
    name: string;
    iso2_code: string;
}
interface RankKeyword {
    id: string;
    userId: string;
    keyword: string;
    domain: string;
    country: CountryCode;
    device: Device;
    searchEngine: SearchEngine;
    targetUrl?: string;
    tags: string[];
    isActive: boolean;
    currentPosition?: number;
    previousPosition?: number;
    bestPosition?: number;
    averagePosition?: number;
    lastChecked?: Date;
    createdAt: Date;
    updatedAt: Date;
    metadata?: {
        searchVolume?: number;
        difficulty?: number;
        cpc?: number;
        competition?: 'low' | 'medium' | 'high';
    };
}
interface RankHistory {
    id: string;
    keywordId: string;
    position: number;
    checkedAt: Date;
    searchResults?: RankSearchResult[];
    features?: SearchFeature[];
    metadata?: {
        totalResults?: number;
        searchTime?: number;
        location?: string;
    };
}
/** A single search engine result entry for rank tracking. */
interface RankSearchResult {
    position: number;
    url: string;
    title: string;
    snippet: string;
    domain: string;
    isTargetDomain: boolean;
}
/** @deprecated Use RankSearchResult instead (#V7 M-05 typo fix) */
type SerchResult = RankSearchResult;
/** @deprecated Use RankSearchResult instead (#V7 M-05 name clash with CommonTypes.SearchResult) */
type SearchResult = RankSearchResult;
interface SearchFeature {
    type: string;
    position: number;
    data?: Json$1;
}
interface RankTrackingDomain {
    id: string;
    userId: string;
    domain: string;
    name: string;
    isActive: boolean;
    keywordCount: number;
    averagePosition?: number;
    visibility?: number;
    createdAt: Date;
    updatedAt: Date;
}
interface CreateKeywordRequest {
    keyword: string;
    domain: string;
    country: CountryCode;
    device?: Device;
    searchEngine?: SearchEngine;
    targetUrl?: string;
    tags?: string[];
}
interface UpdateKeywordRequest {
    keyword?: string;
    domain?: string;
    country?: CountryCode;
    device?: Device;
    searchEngine?: SearchEngine;
    targetUrl?: string;
    tags?: string[];
    isActive?: boolean;
}
interface BulkKeywordRequest {
    keywords: CreateKeywordRequest[];
    validateDuplicates?: boolean;
    skipInvalid?: boolean;
}
interface RankCheckRequest {
    keywordIds: string[];
    forceRefresh?: boolean;
    priority?: boolean;
}
interface RankCheckResult {
    keywordId: string;
    keyword: string;
    domain: string;
    position: number;
    previousPosition?: number;
    positionChange: number;
    targetUrl?: string;
    actualUrl?: string;
    checkedAt: Date;
    success: boolean;
    error?: string;
    searchResults?: RankSearchResult[];
    features?: SearchFeature[];
}
interface DashboardRecentKeyword {
    id: string;
    keyword: string;
    device_type: string;
    domain: {
        id: string;
        domain_name: string;
        display_name: string | null;
    } | null;
    country: {
        name: string;
        iso2_code: string;
    } | null;
    recent_ranking: {
        position: number | null;
        check_date: string;
    }[] | null;
}
interface KeywordAnalytics {
    keywordId: string;
    period: {
        from: Date;
        to: Date;
    };
    metrics: {
        averagePosition: number;
        bestPosition: number;
        worstPosition: number;
        volatility: number;
        trend: 'up' | 'down' | 'stable';
        changePercent: number;
    };
    history: {
        date: Date;
        position: number;
    }[];
}
interface DomainAnalytics {
    domain: string;
    period: {
        from: Date;
        to: Date;
    };
    metrics: {
        totalKeywords: number;
        averagePosition: number;
        visibility: number;
        topKeywords: number;
        improvingKeywords: number;
        decliningKeywords: number;
    };
    positionDistribution: {
        range: string;
        count: number;
        percentage: number;
    }[];
}
interface Competitor {
    id: string;
    userId: string;
    domain: string;
    name: string;
    isActive: boolean;
    keywordOverlap?: number;
    averagePosition?: number;
    visibility?: number;
    createdAt: Date;
    updatedAt: Date;
}
interface CompetitorAnalysis {
    competitorId: string;
    period: {
        from: Date;
        to: Date;
    };
    metrics: {
        sharedKeywords: number;
        winningKeywords: number;
        losingKeywords: number;
        gapOpportunities: number;
    };
    keywordGaps: {
        keyword: string;
        competitorPosition: number;
        ourPosition?: number;
        opportunity: 'low' | 'medium' | 'high';
    }[];
}
interface RankReport {
    id: string;
    userId: string;
    name: string;
    type: 'keyword' | 'domain' | 'competitor';
    filters: {
        keywordIds?: string[];
        domains?: string[];
        countries?: CountryCode[];
        devices?: Device[];
        tags?: string[];
    };
    schedule?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        time: string;
        timezone: string;
        emails: string[];
    };
    format: 'pdf' | 'excel' | 'csv';
    isActive: boolean;
    lastGenerated?: Date;
    createdAt: Date;
    updatedAt: Date;
}
interface GenerateReportRequest {
    reportId: string;
    period: {
        from: Date;
        to: Date;
    };
    includeCharts?: boolean;
    includeComparison?: boolean;
}
interface RankTrackingQuota {
    totalKeywords: number;
    usedKeywords: number;
    remainingKeywords: number;
    dailyChecks: number;
    usedChecks: number;
    remainingChecks: number;
    resetDate: Date;
}
interface RankTrackingLimits {
    maxKeywords: number;
    dailyChecks: number;
    historicalData: number;
    competitors: number;
    reports: number;
    apiAccess: boolean;
    bulkOperations: boolean;
}
interface RankTrackingSettings {
    userId: string;
    defaultCountry: CountryCode;
    defaultDevice: Device;
    defaultSearchEngine: SearchEngine;
    checkFrequency: 'daily' | 'weekly' | 'monthly';
    notifications: {
        positionChanges: boolean;
        significantDrops: boolean;
        newTopRankings: boolean;
        weeklyReports: boolean;
    };
    alertThresholds: {
        positionDrop: number;
        positionImprovement: number;
        volatility: number;
    };
}
interface AvailableLocation {
    country: CountryCode;
    countryName: string;
    regions?: {
        code: string;
        name: string;
        cities?: {
            code: string;
            name: string;
        }[];
    }[];
    languages: string[];
}

/**
 * User-related type definitions for IndexNow Studio
 */
type UserRole = 'user' | 'admin' | 'super_admin';
interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
    scope?: string[];
}
interface Session {
    id: string;
    userId: string;
    deviceId?: string;
    ipAddress: string;
    userAgent: string;
    location?: {
        country: string;
        city: string;
        region: string;
    };
    isActive: boolean;
    lastActivity: Date;
    createdAt: Date;
    expiresAt: Date;
}
interface LoginAttempt {
    id: string;
    email: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    failureReason?: string;
    timestamp: Date;
    location?: {
        country: string;
        city: string;
    };
}
interface UserManagementAction {
    userId: string;
    action: 'suspend' | 'activate' | 'reset_password' | 'reset_quota' | 'extend_subscription' | 'change_package' | 'delete';
    reason: string;
    additionalData?: Record<string, unknown>;
    performedBy: string;
    performedAt: Date;
}
interface UserStats {
    totalUsers: number;
    activeUsers: number;
    trialUsers: number;
    subscribedUsers: number;
    suspendedUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    churnRate: number;
    growthRate: number;
}
interface PhoneVerification {
    id: string;
    userId: string;
    phoneNumber: string;
    code: string;
    isUsed: boolean;
    attempts: number;
    expiresAt: Date;
    createdAt: Date;
    verifiedAt?: Date;
}
interface TeamInvitation {
    id: string;
    teamId: string;
    email: string;
    role: string;
    token: string;
    invitedBy: string;
    isAccepted: boolean;
    expiresAt: Date;
    createdAt: Date;
    acceptedAt?: Date;
}

/**
 * Simple universal logger for IndexNow Studio
 * Works in both browser and server environments
 */

interface LogContext extends Record<string, Json$1 | Error | object | undefined> {
    error?: Error | string | object;
    userId?: string;
    eventType?: string;
    activityId?: string;
}
interface LoggerTransport {
    debug(obj: object, msg: string): void;
    info(obj: object, msg: string): void;
    warn(obj: object, msg: string): void;
    error(obj: object, msg: string): void;
}
/**
 * Set an external logger transport (e.g., pino) to receive all shared package log calls.
 * Call this once at app startup. When set, all logger.info/warn/error/debug calls
 * from @indexnow/shared packages will route through the transport instead of console.
 */
declare function setLoggerTransport(transport: LoggerTransport): void;
declare class Logger {
    private isProductionEnv;
    private formatMessage;
    private log;
    debug(context: LogContext | string, message?: string): void;
    info(context: LogContext | string, message?: string): void;
    warn(context: LogContext | string, message?: string): void;
    error(context: LogContext | string, message?: string): void;
    fatal(context: LogContext | string, message?: string): void;
}

declare const ErrorHandlingService: {
    handle: (error: Error | string | object | null | undefined, context?: LogContext) => void;
    createError: (config: {
        message: string;
        type?: ErrorType;
        severity?: ErrorSeverity;
        [key: string]: Json$1 | ErrorType | ErrorSeverity | undefined;
    }) => Error & {
        type?: ErrorType;
        severity?: ErrorSeverity;
    };
};
declare const logger: Logger;

/**
 * Utility functions for formatting data
 */
/**
 * Formats a date string into a readable format.
 * @param dateString - The date to format
 * @param includeRelative - If true, appends a relative time suffix (optional, default false)
 */
declare function formatDate(dateString: string | Date, includeRelative?: boolean): string;
/**
 * Formats a date string into a relative time string (e.g., "2 days ago")
 * Handles future dates and invalid input gracefully (#14)
 */
declare function formatRelativeTime(dateString: string | Date): string;
/**
 * Formats a number with thousands separators
 */
declare function formatNumber(num: number): string;
/**
 * Truncates a string to a maximum length
 */
declare function truncateString(str: string, maxLength: number): string;
/**
 * Capitalizes the first letter of a string
 */
declare function capitalizeFirstLetter(str: string): string;

/**
 * Combines tailwind classes with clsx and twMerge
 */
declare function cn(...inputs: ClassValue[]): string;

/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascade failures by stopping requests to failing services
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests fail immediately
 * - HALF_OPEN: Testing if service has recovered
 *
 * Phase 3 - Milestone C.4: Circuit Breaker implementation
 */
declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    monitoringWindow: number;
    name: string;
}
interface CircuitBreakerMetrics {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number | null;
    lastStateChange: number;
    totalRequests: number;
    totalFailures: number;
    totalSuccesses: number;
}
declare class CircuitBreaker {
    private config;
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime;
    private lastStateChange;
    private nextAttempt;
    private readonly failures;
    private totalRequests;
    private totalFailures;
    private totalSuccesses;
    constructor(config: CircuitBreakerConfig);
    /**
     * Execute an operation with circuit breaker protection
     */
    execute<T>(operation: () => Promise<T>): Promise<T>;
    /**
     * Handle successful operation
     */
    private onSuccess;
    /**
     * Handle failed operation
     */
    private onFailure;
    /**
     * Transition to new state
     */
    private transitionTo;
    /**
     * Get current metrics
     */
    getMetrics(): CircuitBreakerMetrics;
    /**
     * Reset the circuit breaker
     */
    reset(): void;
    /**
     * Get current state
     */
    getState(): CircuitState;
    /**
     * Check if circuit is available
     */
    isAvailable(): boolean;
}
/**
 * Circuit Breaker Manager
 * Manages circuit breakers for different services
 * Max size capped to prevent unbounded growth (#10/#11)
 */
declare class CircuitBreakerManager {
    private static breakers;
    private static readonly MAX_BREAKERS;
    /**
     * Get or create a circuit breaker for a service
     */
    static getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker;
    /**
     * Get all circuit breaker metrics
     */
    static getAllMetrics(): Record<string, CircuitBreakerMetrics>;
    /**
     * Reset all circuit breakers
     */
    static resetAll(): void;
    /**
     * Reset specific circuit breaker
     */
    static reset(serviceName: string): void;
    /**
     * Remove a circuit breaker entirely (#10)
     */
    static removeBreaker(serviceName: string): boolean;
    /**
     * Get current number of tracked breakers
     */
    static get size(): number;
}
declare const ServiceCircuitBreakers: {
    database: () => CircuitBreaker;
    externalApi: () => CircuitBreaker;
    payment: () => CircuitBreaker;
    serp: () => CircuitBreaker;
};

/**
 * Exponential Backoff Implementation
 *
 * Automatically retries failed operations with increasing delays
 * Prevents overwhelming failed services with repeated requests
 *
 * Phase 3 - Milestone C.5: Exponential Backoff implementation
 */
interface RetryConfig {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    multiplier: number;
    jitter: boolean;
    retryableErrors?: RegExp[];
    onRetry?: (attempt: number, delay: number, error: Error) => void;
}
interface RetryMetrics {
    attempts: number;
    totalDelay: number;
    success: boolean;
    finalError?: Error;
}
declare class ExponentialBackoff {
    private readonly config;
    constructor(config?: Partial<RetryConfig>);
    /**
     * Execute operation with exponential backoff retry
     */
    execute<T>(operation: () => Promise<T>, context?: string): Promise<T>;
    /**
     * Calculate delay for given attempt with exponential backoff
     */
    private calculateDelay;
    /**
     * Check if error is retryable
     */
    private isRetryableError;
}
/**
 * Pre-configured backoff strategies
 */
declare const BackoffStrategies: {
    /**
     * Fast retry - for operations that usually succeed quickly
     */
    fast: ExponentialBackoff;
    /**
     * Standard retry - balanced approach
     */
    standard: ExponentialBackoff;
    /**
     * Slow retry - for expensive operations
     */
    slow: ExponentialBackoff;
    /**
     * Aggressive retry - for critical operations
     */
    aggressive: ExponentialBackoff;
    /**
     * API rate limit retry - for rate-limited APIs
     */
    rateLimit: ExponentialBackoff;
};
/**
 * Utility function for simple retry with exponential backoff
 */
declare function retryWithBackoff<T>(operation: () => Promise<T>, config?: Partial<RetryConfig>, context?: string): Promise<T>;

/**
 * Fallback Handler Implementation
 *
 * Provides fallback strategies when operations fail
 * Ensures graceful degradation of service
 *
 * Phase 3 - Milestone C.6: Fallback Handler implementation
 */
type FallbackStrategy<T> = {
    type: 'default';
    value: T;
} | {
    type: 'cached';
    ttl?: number;
} | {
    type: 'alternative';
    operation: () => Promise<T>;
} | {
    type: 'degraded';
    operation: () => Promise<Partial<T>>;
} | {
    type: 'empty';
} | {
    type: 'error';
};
interface FallbackConfig<T> {
    strategies: FallbackStrategy<T>[];
    cacheTTL?: number;
    logFallbacks?: boolean;
}

declare class FallbackHandler<T = Json$1> {
    private config;
    private cache;
    private readonly defaultCacheTTL;
    constructor(config: FallbackConfig<T>);
    /**
     * Execute operation with fallback strategies
     */
    executeWithFallback(operation: () => Promise<T>, cacheKey?: string, context?: string): Promise<T>;
    /**
     * Execute a specific fallback strategy
     */
    private executeFallbackStrategy;
    /**
     * Get cached value if not expired
     */
    private getCached;
    /**
     * Set cached value
     */
    private setCached;
    /**
     * Clear all cached values
     */
    clearCache(): void;
    /**
     * Clear specific cached value
     */
    clearCacheKey(key: string): void;
}
/**
 * Create a fallback handler with common strategies
 */
declare function createFallbackHandler<T>(strategies: FallbackStrategy<T>[], config?: Partial<FallbackConfig<T>>): FallbackHandler<T>;
/**
 * Pre-configured fallback handlers for common scenarios
 */
declare const FallbackHandlers: {
    /**
     * Cached with default fallback
     */
    cachedWithDefault<T>(defaultValue: T, cacheTTL?: number): FallbackHandler<T>;
    /**
     * Alternative operation with empty fallback
     */
    alternativeWithEmpty<T>(alternativeOp: () => Promise<T>): FallbackHandler<T>;
    /**
     * Degraded service fallback
     */
    degradedService<T>(degradedOp: () => Promise<Partial<T>>): FallbackHandler<Partial<T>>;
    /**
     * Fail-safe with multiple alternatives
     */
    multipleAlternatives<T>(alternatives: Array<() => Promise<T>>, defaultValue?: T): FallbackHandler<T>;
};

/**
 * Resilient Operation Executor
 *
 * Combines Circuit Breaker, Exponential Backoff, and Fallback Handler
 * for comprehensive resilience in external service calls
 *
 * Phase 3 - Milestone C.7: Integration of resilience mechanisms
 */

interface ResilientOperationConfig<T> {
    serviceName: string;
    circuitBreaker?: boolean;
    retryConfig?: Partial<RetryConfig>;
    fallbackStrategies?: FallbackStrategy<T>[];
    cacheKey?: string;
    context?: string;
}
declare class ResilientOperationExecutor {
    /**
     * Execute operation with full resilience protection
     */
    static execute<T>(operation: () => Promise<T>, config: ResilientOperationConfig<T>): Promise<T>;
    /**
     * Quick execute with default resilience settings
     */
    static executeWithDefaults<T>(operation: () => Promise<T>, serviceName: string, context?: string): Promise<T>;
    /**
     * Execute database operation with resilience
     */
    static executeDatabase<T>(operation: () => Promise<T>, context?: string): Promise<T>;
    /**
     * Execute external API call with resilience
     */
    static executeExternalApi<T>(operation: () => Promise<T>, apiName: string, fallbackValue?: T): Promise<T>;
    /**
     * Execute SERP API call with resilience
     */
    static executeSerpApi<T>(operation: () => Promise<T>, cacheKey?: string): Promise<T>;
    /**
     * Execute payment operation with resilience
     */
    static executePayment<T>(operation: () => Promise<T>, context?: string): Promise<T>;
}
/**
 * Decorator for resilient methods
 */
declare function Resilient<T>(config: Omit<ResilientOperationConfig<T>, 'serviceName'>): (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>>) => TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>>;

/**
 * Currency utility functions.
 * Default currency is USD. Paddle handles multi-currency conversion at checkout.
 * (#V7 L-03) The currency parameter is accepted so callers can pass non-USD amounts
 * (e.g. IDR from the database) — Intl.NumberFormat handles formatting for any ISO 4217 code.
 */
/**
 * Formats currency amount
 */
declare function formatCurrency(amount: number, currency?: string): string;
/**
 * Gets currency symbol (always $)
 */
declare function getCurrencySymbol(): string;

/**
 * URL Utility Functions
 *
 * Helper functions for URL manipulation and sanitization
 */
/**
 * Remove query parameters from URL
 * Example: "https://example.com/page?param=value" -> "https://example.com/page"
 *
 * This is used to clean URLs before storing in database to ensure consistency
 * and prevent storing tracking parameters like ?srsltid=...
 */
declare function removeUrlParameters(url: string | null): string | null;
/**
 * Extract clean domain from URL
 * Example: "https://www.example.com/page" -> "example.com"
 */
declare function extractDomain(url: string): string;
/**
 * Normalize URL for comparison
 * - Removes protocol
 * - Removes www
 * - Removes trailing slash
 * - Converts to lowercase
 */
declare function normalizeUrl(url: string): string;
/**
 * Check if URL is valid
 */
declare function isValidUrl(url: string): boolean;
/**
 * Add protocol to URL if missing
 */
declare function ensureProtocol(url: string, protocol?: 'http' | 'https'): string;

/**
 * IP Address and Device Detection Utilities for Activity Logging
 * Comprehensive tracking for security and analytics purposes
 */

interface DeviceInfo {
    type: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
    version?: string;
}
interface LocationData {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    isp?: string;
}
/**
 * Extract real IP address from various headers considering proxies
 */
declare function getClientIP(request?: {
    headers: {
        get(name: string): string | null;
    };
}): string | null;
/**
 * Parse User-Agent string to extract device information
 */
declare function parseUserAgent(userAgent: string): DeviceInfo;
/**
 * Get comprehensive device and location info from request
 */
declare function getRequestInfo(request?: NextRequest): Promise<{
    ipAddress: string | null;
    userAgent: string | null;
    deviceInfo: DeviceInfo | null;
    locationData: LocationData | null;
}>;
/**
 * Format device info for display
 */
declare function formatDeviceInfo(deviceInfo?: DeviceInfo | null): string;
/**
 * Format location data for display
 */
declare function formatLocationData(locationData?: LocationData | null): string;
/**
 * Get security risk level based on device/location patterns
 */
declare function getSecurityRiskLevel(ipAddress: string | null, deviceInfo: DeviceInfo | null, locationData: LocationData | null, previousIPs?: string[], previousDevices?: DeviceInfo[]): 'low' | 'medium' | 'high';

interface RegistrationCountry {
    code: string;
    name: string;
    flag: string;
}
declare const countries: RegistrationCountry[];
declare function findCountryByCode(code: string): RegistrationCountry | undefined;
declare function findCountryByName(name: string): RegistrationCountry | undefined;
declare function getPopularCountries(): RegistrationCountry[];

interface RateLimitEntry {
    count: number;
    resetTime: number;
}
/**
 * Interface for a distributed rate-limit store (e.g. Redis).
 * Implement this and register via `setRateLimitStore()` to replace the
 * default in-memory Map with a distributed backend.
 *
 * ⚠ (#V7 H-07): The default in-memory store only works within a single process.
 * In multi-instance deployments (e.g. multiple containers behind a load balancer),
 * each instance maintains its own Map, so rate limits are per-instance, not global.
 * Register a Redis-backed store at startup for correct cross-instance enforcement.
 */
interface RateLimitStore {
    /** Get the current entry for a key, or null if not found / expired */
    get(key: string): Promise<RateLimitEntry | null>;
    /** Set or update the entry for a key */
    set(key: string, entry: RateLimitEntry): Promise<void>;
    /** Delete a key */
    delete(key: string): Promise<void>;
}
/**
 * Register a distributed rate-limit store (e.g. Redis-backed).
 * Call this at app startup to replace the default in-memory store.
 *
 * Example with Redis cacheService:
 * ```ts
 * import { cacheService } from '@/lib/cache/redis-cache';
 * import { setRateLimitStore } from '@indexnow/shared';
 *
 * setRateLimitStore({
 *   async get(key) {
 *     return cacheService.get(`ratelimit:${key}`);
 *   },
 *   async set(key, entry) {
 *     const ttlSeconds = Math.ceil((entry.resetTime - Date.now()) / 1000);
 *     await cacheService.set(`ratelimit:${key}`, entry, Math.max(ttlSeconds, 1));
 *   },
 *   async delete(key) {
 *     await cacheService.del(`ratelimit:${key}`);
 *   },
 * });
 * ```
 */
declare function setRateLimitStore(store: RateLimitStore): void;
type HeaderValue = string | string[] | undefined | null;
interface HeadersObject {
    [key: string]: HeaderValue;
}
type HeadersLike = Headers | HeadersObject | {
    get(name: string): string | null | undefined;
};
interface RequestLike {
    headers: HeadersLike;
    nextUrl?: {
        pathname: string;
    } | null;
}
/**
 * Check if IP is currently rate limited
 */
declare function isRateLimited(request: RequestLike): Promise<boolean>;
/**
 * Record a failed authentication attempt
 */
declare function recordFailedAttempt(request: RequestLike): Promise<boolean>;
/**
 * Reset rate limit for an IP
 */
declare function resetRateLimit(request: RequestLike): Promise<void>;

/**
 * SQL/PostgREST utility functions for safe query construction
 */
/**
 * Escapes SQL LIKE/ILIKE wildcard characters from user input.
 * Prevents injection of `%`, `_`, and `\` into PostgREST filter strings.
 *
 * @param pattern - Raw user input to be used in ilike/like filters
 * @returns Escaped string safe for use in PostgREST .ilike() / .or() filters
 */
declare function escapeLikePattern(pattern: string): string;

/**
 * Shared async utilities — consolidated from duplicate implementations.
 */
/**
 * Pause execution for a specified duration.
 * Use this instead of creating per-class `private sleep()` methods.
 * (#V7 L-11) Clamps to 0 for negative values.
 */
declare function sleep(ms: number): Promise<void>;

/**
 * Standardized API Response Utilities
 * Provides consistent formatting for all API responses
 */

/**
 * Standardized API Error Details
 */
interface ErrorDetails {
    message?: string;
    stack?: string;
    metadata?: Record<string, Json$1>;
    validationErrors?: Array<{
        path: string;
        message: string;
    }>;
    [key: string]: Json$1 | undefined;
}
/**
 * Standardized API Success Response
 */
interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    timestamp: string;
    requestId?: string;
    statusCode?: number;
}
/**
 * Standardized API Error Response
 */
interface ApiErrorResponse {
    success: false;
    error: {
        id: string;
        type: ErrorType;
        message: string;
        userMessage?: string;
        severity: ErrorSeverity;
        timestamp: string;
        statusCode: number;
        details?: Omit<ErrorDetails, 'stack' | 'message'>;
    };
    requestId?: string;
}
/**
 * Union type for all API responses
 */
type ApiResponse<T = Json$1> = ApiSuccessResponse<T> | ApiErrorResponse;
/**
 * Format a successful API response
 */
declare function formatSuccess<T>(data: T, requestId?: string, statusCode?: number): ApiSuccessResponse<T>;
/**
 * Format an error API response
 * Sanitize the error to prevent internal data leakage in production
 */
declare function formatError(error: {
    id: string;
    type: ErrorType;
    message: string;
    userMessage?: string;
    severity: ErrorSeverity;
    timestamp: Date;
    statusCode: number;
    details?: ErrorDetails;
}, requestId?: string): ApiErrorResponse;

/**
 * Activity Event Types and Logging Data Types
 * Shared constants for client-side and server-side activity logging.
 * Client-side logging uses `useActivityLogger` hook from `@indexnow/ui`.
 * Server-side logging uses `ServerActivityLogger` from the API app.
 */

interface ActivityLogData {
    userId: string;
    eventType: string;
    actionDescription: string;
    targetType?: string;
    targetId?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: Record<string, Json$1>;
    locationData?: Record<string, Json$1>;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, Json$1>;
}
declare const ActivityEventTypes: {
    readonly LOGIN: "login";
    readonly LOGOUT: "logout";
    readonly REGISTER: "register";
    readonly PASSWORD_RESET: "password_reset";
    readonly PASSWORD_CHANGE: "password_change";
    readonly PROFILE_UPDATE: "profile_update";
    readonly SETTINGS_CHANGE: "settings_change";
    readonly SETTINGS_VIEW: "settings_view";
    readonly NOTIFICATION_SETTINGS_UPDATE: "notification_settings_update";
    readonly JOB_CREATE: "job_create";
    readonly JOB_UPDATE: "job_update";
    readonly JOB_DELETE: "job_delete";
    readonly JOB_START: "job_start";
    readonly JOB_PAUSE: "job_pause";
    readonly JOB_RESUME: "job_resume";
    readonly JOB_CANCEL: "job_cancel";
    readonly JOB_VIEW: "job_view";
    readonly CHECKOUT_INITIATED: "checkout_initiated";
    readonly ORDER_CREATED: "order_created";
    readonly PAYMENT_PROOF_UPLOADED: "payment_proof_uploaded";
    readonly SUBSCRIPTION_UPGRADE: "subscription_upgrade";
    readonly BILLING_VIEW: "billing_view";
    readonly BILLING_HISTORY_VIEW: "billing_history_view";
    readonly ORDER_VIEW: "order_view";
    readonly PACKAGE_SELECTION: "package_selection";
    readonly DASHBOARD_VIEW: "dashboard_view";
    readonly DASHBOARD_STATS_VIEW: "dashboard_stats_view";
    readonly QUOTA_VIEW: "quota_view";
    readonly INDEXNOW_PAGE_VIEW: "indexnow_page_view";
    readonly MANAGE_JOBS_VIEW: "manage_jobs_view";
    readonly API_CALL: "api_call";
    readonly GOOGLE_API_CALL: "google_api_call";
    readonly ADMIN_LOGIN: "admin_login";
    readonly ADMIN_DASHBOARD_VIEW: "admin_dashboard_view";
    readonly ADMIN_STATS_VIEW: "admin_stats_view";
    readonly USER_MANAGEMENT: "user_management";
    readonly USER_SUSPEND: "user_suspend";
    readonly USER_UNSUSPEND: "user_unsuspend";
    readonly USER_PASSWORD_RESET: "user_password_reset";
    readonly USER_PROFILE_UPDATE: "user_profile_update";
    readonly USER_ROLE_CHANGE: "user_role_change";
    readonly USER_QUOTA_RESET: "user_quota_reset";
    readonly USER_PACKAGE_CHANGE: "user_package_change";
    readonly USER_SUBSCRIPTION_EXTEND: "user_subscription_extend";
    readonly ADMIN_SETTINGS: "admin_settings";
    readonly SITE_SETTINGS_UPDATE: "site_settings_update";
    readonly SITE_SETTINGS_VIEW: "site_settings_view";
    readonly PAYMENT_GATEWAY_CREATE: "payment_gateway_create";
    readonly PAYMENT_GATEWAY_UPDATE: "payment_gateway_update";
    readonly PAYMENT_GATEWAY_DELETE: "payment_gateway_delete";
    readonly PAYMENT_GATEWAY_VIEW: "payment_gateway_view";
    readonly PACKAGE_CREATE: "package_create";
    readonly PACKAGE_UPDATE: "package_update";
    readonly PACKAGE_DELETE: "package_delete";
    readonly PACKAGE_VIEW: "package_view";
    readonly ORDER_MANAGEMENT: "order_management";
    readonly ORDER_STATUS_UPDATE: "order_status_update";
    readonly ADMIN_ORDER_VIEW: "admin_order_view";
    readonly ORDER_APPROVE: "order_approve";
    readonly ORDER_REJECT: "order_reject";
    readonly PAGE_VIEW: "page_view";
    readonly ADMIN_PANEL_ACCESS: "admin_panel_access";
    readonly USER_SECURITY_VIEW: "user_security_view";
    readonly USER_ACTIVITY_VIEW: "user_activity_view";
    readonly KEYWORD_ADD: "keyword_add";
    readonly KEYWORD_DELETE: "keyword_delete";
    readonly KEYWORD_UPDATE: "keyword_update";
    readonly KEYWORD_BULK_DELETE: "keyword_bulk_delete";
    readonly KEYWORD_TAG_ADD: "keyword_tag_add";
    readonly KEYWORD_TAG_REMOVE: "keyword_tag_remove";
    readonly DOMAIN_ADD: "domain_add";
    readonly DOMAIN_DELETE: "domain_delete";
    readonly DOMAIN_UPDATE: "domain_update";
    readonly KEYWORD_TRACKER_VIEW: "keyword_tracker_view";
    readonly RANK_HISTORY_VIEW: "rank_history_view";
    readonly ERROR_OCCURRED: "error_occurred";
    readonly SECURITY_VIOLATION: "security_violation";
    readonly QUOTA_EXCEEDED: "quota_exceeded";
};

/**
 * Combined Config Schema
 */
declare const ConfigSchema: z.ZodObject<{
    app: z.ZodObject<{
        name: z.ZodDefault<z.ZodString>;
        version: z.ZodDefault<z.ZodString>;
        environment: z.ZodDefault<z.ZodEnum<["development", "staging", "production"]>>;
        baseUrl: z.ZodDefault<z.ZodString>;
        dashboardUrl: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        backendUrl: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        apiBaseUrl: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        port: z.ZodDefault<z.ZodNumber>;
        allowedOrigins: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        version: string;
        environment: "development" | "staging" | "production";
        baseUrl: string;
        port: number;
        allowedOrigins: string[];
        dashboardUrl?: string | undefined;
        backendUrl?: string | undefined;
        apiBaseUrl?: string | undefined;
    }, {
        name?: string | undefined;
        version?: string | undefined;
        environment?: "development" | "staging" | "production" | undefined;
        baseUrl?: string | undefined;
        dashboardUrl?: unknown;
        backendUrl?: unknown;
        apiBaseUrl?: unknown;
        port?: number | undefined;
        allowedOrigins?: string[] | undefined;
    }>;
    supabase: z.ZodObject<{
        url: z.ZodString;
        anonKey: z.ZodString;
        serviceRoleKey: z.ZodOptional<z.ZodString>;
        jwtSecret: z.ZodOptional<z.ZodString>;
        bucketName: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        anonKey: string;
        bucketName: string;
        serviceRoleKey?: string | undefined;
        jwtSecret?: string | undefined;
    }, {
        url: string;
        anonKey: string;
        serviceRoleKey?: string | undefined;
        jwtSecret?: string | undefined;
        bucketName?: string | undefined;
    }>;
    security: z.ZodObject<{
        encryptionKey: z.ZodOptional<z.ZodString>;
        encryptionMasterKey: z.ZodOptional<z.ZodString>;
        jwtSecret: z.ZodOptional<z.ZodString>;
        systemApiKey: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        jwtSecret?: string | undefined;
        encryptionKey?: string | undefined;
        encryptionMasterKey?: string | undefined;
        systemApiKey?: string | undefined;
    }, {
        jwtSecret?: string | undefined;
        encryptionKey?: string | undefined;
        encryptionMasterKey?: string | undefined;
        systemApiKey?: string | undefined;
    }>;
    redis: z.ZodObject<{
        host: z.ZodOptional<z.ZodString>;
        port: z.ZodOptional<z.ZodNumber>;
        user: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        password?: string | undefined;
        url?: string | undefined;
        user?: string | undefined;
        port?: number | undefined;
        host?: string | undefined;
    }, {
        password?: string | undefined;
        url?: string | undefined;
        user?: string | undefined;
        port?: number | undefined;
        host?: string | undefined;
    }>;
    bullmq: z.ZodObject<{
        concurrency: z.ZodObject<{
            rankCheck: z.ZodDefault<z.ZodNumber>;
            email: z.ZodDefault<z.ZodNumber>;
            payments: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            email: number;
            rankCheck: number;
            payments: number;
        }, {
            email?: number | undefined;
            rankCheck?: number | undefined;
            payments?: number | undefined;
        }>;
        rateLimit: z.ZodObject<{
            rankCheck: z.ZodObject<{
                max: z.ZodDefault<z.ZodNumber>;
                duration: z.ZodDefault<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                max: number;
                duration: number;
            }, {
                max?: number | undefined;
                duration?: number | undefined;
            }>;
            email: z.ZodObject<{
                max: z.ZodDefault<z.ZodNumber>;
                duration: z.ZodDefault<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                max: number;
                duration: number;
            }, {
                max?: number | undefined;
                duration?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            email: {
                max: number;
                duration: number;
            };
            rankCheck: {
                max: number;
                duration: number;
            };
        }, {
            email: {
                max?: number | undefined;
                duration?: number | undefined;
            };
            rankCheck: {
                max?: number | undefined;
                duration?: number | undefined;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        concurrency: {
            email: number;
            rankCheck: number;
            payments: number;
        };
        rateLimit: {
            email: {
                max: number;
                duration: number;
            };
            rankCheck: {
                max: number;
                duration: number;
            };
        };
    }, {
        concurrency: {
            email?: number | undefined;
            rankCheck?: number | undefined;
            payments?: number | undefined;
        };
        rateLimit: {
            email: {
                max?: number | undefined;
                duration?: number | undefined;
            };
            rankCheck: {
                max?: number | undefined;
                duration?: number | undefined;
            };
        };
    }>;
    paddle: z.ZodObject<{
        apiKey: z.ZodOptional<z.ZodString>;
        webhookSecret: z.ZodOptional<z.ZodString>;
        clientToken: z.ZodOptional<z.ZodString>;
        environment: z.ZodDefault<z.ZodEnum<["sandbox", "production"]>>;
    }, "strip", z.ZodTypeAny, {
        environment: "production" | "sandbox";
        apiKey?: string | undefined;
        webhookSecret?: string | undefined;
        clientToken?: string | undefined;
    }, {
        environment?: "production" | "sandbox" | undefined;
        apiKey?: string | undefined;
        webhookSecret?: string | undefined;
        clientToken?: string | undefined;
    }>;
    monitoring: z.ZodObject<{
        sentry: z.ZodObject<{
            dsn: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            environment: z.ZodDefault<z.ZodString>;
            traceSampleRate: z.ZodDefault<z.ZodNumber>;
            replaysSessionRate: z.ZodDefault<z.ZodNumber>;
            replaysErrorRate: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            environment: string;
            traceSampleRate: number;
            replaysSessionRate: number;
            replaysErrorRate: number;
            dsn?: string | undefined;
        }, {
            environment?: string | undefined;
            dsn?: unknown;
            traceSampleRate?: number | undefined;
            replaysSessionRate?: number | undefined;
            replaysErrorRate?: number | undefined;
        }>;
        posthog: z.ZodObject<{
            key: z.ZodOptional<z.ZodString>;
            host: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            host: string;
            key?: string | undefined;
        }, {
            host?: string | undefined;
            key?: string | undefined;
        }>;
        ga4: z.ZodObject<{
            measurementId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            measurementId?: string | undefined;
        }, {
            measurementId?: string | undefined;
        }>;
        logLevel: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    }, "strip", z.ZodTypeAny, {
        sentry: {
            environment: string;
            traceSampleRate: number;
            replaysSessionRate: number;
            replaysErrorRate: number;
            dsn?: string | undefined;
        };
        posthog: {
            host: string;
            key?: string | undefined;
        };
        ga4: {
            measurementId?: string | undefined;
        };
        logLevel: "debug" | "info" | "warn" | "error";
    }, {
        sentry: {
            environment?: string | undefined;
            dsn?: unknown;
            traceSampleRate?: number | undefined;
            replaysSessionRate?: number | undefined;
            replaysErrorRate?: number | undefined;
        };
        posthog: {
            host?: string | undefined;
            key?: string | undefined;
        };
        ga4: {
            measurementId?: string | undefined;
        };
        logLevel?: "debug" | "info" | "warn" | "error" | undefined;
    }>;
    email: z.ZodObject<{
        smtp: z.ZodObject<{
            host: z.ZodOptional<z.ZodString>;
            port: z.ZodOptional<z.ZodNumber>;
            user: z.ZodOptional<z.ZodString>;
            pass: z.ZodOptional<z.ZodString>;
            fromName: z.ZodDefault<z.ZodString>;
            fromEmail: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            fromName: string;
            user?: string | undefined;
            port?: number | undefined;
            host?: string | undefined;
            pass?: string | undefined;
            fromEmail?: string | undefined;
        }, {
            user?: string | undefined;
            port?: number | undefined;
            host?: string | undefined;
            pass?: string | undefined;
            fromName?: string | undefined;
            fromEmail?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        smtp: {
            fromName: string;
            user?: string | undefined;
            port?: number | undefined;
            host?: string | undefined;
            pass?: string | undefined;
            fromEmail?: string | undefined;
        };
    }, {
        smtp: {
            user?: string | undefined;
            port?: number | undefined;
            host?: string | undefined;
            pass?: string | undefined;
            fromName?: string | undefined;
            fromEmail?: string | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    email: {
        smtp: {
            fromName: string;
            user?: string | undefined;
            port?: number | undefined;
            host?: string | undefined;
            pass?: string | undefined;
            fromEmail?: string | undefined;
        };
    };
    paddle: {
        environment: "production" | "sandbox";
        apiKey?: string | undefined;
        webhookSecret?: string | undefined;
        clientToken?: string | undefined;
    };
    app: {
        name: string;
        version: string;
        environment: "development" | "staging" | "production";
        baseUrl: string;
        port: number;
        allowedOrigins: string[];
        dashboardUrl?: string | undefined;
        backendUrl?: string | undefined;
        apiBaseUrl?: string | undefined;
    };
    supabase: {
        url: string;
        anonKey: string;
        bucketName: string;
        serviceRoleKey?: string | undefined;
        jwtSecret?: string | undefined;
    };
    security: {
        jwtSecret?: string | undefined;
        encryptionKey?: string | undefined;
        encryptionMasterKey?: string | undefined;
        systemApiKey?: string | undefined;
    };
    redis: {
        password?: string | undefined;
        url?: string | undefined;
        user?: string | undefined;
        port?: number | undefined;
        host?: string | undefined;
    };
    bullmq: {
        concurrency: {
            email: number;
            rankCheck: number;
            payments: number;
        };
        rateLimit: {
            email: {
                max: number;
                duration: number;
            };
            rankCheck: {
                max: number;
                duration: number;
            };
        };
    };
    monitoring: {
        sentry: {
            environment: string;
            traceSampleRate: number;
            replaysSessionRate: number;
            replaysErrorRate: number;
            dsn?: string | undefined;
        };
        posthog: {
            host: string;
            key?: string | undefined;
        };
        ga4: {
            measurementId?: string | undefined;
        };
        logLevel: "debug" | "info" | "warn" | "error";
    };
}, {
    email: {
        smtp: {
            user?: string | undefined;
            port?: number | undefined;
            host?: string | undefined;
            pass?: string | undefined;
            fromName?: string | undefined;
            fromEmail?: string | undefined;
        };
    };
    paddle: {
        environment?: "production" | "sandbox" | undefined;
        apiKey?: string | undefined;
        webhookSecret?: string | undefined;
        clientToken?: string | undefined;
    };
    app: {
        name?: string | undefined;
        version?: string | undefined;
        environment?: "development" | "staging" | "production" | undefined;
        baseUrl?: string | undefined;
        dashboardUrl?: unknown;
        backendUrl?: unknown;
        apiBaseUrl?: unknown;
        port?: number | undefined;
        allowedOrigins?: string[] | undefined;
    };
    supabase: {
        url: string;
        anonKey: string;
        serviceRoleKey?: string | undefined;
        jwtSecret?: string | undefined;
        bucketName?: string | undefined;
    };
    security: {
        jwtSecret?: string | undefined;
        encryptionKey?: string | undefined;
        encryptionMasterKey?: string | undefined;
        systemApiKey?: string | undefined;
    };
    redis: {
        password?: string | undefined;
        url?: string | undefined;
        user?: string | undefined;
        port?: number | undefined;
        host?: string | undefined;
    };
    bullmq: {
        concurrency: {
            email?: number | undefined;
            rankCheck?: number | undefined;
            payments?: number | undefined;
        };
        rateLimit: {
            email: {
                max?: number | undefined;
                duration?: number | undefined;
            };
            rankCheck: {
                max?: number | undefined;
                duration?: number | undefined;
            };
        };
    };
    monitoring: {
        sentry: {
            environment?: string | undefined;
            dsn?: unknown;
            traceSampleRate?: number | undefined;
            replaysSessionRate?: number | undefined;
            replaysErrorRate?: number | undefined;
        };
        posthog: {
            host?: string | undefined;
            key?: string | undefined;
        };
        ga4: {
            measurementId?: string | undefined;
        };
        logLevel?: "debug" | "info" | "warn" | "error" | undefined;
    };
}>;
type AppConfigType = z.infer<typeof ConfigSchema>;
/**
 * Creates an AppConfig instance based on environment variables.
 * NOTE (#6): This throws on invalid config — intentional fail-fast design.
 * The application should not boot with missing critical secrets.
 * If lazy/graceful init is needed, wrap the import in a try-catch.
 */
declare const createAppConfig: () => AppConfigType;
declare const AppConfig: {
    email: {
        smtp: {
            fromName: string;
            user?: string | undefined;
            port?: number | undefined;
            host?: string | undefined;
            pass?: string | undefined;
            fromEmail?: string | undefined;
        };
    };
    paddle: {
        environment: "production" | "sandbox";
        apiKey?: string | undefined;
        webhookSecret?: string | undefined;
        clientToken?: string | undefined;
    };
    app: {
        name: string;
        version: string;
        environment: "development" | "staging" | "production";
        baseUrl: string;
        port: number;
        allowedOrigins: string[];
        dashboardUrl?: string | undefined;
        backendUrl?: string | undefined;
        apiBaseUrl?: string | undefined;
    };
    supabase: {
        url: string;
        anonKey: string;
        bucketName: string;
        serviceRoleKey?: string | undefined;
        jwtSecret?: string | undefined;
    };
    security: {
        jwtSecret?: string | undefined;
        encryptionKey?: string | undefined;
        encryptionMasterKey?: string | undefined;
        systemApiKey?: string | undefined;
    };
    redis: {
        password?: string | undefined;
        url?: string | undefined;
        user?: string | undefined;
        port?: number | undefined;
        host?: string | undefined;
    };
    bullmq: {
        concurrency: {
            email: number;
            rankCheck: number;
            payments: number;
        };
        rateLimit: {
            email: {
                max: number;
                duration: number;
            };
            rankCheck: {
                max: number;
                duration: number;
            };
        };
    };
    monitoring: {
        sentry: {
            environment: string;
            traceSampleRate: number;
            replaysSessionRate: number;
            replaysErrorRate: number;
            dsn?: string | undefined;
        };
        posthog: {
            host: string;
            key?: string | undefined;
        };
        ga4: {
            measurementId?: string | undefined;
        };
        logLevel: "debug" | "info" | "warn" | "error";
    };
};
declare const isProduction: () => boolean;
declare const isDevelopment: () => boolean;
declare const isStaging: () => boolean;
declare const isMaintenanceMode: () => boolean;

export { ACTIVITY_ENDPOINTS, ADMIN_ENDPOINTS, API_BASE, APP_METADATA, AUTH_ENDPOINTS, type AcceptInvitationRequest, type AcceptInvitationResponse, type ActivityDetail, ActivityEventTypes, type ActivityLogData, type AddPaymentMethodRequest, type AddPaymentMethodResponse, type Address, type AdminActionType, type AdminOrderActivityLog, type AdminOrderDetailResponse, type AdminOrderSummary, type AdminOrderTransaction, type AdminOrdersResponse, AdminSchemas, type AdminTargetType, type AdminTransactionHistory, type AdminUserProfile, type AdvancedNeonCardProps, type AlertDialogProps, type AlertProps, type AlertThresholds, type AnalyticsEvent, ApiEndpoints, type ApiError, type ApiErrorResponse, type ApiKey, type ApiMetadata, type ApiResponse, type ApiStatus, type ApiSuccessResponse, AppConfig, type AppConfigType, AppError, type AppUserProfile, type AppUserSettings, type ApplicationConfig, type ApplicationLimits, type ApplicationMetrics, type ApplyPromoCodeResponse, type AudioInfo, type AuditEvent, type AuditableEntity, type AuthState, type AuthTokens, type AutoCancelJob, AutoCancelJobSchema, type AvailableLocation, BILLING_ENDPOINTS, BackoffStrategies, type BackupJob, type BaseComponentProps, type BaseEntity, type BaseResponse, BaseSchemas, type BillingCurrentSubscription, type BillingHistoryPaginationInfo, type BillingHistoryResponse, type BillingHistorySummary, type BillingHistoryTransaction, type BillingOverviewResponse, type BillingPeriod, type BillingRecentTransaction, type BillingStats, type BreadcrumbItem, type BulkKeywordRequest, type ButtonProps, CACHE_KEYS, CACHE_TTL, type CPUMetrics, type CacheEntry, type CacheStats, type CancelSubscriptionRequest, type CancelSubscriptionResponse, type ChangePasswordRequestBody, type ChangePasswordResponse, type ChartProps, type CheckboxProps, CircuitBreaker, type CircuitBreakerConfig, CircuitBreakerManager, type CircuitBreakerMetrics, CircuitState, type ClientOnlyWrapperProps, type ColorPickerProps, type Comment, type CommentableEntity, type Competitor, type CompetitorAnalysis, type ComplianceReporting, type ComponentNavigationItem, type ComponentValidationError, type Config, ConfigSchema, type Confirm2FARequest, type Confirm2FAResponse, type ConfirmPasswordResetRequest, type Coordinates, type Country, type CountryCode, type CreateApiKeyRequest, type CreateApiKeyRequestBody, type CreateApiKeyResponse, type CreateInvoiceData, type CreateInvoiceRequest, type CreateInvoiceResponse, type CreateKeywordRequest, type CreatePaymentRequest, type CreatePaymentRequestBody, type CreatePaymentResponse, type CreatePromoCodeRequest, type CreateRefundRequest, type CreateRefundRequestBody, type CreateRefundResponse, type CreateSubscriptionData, type CreateSubscriptionRequest, type CreateSubscriptionRequestBody, type CreateSubscriptionResponse, type CreateWebhookRequest, type CreateWebhookResponse, type Currency, CustomValidators, type CustomerInfo, type CustomerInfoRequestBody, DASHBOARD_ENDPOINTS, DEFAULT_SETTINGS, type DashboardAggregateResponse, type DashboardDomainInfo, type DashboardPackageInfo, type DashboardPackagePricingTier, type DashboardPreviewProps, type DashboardProfileInfo, type DashboardQuota, type DashboardRecentKeyword, type DashboardRecentKeywordInfo, type DashboardState, type DashboardTrialInfo, type Database, type DatabaseConfig, type DatabaseMetrics, type DatePickerProps, type DateRange, type DashboardNotification as DbDashboardNotification, type Json as DbJson, type KeywordCountry as DbKeywordCountry, type KeywordDomain as DbKeywordDomain, type KeywordKeyword as DbKeywordKeyword, type KeywordRanking as DbKeywordRanking, type PackageRow as DbPackageRow, type ProfileRow as DbProfileRow, type RankKeywordRow as DbRankKeywordRow, type SeRankingIntegration as DbSeRankingIntegration, type SeRankingUsageLog as DbSeRankingUsageLog, type SecurityActivityLog as DbSecurityActivityLog, type SecurityAuditLog as DbSecurityAuditLog, type SiteIntegration as DbSiteIntegration, type SubscriptionRow as DbSubscriptionRow, type SystemErrorLog as DbSystemErrorLog, type TransactionRow as DbTransactionRow, type UserProfile as DbUserProfile, type UserSettings as DbUserSettings, type UserSettingsRow as DbUserSettingsRow, type DeepPartial, type DeleteAccountRequest, type DeleteAccountResponse, type Device, type DeviceInfo, type Disable2FARequest, type Disable2FAResponse, type DiskMetrics, type Domain, type DomainAnalytics, type DrawerProps, EMAIL_TEMPLATES, ERROR_ENDPOINTS, EXTERNAL_ENDPOINTS, type EmailConfig, type EmailJob, EmailJobSchema, type EmailVerification, type Enable2FARequest, type Enable2FAResponse, type EncryptionConfig, type EnrichedActivityLog, type EnrichedSystemErrorLog, type EnrichmentJobConfig, type Environment, type ErrorContext, type ErrorDetailResponse, ErrorHandlingService, type ErrorResponse, ErrorSeverity, type ErrorStats, ErrorType, ExponentialBackoff, type ExportUserDataRequest, type ExportUserDataResponse, type ExternalService, FIELD_LIMITS, FILE_UPLOAD, type FallbackConfig, FallbackHandler, FallbackHandlers, type FallbackStrategy, type FeatureFlags, type FileAttachment, type FileDownload, type FileInfo, type FileUpload, type FileUploadProps, FileValidation, type FilterOperator, type FilterParam, type FormActions, type FormField, type FormProps, type FormState, type FraudDetection, type FraudFactor, type FraudRule, type FraudScore, type GenerateReportRequest, type GeoLocation, type GetActivityDetailResponse, type GetActivityLogsResponse, type GetApiKeysResponse, type GetBillingHistoryResponse, type GetBillingStatisticsResponse, type GetDataExportsResponse, type GetInvitationsResponse, type GetInvoiceDetailsResponse, type GetInvoicesResponse, type GetPackageDetailsResponse, type GetPackagesResponse, type GetPaymentAnalyticsResponse, type GetPaymentMethodsResponse, type GetPromoCodesResponse, type GetRefundsResponse, type GetSubscriptionResponse, type GetTrialStatusResponse, type GetUserActivityResponse, type GetUserAnalyticsResponse, type GetUserDetailsResponse, type GetUserProfileResponse, type GetUserQuotaHistoryResponse, type GetUserQuotaResponse, type GetUserSessionsResponse, type GetUserSettingsResponse, type GetUserSubscriptionResponse, type GetUsersResponse, type GetWebhooksResponse, HTTP_STATUS, type HeaderProps, type HeaderValue, type HeadersLike, type HeadersObject, type HealthCheck, type HealthStatus, type ID, INTEGRATION_ENDPOINTS, type IconButtonProps, type ImageInfo, type ImmediateRankCheckJob, ImmediateRankCheckJobSchema, type Incident, type IncidentUpdate, type InputProps, type InsertDashboardNotification, type InsertKeywordCountry, type InsertKeywordDomain, type InsertKeywordKeyword, type InsertKeywordRanking, type InsertPackage, type InsertPaymentGateway, type InsertSeRankingIntegration, type InsertSeRankingUsageLog, type InsertSecurityActivityLog, type InsertSecurityAuditLog, type InsertSiteIntegration, type InsertSubscription, type InsertTransaction, type InsertUserProfile, type InsertUserSettings, type InviteUserRequest, type InviteUserResponse, type Invoice, type InvoiceDiscount, type InvoiceFilters, type InvoiceItem, type InvoiceManager, type InvoiceTax, JOB_STATUS, JOB_TYPES, type JobQueue, type JobResult, Json$1 as Json, type KeysOfType, type KeywordAnalytics, type KeywordEnrichmentJob, KeywordEnrichmentJobSchema, type KeywordIntentType, LEGACY_ENDPOINTS, type LayoutProps, type LoadingActions, type LoadingProps, type LoadingState, type Location, type LocationData, type LogLevel, type LoggerTransport, type LoginAttempt, type LoginRequestBody, type LoginResponse, type LogoutRequest, type LogoutResponse, type MaintenanceWindow, type Maybe, type MemoryMetrics, type Metric, type MetricGroup, type ModalActions, type ModalProps, type ModalState, type MonitoringConfig, NOTIFICATION_ENDPOINTS, NOTIFICATION_TYPES, NUMERIC_LIMITS, type NavItem, type NavigationItem, type NetworkMetrics, type Notification$1 as Notification, type NotificationActions, type NotificationDashboardType, type NotificationSettings, type NotificationState, type NotificationType, type Nullable, type OnboardingState, type OnboardingStep, type Optional, type OptionalFields, type Order, type OrderDetailsResponse, type OrderPackageInfo, PAGINATION, PAYMENT_ENDPOINTS, PUBLIC_ENDPOINTS, type Package, type PackageFeatures, type PackagePricingTier, type PackagePricingTiers, type PackageQuotaLimits, type PaginatedResult, type PaginationMeta, type PaginationParams, type PaginationProps, type PaymentAnalytics, type PaymentApiResponse, type PaymentData, type PaymentError, type PaymentErrorResponse, type PaymentGateway, type PaymentGatewayConfiguration, type PaymentGatewayCredentials, type PaymentGatewayRow, type PaymentMethod, type PaymentMethodDetails, type PaymentPaginatedResponse, type PaymentResponse, type PaymentResult, PaymentSchemas, type PaymentState, type PaymentStatus, type PaymentStatusResponse, type PaymentTimeline, type PaymentWebhookJob, PaymentWebhookJobSchema, type PerformanceMetrics, type Period, type PhoneVerification, type Prettify, type PricingTier, type PricingTierDetails, type PricingTiers, type Priority, type PrivacySettings, type ProcessPaymentRequest, type ProcessPaymentResponse, type ProcessRefundRequest, type ProcessRefundResponse, type ProgressProps, type PromoCode, type PublicSettingsPackage, type PublicSettingsResponse, type QuotaResetInterval, type QuotaUsageEntry, RANK_TRACKING, RANK_TRACKING_ENDPOINTS, RATE_LIMITS, REGEX_PATTERNS, ROLE_PERMISSIONS, type RadioGroupProps, type RadioOption, type RankCheckError, type RankCheckRequest, type RankCheckResult, type RankHistory, type RankKeyword, type RankReport, type RankSearchResult, type RankTrackingDomain, type RankTrackingLimits, type RankTrackingQuota, RankTrackingSchemas, type SearchResult as RankTrackingSearchResult, type RankTrackingSettings, type RankTrackingState, type RateLimitConfig, type RateLimitStore, type ReactivateAccountRequest, type ReactivateAccountResponse, type RedisConfig, type RefreshTokenRequest, type RefreshTokenResponse, type Refund, type RefundReport, type RegisterRequestBody, type RegisterResponse, type RegistrationCountry, type RemovePaymentMethodRequest, type RemovePaymentMethodResponse, type RequestLike, type RequiredFields, type ResetPasswordEmailRequest, Resilient, type ResilientOperationConfig, ResilientOperationExecutor, type RetryConfig, type RetryMetrics, type RevenueReport, type RevokeApiKeyRequest, type RevokeApiKeyResponse, SCHEDULE_TYPES, SYSTEM_ENDPOINTS, type SeRankingOperationType, type SearchActions, type SearchEngine, type SearchEngineType, type SearchFeature, type SearchParams, type SearchResult$1 as SearchResult, type SearchState, type SecurityActivityEventType, type SecurityAuditEventType, type SecurityConfig, type SecuritySettings, type SelectOption, type SelectProps, type SendInvoiceOptions, type SendInvoiceRequest, type SendInvoiceResponse, type SendVerificationEmailRequest, type SendVerificationEmailResponse, type SerchResult, ServiceCircuitBreakers, type ServiceHealth, type Session, type SessionInfo, type Setting, type SettingsGroup, type SidebarActions, type SidebarItem, type SidebarProps, type SidebarState, type SiteIntegrationAlertSettings, type SiteIntegrationRateLimits, type SiteSettingsRow, type SoftDeletableEntity, type SortOptions, type SortParam, type StartTrialResponse, type StatsCardProps, type Status, type StepItem, type StepsProps, type StorageConfig, type StructuredError, type Subscription, type SubscriptionManager, type SubscriptionStatus, type SuccessResponse, type SuspendAccountRequest, type SuspendAccountResponse, type SystemConfig, type SystemErrorStats, type SystemHealth, type SystemJob, type SystemLog, type SystemMetrics, type SystemStatus, TIME, type TabProps, type TableActions, type TableColumn, type TableProps, type TableState, type TabsProps, type Tag, type TaggedEntity, type Task, type TaskResult, type TaxReport, type Team, type TeamInvitation, type TeamMember, type TeamSettings, type TerminateSessionResponse, type TestWebhookResponse, type TextareaProps, type ThemeActions, type ThemeConfig, type ThemeMode, type ThemeState, type TimeRange, type Timestamp, type ToastProps, type Transaction, type TransactionFilters, type TransactionGatewayResponse, type TransactionMetadata, type TrialEligibility, type TwoFactorAuth, type UISize, type UIVariant, USER_ERROR_MESSAGES, USER_ROLES, type UUID, type UpdateApiKeyRequest, type UpdateApiKeyResponse, type UpdateBillingAddressRequest, type UpdateDashboardNotification, type UpdateInvoiceRequest, type UpdateKeywordDomain, type UpdateKeywordKeyword, type UpdateKeywordRanking, type UpdateKeywordRequest, type UpdatePackage, type UpdatePaymentGateway, type UpdatePaymentMethodRequest, type UpdatePaymentMethodResponse, type UpdatePromoCodeRequest, type UpdateSeRankingIntegration, type UpdateSeRankingUsageLog, type UpdateSiteIntegration, type UpdateSubscription, type UpdateSubscriptionRequest, type UpdateSubscriptionResponse, type UpdateTransaction, type UpdateUserProfile, type UpdateUserProfileResponse, type UpdateUserRoleRequest, type UpdateUserRoleResponse, type UpdateUserSettings, type UpdateUserSettingsRequestBody, type UpdateUserSettingsResponse, type UpdateWebhookRequest, type UploadActions, type UploadState, type UploadedFile, type User, type UserActivity, type UserActivityLog, type UserApiResponse, type UserContext, type UserErrorResponse, type UserFeedback, type UserInvitation, type UserManagementAction, type UserMenuProps, type UserPaginatedResponse, type UserPreferences, type UserQuota, type UserQuotaLimits, type UserQuotaUsage, type UserResponse, type UserRole, UserSchemas, type UserSession, type UserStats, type UserStatus, type UserSubscription, VALIDATION_PATTERNS, type ValidatePromoCodeRequest, type ValidatePromoCodeRequestBody, type ValidatePromoCodeResponse, type ValidationActions, type ValidationError, type ValidationState, type Verify2FARequest, type Verify2FAResponse, type VerifyEmailRequest, type VerifyEmailResponse, type VerifyRoleResponse, type VideoInfo, type Visibility, type Webhook, type WebhookEndpoint, type WebhookEvent, type WizardActions, type WizardState, type WizardStep, buildEndpoint, capitalizeFirstLetter, changePasswordSchema, cn, countries, createApiKeySchema, createAppConfig, createFallbackHandler, createPaymentSchema, createRefundSchema, createSubscriptionSchema, customerInfoSchema, ensureProtocol, escapeLikePattern, extractDomain, findCountryByCode, findCountryByName, formatCurrency, formatDate, formatDeviceInfo, formatError, formatLocationData, formatNumber, formatRelativeTime, formatSuccess, getClientIP, getCurrencySymbol, getPopularCountries, getRequestInfo, getSecurityRiskLevel, isDevelopment, isMaintenanceMode, isProduction, isRateLimited, isStaging, isValidEndpoint, isValidUrl, logger, loginSchema, normalizeUrl, parseUserAgent, recordFailedAttempt, registerSchema, removeUrlParameters, resetRateLimit, retryWithBackoff, setLoggerTransport, setRateLimitStore, sleep, truncateString, updateUserSettingsSchema, validatePromoCodeSchema };
