// src/schema.ts
import { z as z2 } from "zod";

// src/constants/ValidationRules.ts
import { z } from "zod";
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
  email: z.string().min(FIELD_LIMITS.EMAIL.min, "Email is too short").max(FIELD_LIMITS.EMAIL.max, "Email is too long").regex(VALIDATION_PATTERNS.EMAIL, "Invalid email format"),
  password: z.string().min(FIELD_LIMITS.PASSWORD.min, "Password must be at least 8 characters").max(FIELD_LIMITS.PASSWORD.max, "Password is too long").regex(
    VALIDATION_PATTERNS.PASSWORD,
    "Password must contain uppercase, lowercase, number and special character"
  ),
  url: z.string().min(FIELD_LIMITS.URL.min, "URL is too short").max(FIELD_LIMITS.URL.max, "URL is too long").regex(VALIDATION_PATTERNS.URL, "Invalid URL format"),
  domain: z.string().min(FIELD_LIMITS.DOMAIN.min, "Domain is too short").max(FIELD_LIMITS.DOMAIN.max, "Domain is too long").regex(VALIDATION_PATTERNS.DOMAIN, "Invalid domain format"),
  phone: z.string().min(FIELD_LIMITS.PHONE.min, "Phone number is too short").max(FIELD_LIMITS.PHONE.max, "Phone number is too long").regex(VALIDATION_PATTERNS.PHONE, "Invalid phone number format"),
  uuid: z.string().regex(VALIDATION_PATTERNS.UUID, "Invalid UUID format"),
  cron: z.string().regex(VALIDATION_PATTERNS.CRON, "Invalid cron expression"),
  slug: z.string().min(FIELD_LIMITS.SLUG.min, "Slug is too short").max(FIELD_LIMITS.SLUG.max, "Slug is too long").regex(VALIDATION_PATTERNS.SLUG, "Invalid slug format"),
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(NUMERIC_LIMITS.PAGINATION.min).max(NUMERIC_LIMITS.PAGINATION.max).default(10)
  }),
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }),
  tags: z.array(z.string().min(FIELD_LIMITS.TAG.min).max(FIELD_LIMITS.TAG.max)).max(20, "Too many tags")
};
var UserSchemas = {
  register: z.object({
    email: BaseSchemas.email,
    password: BaseSchemas.password,
    fullName: z.string().min(FIELD_LIMITS.NAME.min, "Name is required").max(FIELD_LIMITS.NAME.max, "Name is too long"),
    phoneNumber: BaseSchemas.phone.optional(),
    country: z.string().min(2).max(3).optional()
  }),
  login: z.object({
    email: BaseSchemas.email,
    password: z.string().min(1, "Password is required")
  }),
  profile: z.object({
    fullName: z.string().min(FIELD_LIMITS.NAME.min, "Name is required").max(FIELD_LIMITS.NAME.max, "Name is too long"),
    phoneNumber: BaseSchemas.phone.optional(),
    country: z.string().min(2).max(3).optional(),
    emailNotifications: z.boolean().default(true)
  }),
  changePassword: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: BaseSchemas.password,
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),
  settings: z.object({
    timeoutDuration: z.number().min(NUMERIC_LIMITS.TIMEOUT.min).max(NUMERIC_LIMITS.TIMEOUT.max).default(3e4),
    retryAttempts: z.number().min(NUMERIC_LIMITS.RETRY_ATTEMPTS.min).max(NUMERIC_LIMITS.RETRY_ATTEMPTS.max).default(3),
    emailJobCompletion: z.boolean().default(true),
    emailJobFailure: z.boolean().default(true),
    emailQuotaAlerts: z.boolean().default(true),
    emailDailyReport: z.boolean().default(true),
    defaultSchedule: z.enum(["one-time", "hourly", "daily", "weekly", "monthly"]).default("one-time")
  })
};
var RankTrackingSchemas = {
  keyword: z.object({
    keyword: z.string().min(FIELD_LIMITS.KEYWORD.min, "Keyword is required").max(FIELD_LIMITS.KEYWORD.max, "Keyword is too long"),
    domain: BaseSchemas.domain,
    country: z.string().length(2, "Invalid country code"),
    device: z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
    searchEngine: z.enum(["google", "bing", "yahoo"]).default("google"),
    tags: BaseSchemas.tags.optional(),
    targetUrl: BaseSchemas.url.optional()
  }),
  bulkKeywords: z.object({
    keywords: z.array(
      z.object({
        keyword: z.string().min(FIELD_LIMITS.KEYWORD.min).max(FIELD_LIMITS.KEYWORD.max),
        domain: BaseSchemas.domain,
        country: z.string().length(2),
        device: z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
        searchEngine: z.enum(["google", "bing", "yahoo"]).default("google"),
        tags: BaseSchemas.tags.optional(),
        targetUrl: BaseSchemas.url.optional()
      })
    ).min(1, "At least one keyword is required").max(NUMERIC_LIMITS.BULK_OPERATIONS.max, "Too many keywords")
  }),
  domain: z.object({
    domain: BaseSchemas.domain,
    name: z.string().min(FIELD_LIMITS.NAME.min, "Domain name is required").max(FIELD_LIMITS.NAME.max, "Domain name is too long"),
    isActive: z.boolean().default(true)
  }),
  rankCheck: z.object({
    keywordIds: z.array(BaseSchemas.uuid).min(1, "At least one keyword is required").max(NUMERIC_LIMITS.BULK_OPERATIONS.max, "Too many keywords"),
    forceRefresh: z.boolean().default(false)
  })
};
var customerInfoSchema = z.object({
  firstName: z.string().min(FIELD_LIMITS.NAME.min, "First name is required").max(FIELD_LIMITS.NAME.max, "First name is too long"),
  lastName: z.string().min(FIELD_LIMITS.NAME.min, "Last name is required").max(FIELD_LIMITS.NAME.max, "Last name is too long"),
  email: BaseSchemas.email,
  phone: BaseSchemas.phone,
  address: z.string().min(10, "Address is too short").max(200, "Address is too long"),
  city: z.string().min(2, "City is required").max(50, "City name is too long"),
  postalCode: z.string().min(3, "Postal code is required").max(10, "Postal code is too long"),
  country: z.string().length(2, "Invalid country code")
});
var PaymentSchemas = {
  customerInfo: customerInfoSchema,
  paymentRequest: z.object({
    packageId: BaseSchemas.uuid,
    billingPeriod: z.enum(["monthly", "quarterly", "biannual", "annual"]),
    paymentMethod: z.enum(["paddle", "credit-card"]),
    customerInfo: customerInfoSchema,
    promoCode: z.string().optional(),
    isTrialToSubscription: z.boolean().default(false)
  }),
  webhookPayload: z.object({
    order_id: z.string(),
    status_code: z.string(),
    transaction_status: z.string(),
    fraud_status: z.string().optional(),
    payment_type: z.string().optional(),
    gross_amount: z.string(),
    signature_key: z.string()
  })
};
var AdminSchemas = {
  userManagement: z.object({
    userId: BaseSchemas.uuid,
    action: z.enum([
      "suspend",
      "activate",
      "reset-password",
      "reset-quota",
      "extend-subscription",
      "change-package"
    ]),
    reason: z.string().min(10, "Reason must be at least 10 characters").max(FIELD_LIMITS.MESSAGE.max, "Reason is too long"),
    additionalData: z.record(z.any()).optional()
  }),
  packageManagement: z.object({
    name: z.string().min(FIELD_LIMITS.PACKAGE_NAME.min, "Package name is required").max(FIELD_LIMITS.PACKAGE_NAME.max, "Package name is too long"),
    description: z.string().min(FIELD_LIMITS.DESCRIPTION.min).max(FIELD_LIMITS.DESCRIPTION.max, "Description is too long"),
    price: z.number().min(NUMERIC_LIMITS.PRICE.min).max(NUMERIC_LIMITS.PRICE.max),
    quotaLimits: z.object({
      dailyUrls: z.number().min(0),
      keywords: z.number().min(0),
      concurrentJobs: z.number().min(0)
    }),
    features: z.array(z.string()),
    isActive: z.boolean().default(true)
  }),
  siteSettings: z.object({
    siteName: z.string().min(FIELD_LIMITS.NAME.min, "Site name is required").max(FIELD_LIMITS.NAME.max, "Site name is too long"),
    siteDescription: z.string().max(FIELD_LIMITS.DESCRIPTION.max, "Description is too long"),
    contactEmail: BaseSchemas.email.optional(),
    supportEmail: BaseSchemas.email.optional(),
    maintenanceMode: z.boolean().default(false),
    registrationEnabled: z.boolean().default(true)
  })
};

