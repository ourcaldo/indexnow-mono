"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/schema.ts
var schema_exports = {};
__export(schema_exports, {
  apiRequestSchemas: () => apiRequestSchemas,
  changePasswordSchema: () => changePasswordSchema,
  createJobSchema: () => createJobSchema,
  forgotPasswordSchema: () => forgotPasswordSchema,
  indexStatusSchema: () => indexStatusSchema,
  loginSchema: () => loginSchema,
  registerSchema: () => registerSchema,
  resetPasswordSchema: () => resetPasswordSchema,
  updateSiteSettingsSchema: () => updateSiteSettingsSchema,
  updateUserProfileSchema: () => updateUserProfileSchema,
  updateUserSettingsSchema: () => updateUserSettingsSchema,
  urlSubmissionSchema: () => urlSubmissionSchema
});
module.exports = __toCommonJS(schema_exports);
var import_zod2 = require("zod");

// src/constants/ValidationRules.ts
var import_zod = require("zod");
var VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  DOMAIN: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  CRON: /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
};
var FIELD_LIMITS = {
  EMAIL: { min: 5, max: 254 },
  PASSWORD: { min: 8, max: 128 },
  NAME: { min: 1, max: 100 },
  TITLE: { min: 1, max: 200 },
  DESCRIPTION: { min: 0, max: 1e3 },
  URL: { min: 10, max: 2048 },
  PHONE: { min: 8, max: 20 },
  TAG: { min: 1, max: 50 },
  SLUG: { min: 1, max: 100 },
  MESSAGE: { min: 1, max: 5e3 },
  KEYWORD: { min: 1, max: 100 },
  DOMAIN: { min: 3, max: 253 },
  JOB_NAME: { min: 1, max: 100 },
  PACKAGE_NAME: { min: 1, max: 50 }
};
var NUMERIC_LIMITS = {
  PAGINATION: { min: 1, max: 1e3 },
  // Increased for bulk data fetching
  QUOTA: { min: 0, max: 999999999 },
  PRICE: { min: 0, max: 999999999 },
  PERCENTAGE: { min: 0, max: 100 },
  POSITION: { min: 1, max: 100 },
  RETRY_ATTEMPTS: { min: 0, max: 10 },
  TIMEOUT: { min: 1e3, max: 3e5 },
  // 1 second to 5 minutes
  FILE_SIZE: { min: 1, max: 5 * 1024 * 1024 },
  // 1 byte to 5MB
  BULK_OPERATIONS: { min: 1, max: 1e3 }
};
var BaseSchemas = {
  email: import_zod.z.string().min(FIELD_LIMITS.EMAIL.min, "Email is too short").max(FIELD_LIMITS.EMAIL.max, "Email is too long").regex(VALIDATION_PATTERNS.EMAIL, "Invalid email format"),
  password: import_zod.z.string().min(FIELD_LIMITS.PASSWORD.min, "Password must be at least 8 characters").max(FIELD_LIMITS.PASSWORD.max, "Password is too long").regex(
    VALIDATION_PATTERNS.PASSWORD,
    "Password must contain uppercase, lowercase, number and special character"
  ),
  url: import_zod.z.string().min(FIELD_LIMITS.URL.min, "URL is too short").max(FIELD_LIMITS.URL.max, "URL is too long").regex(VALIDATION_PATTERNS.URL, "Invalid URL format"),
  domain: import_zod.z.string().min(FIELD_LIMITS.DOMAIN.min, "Domain is too short").max(FIELD_LIMITS.DOMAIN.max, "Domain is too long").regex(VALIDATION_PATTERNS.DOMAIN, "Invalid domain format"),
  phone: import_zod.z.string().min(FIELD_LIMITS.PHONE.min, "Phone number is too short").max(FIELD_LIMITS.PHONE.max, "Phone number is too long").regex(VALIDATION_PATTERNS.PHONE, "Invalid phone number format"),
  uuid: import_zod.z.string().regex(VALIDATION_PATTERNS.UUID, "Invalid UUID format"),
  cron: import_zod.z.string().regex(VALIDATION_PATTERNS.CRON, "Invalid cron expression"),
  slug: import_zod.z.string().min(FIELD_LIMITS.SLUG.min, "Slug is too short").max(FIELD_LIMITS.SLUG.max, "Slug is too long").regex(VALIDATION_PATTERNS.SLUG, "Invalid slug format"),
  pagination: import_zod.z.object({
    page: import_zod.z.number().min(1).default(1),
    limit: import_zod.z.number().min(NUMERIC_LIMITS.PAGINATION.min).max(NUMERIC_LIMITS.PAGINATION.max).default(10)
  }),
  dateRange: import_zod.z.object({
    startDate: import_zod.z.string().datetime().optional(),
    endDate: import_zod.z.string().datetime().optional()
  }),
  tags: import_zod.z.array(import_zod.z.string().min(FIELD_LIMITS.TAG.min).max(FIELD_LIMITS.TAG.max)).max(20, "Too many tags")
};
var UserSchemas = {
  register: import_zod.z.object({
    email: BaseSchemas.email,
    password: BaseSchemas.password,
    fullName: import_zod.z.string().min(FIELD_LIMITS.NAME.min, "Name is required").max(FIELD_LIMITS.NAME.max, "Name is too long"),
    phoneNumber: BaseSchemas.phone.optional(),
    country: import_zod.z.string().min(2).max(3).optional()
  }),
  login: import_zod.z.object({
    email: BaseSchemas.email,
    password: import_zod.z.string().min(1, "Password is required")
  }),
  profile: import_zod.z.object({
    fullName: import_zod.z.string().min(FIELD_LIMITS.NAME.min, "Name is required").max(FIELD_LIMITS.NAME.max, "Name is too long"),
    phoneNumber: BaseSchemas.phone.optional(),
    country: import_zod.z.string().min(2).max(3).optional(),
    emailNotifications: import_zod.z.boolean().default(true)
  }),
  changePassword: import_zod.z.object({
    currentPassword: import_zod.z.string().min(1, "Current password is required"),
    newPassword: BaseSchemas.password,
    confirmPassword: import_zod.z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),
  settings: import_zod.z.object({
    timeoutDuration: import_zod.z.number().min(NUMERIC_LIMITS.TIMEOUT.min).max(NUMERIC_LIMITS.TIMEOUT.max).default(3e4),
    retryAttempts: import_zod.z.number().min(NUMERIC_LIMITS.RETRY_ATTEMPTS.min).max(NUMERIC_LIMITS.RETRY_ATTEMPTS.max).default(3),
    emailJobCompletion: import_zod.z.boolean().default(true),
    emailJobFailure: import_zod.z.boolean().default(true),
    emailQuotaAlerts: import_zod.z.boolean().default(true),
    emailDailyReport: import_zod.z.boolean().default(true),
    defaultSchedule: import_zod.z.enum(["one-time", "hourly", "daily", "weekly", "monthly"]).default("one-time")
  })
};
var RankTrackingSchemas = {
  keyword: import_zod.z.object({
    keyword: import_zod.z.string().min(FIELD_LIMITS.KEYWORD.min, "Keyword is required").max(FIELD_LIMITS.KEYWORD.max, "Keyword is too long"),
    domain: BaseSchemas.domain,
    country: import_zod.z.string().length(2, "Invalid country code"),
    device: import_zod.z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
    searchEngine: import_zod.z.enum(["google", "bing", "yahoo"]).default("google"),
    tags: BaseSchemas.tags.optional(),
    targetUrl: BaseSchemas.url.optional()
  }),
  bulkKeywords: import_zod.z.object({
    keywords: import_zod.z.array(
      import_zod.z.object({
        keyword: import_zod.z.string().min(FIELD_LIMITS.KEYWORD.min).max(FIELD_LIMITS.KEYWORD.max),
        domain: BaseSchemas.domain,
        country: import_zod.z.string().length(2),
        device: import_zod.z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
        searchEngine: import_zod.z.enum(["google", "bing", "yahoo"]).default("google"),
        tags: BaseSchemas.tags.optional(),
        targetUrl: BaseSchemas.url.optional()
      })
    ).min(1, "At least one keyword is required").max(NUMERIC_LIMITS.BULK_OPERATIONS.max, "Too many keywords")
  }),
  domain: import_zod.z.object({
    domain: BaseSchemas.domain,
    name: import_zod.z.string().min(FIELD_LIMITS.NAME.min, "Domain name is required").max(FIELD_LIMITS.NAME.max, "Domain name is too long"),
    isActive: import_zod.z.boolean().default(true)
  }),
  rankCheck: import_zod.z.object({
    keywordIds: import_zod.z.array(BaseSchemas.uuid).min(1, "At least one keyword is required").max(NUMERIC_LIMITS.BULK_OPERATIONS.max, "Too many keywords"),
    forceRefresh: import_zod.z.boolean().default(false)
  })
};
var customerInfoSchema = import_zod.z.object({
  firstName: import_zod.z.string().min(FIELD_LIMITS.NAME.min, "First name is required").max(FIELD_LIMITS.NAME.max, "First name is too long"),
  lastName: import_zod.z.string().min(FIELD_LIMITS.NAME.min, "Last name is required").max(FIELD_LIMITS.NAME.max, "Last name is too long"),
  email: BaseSchemas.email,
  phone: BaseSchemas.phone,
  address: import_zod.z.string().min(10, "Address is too short").max(200, "Address is too long"),
  city: import_zod.z.string().min(2, "City is required").max(50, "City name is too long"),
  postalCode: import_zod.z.string().min(3, "Postal code is required").max(10, "Postal code is too long"),
  country: import_zod.z.string().length(2, "Invalid country code")
});
var PaymentSchemas = {
  customerInfo: customerInfoSchema,
  paymentRequest: import_zod.z.object({
    packageId: BaseSchemas.uuid,
    billingPeriod: import_zod.z.enum(["monthly", "quarterly", "biannual", "annual"]),
    paymentMethod: import_zod.z.enum(["paddle", "credit-card"]),
    customerInfo: customerInfoSchema,
    promoCode: import_zod.z.string().optional(),
    isTrialToSubscription: import_zod.z.boolean().default(false)
  }),
  webhookPayload: import_zod.z.object({
    order_id: import_zod.z.string(),
    status_code: import_zod.z.string(),
    transaction_status: import_zod.z.string(),
    fraud_status: import_zod.z.string().optional(),
    payment_type: import_zod.z.string().optional(),
    gross_amount: import_zod.z.string(),
    signature_key: import_zod.z.string()
  })
};
var AdminSchemas = {
  userManagement: import_zod.z.object({
    userId: BaseSchemas.uuid,
    action: import_zod.z.enum([
      "suspend",
      "activate",
      "reset-password",
      "extend-subscription",
      "change-package"
    ]),
    reason: import_zod.z.string().min(10, "Reason must be at least 10 characters").max(FIELD_LIMITS.MESSAGE.max, "Reason is too long"),
    additionalData: import_zod.z.record(import_zod.z.any()).optional()
  }),
  packageManagement: import_zod.z.object({
    name: import_zod.z.string().min(FIELD_LIMITS.PACKAGE_NAME.min, "Package name is required").max(FIELD_LIMITS.PACKAGE_NAME.max, "Package name is too long"),
    description: import_zod.z.string().min(FIELD_LIMITS.DESCRIPTION.min).max(FIELD_LIMITS.DESCRIPTION.max, "Description is too long"),
    price: import_zod.z.number().min(NUMERIC_LIMITS.PRICE.min).max(NUMERIC_LIMITS.PRICE.max),
    quotaLimits: import_zod.z.object({
      dailyUrls: import_zod.z.number().min(0),
      keywords: import_zod.z.number().min(0),
      concurrentJobs: import_zod.z.number().min(0)
    }),
    features: import_zod.z.array(import_zod.z.string()),
    isActive: import_zod.z.boolean().default(true)
  }),
  siteSettings: import_zod.z.object({
    siteName: import_zod.z.string().min(FIELD_LIMITS.NAME.min, "Site name is required").max(FIELD_LIMITS.NAME.max, "Site name is too long"),
    siteDescription: import_zod.z.string().max(FIELD_LIMITS.DESCRIPTION.max, "Description is too long"),
    contactEmail: BaseSchemas.email.optional(),
    supportEmail: BaseSchemas.email.optional(),
    maintenanceMode: import_zod.z.boolean().default(false),
    registrationEnabled: import_zod.z.boolean().default(true)
  })
};

// src/schema.ts
var passwordSchema = import_zod2.z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number");
var loginSchema = import_zod2.z.object({
  email: import_zod2.z.string().email("Please enter a valid email address"),
  password: import_zod2.z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: import_zod2.z.boolean().optional()
});
var registerSchema = import_zod2.z.object({
  name: import_zod2.z.string().min(2, "Name must be at least 2 characters"),
  email: import_zod2.z.string().email("Please enter a valid email address"),
  password: passwordSchema,
  confirmPassword: import_zod2.z.string().min(8, "Please confirm your password"),
  phoneNumber: import_zod2.z.string().min(3, "Please enter a valid phone number").regex(/^\+?[0-9\s\-\(\)]+$/, "Phone number can only contain numbers, spaces, +, -, ( and )"),
  country: import_zod2.z.string().min(2, "Please select a country")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
var forgotPasswordSchema = import_zod2.z.object({
  email: import_zod2.z.string().email("Please enter a valid email address")
});
var resetPasswordSchema = import_zod2.z.object({
  password: passwordSchema,
  confirmPassword: import_zod2.z.string().min(8, "Please confirm your password")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
var urlSubmissionSchema = import_zod2.z.object({
  url: import_zod2.z.string().url("Please enter a valid URL"),
  keyLocation: import_zod2.z.string().url("Key location URL").optional()
});
var indexStatusSchema = import_zod2.z.object({
  url: import_zod2.z.string().url(),
  status: import_zod2.z.enum(["pending", "submitted", "indexed", "failed", "skipped"]),
  submittedAt: import_zod2.z.string().datetime(),
  indexedAt: import_zod2.z.string().datetime().optional(),
  errorMessage: import_zod2.z.string().optional()
});
var createJobSchema = import_zod2.z.object({
  name: import_zod2.z.string().min(1, "Job name is required"),
  type: import_zod2.z.enum(["manual"]),
  schedule_type: import_zod2.z.enum(["one-time", "hourly", "daily", "weekly", "monthly"]).default("one-time"),
  source_data: import_zod2.z.object({
    urls: import_zod2.z.array(import_zod2.z.string().url()).optional()
  })
});
var updateUserProfileSchema = import_zod2.z.object({
  full_name: import_zod2.z.string().min(1, "Full name is required").optional(),
  email_notifications: import_zod2.z.boolean().optional(),
  phone_number: import_zod2.z.string().optional()
});
var updateUserSettingsSchema = import_zod2.z.object({
  timeout_duration: import_zod2.z.number().min(1e3).max(3e5).optional(),
  // 1s to 5min
  retry_attempts: import_zod2.z.number().min(1).max(10).optional(),
  email_job_completion: import_zod2.z.boolean().optional(),
  email_job_failure: import_zod2.z.boolean().optional(),
  email_quota_alerts: import_zod2.z.boolean().optional(),
  default_schedule: import_zod2.z.enum(["one-time", "hourly", "daily", "weekly", "monthly"]).optional(),
  email_daily_report: import_zod2.z.boolean().optional()
});
var changePasswordSchema = import_zod2.z.object({
  currentPassword: import_zod2.z.string().min(8, "Current password is required"),
  newPassword: import_zod2.z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: import_zod2.z.string().min(8, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"]
});
var updateSiteSettingsSchema = import_zod2.z.object({
  site_name: import_zod2.z.string().min(1, "Site name is required").optional(),
  site_tagline: import_zod2.z.string().optional(),
  site_description: import_zod2.z.string().optional(),
  site_logo_url: import_zod2.z.string().url().optional().or(import_zod2.z.literal("")),
  white_logo: import_zod2.z.string().url().optional().or(import_zod2.z.literal("")),
  site_icon_url: import_zod2.z.string().url().optional().or(import_zod2.z.literal("")),
  site_favicon_url: import_zod2.z.string().url().optional().or(import_zod2.z.literal("")),
  contact_email: import_zod2.z.string().email().optional().or(import_zod2.z.literal("")),
  support_email: import_zod2.z.string().email().optional().or(import_zod2.z.literal("")),
  maintenance_mode: import_zod2.z.boolean().optional(),
  registration_enabled: import_zod2.z.boolean().optional()
});
var apiRequestSchemas = {
  // Admin user management schemas
  adminUserAction: import_zod2.z.object({
    userId: import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID, "Invalid user ID format"),
    action: import_zod2.z.enum([
      "suspend",
      "activate",
      "reset-password",
      "extend-subscription",
      "change-package"
    ]),
    reason: import_zod2.z.string().min(10).max(FIELD_LIMITS.MESSAGE.max),
    additionalData: import_zod2.z.record(import_zod2.z.unknown()).optional()
  }),
  // Query parameter schemas
  paginationQuery: import_zod2.z.object({
    page: import_zod2.z.string().transform((val) => parseInt(val, 10)).pipe(import_zod2.z.number().min(1).max(1e3)).optional().default("1"),
    limit: import_zod2.z.string().transform((val) => parseInt(val, 10)).pipe(import_zod2.z.number().min(1).max(1e3)).optional().default("10")
  }),
  ordersQuery: import_zod2.z.object({
    page: import_zod2.z.string().transform((val) => parseInt(val, 10)).pipe(import_zod2.z.number().min(1).max(1e3)).optional().default("1"),
    limit: import_zod2.z.string().transform((val) => parseInt(val, 10)).pipe(import_zod2.z.number().min(1).max(100)).optional().default("10"),
    status: import_zod2.z.enum(["pending", "proof_uploaded", "completed", "failed", "cancelled"]).optional(),
    customer: import_zod2.z.string().max(100).optional(),
    package_id: import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID).optional(),
    date_from: import_zod2.z.string().datetime().optional(),
    date_to: import_zod2.z.string().datetime().optional(),
    amount_min: import_zod2.z.string().transform((val) => parseFloat(val)).pipe(import_zod2.z.number().min(0)).optional(),
    amount_max: import_zod2.z.string().transform((val) => parseFloat(val)).pipe(import_zod2.z.number().min(0)).optional()
  }),
  adminActivityQuery: import_zod2.z.object({
    days: import_zod2.z.string().transform((val) => parseInt(val, 10)).pipe(import_zod2.z.number().min(1).max(365)).optional().default("7"),
    limit: import_zod2.z.string().transform((val) => parseInt(val, 10)).pipe(import_zod2.z.number().min(1).max(500)).optional().default("100"),
    page: import_zod2.z.string().transform((val) => parseInt(val, 10)).pipe(import_zod2.z.number().min(1).max(1e3)).optional().default("1"),
    user: import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID).optional(),
    search: import_zod2.z.string().max(100).optional(),
    event_type: import_zod2.z.enum([
      "all",
      "login",
      "logout",
      "admin_action",
      "order_management",
      "user_management",
      "system_action"
    ]).optional().default("all")
  }),
  keywordsQuery: import_zod2.z.object({
    domain_id: import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID, "Invalid domain ID").optional(),
    device_type: import_zod2.z.enum(["desktop", "mobile", "tablet"]).optional(),
    country_id: import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID, "Invalid country ID").optional(),
    tags: import_zod2.z.string().optional(),
    search: import_zod2.z.string().max(100).optional(),
    sort: import_zod2.z.enum(["keyword", "position", "created_at", "updated_at"]).optional(),
    order: import_zod2.z.enum(["asc", "desc"]).optional(),
    page: import_zod2.z.string().transform((val) => parseInt(val, 10)).pipe(import_zod2.z.number().min(1).max(1e3)).optional().default("1"),
    limit: import_zod2.z.string().transform((val) => parseInt(val, 10)).pipe(import_zod2.z.number().min(1).max(1e3)).optional().default("20")
  }),
  // URL parameter schemas
  idParam: import_zod2.z.object({
    id: import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID, "Invalid ID format")
  }),
  // Bulk operation schemas
  bulkKeywordDelete: import_zod2.z.object({
    keyword_ids: import_zod2.z.array(import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID)).min(1).max(NUMERIC_LIMITS.BULK_OPERATIONS.max),
    confirm: import_zod2.z.boolean().refine((val) => val === true, "Confirmation required for bulk delete")
  }),
  // Rank tracking schemas
  keywordCreate: import_zod2.z.object({
    keyword: import_zod2.z.string().min(FIELD_LIMITS.KEYWORD.min).max(FIELD_LIMITS.KEYWORD.max),
    domain: import_zod2.z.string().regex(VALIDATION_PATTERNS.DOMAIN),
    country: import_zod2.z.string().length(2),
    device: import_zod2.z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
    search_engine: import_zod2.z.enum(["google", "bing", "yahoo"]).default("google"),
    target_url: import_zod2.z.string().url().optional(),
    tags: import_zod2.z.array(import_zod2.z.string().max(FIELD_LIMITS.TAG.max)).max(10).optional()
  }),
  rankCheckTrigger: import_zod2.z.object({
    keyword_ids: import_zod2.z.array(import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID)).min(1).max(100),
    force_refresh: import_zod2.z.boolean().default(false),
    priority: import_zod2.z.enum(["low", "normal", "high"]).default("normal")
  }),
  // Settings and configuration
  siteSettingsUpdate: import_zod2.z.object({
    id: import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID).optional(),
    // For updates
    site_name: import_zod2.z.string().min(1).max(100).optional(),
    site_tagline: import_zod2.z.string().max(200).optional(),
    site_description: import_zod2.z.string().max(500).optional(),
    site_logo_url: import_zod2.z.string().url().optional(),
    white_logo: import_zod2.z.string().url().optional(),
    site_icon_url: import_zod2.z.string().url().optional(),
    site_favicon_url: import_zod2.z.string().url().optional(),
    contact_email: import_zod2.z.string().regex(VALIDATION_PATTERNS.EMAIL).optional(),
    support_email: import_zod2.z.string().regex(VALIDATION_PATTERNS.EMAIL).optional(),
    maintenance_mode: import_zod2.z.boolean().optional(),
    registration_enabled: import_zod2.z.boolean().optional()
  }),
  // Admin user management request bodies
  adminChangePackage: import_zod2.z.object({
    packageId: import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID, "Invalid package ID"),
    reason: import_zod2.z.string().min(10).max(FIELD_LIMITS.MESSAGE.max),
    effectiveDate: import_zod2.z.string().datetime().optional(),
    notifyUser: import_zod2.z.boolean().default(true)
  }),
  adminResetPassword: import_zod2.z.object({
    newPassword: import_zod2.z.string().min(8).max(128),
    reason: import_zod2.z.string().min(10).max(FIELD_LIMITS.MESSAGE.max),
    forcePasswordChange: import_zod2.z.boolean().default(true),
    notifyUser: import_zod2.z.boolean().default(true)
  }),
  adminExtendSubscription: import_zod2.z.object({
    extensionPeriod: import_zod2.z.number().min(1).max(365),
    // Days
    reason: import_zod2.z.string().min(10).max(FIELD_LIMITS.MESSAGE.max),
    addToExisting: import_zod2.z.boolean().default(true)
  }),
  // URL Parameter validation schemas for dynamic routes
  uuidParam: import_zod2.z.object({
    id: import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID, "Invalid ID format - must be a valid UUID")
  }),
  slugParam: import_zod2.z.object({
    slug: import_zod2.z.string().regex(
      VALIDATION_PATTERNS.SLUG,
      "Invalid slug format - must contain only lowercase letters, numbers, and dashes"
    )
  }),
  keywordIdParam: import_zod2.z.object({
    keywordId: import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID, "Invalid keyword ID format")
  }),
  domainIdParam: import_zod2.z.object({
    domainId: import_zod2.z.string().regex(VALIDATION_PATTERNS.UUID, "Invalid domain ID format")
  })
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  apiRequestSchemas,
  changePasswordSchema,
  createJobSchema,
  forgotPasswordSchema,
  indexStatusSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateSiteSettingsSchema,
  updateUserProfileSchema,
  updateUserSettingsSchema,
  urlSubmissionSchema
});
//# sourceMappingURL=schema.js.map