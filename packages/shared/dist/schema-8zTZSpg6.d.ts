import { z } from 'zod';

type Json = string | number | boolean | null | {
    [key: string]: Json;
} | Json[];

declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}>;
declare const registerSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    phoneNumber: z.ZodString;
    country: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    phoneNumber: string;
    country: string;
    confirmPassword: string;
    name: string;
}, {
    email: string;
    password: string;
    phoneNumber: string;
    country: string;
    confirmPassword: string;
    name: string;
}>, {
    email: string;
    password: string;
    phoneNumber: string;
    country: string;
    confirmPassword: string;
    name: string;
}, {
    email: string;
    password: string;
    phoneNumber: string;
    country: string;
    confirmPassword: string;
    name: string;
}>;
declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
declare const resetPasswordSchema: z.ZodEffects<z.ZodObject<{
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    confirmPassword: string;
}, {
    password: string;
    confirmPassword: string;
}>, {
    password: string;
    confirmPassword: string;
}, {
    password: string;
    confirmPassword: string;
}>;
declare const urlSubmissionSchema: z.ZodObject<{
    url: z.ZodString;
    keyLocation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    keyLocation?: string | undefined;
}, {
    url: string;
    keyLocation?: string | undefined;
}>;
declare const indexStatusSchema: z.ZodObject<{
    url: z.ZodString;
    status: z.ZodEnum<["pending", "submitted", "indexed", "failed", "skipped"]>;
    submittedAt: z.ZodString;
    indexedAt: z.ZodOptional<z.ZodString>;
    errorMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "submitted" | "indexed" | "failed" | "skipped";
    url: string;
    submittedAt: string;
    indexedAt?: string | undefined;
    errorMessage?: string | undefined;
}, {
    status: "pending" | "submitted" | "indexed" | "failed" | "skipped";
    url: string;
    submittedAt: string;
    indexedAt?: string | undefined;
    errorMessage?: string | undefined;
}>;
declare const createJobSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["manual"]>;
    schedule_type: z.ZodDefault<z.ZodEnum<["one-time", "hourly", "daily", "weekly", "monthly"]>>;
    source_data: z.ZodObject<{
        urls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        urls?: string[] | undefined;
    }, {
        urls?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "manual";
    name: string;
    schedule_type: "one-time" | "hourly" | "daily" | "weekly" | "monthly";
    source_data: {
        urls?: string[] | undefined;
    };
}, {
    type: "manual";
    name: string;
    source_data: {
        urls?: string[] | undefined;
    };
    schedule_type?: "one-time" | "hourly" | "daily" | "weekly" | "monthly" | undefined;
}>;
declare const updateUserProfileSchema: z.ZodObject<{
    full_name: z.ZodOptional<z.ZodString>;
    email_notifications: z.ZodOptional<z.ZodBoolean>;
    phone_number: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    full_name?: string | undefined;
    email_notifications?: boolean | undefined;
    phone_number?: string | undefined;
}, {
    full_name?: string | undefined;
    email_notifications?: boolean | undefined;
    phone_number?: string | undefined;
}>;
declare const updateUserSettingsSchema: z.ZodObject<{
    timeout_duration: z.ZodOptional<z.ZodNumber>;
    retry_attempts: z.ZodOptional<z.ZodNumber>;
    email_job_completion: z.ZodOptional<z.ZodBoolean>;
    email_job_failure: z.ZodOptional<z.ZodBoolean>;
    email_quota_alerts: z.ZodOptional<z.ZodBoolean>;
    default_schedule: z.ZodOptional<z.ZodEnum<["one-time", "hourly", "daily", "weekly", "monthly"]>>;
    email_daily_report: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    timeout_duration?: number | undefined;
    retry_attempts?: number | undefined;
    email_job_completion?: boolean | undefined;
    email_job_failure?: boolean | undefined;
    email_quota_alerts?: boolean | undefined;
    default_schedule?: "one-time" | "hourly" | "daily" | "weekly" | "monthly" | undefined;
    email_daily_report?: boolean | undefined;
}, {
    timeout_duration?: number | undefined;
    retry_attempts?: number | undefined;
    email_job_completion?: boolean | undefined;
    email_job_failure?: boolean | undefined;
    email_quota_alerts?: boolean | undefined;
    default_schedule?: "one-time" | "hourly" | "daily" | "weekly" | "monthly" | undefined;
    email_daily_report?: boolean | undefined;
}>;
declare const changePasswordSchema: z.ZodEffects<z.ZodObject<{
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
declare const updateSiteSettingsSchema: z.ZodObject<{
    site_name: z.ZodOptional<z.ZodString>;
    site_tagline: z.ZodOptional<z.ZodString>;
    site_description: z.ZodOptional<z.ZodString>;
    site_logo_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    white_logo: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    site_icon_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    site_favicon_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    contact_email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    support_email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    maintenance_mode: z.ZodOptional<z.ZodBoolean>;
    registration_enabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    site_name?: string | undefined;
    site_tagline?: string | undefined;
    site_description?: string | undefined;
    site_logo_url?: string | undefined;
    white_logo?: string | undefined;
    site_icon_url?: string | undefined;
    site_favicon_url?: string | undefined;
    contact_email?: string | undefined;
    support_email?: string | undefined;
    maintenance_mode?: boolean | undefined;
    registration_enabled?: boolean | undefined;
}, {
    site_name?: string | undefined;
    site_tagline?: string | undefined;
    site_description?: string | undefined;
    site_logo_url?: string | undefined;
    white_logo?: string | undefined;
    site_icon_url?: string | undefined;
    site_favicon_url?: string | undefined;
    contact_email?: string | undefined;
    support_email?: string | undefined;
    maintenance_mode?: boolean | undefined;
    registration_enabled?: boolean | undefined;
}>;
type LoginRequest = z.infer<typeof loginSchema>;
type RegisterRequest = z.infer<typeof registerSchema>;
type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
type UrlSubmission = z.infer<typeof urlSubmissionSchema>;
type IndexStatus = z.infer<typeof indexStatusSchema>;
type CreateJobRequest = z.infer<typeof createJobSchema>;
type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
type UpdateUserSettingsRequest = z.infer<typeof updateUserSettingsSchema>;
type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
type UpdateSiteSettingsRequest = z.infer<typeof updateSiteSettingsSchema>;
interface DashboardStats {
    total_jobs: number;
    active_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    pending_jobs: number;
    total_urls_indexed: number;
    total_urls_failed: number;
    total_urls_processed: number;
    total_urls_submitted: number;
    success_rate: number;
    quota_usage: number;
}
declare const apiRequestSchemas: {
    adminUserAction: z.ZodObject<{
        userId: z.ZodString;
        action: z.ZodEnum<["suspend", "activate", "reset-password", "reset-quota", "extend-subscription", "change-package"]>;
        reason: z.ZodString;
        additionalData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        action: "suspend" | "activate" | "reset-password" | "reset-quota" | "extend-subscription" | "change-package";
        reason: string;
        additionalData?: Record<string, unknown> | undefined;
    }, {
        userId: string;
        action: "suspend" | "activate" | "reset-password" | "reset-quota" | "extend-subscription" | "change-package";
        reason: string;
        additionalData?: Record<string, unknown> | undefined;
    }>;
    paginationQuery: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
    }, {
        page?: string | undefined;
        limit?: string | undefined;
    }>;
    ordersQuery: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        status: z.ZodOptional<z.ZodEnum<["pending", "proof_uploaded", "completed", "failed", "cancelled"]>>;
        customer: z.ZodOptional<z.ZodString>;
        package_id: z.ZodOptional<z.ZodString>;
        date_from: z.ZodOptional<z.ZodString>;
        date_to: z.ZodOptional<z.ZodString>;
        amount_min: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
        amount_max: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        status?: "pending" | "failed" | "proof_uploaded" | "completed" | "cancelled" | undefined;
        customer?: string | undefined;
        package_id?: string | undefined;
        date_from?: string | undefined;
        date_to?: string | undefined;
        amount_min?: number | undefined;
        amount_max?: number | undefined;
    }, {
        page?: string | undefined;
        limit?: string | undefined;
        status?: "pending" | "failed" | "proof_uploaded" | "completed" | "cancelled" | undefined;
        customer?: string | undefined;
        package_id?: string | undefined;
        date_from?: string | undefined;
        date_to?: string | undefined;
        amount_min?: string | undefined;
        amount_max?: string | undefined;
    }>;
    adminActivityQuery: z.ZodObject<{
        days: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        user: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        event_type: z.ZodDefault<z.ZodOptional<z.ZodEnum<["all", "login", "logout", "admin_action", "order_management", "user_management", "system_action"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        days: number;
        event_type: "all" | "login" | "logout" | "admin_action" | "order_management" | "user_management" | "system_action";
        user?: string | undefined;
        search?: string | undefined;
    }, {
        page?: string | undefined;
        limit?: string | undefined;
        days?: string | undefined;
        user?: string | undefined;
        search?: string | undefined;
        event_type?: "all" | "login" | "logout" | "admin_action" | "order_management" | "user_management" | "system_action" | undefined;
    }>;
    keywordsQuery: z.ZodObject<{
        domain_id: z.ZodOptional<z.ZodString>;
        device_type: z.ZodOptional<z.ZodEnum<["desktop", "mobile", "tablet"]>>;
        country_id: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        sort: z.ZodOptional<z.ZodEnum<["keyword", "position", "created_at", "updated_at"]>>;
        order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sort?: "keyword" | "position" | "created_at" | "updated_at" | undefined;
        tags?: string | undefined;
        search?: string | undefined;
        domain_id?: string | undefined;
        device_type?: "desktop" | "mobile" | "tablet" | undefined;
        country_id?: string | undefined;
        order?: "asc" | "desc" | undefined;
    }, {
        page?: string | undefined;
        limit?: string | undefined;
        sort?: "keyword" | "position" | "created_at" | "updated_at" | undefined;
        tags?: string | undefined;
        search?: string | undefined;
        domain_id?: string | undefined;
        device_type?: "desktop" | "mobile" | "tablet" | undefined;
        country_id?: string | undefined;
        order?: "asc" | "desc" | undefined;
    }>;
    idParam: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    bulkKeywordDelete: z.ZodObject<{
        keyword_ids: z.ZodArray<z.ZodString, "many">;
        confirm: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    }, "strip", z.ZodTypeAny, {
        keyword_ids: string[];
        confirm: boolean;
    }, {
        keyword_ids: string[];
        confirm: boolean;
    }>;
    keywordCreate: z.ZodObject<{
        keyword: z.ZodString;
        domain: z.ZodString;
        country: z.ZodString;
        device: z.ZodDefault<z.ZodEnum<["desktop", "mobile", "tablet"]>>;
        search_engine: z.ZodDefault<z.ZodEnum<["google", "bing", "yahoo"]>>;
        target_url: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        country: string;
        keyword: string;
        domain: string;
        device: "desktop" | "mobile" | "tablet";
        search_engine: "google" | "bing" | "yahoo";
        tags?: string[] | undefined;
        target_url?: string | undefined;
    }, {
        country: string;
        keyword: string;
        domain: string;
        device?: "desktop" | "mobile" | "tablet" | undefined;
        tags?: string[] | undefined;
        search_engine?: "google" | "bing" | "yahoo" | undefined;
        target_url?: string | undefined;
    }>;
    rankCheckTrigger: z.ZodObject<{
        keyword_ids: z.ZodArray<z.ZodString, "many">;
        force_refresh: z.ZodDefault<z.ZodBoolean>;
        priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high"]>>;
    }, "strip", z.ZodTypeAny, {
        keyword_ids: string[];
        force_refresh: boolean;
        priority: "low" | "normal" | "high";
    }, {
        keyword_ids: string[];
        force_refresh?: boolean | undefined;
        priority?: "low" | "normal" | "high" | undefined;
    }>;
    siteSettingsUpdate: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        site_name: z.ZodOptional<z.ZodString>;
        site_tagline: z.ZodOptional<z.ZodString>;
        site_description: z.ZodOptional<z.ZodString>;
        site_logo_url: z.ZodOptional<z.ZodString>;
        white_logo: z.ZodOptional<z.ZodString>;
        site_icon_url: z.ZodOptional<z.ZodString>;
        site_favicon_url: z.ZodOptional<z.ZodString>;
        contact_email: z.ZodOptional<z.ZodString>;
        support_email: z.ZodOptional<z.ZodString>;
        maintenance_mode: z.ZodOptional<z.ZodBoolean>;
        registration_enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        site_name?: string | undefined;
        site_tagline?: string | undefined;
        site_description?: string | undefined;
        site_logo_url?: string | undefined;
        white_logo?: string | undefined;
        site_icon_url?: string | undefined;
        site_favicon_url?: string | undefined;
        contact_email?: string | undefined;
        support_email?: string | undefined;
        maintenance_mode?: boolean | undefined;
        registration_enabled?: boolean | undefined;
        id?: string | undefined;
    }, {
        site_name?: string | undefined;
        site_tagline?: string | undefined;
        site_description?: string | undefined;
        site_logo_url?: string | undefined;
        white_logo?: string | undefined;
        site_icon_url?: string | undefined;
        site_favicon_url?: string | undefined;
        contact_email?: string | undefined;
        support_email?: string | undefined;
        maintenance_mode?: boolean | undefined;
        registration_enabled?: boolean | undefined;
        id?: string | undefined;
    }>;
    adminChangePackage: z.ZodObject<{
        packageId: z.ZodString;
        reason: z.ZodString;
        effectiveDate: z.ZodOptional<z.ZodString>;
        notifyUser: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        packageId: string;
        reason: string;
        notifyUser: boolean;
        effectiveDate?: string | undefined;
    }, {
        packageId: string;
        reason: string;
        effectiveDate?: string | undefined;
        notifyUser?: boolean | undefined;
    }>;
    adminResetPassword: z.ZodObject<{
        newPassword: z.ZodString;
        reason: z.ZodString;
        forcePasswordChange: z.ZodDefault<z.ZodBoolean>;
        notifyUser: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        newPassword: string;
        reason: string;
        notifyUser: boolean;
        forcePasswordChange: boolean;
    }, {
        newPassword: string;
        reason: string;
        notifyUser?: boolean | undefined;
        forcePasswordChange?: boolean | undefined;
    }>;
    adminExtendSubscription: z.ZodObject<{
        extensionPeriod: z.ZodNumber;
        reason: z.ZodString;
        addToExisting: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        reason: string;
        extensionPeriod: number;
        addToExisting: boolean;
    }, {
        reason: string;
        extensionPeriod: number;
        addToExisting?: boolean | undefined;
    }>;
    uuidParam: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    slugParam: z.ZodObject<{
        slug: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        slug: string;
    }, {
        slug: string;
    }>;
    keywordIdParam: z.ZodObject<{
        keywordId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        keywordId: string;
    }, {
        keywordId: string;
    }>;
    domainIdParam: z.ZodObject<{
        domainId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        domainId: string;
    }, {
        domainId: string;
    }>;
};
/** @deprecated Use ApiResponse from core/api-response instead */
interface ApiResponse<T = Json> {
    data?: T;
    error?: string;
    message?: string;
    details?: Json;
}
interface PaginatedResponse<T = Json> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export { type ApiResponse as A, type ChangePasswordRequest as C, type DashboardStats as D, type ForgotPasswordRequest as F, type IndexStatus as I, type Json as J, type LoginRequest as L, type PaginatedResponse as P, type RegisterRequest as R, type UpdateUserSettingsRequest as U, type ResetPasswordRequest as a, apiRequestSchemas as b, changePasswordSchema as c, resetPasswordSchema as d, updateSiteSettingsSchema as e, forgotPasswordSchema as f, updateUserProfileSchema as g, type CreateJobRequest as h, type UpdateSiteSettingsRequest as i, type UpdateUserProfileRequest as j, type UrlSubmission as k, loginSchema as l, createJobSchema as m, indexStatusSchema as n, urlSubmissionSchema as o, registerSchema as r, updateUserSettingsSchema as u };