// src/schema.ts
var passwordSchema = z2.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number");
var loginSchema = z2.object({
  email: z2.string().email("Please enter a valid email address"),
  password: z2.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z2.boolean().optional()
});
var registerSchema = z2.object({
  name: z2.string().min(2, "Name must be at least 2 characters"),
  email: z2.string().email("Please enter a valid email address"),
  password: passwordSchema,
  confirmPassword: z2.string().min(8, "Please confirm your password"),
  phoneNumber: z2.string().min(3, "Please enter a valid phone number").regex(/^\+?[0-9\s\-\(\)]+$/, "Phone number can only contain numbers, spaces, +, -, ( and )"),
  country: z2.string().min(2, "Please select a country")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
var forgotPasswordSchema = z2.object({
  email: z2.string().email("Please enter a valid email address")
});
var resetPasswordSchema = z2.object({
  password: passwordSchema,
  confirmPassword: z2.string().min(8, "Please confirm your password")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
var urlSubmissionSchema = z2.object({
  url: z2.string().url("Please enter a valid URL"),
  keyLocation: z2.string().url("Key location URL").optional()
});
var indexStatusSchema = z2.object({
  url: z2.string().url(),
  status: z2.enum(["pending", "submitted", "indexed", "failed", "skipped"]),
  submittedAt: z2.string().datetime(),
  indexedAt: z2.string().datetime().optional(),
  errorMessage: z2.string().optional()
});
var createJobSchema = z2.object({
  name: z2.string().min(1, "Job name is required"),
  type: z2.enum(["manual"]),
  schedule_type: z2.enum(["one-time", "hourly", "daily", "weekly", "monthly"]).default("one-time"),
  source_data: z2.object({
    urls: z2.array(z2.string().url()).optional()
  })
});
var updateUserProfileSchema = z2.object({
  full_name: z2.string().min(1, "Full name is required").optional(),
  email_notifications: z2.boolean().optional(),
  phone_number: z2.string().optional()
});
var updateUserSettingsSchema = z2.object({
  timeout_duration: z2.number().min(1e3).max(3e5).optional(),
  // 1s to 5min
  retry_attempts: z2.number().min(1).max(10).optional(),
  email_job_completion: z2.boolean().optional(),
  email_job_failure: z2.boolean().optional(),
  email_quota_alerts: z2.boolean().optional(),
  default_schedule: z2.enum(["one-time", "hourly", "daily", "weekly", "monthly"]).optional(),
  email_daily_report: z2.boolean().optional()
});
var changePasswordSchema = z2.object({
  currentPassword: z2.string().min(8, "Current password is required"),
  newPassword: z2.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z2.string().min(8, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"]
});
var updateSiteSettingsSchema = z2.object({
  site_name: z2.string().min(1, "Site name is required").optional(),
  site_tagline: z2.string().optional(),
  site_description: z2.string().optional(),
  site_logo_url: z2.string().url().optional().or(z2.literal("")),
  white_logo: z2.string().url().optional().or(z2.literal("")),
  site_icon_url: z2.string().url().optional().or(z2.literal("")),
  site_favicon_url: z2.string().url().optional().or(z2.literal("")),
  contact_email: z2.string().email().optional().or(z2.literal("")),
  support_email: z2.string().email().optional().or(z2.literal("")),
  maintenance_mode: z2.boolean().optional(),
  registration_enabled: z2.boolean().optional()
});
var apiRequestSchemas = {
  // Admin user management schemas
  adminUserAction: z2.object({
    userId: z2.string().regex(VALIDATION_PATTERNS.UUID, "Invalid user ID format"),
    action: z2.enum([
      "suspend",
      "activate",
      "reset-password",
      "reset-quota",
      "extend-subscription",
      "change-package"
    ]),
    reason: z2.string().min(10).max(FIELD_LIMITS.MESSAGE.max),
    additionalData: z2.record(z2.unknown()).optional()
  }),
  // Query parameter schemas
  paginationQuery: z2.object({
    page: z2.string().transform((val) => parseInt(val, 10)).pipe(z2.number().min(1).max(1e3)).optional().default("1"),
    limit: z2.string().transform((val) => parseInt(val, 10)).pipe(z2.number().min(1).max(1e3)).optional().default("10")
  }),
  ordersQuery: z2.object({
    page: z2.string().transform((val) => parseInt(val, 10)).pipe(z2.number().min(1).max(1e3)).optional().default("1"),
    limit: z2.string().transform((val) => parseInt(val, 10)).pipe(z2.number().min(1).max(100)).optional().default("10"),
    status: z2.enum(["pending", "proof_uploaded", "completed", "failed", "cancelled"]).optional(),
    customer: z2.string().max(100).optional(),
    package_id: z2.string().regex(VALIDATION_PATTERNS.UUID).optional(),
    date_from: z2.string().datetime().optional(),
    date_to: z2.string().datetime().optional(),
    amount_min: z2.string().transform((val) => parseFloat(val)).pipe(z2.number().min(0)).optional(),
    amount_max: z2.string().transform((val) => parseFloat(val)).pipe(z2.number().min(0)).optional()
  }),
  adminActivityQuery: z2.object({
    days: z2.string().transform((val) => parseInt(val, 10)).pipe(z2.number().min(1).max(365)).optional().default("7"),
    limit: z2.string().transform((val) => parseInt(val, 10)).pipe(z2.number().min(1).max(500)).optional().default("100"),
    page: z2.string().transform((val) => parseInt(val, 10)).pipe(z2.number().min(1).max(1e3)).optional().default("1"),
    user: z2.string().regex(VALIDATION_PATTERNS.UUID).optional(),
    search: z2.string().max(100).optional(),
    event_type: z2.enum([
      "all",
      "login",
      "logout",
      "admin_action",
      "order_management",
      "user_management",
      "system_action"
    ]).optional().default("all")
  }),
  keywordsQuery: z2.object({
    domain_id: z2.string().regex(VALIDATION_PATTERNS.UUID, "Invalid domain ID").optional(),
    device_type: z2.enum(["desktop", "mobile", "tablet"]).optional(),
    country_id: z2.string().regex(VALIDATION_PATTERNS.UUID, "Invalid country ID").optional(),
    tags: z2.string().optional(),
    search: z2.string().max(100).optional(),
    sort: z2.enum(["keyword", "position", "created_at", "updated_at"]).optional(),
    order: z2.enum(["asc", "desc"]).optional(),
    page: z2.string().transform((val) => parseInt(val, 10)).pipe(z2.number().min(1).max(1e3)).optional().default("1"),
    limit: z2.string().transform((val) => parseInt(val, 10)).pipe(z2.number().min(1).max(1e3)).optional().default("20")
  }),
  // URL parameter schemas
  idParam: z2.object({
    id: z2.string().regex(VALIDATION_PATTERNS.UUID, "Invalid ID format")
  }),
  // Bulk operation schemas
  bulkKeywordDelete: z2.object({
    keyword_ids: z2.array(z2.string().regex(VALIDATION_PATTERNS.UUID)).min(1).max(NUMERIC_LIMITS.BULK_OPERATIONS.max),
    confirm: z2.boolean().refine((val) => val === true, "Confirmation required for bulk delete")
  }),
  // Rank tracking schemas
  keywordCreate: z2.object({
    keyword: z2.string().min(FIELD_LIMITS.KEYWORD.min).max(FIELD_LIMITS.KEYWORD.max),
    domain: z2.string().regex(VALIDATION_PATTERNS.DOMAIN),
    country: z2.string().length(2),
    device: z2.enum(["desktop", "mobile", "tablet"]).default("desktop"),
    search_engine: z2.enum(["google", "bing", "yahoo"]).default("google"),
    target_url: z2.string().url().optional(),
    tags: z2.array(z2.string().max(FIELD_LIMITS.TAG.max)).max(10).optional()
  }),
  rankCheckTrigger: z2.object({
    keyword_ids: z2.array(z2.string().regex(VALIDATION_PATTERNS.UUID)).min(1).max(100),
    force_refresh: z2.boolean().default(false),
    priority: z2.enum(["low", "normal", "high"]).default("normal")
  }),
  // Settings and configuration
  siteSettingsUpdate: z2.object({
    id: z2.string().regex(VALIDATION_PATTERNS.UUID).optional(),
    // For updates
    site_name: z2.string().min(1).max(100).optional(),
    site_tagline: z2.string().max(200).optional(),
    site_description: z2.string().max(500).optional(),
    site_logo_url: z2.string().url().optional(),
    white_logo: z2.string().url().optional(),
    site_icon_url: z2.string().url().optional(),
    site_favicon_url: z2.string().url().optional(),
    contact_email: z2.string().regex(VALIDATION_PATTERNS.EMAIL).optional(),
    support_email: z2.string().regex(VALIDATION_PATTERNS.EMAIL).optional(),
    maintenance_mode: z2.boolean().optional(),
    registration_enabled: z2.boolean().optional()
  }),
  // Admin user management request bodies
  adminChangePackage: z2.object({
    packageId: z2.string().regex(VALIDATION_PATTERNS.UUID, "Invalid package ID"),
    reason: z2.string().min(10).max(FIELD_LIMITS.MESSAGE.max),
    effectiveDate: z2.string().datetime().optional(),
    notifyUser: z2.boolean().default(true)
  }),
  adminResetPassword: z2.object({
    newPassword: z2.string().min(8).max(128),
    reason: z2.string().min(10).max(FIELD_LIMITS.MESSAGE.max),
    forcePasswordChange: z2.boolean().default(true),
    notifyUser: z2.boolean().default(true)
  }),
  adminExtendSubscription: z2.object({
    extensionPeriod: z2.number().min(1).max(365),
    // Days
    reason: z2.string().min(10).max(FIELD_LIMITS.MESSAGE.max),
    addToExisting: z2.boolean().default(true)
  }),
  // URL Parameter validation schemas for dynamic routes
  uuidParam: z2.object({
    id: z2.string().regex(VALIDATION_PATTERNS.UUID, "Invalid ID format - must be a valid UUID")
  }),
  slugParam: z2.object({
    slug: z2.string().regex(
      VALIDATION_PATTERNS.SLUG,
      "Invalid slug format - must contain only lowercase letters, numbers, and dashes"
    )
  }),
  keywordIdParam: z2.object({
    keywordId: z2.string().regex(VALIDATION_PATTERNS.UUID, "Invalid keyword ID format")
  }),
  domainIdParam: z2.object({
    domainId: z2.string().regex(VALIDATION_PATTERNS.UUID, "Invalid domain ID format")
  })
};
export {
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
};
//# sourceMappingURL=schema.mjs.map