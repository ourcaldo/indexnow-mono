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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ACTIVITY_ENDPOINTS: () => ACTIVITY_ENDPOINTS,
  ADMIN_ENDPOINTS: () => ADMIN_ENDPOINTS,
  API_BASE: () => API_BASE,
  APP_METADATA: () => APP_METADATA,
  AUTH_ENDPOINTS: () => AUTH_ENDPOINTS,
  ActivityEventTypes: () => ActivityEventTypes,
  AdminSchemas: () => AdminSchemas,
  ApiEndpoints: () => ApiEndpoints,
  AppConfig: () => AppConfig,
  AppError: () => AppError,
  AutoCancelJobSchema: () => AutoCancelJobSchema,
  BILLING_ENDPOINTS: () => BILLING_ENDPOINTS,
  BackoffStrategies: () => BackoffStrategies,
  BaseSchemas: () => BaseSchemas,
  CACHE_KEYS: () => CACHE_KEYS,
  CACHE_TTL: () => CACHE_TTL,
  CircuitBreaker: () => CircuitBreaker,
  CircuitBreakerManager: () => CircuitBreakerManager,
  CircuitState: () => CircuitState,
  ConfigSchema: () => ConfigSchema,
  CustomValidators: () => CustomValidators,
  DASHBOARD_ENDPOINTS: () => DASHBOARD_ENDPOINTS,
  DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
  EMAIL_TEMPLATES: () => EMAIL_TEMPLATES,
  ERROR_ENDPOINTS: () => ERROR_ENDPOINTS,
  EXTERNAL_ENDPOINTS: () => EXTERNAL_ENDPOINTS,
  EmailJobSchema: () => EmailJobSchema,
  ErrorHandlingService: () => ErrorHandlingService,
  ErrorSeverity: () => ErrorSeverity,
  ErrorType: () => ErrorType,
  ExponentialBackoff: () => ExponentialBackoff,
  FIELD_LIMITS: () => FIELD_LIMITS,
  FILE_UPLOAD: () => FILE_UPLOAD,
  FallbackHandler: () => FallbackHandler,
  FallbackHandlers: () => FallbackHandlers,
  FileValidation: () => FileValidation,
  HTTP_STATUS: () => HTTP_STATUS,
  INTEGRATION_ENDPOINTS: () => INTEGRATION_ENDPOINTS,
  ImmediateRankCheckJobSchema: () => ImmediateRankCheckJobSchema,
  JOB_STATUS: () => JOB_STATUS,
  JOB_TYPES: () => JOB_TYPES,
  KeywordEnrichmentJobSchema: () => KeywordEnrichmentJobSchema,
  LEGACY_ENDPOINTS: () => LEGACY_ENDPOINTS,
  NOTIFICATION_ENDPOINTS: () => NOTIFICATION_ENDPOINTS,
  NOTIFICATION_TYPES: () => NOTIFICATION_TYPES,
  NUMERIC_LIMITS: () => NUMERIC_LIMITS,
  PAGINATION: () => PAGINATION,
  PAYMENT_ENDPOINTS: () => PAYMENT_ENDPOINTS,
  PUBLIC_ENDPOINTS: () => PUBLIC_ENDPOINTS,
  PaymentSchemas: () => PaymentSchemas,
  PaymentWebhookJobSchema: () => PaymentWebhookJobSchema,
  RANK_TRACKING: () => RANK_TRACKING,
  RANK_TRACKING_ENDPOINTS: () => RANK_TRACKING_ENDPOINTS,
  RATE_LIMITS: () => RATE_LIMITS,
  REGEX_PATTERNS: () => REGEX_PATTERNS,
  ROLE_PERMISSIONS: () => ROLE_PERMISSIONS,
  RankTrackingSchemas: () => RankTrackingSchemas,
  Resilient: () => Resilient,
  ResilientOperationExecutor: () => ResilientOperationExecutor,
  SCHEDULE_TYPES: () => SCHEDULE_TYPES,
  SYSTEM_ENDPOINTS: () => SYSTEM_ENDPOINTS,
  ServiceCircuitBreakers: () => ServiceCircuitBreakers,
  TIME: () => TIME,
  USER_ERROR_MESSAGES: () => USER_ERROR_MESSAGES,
  USER_ROLES: () => USER_ROLES,
  UserSchemas: () => UserSchemas,
  VALIDATION_PATTERNS: () => VALIDATION_PATTERNS,
  apiRequestSchemas: () => apiRequestSchemas,
  buildEndpoint: () => buildEndpoint,
  capitalizeFirstLetter: () => capitalizeFirstLetter,
  changePasswordSchema: () => changePasswordSchema,
  cn: () => cn,
  countries: () => countries,
  createApiKeySchema: () => createApiKeySchema,
  createAppConfig: () => createAppConfig,
  createFallbackHandler: () => createFallbackHandler,
  createPaymentSchema: () => createPaymentSchema,
  createRefundSchema: () => createRefundSchema,
  createSubscriptionSchema: () => createSubscriptionSchema,
  customerInfoSchema: () => customerInfoSchema2,
  ensureProtocol: () => ensureProtocol,
  escapeLikePattern: () => escapeLikePattern,
  extractDomain: () => extractDomain,
  findCountryByCode: () => findCountryByCode,
  findCountryByName: () => findCountryByName,
  forgotPasswordSchema: () => forgotPasswordSchema,
  formatCurrency: () => formatCurrency,
  formatDate: () => formatDate,
  formatDeviceInfo: () => formatDeviceInfo,
  formatError: () => formatError,
  formatLocationData: () => formatLocationData,
  formatNumber: () => formatNumber,
  formatRelativeTime: () => formatRelativeTime,
  formatSuccess: () => formatSuccess,
  getClientIP: () => getClientIP,
  getCurrencySymbol: () => getCurrencySymbol,
  getPopularCountries: () => getPopularCountries,
  getRequestInfo: () => getRequestInfo,
  getSecurityRiskLevel: () => getSecurityRiskLevel,
  isDevelopment: () => isDevelopment,
  isMaintenanceMode: () => isMaintenanceMode,
  isProduction: () => isProduction,
  isRateLimited: () => isRateLimited,
  isStaging: () => isStaging,
  isValidEndpoint: () => isValidEndpoint,
  isValidUrl: () => isValidUrl,
  logger: () => logger,
  loginSchema: () => loginSchema,
  normalizeUrl: () => normalizeUrl,
  parseUserAgent: () => parseUserAgent,
  recordFailedAttempt: () => recordFailedAttempt,
  registerSchema: () => registerSchema,
  removeUrlParameters: () => removeUrlParameters,
  resetPasswordSchema: () => resetPasswordSchema,
  resetRateLimit: () => resetRateLimit,
  retryWithBackoff: () => retryWithBackoff,
  setLoggerTransport: () => setLoggerTransport,
  setRateLimitStore: () => setRateLimitStore,
  sleep: () => sleep,
  truncateString: () => truncateString,
  updateSiteSettingsSchema: () => updateSiteSettingsSchema,
  updateUserProfileSchema: () => updateUserProfileSchema,
  updateUserSettingsSchema: () => updateUserSettingsSchema,
  validatePromoCodeSchema: () => validatePromoCodeSchema
});
module.exports = __toCommonJS(index_exports);

// src/schema.ts
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
var FileValidation = {
  validateFileType: (fileName, allowedTypes) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
    return allowedTypes.includes(extension);
  },
  validateFileSize: (fileSize, maxSize = NUMERIC_LIMITS.FILE_SIZE.max) => {
    return fileSize <= maxSize && fileSize >= NUMERIC_LIMITS.FILE_SIZE.min;
  },
  validateUrlList: (content) => {
    const urls = content.split("\n").map((url) => url.trim()).filter((url) => url.length > 0);
    const validUrls = [];
    const errors = [];
    urls.forEach((url, index) => {
      if (VALIDATION_PATTERNS.URL.test(url)) {
        validUrls.push(url);
      } else {
        errors.push(`Invalid URL at line ${index + 1}: ${url}`);
      }
    });
    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
    return validUrls;
  }
};
var CustomValidators = {
  isStrongPassword: (password) => {
    return VALIDATION_PATTERNS.PASSWORD.test(password);
  },
  isValidCronExpression: (cron) => {
    return VALIDATION_PATTERNS.CRON.test(cron);
  },
  isValidDomain: (domain) => {
    return VALIDATION_PATTERNS.DOMAIN.test(domain);
  },
  isBusinessEmail: (email) => {
    const freeEmailDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "aol.com",
      "icloud.com",
      "protonmail.com",
      "tempmail.org",
      "10minutemail.com",
      "guerrillamail.com"
    ];
    if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
      return false;
    }
    const domain = email.split("@")[1].toLowerCase();
    return !freeEmailDomains.includes(domain);
  },
  sanitizeInput: (input) => {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/[<>]/g, "").trim();
  }
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

// src/core/config/AppConfig.ts
var import_zod3 = require("zod");
var optionalUrl = import_zod3.z.preprocess(
  (val) => typeof val === "string" && val.trim() === "" ? void 0 : val,
  import_zod3.z.string().url().optional()
);
var AppSchema = import_zod3.z.object({
  name: import_zod3.z.string().default("IndexNow Studio"),
  version: import_zod3.z.string().default("1.0.0"),
  environment: import_zod3.z.enum(["development", "staging", "production"]).default("production"),
  baseUrl: import_zod3.z.string().url().default("http://localhost:3000"),
  dashboardUrl: optionalUrl,
  backendUrl: optionalUrl,
  apiBaseUrl: optionalUrl,
  port: import_zod3.z.coerce.number().default(3e3),
  allowedOrigins: import_zod3.z.array(import_zod3.z.string()).default([])
});
var SupabaseSchema = import_zod3.z.object({
  url: import_zod3.z.string().url(),
  anonKey: import_zod3.z.string().min(1),
  serviceRoleKey: import_zod3.z.string().min(1).optional(),
  jwtSecret: import_zod3.z.string().min(1).optional(),
  bucketName: import_zod3.z.string().default("indexnow-public")
});
var SecuritySchema = import_zod3.z.object({
  encryptionKey: import_zod3.z.string().min(1).optional(),
  encryptionMasterKey: import_zod3.z.string().min(1).optional(),
  jwtSecret: import_zod3.z.string().min(1).optional(),
  systemApiKey: import_zod3.z.string().min(1).optional()
});
var RedisSchema = import_zod3.z.object({
  host: import_zod3.z.string().optional(),
  port: import_zod3.z.coerce.number().optional(),
  user: import_zod3.z.string().optional(),
  password: import_zod3.z.string().optional(),
  url: import_zod3.z.string().optional()
});
var BullMQSchema = import_zod3.z.object({
  concurrency: import_zod3.z.object({
    rankCheck: import_zod3.z.coerce.number().default(5),
    email: import_zod3.z.coerce.number().default(10),
    payments: import_zod3.z.coerce.number().default(3)
  }),
  rateLimit: import_zod3.z.object({
    rankCheck: import_zod3.z.object({
      max: import_zod3.z.coerce.number().default(28),
      duration: import_zod3.z.coerce.number().default(6e4)
    }),
    email: import_zod3.z.object({
      max: import_zod3.z.coerce.number().default(50),
      duration: import_zod3.z.coerce.number().default(6e4)
    })
  })
});
var PaddleSchema = import_zod3.z.object({
  apiKey: import_zod3.z.string().min(1).optional(),
  webhookSecret: import_zod3.z.string().min(1).optional(),
  clientToken: import_zod3.z.string().min(1).optional(),
  environment: import_zod3.z.enum(["sandbox", "production"]).default("sandbox")
});
var MonitoringSchema = import_zod3.z.object({
  sentry: import_zod3.z.object({
    dsn: optionalUrl,
    environment: import_zod3.z.string().default("development"),
    traceSampleRate: import_zod3.z.coerce.number().default(0.1),
    replaysSessionRate: import_zod3.z.coerce.number().default(0.1),
    replaysErrorRate: import_zod3.z.coerce.number().default(1)
  }),
  posthog: import_zod3.z.object({
    key: import_zod3.z.string().optional(),
    host: import_zod3.z.string().url().default("https://app.posthog.com")
  }),
  ga4: import_zod3.z.object({
    measurementId: import_zod3.z.string().optional()
  }),
  logLevel: import_zod3.z.enum(["debug", "info", "warn", "error"]).default("info")
});
var EmailSchema = import_zod3.z.object({
  smtp: import_zod3.z.object({
    host: import_zod3.z.string().optional(),
    port: import_zod3.z.coerce.number().optional(),
    user: import_zod3.z.string().optional(),
    pass: import_zod3.z.string().optional(),
    fromName: import_zod3.z.string().default("IndexNow"),
    fromEmail: import_zod3.z.string().optional()
  })
});
var ConfigSchema = import_zod3.z.object({
  app: AppSchema,
  supabase: SupabaseSchema,
  security: SecuritySchema,
  redis: RedisSchema,
  bullmq: BullMQSchema,
  paddle: PaddleSchema,
  monitoring: MonitoringSchema,
  email: EmailSchema
});
var createAppConfig = () => {
  const rawConfig = {
    app: {
      name: process.env.NEXT_PUBLIC_APP_NAME,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      environment: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL,
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
      port: process.env.PORT,
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || void 0
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecret: process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET,
      bucketName: process.env.SUPABASE_BUCKET_NAME
    },
    security: {
      encryptionKey: process.env.ENCRYPTION_KEY,
      encryptionMasterKey: process.env.ENCRYPTION_MASTER_KEY,
      jwtSecret: process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET,
      systemApiKey: process.env.SYSTEM_API_KEY
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      user: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      url: process.env.REDIS_URL
    },
    bullmq: {
      concurrency: {
        rankCheck: process.env.BULLMQ_CONCURRENCY_RANK_CHECK,
        email: process.env.BULLMQ_CONCURRENCY_EMAIL,
        payments: process.env.BULLMQ_CONCURRENCY_PAYMENTS
      },
      rateLimit: {
        rankCheck: {
          max: process.env.BULLMQ_RATE_LIMIT_RANK_CHECK_MAX,
          duration: process.env.BULLMQ_RATE_LIMIT_RANK_CHECK_DURATION
        },
        email: {
          max: process.env.BULLMQ_RATE_LIMIT_EMAIL_MAX,
          duration: process.env.BULLMQ_RATE_LIMIT_EMAIL_DURATION
        }
      }
    },
    paddle: {
      apiKey: process.env.PADDLE_API_KEY,
      webhookSecret: process.env.PADDLE_WEBHOOK_SECRET,
      clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV
    },
    monitoring: {
      sentry: {
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
        traceSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE,
        replaysSessionRate: process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_RATE,
        replaysErrorRate: process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_RATE
      },
      posthog: {
        key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST
      },
      ga4: {
        measurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
      },
      logLevel: process.env.LOG_LEVEL
    },
    email: {
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        fromName: process.env.SMTP_FROM_NAME,
        fromEmail: process.env.SMTP_FROM_EMAIL
      }
    }
  };
  const parsed = ConfigSchema.safeParse(rawConfig);
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  if (!parsed.success) {
    const errorMsg = "\u274C Invalid configuration: " + JSON.stringify(parsed.error.format(), null, 2);
    if (isBuildPhase) {
      console.warn(
        "[AppConfig] Build-time config validation failed (non-fatal during build):",
        errorMsg
      );
      const buildStub = rawConfig;
      return new Proxy(buildStub, {
        get(target, prop) {
          const value = target[prop];
          if (value === void 0 && typeof prop === "string" && prop !== "then") {
            console.warn(`[AppConfig] Build-time access to missing config key: ${prop}`);
          }
          return value;
        }
      });
    }
    if (typeof window === "undefined") {
      console.error(errorMsg);
    } else {
      console.warn(errorMsg);
    }
    throw new Error(errorMsg);
  }
  if (parsed.data.app.environment === "production" && !isBuildPhase) {
    const missing = [];
    const warnings = [];
    if (!parsed.data.security.encryptionKey) missing.push("ENCRYPTION_KEY");
    if (!parsed.data.security.encryptionMasterKey) missing.push("ENCRYPTION_MASTER_KEY");
    if (!parsed.data.security.jwtSecret) missing.push("JWT_SECRET");
    if (!parsed.data.security.systemApiKey) missing.push("SYSTEM_API_KEY");
    if (!parsed.data.supabase.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!parsed.data.supabase.jwtSecret) missing.push("SUPABASE_JWT_SECRET");
    if (!parsed.data.redis.host && !parsed.data.redis.url) missing.push("REDIS_HOST or REDIS_URL");
    if (!parsed.data.email.smtp.host) missing.push("SMTP_HOST");
    if (!parsed.data.email.smtp.user) missing.push("SMTP_USER");
    if (!parsed.data.email.smtp.pass) missing.push("SMTP_PASS");
    if (!parsed.data.paddle.apiKey) warnings.push("PADDLE_API_KEY (payments will be unavailable)");
    if (!parsed.data.paddle.webhookSecret)
      warnings.push("PADDLE_WEBHOOK_SECRET (webhook verification disabled)");
    if (!parsed.data.monitoring.sentry.dsn)
      warnings.push("NEXT_PUBLIC_SENTRY_DSN (error tracking disabled)");
    if (warnings.length > 0) {
      console.warn(`\u26A0\uFE0F  Missing recommended production variables:
  - ${warnings.join("\n  - ")}`);
    }
    if (missing.length > 0) {
      const errorMsg = `\u274C Missing required production environment variables: ${missing.join(", ")}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }
  return parsed.data;
};
var AppConfig = createAppConfig();
var isProduction = () => AppConfig.app.environment === "production";
var isDevelopment = () => AppConfig.app.environment === "development";
var isStaging = () => AppConfig.app.environment === "staging";
var isMaintenanceMode = () => false;

// src/constants/ApiEndpoints.ts
var normalizeApiBaseUrl = (url) => {
  return url.replace(/\/+$/, "");
};
var API_BASE_URL = normalizeApiBaseUrl(
  AppConfig.app.apiBaseUrl || `${AppConfig.app.baseUrl || ""}/api`
);
var API_BASE = {
  V1: `${API_BASE_URL}/v1`,
  SYSTEM: `${API_BASE_URL}/system`,
  PUBLIC: `${API_BASE_URL}/v1/public`
};
var AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE.V1}/auth/login`,
  LOGOUT: `${API_BASE.V1}/auth/logout`,
  REGISTER: `${API_BASE.V1}/auth/register`,
  SESSION: `${API_BASE.V1}/auth/session`,
  DETECT_LOCATION: `${API_BASE.V1}/auth/detect-location`,
  RESEND_VERIFICATION: `${API_BASE.V1}/auth/resend-verification`,
  CHANGE_PASSWORD: `${API_BASE.V1}/auth/user/change-password`,
  AVATAR: `${API_BASE.V1}/auth/user/avatar`,
  PROFILE: `${API_BASE.V1}/auth/user/profile`,
  PROFILE_COMPLETE: `${API_BASE.V1}/auth/user/profile/complete`,
  SETTINGS: `${API_BASE.V1}/auth/user/settings`,
  QUOTA: `${API_BASE.V1}/auth/user/quota`,
  QUOTA_HISTORY: (days) => `${API_BASE.V1}/auth/user/quota/history?days=${days}`,
  QUOTA_ALERTS: `${API_BASE.V1}/auth/user/quota/alerts`,
  QUOTA_ALERT_ACKNOWLEDGE: (alertId) => `${API_BASE.V1}/auth/user/quota/alerts/${alertId}/acknowledge`,
  QUOTA_INCREASE_REQUEST: `${API_BASE.V1}/auth/user/quota/increase-request`,
  TRIAL_ELIGIBILITY: `${API_BASE.V1}/auth/user/trial-eligibility`,
  TRIAL_STATUS: `${API_BASE.V1}/auth/user/trial-status`
};
var ADMIN_ENDPOINTS = {
  DASHBOARD: `${API_BASE.V1}/admin/dashboard`,
  VERIFY_ROLE: `${API_BASE.V1}/admin/verify-role`,
  // User management
  USERS: `${API_BASE.V1}/admin/users`,
  USER_BY_ID: (id) => `${API_BASE.V1}/admin/users/${id}`,
  USER_ROLE: (id) => `${API_BASE.V1}/admin/users/${id}/role`,
  SUSPEND_USER: (id) => `${API_BASE.V1}/admin/users/${id}/suspend`,
  RESET_USER_PASSWORD: (id) => `${API_BASE.V1}/admin/users/${id}/reset-password`,
  EXTEND_SUBSCRIPTION: (id) => `${API_BASE.V1}/admin/users/${id}/extend-subscription`,
  CHANGE_PACKAGE: (id) => `${API_BASE.V1}/admin/users/${id}/change-package`,
  USER_SECURITY: (id) => `${API_BASE.V1}/admin/users/${id}/security`,
  USER_QUOTA_USAGE: (id) => `${API_BASE.V1}/admin/users/${id}/quota-usage`,
  USER_API_STATS: (id) => `${API_BASE.V1}/admin/users/${id}/api-stats`,
  // Order management
  ORDERS: `${API_BASE.V1}/admin/orders`,
  ORDER_BY_ID: (id) => `${API_BASE.V1}/admin/orders/${id}`,
  ORDER_STATUS: (id) => `${API_BASE.V1}/admin/orders/${id}/status`,
  // Package management
  PACKAGES: `${API_BASE.V1}/admin/packages`,
  PACKAGE_BY_ID: (id) => `${API_BASE.V1}/admin/settings/packages/${id}`,
  // Activity logs
  ACTIVITY: `${API_BASE.V1}/admin/activity`,
  ACTIVITY_BY_ID: (id) => `${API_BASE.V1}/admin/activity/${id}`,
  // Error management
  ERRORS: `${API_BASE.V1}/admin/errors`,
  ERROR_BY_ID: (id) => `${API_BASE.V1}/admin/errors/${id}`,
  ERROR_STATS: `${API_BASE.V1}/admin/errors/stats`,
  CRITICAL_ERRORS: `${API_BASE.V1}/admin/errors/critical`,
  // System quota
  QUOTA_STATUS: `${API_BASE.V1}/admin/quota/status`,
  QUOTA_HEALTH: `${API_BASE.V1}/admin/quota/health`,
  QUOTA_REPORT: `${API_BASE.V1}/admin/quota/report`,
  // Rank Tracker Admin
  RANK_TRACKER_TRIGGER_MANUAL_CHECK: `${API_BASE.V1}/admin/rank-tracker/trigger-manual-check`,
  // Settings
  SITE_SETTINGS: `${API_BASE.V1}/admin/settings/site`,
  TEST_EMAIL: `${API_BASE.V1}/admin/settings/site/test-email`,
  PAYMENT_GATEWAYS: `${API_BASE.V1}/admin/settings/payments`,
  PAYMENT_GATEWAY_BY_ID: (id) => `${API_BASE.V1}/admin/settings/payments/${id}`,
  PAYMENT_GATEWAY_DEFAULT: (id) => `${API_BASE.V1}/admin/settings/payments/${id}/default`,
  SMTP_SETTINGS: `${API_BASE.V1}/admin/settings/smtp`,
  API_KEYS: `${API_BASE.V1}/admin/settings/api-keys`
};
var RANK_TRACKING_ENDPOINTS = {
  KEYWORDS: `${API_BASE.V1}/rank-tracking/keywords`,
  KEYWORD_BY_ID: (id) => `${API_BASE.V1}/rank-tracking/keywords/${id}`,
  KEYWORD_HISTORY: (id) => `${API_BASE.V1}/rank-tracking/keywords/${id}/history`,
  KEYWORD_USAGE: `${API_BASE.V1}/rank-tracking/keyword-usage`,
  KEYWORDS_BULK: `${API_BASE.V1}/rank-tracking/keywords/bulk`,
  BULK_DELETE_KEYWORDS: `${API_BASE.V1}/rank-tracking/keywords/bulk-delete`,
  ADD_KEYWORD_TAG: `${API_BASE.V1}/rank-tracking/keywords/add-tag`,
  CHECK_RANK: `${API_BASE.V1}/rank-tracking/check-rank`,
  RANKINGS_CHECK: `${API_BASE.V1}/rank-tracking/rankings/check`,
  RANK_HISTORY: `${API_BASE.V1}/rank-tracking/rank-history`,
  STATS: `${API_BASE.V1}/rank-tracking/stats`,
  COMPETITORS: `${API_BASE.V1}/rank-tracking/competitors`,
  EXPORT: `${API_BASE.V1}/rank-tracking/export`,
  DOMAINS: `${API_BASE.V1}/rank-tracking/domains`,
  COUNTRIES: `${API_BASE.V1}/rank-tracking/countries`,
  WEEKLY_TRENDS: `${API_BASE.V1}/rank-tracking/weekly-trends`
};
var BILLING_ENDPOINTS = {
  OVERVIEW: `${API_BASE.V1}/billing/overview`,
  HISTORY: `${API_BASE.V1}/billing/history`,
  PACKAGES: `${API_BASE.V1}/billing/packages`,
  PACKAGE_BY_ID: (id) => `${API_BASE.V1}/billing/packages/${id}`,
  PAYMENT: `${API_BASE.V1}/billing/payment`,
  PAYMENT_GATEWAYS: `${API_BASE.V1}/billing/payment-gateways`,
  UPLOAD_PROOF: `${API_BASE.V1}/billing/upload-proof`,
  CANCEL_TRIAL: `${API_BASE.V1}/billing/cancel-trial`,
  // Orders (user-side)
  ORDER_BY_ID: (id) => `${API_BASE.V1}/billing/orders/${id}`,
  // Transactions
  TRANSACTIONS: `${API_BASE.V1}/billing/transactions`,
  TRANSACTION_BY_ID: (id) => `${API_BASE.V1}/billing/transactions/${id}`
};
var PAYMENT_ENDPOINTS = {
  PADDLE_CONFIG: `${API_BASE.V1}/payments/paddle/config`,
  // Reserved for Paddle webhook endpoints
  CUSTOMER_PORTAL: `${API_BASE.V1}/payments/paddle/customer-portal`
};
var ACTIVITY_ENDPOINTS = {
  LOG: `${API_BASE.V1}/activity`
  // For regular users to log their own activities
};
var NOTIFICATION_ENDPOINTS = {
  DISMISS: (id) => `${API_BASE.V1}/notifications/dismiss/${id}`
};
var DASHBOARD_ENDPOINTS = {
  MAIN: `${API_BASE.V1}/dashboard`
};
var PUBLIC_ENDPOINTS = {
  PACKAGES: `${API_BASE.PUBLIC}/packages`,
  SITE_SETTINGS: `${API_BASE.PUBLIC}/site-settings`,
  SETTINGS: `${API_BASE.V1}/public/settings`
};
var SYSTEM_ENDPOINTS = {
  HEALTH: `${API_BASE.V1}/system/health`,
  STATUS: `${API_BASE.V1}/system/status`
};
var ERROR_ENDPOINTS = {
  LOG: `${API_BASE.V1}/errors/log`
};
var EXTERNAL_ENDPOINTS = {
  EXCHANGE_RATE_API: "https://api.exchangerate-api.com/v4/latest/USD"
};
var INTEGRATION_ENDPOINTS = {
  // SeRanking integration
  SERANKING_KEYWORD_DATA: `${API_BASE.V1}/integrations/seranking/keyword-data`,
  SERANKING_KEYWORD_DATA_BULK: `${API_BASE.V1}/integrations/seranking/keyword-data/bulk`,
  SERANKING_QUOTA_STATUS: `${API_BASE.V1}/integrations/seranking/quota/status`,
  SERANKING_QUOTA_HISTORY: `${API_BASE.V1}/integrations/seranking/quota/history`,
  SERANKING_HEALTH: `${API_BASE.V1}/integrations/seranking/health`,
  SERANKING_HEALTH_METRICS: `${API_BASE.V1}/integrations/seranking/health/metrics`
};
var LEGACY_ENDPOINTS = {
  // Reserved for legacy endpoint compatibility
};
var buildEndpoint = (endpoint, params) => {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  return `${endpoint}?${searchParams.toString()}`;
};
var isValidEndpoint = (endpoint) => {
  const staticEndpoints = [
    ...Object.values(AUTH_ENDPOINTS).filter((ep) => typeof ep === "string"),
    ...Object.values(RANK_TRACKING_ENDPOINTS).filter((ep) => typeof ep === "string"),
    ...Object.values(BILLING_ENDPOINTS).filter((ep) => typeof ep === "string"),
    ...Object.values(PAYMENT_ENDPOINTS).filter((ep) => typeof ep === "string"),
    ...Object.values(NOTIFICATION_ENDPOINTS).filter((ep) => typeof ep === "string"),
    ...Object.values(SYSTEM_ENDPOINTS).filter((ep) => typeof ep === "string"),
    ...Object.values(INTEGRATION_ENDPOINTS).filter((ep) => typeof ep === "string")
  ];
  if (staticEndpoints.includes(endpoint)) {
    return true;
  }
  const adminPatterns = [
    /^\/api\/v1\/admin\/users\/[a-f0-9-]+$/,
    /^\/api\/v1\/admin\/users\/[a-f0-9-]+\/(reset-password|extend-subscription|change-package|security|quota-usage)$/,
    /^\/api\/v1\/admin\/orders\/[a-f0-9-]+$/,
    /^\/api\/v1\/admin\/orders\/[a-f0-9-]+\/status$/,
    /^\/api\/v1\/admin\/activity\/[a-f0-9-]+$/
  ];
  return adminPatterns.some((pattern) => pattern.test(endpoint));
};
var ApiEndpoints = {
  BASE: API_BASE,
  V1: API_BASE.V1,
  SYSTEM: API_BASE.SYSTEM,
  PUBLIC_BASE: API_BASE.PUBLIC,
  AUTH: AUTH_ENDPOINTS,
  ADMIN: ADMIN_ENDPOINTS,
  RANK_TRACKING: RANK_TRACKING_ENDPOINTS,
  BILLING: BILLING_ENDPOINTS,
  PAYMENT: PAYMENT_ENDPOINTS,
  ACTIVITY: ACTIVITY_ENDPOINTS,
  NOTIFICATION: NOTIFICATION_ENDPOINTS,
  DASHBOARD: DASHBOARD_ENDPOINTS,
  PUBLIC: PUBLIC_ENDPOINTS,
  SYSTEM_ENDPOINTS,
  ERROR: ERROR_ENDPOINTS,
  EXTERNAL: EXTERNAL_ENDPOINTS,
  INTEGRATION: INTEGRATION_ENDPOINTS,
  LEGACY: LEGACY_ENDPOINTS
};

// src/types/common/ErrorTypes.ts
var ErrorType = /* @__PURE__ */ ((ErrorType2) => {
  ErrorType2["VALIDATION"] = "VALIDATION_ERROR";
  ErrorType2["AUTHENTICATION"] = "AUTHENTICATION_ERROR";
  ErrorType2["AUTHORIZATION"] = "AUTHORIZATION_ERROR";
  ErrorType2["NOT_FOUND"] = "NOT_FOUND_ERROR";
  ErrorType2["DATABASE"] = "DATABASE_ERROR";
  ErrorType2["EXTERNAL_API"] = "EXTERNAL_API_ERROR";
  ErrorType2["BUSINESS_LOGIC"] = "BUSINESS_LOGIC_ERROR";
  ErrorType2["INTERNAL"] = "INTERNAL_ERROR";
  ErrorType2["RATE_LIMIT"] = "RATE_LIMIT_ERROR";
  ErrorType2["SYSTEM"] = "SYSTEM_ERROR";
  ErrorType2["NETWORK"] = "NETWORK_ERROR";
  ErrorType2["PAYMENT"] = "PAYMENT_ERROR";
  ErrorType2["ENCRYPTION"] = "ENCRYPTION_ERROR";
  return ErrorType2;
})(ErrorType || {});
var ErrorSeverity = /* @__PURE__ */ ((ErrorSeverity2) => {
  ErrorSeverity2["LOW"] = "LOW";
  ErrorSeverity2["MEDIUM"] = "MEDIUM";
  ErrorSeverity2["HIGH"] = "HIGH";
  ErrorSeverity2["CRITICAL"] = "CRITICAL";
  return ErrorSeverity2;
})(ErrorSeverity || {});
var AppError = class extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
};

// src/constants/ErrorMessages.ts
var USER_ERROR_MESSAGES = {
  ["AUTHENTICATION_ERROR" /* AUTHENTICATION */]: {
    default: "Authentication failed. Please log in again.",
    invalid_credentials: "Invalid email or password.",
    token_expired: "Your session has expired. Please log in again.",
    missing_token: "Please log in to access this feature."
  },
  ["AUTHORIZATION_ERROR" /* AUTHORIZATION */]: {
    default: "You do not have permission to perform this action.",
    insufficient_permissions: "Insufficient permissions for this operation.",
    resource_not_found: "The requested resource was not found."
  },
  ["VALIDATION_ERROR" /* VALIDATION */]: {
    default: "Please check your input and try again.",
    invalid_format: "The provided data format is invalid.",
    missing_required: "Required fields are missing.",
    invalid_email: "Please provide a valid email address."
  },
  ["DATABASE_ERROR" /* DATABASE */]: {
    default: "A database error occurred. Please try again.",
    connection_failed: "Database connection failed. Please try again later.",
    query_failed: "Failed to process your request. Please try again."
  },
  ["EXTERNAL_API_ERROR" /* EXTERNAL_API */]: {
    default: "External service temporarily unavailable. Please try again.",
    quota_exceeded: "API quota has been exceeded. Please try again later.",
    rate_limited: "Too many requests. Please wait before trying again."
  },
  ["ENCRYPTION_ERROR" /* ENCRYPTION */]: {
    default: "Security processing error. Please try again.",
    encryption_failed: "Failed to encrypt sensitive data."
  },
  ["RATE_LIMIT_ERROR" /* RATE_LIMIT */]: {
    default: "Too many requests. Please wait before trying again.",
    quota_exceeded: "Rate limit exceeded. Please try again later."
  },
  ["SYSTEM_ERROR" /* SYSTEM */]: {
    default: "System error occurred. Please try again.",
    service_unavailable: "Service temporarily unavailable.",
    maintenance: "System is under maintenance. Please try again later."
  },
  ["NETWORK_ERROR" /* NETWORK */]: {
    default: "Network error occurred. Please check your connection.",
    timeout: "Request timed out. Please try again.",
    connection_failed: "Connection failed. Please check your network."
  },
  ["BUSINESS_LOGIC_ERROR" /* BUSINESS_LOGIC */]: {
    default: "Unable to process your request.",
    invalid_operation: "This operation is not allowed.",
    resource_conflict: "A conflict occurred with existing data."
  }
};

// src/constants/AppConstants.ts
var APP_METADATA = {
  NAME: "IndexNow Studio",
  DESCRIPTION: "Professional URL indexing automation platform",
  VERSION: "1.0.0",
  AUTHOR: "IndexNow Studio Team",
  COPYRIGHT: "\xA9 2025 IndexNow Studio. All rights reserved."
};
var USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin"
};
var ROLE_PERMISSIONS = {
  [USER_ROLES.USER]: [
    "read:profile",
    "update:profile",
    "read:rank_tracking",
    "create:rank_tracking",
    "update:rank_tracking",
    "delete:rank_tracking",
    "read:billing",
    "create:payment"
  ],
  [USER_ROLES.ADMIN]: [
    "read:all_users",
    "update:user",
    "suspend:user",
    "read:all_jobs",
    "manage:system_settings",
    "read:analytics",
    "manage:packages",
    "read:system_health"
  ],
  [USER_ROLES.SUPER_ADMIN]: [
    "delete:user",
    "manage:admin_users",
    "manage:system_config",
    "access:debug_tools",
    "manage:payment_gateways",
    "read:system_logs",
    "manage:database"
  ]
};
var JOB_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  SCHEDULED: "scheduled"
};
var SCHEDULE_TYPES = {
  ONE_TIME: "one-time",
  HOURLY: "hourly",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  CUSTOM: "custom"
};
var JOB_TYPES = {
  URL_LIST: "url-list",
  SINGLE_URL: "single-url",
  BULK_UPLOAD: "bulk-upload"
};
var RANK_TRACKING = {
  COUNTRIES: {
    US: "United States",
    GB: "United Kingdom",
    CA: "Canada",
    AU: "Australia",
    ID: "Indonesia",
    SG: "Singapore",
    MY: "Malaysia",
    TH: "Thailand",
    PH: "Philippines",
    VN: "Vietnam"
  },
  DEVICES: {
    DESKTOP: "desktop",
    MOBILE: "mobile",
    TABLET: "tablet"
  },
  SEARCH_ENGINES: {
    GOOGLE: "google",
    BING: "bing",
    YAHOO: "yahoo"
  },
  MAX_POSITION: 100,
  DEFAULT_CHECK_FREQUENCY: "0 2 * * *"
  // Daily at 2 AM UTC
};
var PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5
};
var FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  // 5MB
  ALLOWED_TYPES: {
    URL_LIST: [".txt", ".csv"],
    IMAGE: [".jpg", ".jpeg", ".png", ".gif", ".webp"]
  },
  MAX_URLS_PER_FILE: 1e4
};
var NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error"
};
var EMAIL_TEMPLATES = {
  JOB_COMPLETION: "job-completion",
  JOB_FAILURE: "job-failure",
  QUOTA_ALERT: "quota-alert",
  DAILY_REPORT: "daily-report",
  PAYMENT_RECEIVED: "payment-received",
  LOGIN_NOTIFICATION: "login-notification",
  PACKAGE_ACTIVATED: "package-activated",
  ORDER_EXPIRED: "order-expired",
  BILLING_CONFIRMATION: "billing-confirmation"
};
var CACHE_KEYS = {
  USER_PROFILE: "user:profile",
  USER_SETTINGS: "user:settings",
  USER_QUOTA: "user:quota",
  JOBS: "user:jobs",
  PACKAGES: "packages",
  SITE_SETTINGS: "site:settings",
  RANK_TRACKING: "rank_tracking",
  PAYMENT_GATEWAYS: "payment:gateways"
};
var CACHE_TTL = {
  SHORT: 300,
  // 5 minutes
  MEDIUM: 3600,
  // 1 hour
  LONG: 86400,
  // 24 hours
  VERY_LONG: 604800
  // 7 days
};
var RATE_LIMITS = {
  API_REQUESTS: {
    WINDOW_MS: 15 * 60 * 1e3,
    // 15 minutes
    MAX_REQUESTS: 100
  },
  LOGIN_ATTEMPTS: {
    WINDOW_MS: 15 * 60 * 1e3,
    // 15 minutes
    MAX_ATTEMPTS: 5
  },
  PASSWORD_RESET: {
    WINDOW_MS: 60 * 60 * 1e3,
    // 1 hour
    MAX_ATTEMPTS: 3
  },
  PAYMENT_REQUESTS: {
    WINDOW_MS: 15 * 60 * 1e3,
    // 15 minutes
    MAX_REQUESTS: 5
  }
};
var DEFAULT_SETTINGS = {
  USER: {
    TIMEOUT_DURATION: 3e4,
    RETRY_ATTEMPTS: 3,
    EMAIL_JOB_COMPLETION: true,
    EMAIL_JOB_FAILURE: true,
    EMAIL_QUOTA_ALERTS: true,
    EMAIL_DAILY_REPORT: true,
    DEFAULT_SCHEDULE: SCHEDULE_TYPES.ONE_TIME
  },
  SYSTEM: {
    SITE_NAME: "IndexNow Studio",
    SITE_DESCRIPTION: "Professional URL indexing automation platform",
    SMTP_PORT: 465,
    SMTP_SECURE: true,
    SMTP_ENABLED: false,
    MAINTENANCE_MODE: false,
    REGISTRATION_ENABLED: true
  }
};
var REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  CRON: /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
  DOMAIN: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
};
var HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};
var TIME = {
  SECOND: 1e3,
  MINUTE: 60 * 1e3,
  HOUR: 60 * 60 * 1e3,
  DAY: 24 * 60 * 60 * 1e3,
  WEEK: 7 * 24 * 60 * 60 * 1e3,
  MONTH: 30 * 24 * 60 * 60 * 1e3,
  YEAR: 365 * 24 * 60 * 60 * 1e3
};

// src/types/api/requests/UserRequests.ts
var import_zod4 = require("zod");
var createApiKeySchema = import_zod4.z.object({
  name: import_zod4.z.string().min(1, "API key name is required").max(100, "Name must be less than 100 characters"),
  description: import_zod4.z.string().max(500, "Description must be less than 500 characters").optional(),
  scopes: import_zod4.z.array(import_zod4.z.string()).min(1, "At least one scope is required"),
  expiresAt: import_zod4.z.date().optional()
});

// src/types/api/requests/PaymentRequests.ts
var import_zod5 = require("zod");
var customerInfoSchema2 = import_zod5.z.object({
  firstName: import_zod5.z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: import_zod5.z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  email: import_zod5.z.string().email("Please enter a valid email address"),
  phone: import_zod5.z.string().min(1, "Phone number is required"),
  address: import_zod5.z.object({
    street: import_zod5.z.string().min(1, "Street address is required"),
    city: import_zod5.z.string().min(1, "City is required"),
    state: import_zod5.z.string().optional(),
    postalCode: import_zod5.z.string().min(1, "Postal code is required"),
    country: import_zod5.z.string().min(1, "Country is required")
  }),
  company: import_zod5.z.object({
    name: import_zod5.z.string(),
    taxId: import_zod5.z.string().optional(),
    industry: import_zod5.z.string().optional()
  }).optional()
});
var createPaymentSchema = import_zod5.z.object({
  packageId: import_zod5.z.string().uuid("Invalid package ID"),
  billingPeriod: import_zod5.z.enum(["monthly", "quarterly", "biannual", "annual"]),
  paymentMethod: import_zod5.z.enum(["paddle", "credit-card"]),
  customerInfo: customerInfoSchema2,
  promoCode: import_zod5.z.string().optional(),
  isTrialToSubscription: import_zod5.z.boolean().optional(),
  returnUrl: import_zod5.z.string().url().optional(),
  metadata: import_zod5.z.record(import_zod5.z.any()).optional()
});
var createSubscriptionSchema = import_zod5.z.object({
  packageId: import_zod5.z.string().uuid("Invalid package ID"),
  billingPeriod: import_zod5.z.enum(["monthly", "quarterly", "biannual", "annual"]),
  customerInfo: customerInfoSchema2,
  paymentMethod: import_zod5.z.string().min(1, "Payment method is required"),
  tokenId: import_zod5.z.string().optional(),
  startDate: import_zod5.z.date().optional(),
  trialDays: import_zod5.z.number().min(0).max(365).optional(),
  promoCode: import_zod5.z.string().optional()
});
var createRefundSchema = import_zod5.z.object({
  transactionId: import_zod5.z.string().uuid("Invalid transaction ID"),
  amount: import_zod5.z.number().positive().optional(),
  reason: import_zod5.z.enum(["duplicate", "fraud", "requested_by_customer", "other"]),
  reasonDetails: import_zod5.z.string().max(500, "Reason details must be less than 500 characters").optional(),
  notifyCustomer: import_zod5.z.boolean().optional()
});
var validatePromoCodeSchema = import_zod5.z.object({
  code: import_zod5.z.string().min(1, "Promo code is required"),
  packageId: import_zod5.z.string().uuid("Invalid package ID"),
  billingPeriod: import_zod5.z.enum(["monthly", "quarterly", "biannual", "annual"]),
  userId: import_zod5.z.string().uuid().optional()
});

// src/types/queues/QueueTypes.ts
var import_zod6 = require("zod");
var ImmediateRankCheckJobSchema = import_zod6.z.object({
  keywordId: import_zod6.z.string().uuid(),
  userId: import_zod6.z.string().uuid(),
  domainId: import_zod6.z.string().uuid(),
  keyword: import_zod6.z.string(),
  countryCode: import_zod6.z.string(),
  device: import_zod6.z.enum(["desktop", "mobile", "tablet"])
});
var EmailJobSchema = import_zod6.z.object({
  to: import_zod6.z.string().email(),
  subject: import_zod6.z.string(),
  template: import_zod6.z.enum([
    "billing_confirmation",
    "payment_received",
    "package_activated",
    "order_expired",
    "trial_expiring",
    "login_notification",
    "contact_form"
  ]),
  data: import_zod6.z.record(import_zod6.z.any())
});
var PaymentWebhookJobSchema = import_zod6.z.object({
  orderId: import_zod6.z.string(),
  transactionId: import_zod6.z.string(),
  status: import_zod6.z.enum(["pending", "settlement", "expire", "cancel", "deny"]),
  paymentType: import_zod6.z.string(),
  webhookData: import_zod6.z.record(import_zod6.z.any())
});
var AutoCancelJobSchema = import_zod6.z.object({
  scheduledAt: import_zod6.z.string().datetime()
});
var KeywordEnrichmentJobSchema = import_zod6.z.object({
  scheduledAt: import_zod6.z.string().datetime()
});

// src/utils/logger.ts
var _transport = null;
function setLoggerTransport(transport) {
  _transport = transport;
}
var Logger = class {
  constructor() {
    this.isProductionEnv = isProduction();
  }
  formatMessage(level, _context, message) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }
  log(level, context, message) {
    const ctx = typeof context === "string" ? {} : context;
    const msg = typeof context === "string" ? context : message || "";
    if (_transport) {
      const transportLevel = level === "fatal" ? "error" : level;
      _transport[transportLevel](ctx, msg);
      return;
    }
    if (this.isProductionEnv && (level === "debug" || level === "info")) return;
    const formattedMsg = this.formatMessage(level, ctx, msg);
    switch (level) {
      case "debug":
        console.debug(formattedMsg, ctx);
        break;
      case "info":
        console.info(formattedMsg, ctx);
        break;
      case "warn":
        console.warn(formattedMsg, ctx);
        break;
      case "error":
      case "fatal":
        console.error(formattedMsg, ctx);
        break;
    }
  }
  debug(context, message) {
    this.log("debug", context, message);
  }
  info(context, message) {
    this.log("info", context, message);
  }
  warn(context, message) {
    this.log("warn", context, message);
  }
  error(context, message) {
    this.log("error", context, message);
  }
  fatal(context, message) {
    this.log("fatal", context, message);
  }
};
var ErrorHandlingService = {
  handle: (error, context) => {
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : "An unexpected error occurred";
    let safeErrorMetadata;
    if (error instanceof Error) {
      safeErrorMetadata = { message: error.message, stack: error.stack };
    } else if (typeof error === "object" && error !== null) {
      try {
        safeErrorMetadata = JSON.parse(JSON.stringify(error));
      } catch {
        safeErrorMetadata = { rawError: String(error) };
      }
    } else {
      safeErrorMetadata = { rawError: String(error) };
    }
    const logContext = {
      ...context || {},
      error: safeErrorMetadata
    };
    logger.error(logContext, message);
  },
  createError: (config) => {
    const logContext = {
      errorType: config.type,
      severity: config.severity,
      ...config
    };
    logger.error(logContext, config.message || "Created error");
    const error = new Error(config.message);
    error.type = config.type;
    error.severity = config.severity;
    return error;
  }
};
var logger = new Logger();

// src/utils/formatters.ts
function formatDate(dateString, includeRelative) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";
  const formatted = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  if (includeRelative) {
    const relative = formatRelativeTime(dateString);
    return `${formatted} (${relative})`;
  }
  return formatted;
}
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }
  const now = /* @__PURE__ */ new Date();
  const diffInMs = now.getTime() - date.getTime();
  if (diffInMs < 0) {
    return "In the future";
  }
  const diffInSeconds = Math.floor(diffInMs / 1e3);
  if (diffInSeconds < 60) {
    return "Just now";
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  }
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  }
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
}
function formatNumber(num) {
  return new Intl.NumberFormat("en-US").format(num);
}
function truncateString(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
function r(e) {
  var t, f, n = "";
  if ("string" == typeof e || "number" == typeof e) n += e;
  else if ("object" == typeof e) if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
  } else for (f in e) e[f] && (n && (n += " "), n += f);
  return n;
}
function clsx() {
  for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}

// ../../node_modules/.pnpm/tailwind-merge@2.6.0/node_modules/tailwind-merge/dist/bundle-mjs.mjs
var CLASS_PART_SEPARATOR = "-";
var createClassGroupUtils = (config) => {
  const classMap = createClassMap(config);
  const {
    conflictingClassGroups,
    conflictingClassGroupModifiers
  } = config;
  const getClassGroupId = (className) => {
    const classParts = className.split(CLASS_PART_SEPARATOR);
    if (classParts[0] === "" && classParts.length !== 1) {
      classParts.shift();
    }
    return getGroupRecursive(classParts, classMap) || getGroupIdForArbitraryProperty(className);
  };
  const getConflictingClassGroupIds = (classGroupId, hasPostfixModifier) => {
    const conflicts = conflictingClassGroups[classGroupId] || [];
    if (hasPostfixModifier && conflictingClassGroupModifiers[classGroupId]) {
      return [...conflicts, ...conflictingClassGroupModifiers[classGroupId]];
    }
    return conflicts;
  };
  return {
    getClassGroupId,
    getConflictingClassGroupIds
  };
};
var getGroupRecursive = (classParts, classPartObject) => {
  if (classParts.length === 0) {
    return classPartObject.classGroupId;
  }
  const currentClassPart = classParts[0];
  const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
  const classGroupFromNextClassPart = nextClassPartObject ? getGroupRecursive(classParts.slice(1), nextClassPartObject) : void 0;
  if (classGroupFromNextClassPart) {
    return classGroupFromNextClassPart;
  }
  if (classPartObject.validators.length === 0) {
    return void 0;
  }
  const classRest = classParts.join(CLASS_PART_SEPARATOR);
  return classPartObject.validators.find(({
    validator
  }) => validator(classRest))?.classGroupId;
};
var arbitraryPropertyRegex = /^\[(.+)\]$/;
var getGroupIdForArbitraryProperty = (className) => {
  if (arbitraryPropertyRegex.test(className)) {
    const arbitraryPropertyClassName = arbitraryPropertyRegex.exec(className)[1];
    const property = arbitraryPropertyClassName?.substring(0, arbitraryPropertyClassName.indexOf(":"));
    if (property) {
      return "arbitrary.." + property;
    }
  }
};
var createClassMap = (config) => {
  const {
    theme,
    prefix
  } = config;
  const classMap = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  const prefixedClassGroupEntries = getPrefixedClassGroupEntries(Object.entries(config.classGroups), prefix);
  prefixedClassGroupEntries.forEach(([classGroupId, classGroup]) => {
    processClassesRecursively(classGroup, classMap, classGroupId, theme);
  });
  return classMap;
};
var processClassesRecursively = (classGroup, classPartObject, classGroupId, theme) => {
  classGroup.forEach((classDefinition) => {
    if (typeof classDefinition === "string") {
      const classPartObjectToEdit = classDefinition === "" ? classPartObject : getPart(classPartObject, classDefinition);
      classPartObjectToEdit.classGroupId = classGroupId;
      return;
    }
    if (typeof classDefinition === "function") {
      if (isThemeGetter(classDefinition)) {
        processClassesRecursively(classDefinition(theme), classPartObject, classGroupId, theme);
        return;
      }
      classPartObject.validators.push({
        validator: classDefinition,
        classGroupId
      });
      return;
    }
    Object.entries(classDefinition).forEach(([key, classGroup2]) => {
      processClassesRecursively(classGroup2, getPart(classPartObject, key), classGroupId, theme);
    });
  });
};
var getPart = (classPartObject, path) => {
  let currentClassPartObject = classPartObject;
  path.split(CLASS_PART_SEPARATOR).forEach((pathPart) => {
    if (!currentClassPartObject.nextPart.has(pathPart)) {
      currentClassPartObject.nextPart.set(pathPart, {
        nextPart: /* @__PURE__ */ new Map(),
        validators: []
      });
    }
    currentClassPartObject = currentClassPartObject.nextPart.get(pathPart);
  });
  return currentClassPartObject;
};
var isThemeGetter = (func) => func.isThemeGetter;
var getPrefixedClassGroupEntries = (classGroupEntries, prefix) => {
  if (!prefix) {
    return classGroupEntries;
  }
  return classGroupEntries.map(([classGroupId, classGroup]) => {
    const prefixedClassGroup = classGroup.map((classDefinition) => {
      if (typeof classDefinition === "string") {
        return prefix + classDefinition;
      }
      if (typeof classDefinition === "object") {
        return Object.fromEntries(Object.entries(classDefinition).map(([key, value]) => [prefix + key, value]));
      }
      return classDefinition;
    });
    return [classGroupId, prefixedClassGroup];
  });
};
var createLruCache = (maxCacheSize) => {
  if (maxCacheSize < 1) {
    return {
      get: () => void 0,
      set: () => {
      }
    };
  }
  let cacheSize = 0;
  let cache = /* @__PURE__ */ new Map();
  let previousCache = /* @__PURE__ */ new Map();
  const update = (key, value) => {
    cache.set(key, value);
    cacheSize++;
    if (cacheSize > maxCacheSize) {
      cacheSize = 0;
      previousCache = cache;
      cache = /* @__PURE__ */ new Map();
    }
  };
  return {
    get(key) {
      let value = cache.get(key);
      if (value !== void 0) {
        return value;
      }
      if ((value = previousCache.get(key)) !== void 0) {
        update(key, value);
        return value;
      }
    },
    set(key, value) {
      if (cache.has(key)) {
        cache.set(key, value);
      } else {
        update(key, value);
      }
    }
  };
};
var IMPORTANT_MODIFIER = "!";
var createParseClassName = (config) => {
  const {
    separator,
    experimentalParseClassName
  } = config;
  const isSeparatorSingleCharacter = separator.length === 1;
  const firstSeparatorCharacter = separator[0];
  const separatorLength = separator.length;
  const parseClassName = (className) => {
    const modifiers = [];
    let bracketDepth = 0;
    let modifierStart = 0;
    let postfixModifierPosition;
    for (let index = 0; index < className.length; index++) {
      let currentCharacter = className[index];
      if (bracketDepth === 0) {
        if (currentCharacter === firstSeparatorCharacter && (isSeparatorSingleCharacter || className.slice(index, index + separatorLength) === separator)) {
          modifiers.push(className.slice(modifierStart, index));
          modifierStart = index + separatorLength;
          continue;
        }
        if (currentCharacter === "/") {
          postfixModifierPosition = index;
          continue;
        }
      }
      if (currentCharacter === "[") {
        bracketDepth++;
      } else if (currentCharacter === "]") {
        bracketDepth--;
      }
    }
    const baseClassNameWithImportantModifier = modifiers.length === 0 ? className : className.substring(modifierStart);
    const hasImportantModifier = baseClassNameWithImportantModifier.startsWith(IMPORTANT_MODIFIER);
    const baseClassName = hasImportantModifier ? baseClassNameWithImportantModifier.substring(1) : baseClassNameWithImportantModifier;
    const maybePostfixModifierPosition = postfixModifierPosition && postfixModifierPosition > modifierStart ? postfixModifierPosition - modifierStart : void 0;
    return {
      modifiers,
      hasImportantModifier,
      baseClassName,
      maybePostfixModifierPosition
    };
  };
  if (experimentalParseClassName) {
    return (className) => experimentalParseClassName({
      className,
      parseClassName
    });
  }
  return parseClassName;
};
var sortModifiers = (modifiers) => {
  if (modifiers.length <= 1) {
    return modifiers;
  }
  const sortedModifiers = [];
  let unsortedModifiers = [];
  modifiers.forEach((modifier) => {
    const isArbitraryVariant = modifier[0] === "[";
    if (isArbitraryVariant) {
      sortedModifiers.push(...unsortedModifiers.sort(), modifier);
      unsortedModifiers = [];
    } else {
      unsortedModifiers.push(modifier);
    }
  });
  sortedModifiers.push(...unsortedModifiers.sort());
  return sortedModifiers;
};
var createConfigUtils = (config) => ({
  cache: createLruCache(config.cacheSize),
  parseClassName: createParseClassName(config),
  ...createClassGroupUtils(config)
});
var SPLIT_CLASSES_REGEX = /\s+/;
var mergeClassList = (classList, configUtils) => {
  const {
    parseClassName,
    getClassGroupId,
    getConflictingClassGroupIds
  } = configUtils;
  const classGroupsInConflict = [];
  const classNames = classList.trim().split(SPLIT_CLASSES_REGEX);
  let result = "";
  for (let index = classNames.length - 1; index >= 0; index -= 1) {
    const originalClassName = classNames[index];
    const {
      modifiers,
      hasImportantModifier,
      baseClassName,
      maybePostfixModifierPosition
    } = parseClassName(originalClassName);
    let hasPostfixModifier = Boolean(maybePostfixModifierPosition);
    let classGroupId = getClassGroupId(hasPostfixModifier ? baseClassName.substring(0, maybePostfixModifierPosition) : baseClassName);
    if (!classGroupId) {
      if (!hasPostfixModifier) {
        result = originalClassName + (result.length > 0 ? " " + result : result);
        continue;
      }
      classGroupId = getClassGroupId(baseClassName);
      if (!classGroupId) {
        result = originalClassName + (result.length > 0 ? " " + result : result);
        continue;
      }
      hasPostfixModifier = false;
    }
    const variantModifier = sortModifiers(modifiers).join(":");
    const modifierId = hasImportantModifier ? variantModifier + IMPORTANT_MODIFIER : variantModifier;
    const classId = modifierId + classGroupId;
    if (classGroupsInConflict.includes(classId)) {
      continue;
    }
    classGroupsInConflict.push(classId);
    const conflictGroups = getConflictingClassGroupIds(classGroupId, hasPostfixModifier);
    for (let i = 0; i < conflictGroups.length; ++i) {
      const group = conflictGroups[i];
      classGroupsInConflict.push(modifierId + group);
    }
    result = originalClassName + (result.length > 0 ? " " + result : result);
  }
  return result;
};
function twJoin() {
  let index = 0;
  let argument;
  let resolvedValue;
  let string = "";
  while (index < arguments.length) {
    if (argument = arguments[index++]) {
      if (resolvedValue = toValue(argument)) {
        string && (string += " ");
        string += resolvedValue;
      }
    }
  }
  return string;
}
var toValue = (mix) => {
  if (typeof mix === "string") {
    return mix;
  }
  let resolvedValue;
  let string = "";
  for (let k = 0; k < mix.length; k++) {
    if (mix[k]) {
      if (resolvedValue = toValue(mix[k])) {
        string && (string += " ");
        string += resolvedValue;
      }
    }
  }
  return string;
};
function createTailwindMerge(createConfigFirst, ...createConfigRest) {
  let configUtils;
  let cacheGet;
  let cacheSet;
  let functionToCall = initTailwindMerge;
  function initTailwindMerge(classList) {
    const config = createConfigRest.reduce((previousConfig, createConfigCurrent) => createConfigCurrent(previousConfig), createConfigFirst());
    configUtils = createConfigUtils(config);
    cacheGet = configUtils.cache.get;
    cacheSet = configUtils.cache.set;
    functionToCall = tailwindMerge;
    return tailwindMerge(classList);
  }
  function tailwindMerge(classList) {
    const cachedResult = cacheGet(classList);
    if (cachedResult) {
      return cachedResult;
    }
    const result = mergeClassList(classList, configUtils);
    cacheSet(classList, result);
    return result;
  }
  return function callTailwindMerge() {
    return functionToCall(twJoin.apply(null, arguments));
  };
}
var fromTheme = (key) => {
  const themeGetter = (theme) => theme[key] || [];
  themeGetter.isThemeGetter = true;
  return themeGetter;
};
var arbitraryValueRegex = /^\[(?:([a-z-]+):)?(.+)\]$/i;
var fractionRegex = /^\d+\/\d+$/;
var stringLengths = /* @__PURE__ */ new Set(["px", "full", "screen"]);
var tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
var lengthUnitRegex = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
var colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/;
var shadowRegex = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
var imageRegex = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
var isLength = (value) => isNumber(value) || stringLengths.has(value) || fractionRegex.test(value);
var isArbitraryLength = (value) => getIsArbitraryValue(value, "length", isLengthOnly);
var isNumber = (value) => Boolean(value) && !Number.isNaN(Number(value));
var isArbitraryNumber = (value) => getIsArbitraryValue(value, "number", isNumber);
var isInteger = (value) => Boolean(value) && Number.isInteger(Number(value));
var isPercent = (value) => value.endsWith("%") && isNumber(value.slice(0, -1));
var isArbitraryValue = (value) => arbitraryValueRegex.test(value);
var isTshirtSize = (value) => tshirtUnitRegex.test(value);
var sizeLabels = /* @__PURE__ */ new Set(["length", "size", "percentage"]);
var isArbitrarySize = (value) => getIsArbitraryValue(value, sizeLabels, isNever);
var isArbitraryPosition = (value) => getIsArbitraryValue(value, "position", isNever);
var imageLabels = /* @__PURE__ */ new Set(["image", "url"]);
var isArbitraryImage = (value) => getIsArbitraryValue(value, imageLabels, isImage);
var isArbitraryShadow = (value) => getIsArbitraryValue(value, "", isShadow);
var isAny = () => true;
var getIsArbitraryValue = (value, label, testValue) => {
  const result = arbitraryValueRegex.exec(value);
  if (result) {
    if (result[1]) {
      return typeof label === "string" ? result[1] === label : label.has(result[1]);
    }
    return testValue(result[2]);
  }
  return false;
};
var isLengthOnly = (value) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  lengthUnitRegex.test(value) && !colorFunctionRegex.test(value)
);
var isNever = () => false;
var isShadow = (value) => shadowRegex.test(value);
var isImage = (value) => imageRegex.test(value);
var getDefaultConfig = () => {
  const colors = fromTheme("colors");
  const spacing = fromTheme("spacing");
  const blur = fromTheme("blur");
  const brightness = fromTheme("brightness");
  const borderColor = fromTheme("borderColor");
  const borderRadius = fromTheme("borderRadius");
  const borderSpacing = fromTheme("borderSpacing");
  const borderWidth = fromTheme("borderWidth");
  const contrast = fromTheme("contrast");
  const grayscale = fromTheme("grayscale");
  const hueRotate = fromTheme("hueRotate");
  const invert = fromTheme("invert");
  const gap = fromTheme("gap");
  const gradientColorStops = fromTheme("gradientColorStops");
  const gradientColorStopPositions = fromTheme("gradientColorStopPositions");
  const inset = fromTheme("inset");
  const margin = fromTheme("margin");
  const opacity = fromTheme("opacity");
  const padding = fromTheme("padding");
  const saturate = fromTheme("saturate");
  const scale = fromTheme("scale");
  const sepia = fromTheme("sepia");
  const skew = fromTheme("skew");
  const space = fromTheme("space");
  const translate = fromTheme("translate");
  const getOverscroll = () => ["auto", "contain", "none"];
  const getOverflow = () => ["auto", "hidden", "clip", "visible", "scroll"];
  const getSpacingWithAutoAndArbitrary = () => ["auto", isArbitraryValue, spacing];
  const getSpacingWithArbitrary = () => [isArbitraryValue, spacing];
  const getLengthWithEmptyAndArbitrary = () => ["", isLength, isArbitraryLength];
  const getNumberWithAutoAndArbitrary = () => ["auto", isNumber, isArbitraryValue];
  const getPositions = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"];
  const getLineStyles = () => ["solid", "dashed", "dotted", "double", "none"];
  const getBlendModes = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
  const getAlign = () => ["start", "end", "center", "between", "around", "evenly", "stretch"];
  const getZeroAndEmpty = () => ["", "0", isArbitraryValue];
  const getBreaks = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"];
  const getNumberAndArbitrary = () => [isNumber, isArbitraryValue];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [isAny],
      spacing: [isLength, isArbitraryLength],
      blur: ["none", "", isTshirtSize, isArbitraryValue],
      brightness: getNumberAndArbitrary(),
      borderColor: [colors],
      borderRadius: ["none", "", "full", isTshirtSize, isArbitraryValue],
      borderSpacing: getSpacingWithArbitrary(),
      borderWidth: getLengthWithEmptyAndArbitrary(),
      contrast: getNumberAndArbitrary(),
      grayscale: getZeroAndEmpty(),
      hueRotate: getNumberAndArbitrary(),
      invert: getZeroAndEmpty(),
      gap: getSpacingWithArbitrary(),
      gradientColorStops: [colors],
      gradientColorStopPositions: [isPercent, isArbitraryLength],
      inset: getSpacingWithAutoAndArbitrary(),
      margin: getSpacingWithAutoAndArbitrary(),
      opacity: getNumberAndArbitrary(),
      padding: getSpacingWithArbitrary(),
      saturate: getNumberAndArbitrary(),
      scale: getNumberAndArbitrary(),
      sepia: getZeroAndEmpty(),
      skew: getNumberAndArbitrary(),
      space: getSpacingWithArbitrary(),
      translate: getSpacingWithArbitrary()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", isArbitraryValue]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [isTshirtSize]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": getBreaks()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": getBreaks()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...getPositions(), isArbitraryValue]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: getOverflow()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": getOverflow()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": getOverflow()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: getOverscroll()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": getOverscroll()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": getOverscroll()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [inset]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [inset]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [inset]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [inset]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [inset]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [inset]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [inset]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [inset]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [inset]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", isInteger, isArbitraryValue]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: getSpacingWithAutoAndArbitrary()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", isArbitraryValue]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: getZeroAndEmpty()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: getZeroAndEmpty()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", isInteger, isArbitraryValue]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [isAny]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", isInteger, isArbitraryValue]
        }, isArbitraryValue]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": getNumberWithAutoAndArbitrary()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": getNumberWithAutoAndArbitrary()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [isAny]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [isInteger, isArbitraryValue]
        }, isArbitraryValue]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": getNumberWithAutoAndArbitrary()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": getNumberWithAutoAndArbitrary()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", isArbitraryValue]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", isArbitraryValue]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [gap]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [gap]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [gap]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...getAlign()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...getAlign(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...getAlign(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [padding]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [padding]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [padding]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [padding]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [padding]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [padding]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [padding]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [padding]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [padding]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [margin]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [margin]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [margin]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [margin]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [margin]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [margin]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [margin]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [margin]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [margin]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [space]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [space]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", isArbitraryValue, spacing]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [isArbitraryValue, spacing, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [isArbitraryValue, spacing, "none", "full", "min", "max", "fit", "prose", {
          screen: [isTshirtSize]
        }, isTshirtSize]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [isArbitraryValue, spacing, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [isArbitraryValue, spacing, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [isArbitraryValue, spacing, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [isArbitraryValue, spacing, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", isTshirtSize, isArbitraryLength]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", isArbitraryNumber]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [isAny]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", isArbitraryValue]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", isNumber, isArbitraryNumber]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", isLength, isArbitraryValue]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", isArbitraryValue]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", isArbitraryValue]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [colors]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [opacity]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [colors]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [opacity]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...getLineStyles(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", isLength, isArbitraryLength]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", isLength, isArbitraryValue]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [colors]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: getSpacingWithArbitrary()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", isArbitraryValue]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", isArbitraryValue]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [opacity]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...getPositions(), isArbitraryPosition]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", isArbitrarySize]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, isArbitraryImage]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [colors]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [gradientColorStopPositions]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [gradientColorStopPositions]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [gradientColorStopPositions]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [gradientColorStops]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [gradientColorStops]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [gradientColorStops]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [borderRadius]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [borderRadius]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [borderRadius]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [borderRadius]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [borderRadius]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [borderRadius]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [borderRadius]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [borderRadius]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [borderRadius]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [borderRadius]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [borderRadius]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [borderRadius]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [borderRadius]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [borderRadius]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [borderRadius]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [borderWidth]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [borderWidth]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [borderWidth]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [borderWidth]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [borderWidth]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [borderWidth]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [borderWidth]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [borderWidth]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [borderWidth]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [opacity]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...getLineStyles(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [borderWidth]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [borderWidth]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [opacity]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: getLineStyles()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [borderColor]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [borderColor]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [borderColor]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [borderColor]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [borderColor]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [borderColor]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [borderColor]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [borderColor]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [borderColor]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [borderColor]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...getLineStyles()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [isLength, isArbitraryValue]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [isLength, isArbitraryLength]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [colors]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: getLengthWithEmptyAndArbitrary()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [colors]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [opacity]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [isLength, isArbitraryLength]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [colors]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", isTshirtSize, isArbitraryShadow]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [isAny]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [opacity]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...getBlendModes(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": getBlendModes()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [blur]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [brightness]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [contrast]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", isTshirtSize, isArbitraryValue]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [grayscale]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [hueRotate]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [invert]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [saturate]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [sepia]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [blur]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [brightness]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [contrast]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [grayscale]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [hueRotate]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [invert]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [opacity]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [saturate]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [sepia]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [borderSpacing]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [borderSpacing]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [borderSpacing]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", isArbitraryValue]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: getNumberAndArbitrary()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", isArbitraryValue]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: getNumberAndArbitrary()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", isArbitraryValue]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [scale]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [scale]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [scale]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [isInteger, isArbitraryValue]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [translate]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [translate]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [skew]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [skew]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", isArbitraryValue]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", colors]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", isArbitraryValue]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [colors]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", isArbitraryValue]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [colors, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [isLength, isArbitraryLength, isArbitraryNumber]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [colors, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
};
var twMerge = /* @__PURE__ */ createTailwindMerge(getDefaultConfig);

// src/utils/ui.ts
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/utils/resilience/CircuitBreaker.ts
var CircuitState = /* @__PURE__ */ ((CircuitState2) => {
  CircuitState2["CLOSED"] = "CLOSED";
  CircuitState2["OPEN"] = "OPEN";
  CircuitState2["HALF_OPEN"] = "HALF_OPEN";
  return CircuitState2;
})(CircuitState || {});
var CircuitBreaker = class {
  constructor(config) {
    this.config = config;
    this.state = "CLOSED" /* CLOSED */;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
    this.nextAttempt = Date.now();
    this.failures = [];
    // Timestamps of failures within window
    // Metrics
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
  }
  /**
   * Execute an operation with circuit breaker protection
   */
  async execute(operation) {
    this.totalRequests++;
    if (this.state === "OPEN" /* OPEN */) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(
          `Circuit breaker "${this.config.name}" is OPEN. Service unavailable.`
        );
      }
      this.transitionTo("HALF_OPEN" /* HALF_OPEN */);
    }
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  /**
   * Handle successful operation
   */
  onSuccess() {
    this.totalSuccesses++;
    this.failureCount = 0;
    this.failures.length = 0;
    if (this.state === "HALF_OPEN" /* HALF_OPEN */) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo("CLOSED" /* CLOSED */);
      }
    }
  }
  /**
   * Handle failed operation
   */
  onFailure() {
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    this.failures.push(this.lastFailureTime);
    const windowStart = Date.now() - this.config.monitoringWindow;
    while (this.failures.length > 0 && this.failures[0] < windowStart) {
      this.failures.shift();
    }
    this.failureCount = this.failures.length;
    if (this.state === "HALF_OPEN" /* HALF_OPEN */) {
      this.transitionTo("OPEN" /* OPEN */);
    } else if (this.state === "CLOSED" /* CLOSED */) {
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo("OPEN" /* OPEN */);
      }
    }
  }
  /**
   * Transition to new state
   */
  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    if (newState === "OPEN" /* OPEN */) {
      this.nextAttempt = Date.now() + this.config.timeout;
      this.successCount = 0;
      logger.warn({
        circuitBreaker: this.config.name,
        oldState,
        newState,
        failureCount: this.failureCount,
        nextAttempt: new Date(this.nextAttempt).toISOString()
      }, `Circuit breaker "${this.config.name}" opened`);
    } else if (newState === "CLOSED" /* CLOSED */) {
      this.failureCount = 0;
      this.successCount = 0;
      this.failures.length = 0;
      logger.info({
        circuitBreaker: this.config.name,
        oldState,
        newState
      }, `Circuit breaker "${this.config.name}" closed`);
    } else if (newState === "HALF_OPEN" /* HALF_OPEN */) {
      this.successCount = 0;
      logger.info({
        circuitBreaker: this.config.name,
        oldState,
        newState
      }, `Circuit breaker "${this.config.name}" half-open`);
    }
  }
  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses
    };
  }
  /**
   * Reset the circuit breaker
   */
  reset() {
    this.state = "CLOSED" /* CLOSED */;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.failures.length = 0;
    logger.info({
      circuitBreaker: this.config.name
    }, `Circuit breaker "${this.config.name}" reset`);
  }
  /**
   * Get current state
   */
  getState() {
    return this.state;
  }
  /**
   * Check if circuit is available
   */
  isAvailable() {
    if (this.state === "CLOSED" /* CLOSED */) {
      return true;
    }
    if (this.state === "HALF_OPEN" /* HALF_OPEN */) {
      return true;
    }
    if (this.state === "OPEN" /* OPEN */ && Date.now() >= this.nextAttempt) {
      return true;
    }
    return false;
  }
};
var CircuitBreakerManager = class {
  /**
   * Get or create a circuit breaker for a service
   */
  static getBreaker(serviceName, config) {
    if (!this.breakers.has(serviceName)) {
      if (this.breakers.size >= this.MAX_BREAKERS) {
        const firstKey = this.breakers.keys().next().value;
        if (firstKey) this.breakers.delete(firstKey);
      }
      const defaultConfig = {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 6e4,
        // 1 minute
        monitoringWindow: 12e4,
        // 2 minutes
        name: serviceName,
        ...config
      };
      this.breakers.set(serviceName, new CircuitBreaker(defaultConfig));
    }
    return this.breakers.get(serviceName);
  }
  /**
   * Get all circuit breaker metrics
   */
  static getAllMetrics() {
    const metrics = {};
    this.breakers.forEach((breaker, name) => {
      metrics[name] = breaker.getMetrics();
    });
    return metrics;
  }
  /**
   * Reset all circuit breakers
   */
  static resetAll() {
    this.breakers.forEach((breaker) => breaker.reset());
  }
  /**
   * Reset specific circuit breaker
   */
  static reset(serviceName) {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.reset();
    }
  }
  /**
   * Remove a circuit breaker entirely (#10)
   */
  static removeBreaker(serviceName) {
    return this.breakers.delete(serviceName);
  }
  /**
   * Get current number of tracked breakers
   */
  static get size() {
    return this.breakers.size;
  }
};
CircuitBreakerManager.breakers = /* @__PURE__ */ new Map();
CircuitBreakerManager.MAX_BREAKERS = 100;
var ServiceCircuitBreakers = {
  database: () => CircuitBreakerManager.getBreaker("database", {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 3e4,
    monitoringWindow: 6e4
  }),
  externalApi: () => CircuitBreakerManager.getBreaker("external-api", {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 6e4,
    monitoringWindow: 12e4
  }),
  payment: () => CircuitBreakerManager.getBreaker("payment-service", {
    failureThreshold: 2,
    successThreshold: 3,
    timeout: 12e4,
    monitoringWindow: 18e4
  }),
  serp: () => CircuitBreakerManager.getBreaker("serp-api", {
    failureThreshold: 10,
    successThreshold: 3,
    timeout: 3e5,
    // 5 minutes
    monitoringWindow: 6e5
    // 10 minutes
  })
};

// src/utils/async-utils.ts
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

// src/utils/resilience/ExponentialBackoff.ts
var ExponentialBackoff = class {
  constructor(config = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      initialDelay: config.initialDelay ?? 1e3,
      maxDelay: config.maxDelay ?? 3e4,
      multiplier: config.multiplier ?? 2,
      jitter: config.jitter ?? true,
      retryableErrors: config.retryableErrors ?? [
        /ECONNREFUSED/,
        /ETIMEDOUT/,
        /ENOTFOUND/,
        /503/,
        /502/,
        /504/,
        /429/
        // Rate limit
      ],
      onRetry: config.onRetry ?? (() => {
      })
    };
  }
  /**
   * Execute operation with exponential backoff retry
   */
  async execute(operation, context) {
    const metrics = {
      attempts: 0,
      totalDelay: 0,
      success: false
    };
    let lastError;
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      metrics.attempts = attempt;
      try {
        const result = await operation();
        metrics.success = true;
        if (attempt > 1) {
          logger.info({
            context,
            attempt,
            totalDelay: metrics.totalDelay,
            maxAttempts: this.config.maxAttempts
          }, "Operation succeeded after retry");
        }
        return result;
      } catch (error) {
        lastError = error;
        metrics.finalError = lastError;
        const isRetryable = this.isRetryableError(lastError);
        const isLastAttempt = attempt === this.config.maxAttempts;
        if (!isRetryable || isLastAttempt) {
          logger.error({
            context,
            attempt,
            maxAttempts: this.config.maxAttempts,
            isRetryable,
            error: lastError.message
          }, "Operation failed, no more retries");
          throw lastError;
        }
        const delay = this.calculateDelay(attempt);
        metrics.totalDelay += delay;
        logger.warn({
          context,
          attempt,
          nextAttempt: attempt + 1,
          delay,
          error: lastError.message
        }, "Operation failed, retrying with backoff");
        this.config.onRetry(attempt, delay, lastError);
        await sleep(delay);
      }
    }
    throw lastError;
  }
  /**
   * Calculate delay for given attempt with exponential backoff
   */
  calculateDelay(attempt) {
    let delay = this.config.initialDelay * Math.pow(this.config.multiplier, attempt - 1);
    delay = Math.min(delay, this.config.maxDelay);
    if (this.config.jitter) {
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() * 2 - 1) * jitterRange;
      delay = delay + jitter;
    }
    return Math.floor(delay);
  }
  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const errorMessage = error.message || "";
    return this.config.retryableErrors.some((pattern) => pattern.test(errorMessage));
  }
};
var BackoffStrategies = {
  /**
   * Fast retry - for operations that usually succeed quickly
   */
  fast: new ExponentialBackoff({
    maxAttempts: 3,
    initialDelay: 500,
    maxDelay: 5e3,
    multiplier: 2,
    jitter: true
  }),
  /**
   * Standard retry - balanced approach
   */
  standard: new ExponentialBackoff({
    maxAttempts: 5,
    initialDelay: 1e3,
    maxDelay: 3e4,
    multiplier: 2,
    jitter: true
  }),
  /**
   * Slow retry - for expensive operations
   */
  slow: new ExponentialBackoff({
    maxAttempts: 3,
    initialDelay: 5e3,
    maxDelay: 6e4,
    multiplier: 3,
    jitter: true
  }),
  /**
   * Aggressive retry - for critical operations
   */
  aggressive: new ExponentialBackoff({
    maxAttempts: 10,
    initialDelay: 500,
    maxDelay: 12e4,
    multiplier: 2,
    jitter: true
  }),
  /**
   * API rate limit retry - for rate-limited APIs
   */
  rateLimit: new ExponentialBackoff({
    maxAttempts: 5,
    initialDelay: 2e3,
    maxDelay: 6e4,
    multiplier: 2,
    jitter: true,
    retryableErrors: [/429/, /rate.limit/i, /too.many.requests/i]
  })
};
async function retryWithBackoff(operation, config, context) {
  const backoff = new ExponentialBackoff(config);
  return backoff.execute(operation, context);
}

// src/utils/resilience/FallbackHandler.ts
var FallbackHandler = class {
  // 5 minutes
  constructor(config) {
    this.config = config;
    this.cache = /* @__PURE__ */ new Map();
    this.defaultCacheTTL = 3e5;
  }
  /**
   * Execute operation with fallback strategies
   */
  async executeWithFallback(operation, cacheKey, context) {
    try {
      const result = await operation();
      if (cacheKey) {
        this.setCached(cacheKey, result);
      }
      return result;
    } catch (primaryError) {
      if (this.config.logFallbacks) {
        logger.warn({
          context,
          error: primaryError.message,
          strategiesAvailable: this.config.strategies.length
        }, "Primary operation failed, trying fallback strategies");
      }
      for (let index = 0; index < this.config.strategies.length; index++) {
        const strategy = this.config.strategies[index];
        try {
          const result = await this.executeFallbackStrategy(
            strategy,
            cacheKey,
            context
          );
          if (this.config.logFallbacks) {
            logger.info({
              context,
              strategyIndex: index,
              strategyType: strategy.type
            }, "Fallback strategy succeeded");
          }
          return result;
        } catch (fallbackError) {
          if (this.config.logFallbacks) {
            logger.warn({
              context,
              strategyIndex: index,
              strategyType: strategy.type,
              error: fallbackError.message
            }, "Fallback strategy failed, trying next");
          }
        }
      }
      logger.error({
        context,
        primaryError: primaryError.message,
        strategiesTried: this.config.strategies.length
      }, "All fallback strategies failed");
      throw primaryError;
    }
  }
  /**
   * Execute a specific fallback strategy
   */
  async executeFallbackStrategy(strategy, cacheKey, _context) {
    switch (strategy.type) {
      case "default":
        return strategy.value;
      case "cached":
        if (!cacheKey) {
          throw new Error("Cache key required for cached fallback strategy");
        }
        const cached = this.getCached(cacheKey, strategy.ttl);
        if (!cached) {
          throw new Error("No cached value available");
        }
        return cached;
      case "alternative":
        return await strategy.operation();
      case "degraded":
        return await strategy.operation();
      case "empty":
        return {};
      case "error":
        throw new Error("Error fallback - no fallback available");
      default:
        throw new Error(`Unrecognized fallback strategy: ${strategy.type}`);
    }
  }
  /**
   * Get cached value if not expired
   */
  getCached(key, ttl) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    const maxAge = ttl ?? this.config.cacheTTL ?? this.defaultCacheTTL;
    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }
    return cached.value;
  }
  /**
   * Set cached value
   */
  setCached(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  /**
   * Clear all cached values
   */
  clearCache() {
    this.cache.clear();
  }
  /**
   * Clear specific cached value
   */
  clearCacheKey(key) {
    this.cache.delete(key);
  }
};
function createFallbackHandler(strategies, config) {
  return new FallbackHandler({
    strategies,
    cacheTTL: config?.cacheTTL,
    logFallbacks: config?.logFallbacks ?? true
  });
}
var FallbackHandlers = {
  /**
   * Cached with default fallback
   */
  cachedWithDefault(defaultValue, cacheTTL = 3e5) {
    return new FallbackHandler({
      strategies: [
        { type: "cached", ttl: cacheTTL },
        { type: "default", value: defaultValue }
      ],
      cacheTTL,
      logFallbacks: true
    });
  },
  /**
   * Alternative operation with empty fallback
   */
  alternativeWithEmpty(alternativeOp) {
    return new FallbackHandler({
      strategies: [
        { type: "alternative", operation: alternativeOp },
        { type: "empty" }
      ],
      logFallbacks: true
    });
  },
  /**
   * Degraded service fallback
   */
  degradedService(degradedOp) {
    return new FallbackHandler({
      strategies: [
        { type: "cached" },
        { type: "degraded", operation: degradedOp },
        { type: "empty" }
      ],
      logFallbacks: true
    });
  },
  /**
   * Fail-safe with multiple alternatives
   */
  multipleAlternatives(alternatives, defaultValue) {
    const strategies = [
      { type: "cached" },
      ...alternatives.map((op) => ({ type: "alternative", operation: op }))
    ];
    if (defaultValue !== void 0) {
      strategies.push({ type: "default", value: defaultValue });
    } else {
      strategies.push({ type: "empty" });
    }
    return new FallbackHandler({
      strategies,
      logFallbacks: true
    });
  }
};

// src/utils/resilience/ResilientOperationExecutor.ts
var ResilientOperationExecutor = class {
  /**
   * Execute operation with full resilience protection
   */
  static async execute(operation, config) {
    const { serviceName, circuitBreaker, retryConfig, fallbackStrategies, cacheKey, context } = config;
    const breaker = circuitBreaker !== false ? CircuitBreakerManager.getBreaker(serviceName) : null;
    const backoff = new ExponentialBackoff(retryConfig || {
      maxAttempts: 3,
      initialDelay: 1e3,
      maxDelay: 3e4,
      multiplier: 2,
      jitter: true
    });
    const fallbackHandler = fallbackStrategies ? new FallbackHandler({ strategies: fallbackStrategies, logFallbacks: true }) : null;
    const resilientOperation = async () => {
      if (breaker) {
        return breaker.execute(() => backoff.execute(operation, context || serviceName));
      } else {
        return backoff.execute(operation, context || serviceName);
      }
    };
    if (fallbackHandler) {
      return fallbackHandler.executeWithFallback(resilientOperation, cacheKey, context || serviceName);
    } else {
      return resilientOperation();
    }
  }
  /**
   * Quick execute with default resilience settings
   */
  static async executeWithDefaults(operation, serviceName, context) {
    return this.execute(operation, {
      serviceName,
      context: context || serviceName,
      circuitBreaker: true,
      retryConfig: {
        maxAttempts: 3,
        initialDelay: 1e3,
        maxDelay: 3e4
      }
    });
  }
  /**
   * Execute database operation with resilience
   */
  static async executeDatabase(operation, context) {
    return this.execute(operation, {
      serviceName: "database",
      context: context || "database-operation",
      circuitBreaker: true,
      retryConfig: {
        maxAttempts: 2,
        initialDelay: 500,
        maxDelay: 5e3
      },
      fallbackStrategies: [
        { type: "cached", ttl: 6e4 },
        { type: "error" }
      ]
    });
  }
  /**
   * Execute external API call with resilience
   */
  static async executeExternalApi(operation, apiName, fallbackValue) {
    const strategies = [
      { type: "cached", ttl: 3e5 }
      // 5 minutes
    ];
    if (fallbackValue !== void 0) {
      strategies.push({ type: "default", value: fallbackValue });
    }
    return this.execute(operation, {
      serviceName: `external-api-${apiName}`,
      context: apiName,
      circuitBreaker: true,
      retryConfig: {
        maxAttempts: 5,
        initialDelay: 2e3,
        maxDelay: 6e4,
        multiplier: 2,
        jitter: true
      },
      fallbackStrategies: strategies
    });
  }
  /**
   * Execute SERP API call with resilience
   */
  static async executeSerpApi(operation, cacheKey) {
    return this.execute(operation, {
      serviceName: "serp-api",
      context: "serp-api-call",
      circuitBreaker: true,
      retryConfig: {
        maxAttempts: 10,
        initialDelay: 5e3,
        maxDelay: 3e5,
        // 5 minutes
        multiplier: 2,
        jitter: true,
        retryableErrors: [/429/, /503/, /rate.limit/i, /too.many.requests/i]
      },
      fallbackStrategies: [
        { type: "cached", ttl: 36e5 }
        // 1 hour cache
      ],
      cacheKey
    });
  }
  /**
   * Execute payment operation with resilience
   */
  static async executePayment(operation, context) {
    return this.execute(operation, {
      serviceName: "payment-service",
      context: context || "payment-operation",
      circuitBreaker: true,
      retryConfig: {
        maxAttempts: 2,
        initialDelay: 2e3,
        maxDelay: 1e4
      },
      fallbackStrategies: [
        { type: "error" }
        // Don't fallback for payments - fail explicitly
      ]
    });
  }
};
function Resilient(config) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    if (!originalMethod) {
      return descriptor;
    }
    descriptor.value = async function(...args) {
      return ResilientOperationExecutor.execute(
        () => originalMethod.apply(this, args),
        {
          ...config,
          serviceName: `${target.constructor.name}.${propertyKey}`,
          context: config.context || `${target.constructor.name}.${propertyKey}`
        }
      );
    };
    return descriptor;
  };
}

// src/utils/currency-utils.ts
function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
function getCurrencySymbol() {
  return "$";
}

// src/utils/url-utils.ts
function removeUrlParameters(url) {
  if (!url) {
    return null;
  }
  try {
    const urlObj = new URL(url);
    const cleanUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    return cleanUrl.endsWith("/") && urlObj.pathname !== "/" ? cleanUrl.slice(0, -1) : cleanUrl;
  } catch (error) {
    const questionMarkIndex = url.indexOf("?");
    const hashIndex = url.indexOf("#");
    let endIndex = url.length;
    if (questionMarkIndex !== -1) {
      endIndex = questionMarkIndex;
    }
    if (hashIndex !== -1 && hashIndex < endIndex) {
      endIndex = hashIndex;
    }
    return url.substring(0, endIndex);
  }
}
function extractDomain(url) {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.toLowerCase().replace(/^www\./, "");
  } catch (error) {
    const cleanUrl = url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    return cleanUrl.toLowerCase();
  }
}
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    let normalized = `${urlObj.hostname}${urlObj.pathname}`;
    normalized = normalized.replace(/^www\./, "");
    normalized = normalized.replace(/\/$/, "");
    return normalized.toLowerCase();
  } catch (error) {
    return url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}
function isValidUrl(url) {
  try {
    new URL(url.startsWith("http") ? url : `https://${url}`);
    return true;
  } catch (error) {
    return false;
  }
}
function ensureProtocol(url, protocol = "https") {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${protocol}://${url}`;
}

// src/utils/ip-device-utils.ts
function getClientIP(request) {
  if (request) {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const clientIP = request.headers.get("x-client-ip");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    if (realIP) return realIP;
    if (clientIP) return clientIP;
    return null;
  }
  return null;
}
function parseUserAgent(userAgent) {
  const ua = userAgent.toLowerCase();
  let type = "desktop";
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    type = "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    type = "tablet";
  }
  let browser = "Unrecognized Browser";
  if (ua.includes("chrome") && !ua.includes("edg")) {
    browser = "Chrome";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("edg")) {
    browser = "Edge";
  } else if (ua.includes("opr") || ua.includes("opera")) {
    browser = "Opera";
  }
  let os = "Unrecognized OS";
  if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("mac")) {
    os = "macOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS";
  }
  return { type, browser, os };
}
async function getRequestInfo(request) {
  let ipAddress = null;
  let userAgent = null;
  let deviceInfo = null;
  let locationData = null;
  if (request) {
    ipAddress = getClientIP(request);
    userAgent = request.headers.get("user-agent");
    if (userAgent) {
      deviceInfo = parseUserAgent(userAgent);
    }
    if (ipAddress && ipAddress !== "127.0.0.1" && ipAddress !== "::1" && !ipAddress.startsWith("192.168.") && !ipAddress.startsWith("10.")) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5e3);
        const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
          signal: controller.signal,
          headers: {
            "User-Agent": "IndexNow-Pro/1.0"
          }
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const ipApiData = await response.json();
          if (ipApiData && typeof ipApiData === "object" && !ipApiData.error) {
            locationData = {
              country: ipApiData.country_name || ipApiData.country,
              region: ipApiData.region || ipApiData.regionName,
              city: ipApiData.city,
              timezone: ipApiData.timezone,
              latitude: ipApiData.latitude || ipApiData.lat,
              longitude: ipApiData.longitude || ipApiData.lon,
              isp: ipApiData.org || ipApiData.isp
            };
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn({ ipAddress }, `IP geolocation lookup failed: ${message}`);
      }
    }
    if (!locationData) {
      const country = request.headers.get("cf-ipcountry") || request.headers.get("x-country-code");
      const region = request.headers.get("cf-region") || request.headers.get("x-region");
      const city = request.headers.get("cf-ipcity") || request.headers.get("x-city");
      const timezone = request.headers.get("cf-timezone") || request.headers.get("x-timezone");
      if (country || region || city || timezone) {
        locationData = {
          country: country || void 0,
          region: region || void 0,
          city: city || void 0,
          timezone: timezone || void 0
        };
      }
    }
  } else {
    if (typeof window !== "undefined") {
      userAgent = navigator.userAgent;
      if (userAgent) {
        deviceInfo = parseUserAgent(userAgent);
      }
    }
  }
  return {
    ipAddress,
    userAgent,
    deviceInfo,
    locationData
  };
}
function formatDeviceInfo(deviceInfo) {
  if (!deviceInfo) return "Unrecognized Device";
  const { type, browser, os } = deviceInfo;
  return `${browser} on ${os} (${type.charAt(0).toUpperCase() + type.slice(1)})`;
}
function formatLocationData(locationData) {
  if (!locationData) return "Unrecognized Location";
  const parts = [];
  if (locationData.city) parts.push(locationData.city);
  if (locationData.region) parts.push(locationData.region);
  if (locationData.country) parts.push(locationData.country);
  return parts.length > 0 ? parts.join(", ") : "Unrecognized Location";
}
function getSecurityRiskLevel(ipAddress, deviceInfo, locationData, previousIPs = [], previousDevices = []) {
  let riskScore = 0;
  if (ipAddress && !previousIPs.includes(ipAddress)) {
    riskScore += 1;
  }
  if (deviceInfo && !previousDevices.some((d) => d.type === deviceInfo.type && d.browser === deviceInfo.browser)) {
    riskScore += 1;
  }
  if (locationData?.country) {
    const highRiskCountries = ["CN", "RU", "KP", "IR"];
    if (highRiskCountries.includes(locationData.country)) {
      riskScore += 2;
    }
  }
  if (riskScore >= 3) return "high";
  if (riskScore >= 2) return "medium";
  return "low";
}

// src/utils/countries.ts
var countries = [
  { code: "AF", name: "Afghanistan", flag: "\u{1F1E6}\u{1F1EB}" },
  { code: "AL", name: "Albania", flag: "\u{1F1E6}\u{1F1F1}" },
  { code: "DZ", name: "Algeria", flag: "\u{1F1E9}\u{1F1FF}" },
  { code: "AS", name: "American Samoa", flag: "\u{1F1E6}\u{1F1F8}" },
  { code: "AD", name: "Andorra", flag: "\u{1F1E6}\u{1F1E9}" },
  { code: "AO", name: "Angola", flag: "\u{1F1E6}\u{1F1F4}" },
  { code: "AI", name: "Anguilla", flag: "\u{1F1E6}\u{1F1EE}" },
  { code: "AQ", name: "Antarctica", flag: "\u{1F1E6}\u{1F1F6}" },
  { code: "AG", name: "Antigua and Barbuda", flag: "\u{1F1E6}\u{1F1EC}" },
  { code: "AR", name: "Argentina", flag: "\u{1F1E6}\u{1F1F7}" },
  { code: "AM", name: "Armenia", flag: "\u{1F1E6}\u{1F1F2}" },
  { code: "AW", name: "Aruba", flag: "\u{1F1E6}\u{1F1FC}" },
  { code: "AU", name: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "AT", name: "Austria", flag: "\u{1F1E6}\u{1F1F9}" },
  { code: "AZ", name: "Azerbaijan", flag: "\u{1F1E6}\u{1F1FF}" },
  { code: "BS", name: "Bahamas", flag: "\u{1F1E7}\u{1F1F8}" },
  { code: "BH", name: "Bahrain", flag: "\u{1F1E7}\u{1F1ED}" },
  { code: "BD", name: "Bangladesh", flag: "\u{1F1E7}\u{1F1E9}" },
  { code: "BB", name: "Barbados", flag: "\u{1F1E7}\u{1F1E7}" },
  { code: "BY", name: "Belarus", flag: "\u{1F1E7}\u{1F1FE}" },
  { code: "BE", name: "Belgium", flag: "\u{1F1E7}\u{1F1EA}" },
  { code: "BZ", name: "Belize", flag: "\u{1F1E7}\u{1F1FF}" },
  { code: "BJ", name: "Benin", flag: "\u{1F1E7}\u{1F1EF}" },
  { code: "BM", name: "Bermuda", flag: "\u{1F1E7}\u{1F1F2}" },
  { code: "BT", name: "Bhutan", flag: "\u{1F1E7}\u{1F1F9}" },
  { code: "BO", name: "Bolivia", flag: "\u{1F1E7}\u{1F1F4}" },
  { code: "BQ", name: "Bonaire, Sint Eustatius and Saba", flag: "\u{1F1E7}\u{1F1F6}" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "\u{1F1E7}\u{1F1E6}" },
  { code: "BW", name: "Botswana", flag: "\u{1F1E7}\u{1F1FC}" },
  { code: "BV", name: "Bouvet Island", flag: "\u{1F1E7}\u{1F1FB}" },
  { code: "BR", name: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "IO", name: "British Indian Ocean Territory", flag: "\u{1F1EE}\u{1F1F4}" },
  { code: "BN", name: "Brunei Darussalam", flag: "\u{1F1E7}\u{1F1F3}" },
  { code: "BG", name: "Bulgaria", flag: "\u{1F1E7}\u{1F1EC}" },
  { code: "BF", name: "Burkina Faso", flag: "\u{1F1E7}\u{1F1EB}" },
  { code: "BI", name: "Burundi", flag: "\u{1F1E7}\u{1F1EE}" },
  { code: "CV", name: "Cabo Verde", flag: "\u{1F1E8}\u{1F1FB}" },
  { code: "KH", name: "Cambodia", flag: "\u{1F1F0}\u{1F1ED}" },
  { code: "CM", name: "Cameroon", flag: "\u{1F1E8}\u{1F1F2}" },
  { code: "CA", name: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "KY", name: "Cayman Islands", flag: "\u{1F1F0}\u{1F1FE}" },
  { code: "CF", name: "Central African Republic", flag: "\u{1F1E8}\u{1F1EB}" },
  { code: "TD", name: "Chad", flag: "\u{1F1F9}\u{1F1E9}" },
  { code: "CL", name: "Chile", flag: "\u{1F1E8}\u{1F1F1}" },
  { code: "CN", name: "China", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "CX", name: "Christmas Island", flag: "\u{1F1E8}\u{1F1FD}" },
  { code: "CC", name: "Cocos (Keeling) Islands", flag: "\u{1F1E8}\u{1F1E8}" },
  { code: "CO", name: "Colombia", flag: "\u{1F1E8}\u{1F1F4}" },
  { code: "KM", name: "Comoros", flag: "\u{1F1F0}\u{1F1F2}" },
  { code: "CG", name: "Congo", flag: "\u{1F1E8}\u{1F1EC}" },
  { code: "CD", name: "Congo (Democratic Republic)", flag: "\u{1F1E8}\u{1F1E9}" },
  { code: "CK", name: "Cook Islands", flag: "\u{1F1E8}\u{1F1F0}" },
  { code: "CR", name: "Costa Rica", flag: "\u{1F1E8}\u{1F1F7}" },
  { code: "CI", name: "C\xF4te d'Ivoire", flag: "\u{1F1E8}\u{1F1EE}" },
  { code: "HR", name: "Croatia", flag: "\u{1F1ED}\u{1F1F7}" },
  { code: "CU", name: "Cuba", flag: "\u{1F1E8}\u{1F1FA}" },
  { code: "CW", name: "Cura\xE7ao", flag: "\u{1F1E8}\u{1F1FC}" },
  { code: "CY", name: "Cyprus", flag: "\u{1F1E8}\u{1F1FE}" },
  { code: "CZ", name: "Czech Republic", flag: "\u{1F1E8}\u{1F1FF}" },
  { code: "DK", name: "Denmark", flag: "\u{1F1E9}\u{1F1F0}" },
  { code: "DJ", name: "Djibouti", flag: "\u{1F1E9}\u{1F1EF}" },
  { code: "DM", name: "Dominica", flag: "\u{1F1E9}\u{1F1F2}" },
  { code: "DO", name: "Dominican Republic", flag: "\u{1F1E9}\u{1F1F4}" },
  { code: "EC", name: "Ecuador", flag: "\u{1F1EA}\u{1F1E8}" },
  { code: "EG", name: "Egypt", flag: "\u{1F1EA}\u{1F1EC}" },
  { code: "SV", name: "El Salvador", flag: "\u{1F1F8}\u{1F1FB}" },
  { code: "GQ", name: "Equatorial Guinea", flag: "\u{1F1EC}\u{1F1F6}" },
  { code: "ER", name: "Eritrea", flag: "\u{1F1EA}\u{1F1F7}" },
  { code: "EE", name: "Estonia", flag: "\u{1F1EA}\u{1F1EA}" },
  { code: "SZ", name: "Eswatini", flag: "\u{1F1F8}\u{1F1FF}" },
  { code: "ET", name: "Ethiopia", flag: "\u{1F1EA}\u{1F1F9}" },
  { code: "FK", name: "Falkland Islands", flag: "\u{1F1EB}\u{1F1F0}" },
  { code: "FO", name: "Faroe Islands", flag: "\u{1F1EB}\u{1F1F4}" },
  { code: "FJ", name: "Fiji", flag: "\u{1F1EB}\u{1F1EF}" },
  { code: "FI", name: "Finland", flag: "\u{1F1EB}\u{1F1EE}" },
  { code: "FR", name: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "GF", name: "French Guiana", flag: "\u{1F1EC}\u{1F1EB}" },
  { code: "PF", name: "French Polynesia", flag: "\u{1F1F5}\u{1F1EB}" },
  { code: "TF", name: "French Southern Territories", flag: "\u{1F1F9}\u{1F1EB}" },
  { code: "GA", name: "Gabon", flag: "\u{1F1EC}\u{1F1E6}" },
  { code: "GM", name: "Gambia", flag: "\u{1F1EC}\u{1F1F2}" },
  { code: "GE", name: "Georgia", flag: "\u{1F1EC}\u{1F1EA}" },
  { code: "DE", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "GH", name: "Ghana", flag: "\u{1F1EC}\u{1F1ED}" },
  { code: "GI", name: "Gibraltar", flag: "\u{1F1EC}\u{1F1EE}" },
  { code: "GR", name: "Greece", flag: "\u{1F1EC}\u{1F1F7}" },
  { code: "GL", name: "Greenland", flag: "\u{1F1EC}\u{1F1F1}" },
  { code: "GD", name: "Grenada", flag: "\u{1F1EC}\u{1F1E9}" },
  { code: "GP", name: "Guadeloupe", flag: "\u{1F1EC}\u{1F1F5}" },
  { code: "GU", name: "Guam", flag: "\u{1F1EC}\u{1F1FA}" },
  { code: "GT", name: "Guatemala", flag: "\u{1F1EC}\u{1F1F9}" },
  { code: "GG", name: "Guernsey", flag: "\u{1F1EC}\u{1F1EC}" },
  { code: "GN", name: "Guinea", flag: "\u{1F1EC}\u{1F1F3}" },
  { code: "GW", name: "Guinea-Bissau", flag: "\u{1F1EC}\u{1F1FC}" },
  { code: "GY", name: "Guyana", flag: "\u{1F1EC}\u{1F1FE}" },
  { code: "HT", name: "Haiti", flag: "\u{1F1ED}\u{1F1F9}" },
  { code: "HM", name: "Heard Island and McDonald Islands", flag: "\u{1F1ED}\u{1F1F2}" },
  { code: "VA", name: "Holy See", flag: "\u{1F1FB}\u{1F1E6}" },
  { code: "HN", name: "Honduras", flag: "\u{1F1ED}\u{1F1F3}" },
  { code: "HK", name: "Hong Kong", flag: "\u{1F1ED}\u{1F1F0}" },
  { code: "HU", name: "Hungary", flag: "\u{1F1ED}\u{1F1FA}" },
  { code: "IS", name: "Iceland", flag: "\u{1F1EE}\u{1F1F8}" },
  { code: "IN", name: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "ID", name: "Indonesia", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "IR", name: "Iran", flag: "\u{1F1EE}\u{1F1F7}" },
  { code: "IQ", name: "Iraq", flag: "\u{1F1EE}\u{1F1F6}" },
  { code: "IE", name: "Ireland", flag: "\u{1F1EE}\u{1F1EA}" },
  { code: "IM", name: "Isle of Man", flag: "\u{1F1EE}\u{1F1F2}" },
  { code: "IL", name: "Israel", flag: "\u{1F1EE}\u{1F1F1}" },
  { code: "IT", name: "Italy", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "JM", name: "Jamaica", flag: "\u{1F1EF}\u{1F1F2}" },
  { code: "JP", name: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "JE", name: "Jersey", flag: "\u{1F1EF}\u{1F1EA}" },
  { code: "JO", name: "Jordan", flag: "\u{1F1EF}\u{1F1F4}" },
  { code: "KZ", name: "Kazakhstan", flag: "\u{1F1F0}\u{1F1FF}" },
  { code: "KE", name: "Kenya", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "KI", name: "Kiribati", flag: "\u{1F1F0}\u{1F1EE}" },
  { code: "KP", name: "Korea (Democratic People's Republic)", flag: "\u{1F1F0}\u{1F1F5}" },
  { code: "KR", name: "Korea (Republic)", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "KW", name: "Kuwait", flag: "\u{1F1F0}\u{1F1FC}" },
  { code: "KG", name: "Kyrgyzstan", flag: "\u{1F1F0}\u{1F1EC}" },
  { code: "LA", name: "Laos", flag: "\u{1F1F1}\u{1F1E6}" },
  { code: "LV", name: "Latvia", flag: "\u{1F1F1}\u{1F1FB}" },
  { code: "LB", name: "Lebanon", flag: "\u{1F1F1}\u{1F1E7}" },
  { code: "LS", name: "Lesotho", flag: "\u{1F1F1}\u{1F1F8}" },
  { code: "LR", name: "Liberia", flag: "\u{1F1F1}\u{1F1F7}" },
  { code: "LY", name: "Libya", flag: "\u{1F1F1}\u{1F1FE}" },
  { code: "LI", name: "Liechtenstein", flag: "\u{1F1F1}\u{1F1EE}" },
  { code: "LT", name: "Lithuania", flag: "\u{1F1F1}\u{1F1F9}" },
  { code: "LU", name: "Luxembourg", flag: "\u{1F1F1}\u{1F1FA}" },
  { code: "MO", name: "Macao", flag: "\u{1F1F2}\u{1F1F4}" },
  { code: "MG", name: "Madagascar", flag: "\u{1F1F2}\u{1F1EC}" },
  { code: "MW", name: "Malawi", flag: "\u{1F1F2}\u{1F1FC}" },
  { code: "MY", name: "Malaysia", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "MV", name: "Maldives", flag: "\u{1F1F2}\u{1F1FB}" },
  { code: "ML", name: "Mali", flag: "\u{1F1F2}\u{1F1F1}" },
  { code: "MT", name: "Malta", flag: "\u{1F1F2}\u{1F1F9}" },
  { code: "MH", name: "Marshall Islands", flag: "\u{1F1F2}\u{1F1ED}" },
  { code: "MQ", name: "Martinique", flag: "\u{1F1F2}\u{1F1F6}" },
  { code: "MR", name: "Mauritania", flag: "\u{1F1F2}\u{1F1F7}" },
  { code: "MU", name: "Mauritius", flag: "\u{1F1F2}\u{1F1FA}" },
  { code: "YT", name: "Mayotte", flag: "\u{1F1FE}\u{1F1F9}" },
  { code: "MX", name: "Mexico", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "FM", name: "Micronesia", flag: "\u{1F1EB}\u{1F1F2}" },
  { code: "MD", name: "Moldova", flag: "\u{1F1F2}\u{1F1E9}" },
  { code: "MC", name: "Monaco", flag: "\u{1F1F2}\u{1F1E8}" },
  { code: "MN", name: "Mongolia", flag: "\u{1F1F2}\u{1F1F3}" },
  { code: "ME", name: "Montenegro", flag: "\u{1F1F2}\u{1F1EA}" },
  { code: "MS", name: "Montserrat", flag: "\u{1F1F2}\u{1F1F8}" },
  { code: "MA", name: "Morocco", flag: "\u{1F1F2}\u{1F1E6}" },
  { code: "MZ", name: "Mozambique", flag: "\u{1F1F2}\u{1F1FF}" },
  { code: "MM", name: "Myanmar", flag: "\u{1F1F2}\u{1F1F2}" },
  { code: "NA", name: "Namibia", flag: "\u{1F1F3}\u{1F1E6}" },
  { code: "NR", name: "Nauru", flag: "\u{1F1F3}\u{1F1F7}" },
  { code: "NP", name: "Nepal", flag: "\u{1F1F3}\u{1F1F5}" },
  { code: "NL", name: "Netherlands", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "NC", name: "New Caledonia", flag: "\u{1F1F3}\u{1F1E8}" },
  { code: "NZ", name: "New Zealand", flag: "\u{1F1F3}\u{1F1FF}" },
  { code: "NI", name: "Nicaragua", flag: "\u{1F1F3}\u{1F1EE}" },
  { code: "NE", name: "Niger", flag: "\u{1F1F3}\u{1F1EA}" },
  { code: "NG", name: "Nigeria", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "NU", name: "Niue", flag: "\u{1F1F3}\u{1F1FA}" },
  { code: "NF", name: "Norfolk Island", flag: "\u{1F1F3}\u{1F1EB}" },
  { code: "MK", name: "North Macedonia", flag: "\u{1F1F2}\u{1F1F0}" },
  { code: "MP", name: "Northern Mariana Islands", flag: "\u{1F1F2}\u{1F1F5}" },
  { code: "NO", name: "Norway", flag: "\u{1F1F3}\u{1F1F4}" },
  { code: "OM", name: "Oman", flag: "\u{1F1F4}\u{1F1F2}" },
  { code: "PK", name: "Pakistan", flag: "\u{1F1F5}\u{1F1F0}" },
  { code: "PW", name: "Palau", flag: "\u{1F1F5}\u{1F1FC}" },
  { code: "PS", name: "Palestine", flag: "\u{1F1F5}\u{1F1F8}" },
  { code: "PA", name: "Panama", flag: "\u{1F1F5}\u{1F1E6}" },
  { code: "PG", name: "Papua New Guinea", flag: "\u{1F1F5}\u{1F1EC}" },
  { code: "PY", name: "Paraguay", flag: "\u{1F1F5}\u{1F1FE}" },
  { code: "PE", name: "Peru", flag: "\u{1F1F5}\u{1F1EA}" },
  { code: "PH", name: "Philippines", flag: "\u{1F1F5}\u{1F1ED}" },
  { code: "PN", name: "Pitcairn", flag: "\u{1F1F5}\u{1F1F3}" },
  { code: "PL", name: "Poland", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "PT", name: "Portugal", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "PR", name: "Puerto Rico", flag: "\u{1F1F5}\u{1F1F7}" },
  { code: "QA", name: "Qatar", flag: "\u{1F1F6}\u{1F1E6}" },
  { code: "RE", name: "R\xE9union", flag: "\u{1F1F7}\u{1F1EA}" },
  { code: "RO", name: "Romania", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "RU", name: "Russian Federation", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "RW", name: "Rwanda", flag: "\u{1F1F7}\u{1F1FC}" },
  { code: "BL", name: "Saint Barth\xE9lemy", flag: "\u{1F1E7}\u{1F1F1}" },
  { code: "SH", name: "Saint Helena", flag: "\u{1F1F8}\u{1F1ED}" },
  { code: "KN", name: "Saint Kitts and Nevis", flag: "\u{1F1F0}\u{1F1F3}" },
  { code: "LC", name: "Saint Lucia", flag: "\u{1F1F1}\u{1F1E8}" },
  { code: "MF", name: "Saint Martin", flag: "\u{1F1F2}\u{1F1EB}" },
  { code: "PM", name: "Saint Pierre and Miquelon", flag: "\u{1F1F5}\u{1F1F2}" },
  { code: "VC", name: "Saint Vincent and the Grenadines", flag: "\u{1F1FB}\u{1F1E8}" },
  { code: "WS", name: "Samoa", flag: "\u{1F1FC}\u{1F1F8}" },
  { code: "SM", name: "San Marino", flag: "\u{1F1F8}\u{1F1F2}" },
  { code: "ST", name: "Sao Tome and Principe", flag: "\u{1F1F8}\u{1F1F9}" },
  { code: "SA", name: "Saudi Arabia", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "SN", name: "Senegal", flag: "\u{1F1F8}\u{1F1F3}" },
  { code: "RS", name: "Serbia", flag: "\u{1F1F7}\u{1F1F8}" },
  { code: "SC", name: "Seychelles", flag: "\u{1F1F8}\u{1F1E8}" },
  { code: "SL", name: "Sierra Leone", flag: "\u{1F1F8}\u{1F1F1}" },
  { code: "SG", name: "Singapore", flag: "\u{1F1F8}\u{1F1EC}" },
  { code: "SX", name: "Sint Maarten", flag: "\u{1F1F8}\u{1F1FD}" },
  { code: "SK", name: "Slovakia", flag: "\u{1F1F8}\u{1F1F0}" },
  { code: "SI", name: "Slovenia", flag: "\u{1F1F8}\u{1F1EE}" },
  { code: "SB", name: "Solomon Islands", flag: "\u{1F1F8}\u{1F1E7}" },
  { code: "SO", name: "Somalia", flag: "\u{1F1F8}\u{1F1F4}" },
  { code: "ZA", name: "South Africa", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "GS", name: "South Georgia and the South Sandwich Islands", flag: "\u{1F1EC}\u{1F1F8}" },
  { code: "SS", name: "South Sudan", flag: "\u{1F1F8}\u{1F1F8}" },
  { code: "ES", name: "Spain", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "LK", name: "Sri Lanka", flag: "\u{1F1F1}\u{1F1F0}" },
  { code: "SD", name: "Sudan", flag: "\u{1F1F8}\u{1F1E9}" },
  { code: "SR", name: "Suriname", flag: "\u{1F1F8}\u{1F1F7}" },
  { code: "SJ", name: "Svalbard and Jan Mayen", flag: "\u{1F1F8}\u{1F1EF}" },
  { code: "SE", name: "Sweden", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "CH", name: "Switzerland", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "SY", name: "Syrian Arab Republic", flag: "\u{1F1F8}\u{1F1FE}" },
  { code: "TW", name: "Taiwan", flag: "\u{1F1F9}\u{1F1FC}" },
  { code: "TJ", name: "Tajikistan", flag: "\u{1F1F9}\u{1F1EF}" },
  { code: "TZ", name: "Tanzania", flag: "\u{1F1F9}\u{1F1FF}" },
  { code: "TH", name: "Thailand", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "TL", name: "Timor-Leste", flag: "\u{1F1F9}\u{1F1F1}" },
  { code: "TG", name: "Togo", flag: "\u{1F1F9}\u{1F1EC}" },
  { code: "TK", name: "Tokelau", flag: "\u{1F1F9}\u{1F1F0}" },
  { code: "TO", name: "Tonga", flag: "\u{1F1F9}\u{1F1F4}" },
  { code: "TT", name: "Trinidad and Tobago", flag: "\u{1F1F9}\u{1F1F9}" },
  { code: "TN", name: "Tunisia", flag: "\u{1F1F9}\u{1F1F3}" },
  { code: "TR", name: "Turkey", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "TM", name: "Turkmenistan", flag: "\u{1F1F9}\u{1F1F2}" },
  { code: "TC", name: "Turks and Caicos Islands", flag: "\u{1F1F9}\u{1F1E8}" },
  { code: "TV", name: "Tuvalu", flag: "\u{1F1F9}\u{1F1FB}" },
  { code: "UG", name: "Uganda", flag: "\u{1F1FA}\u{1F1EC}" },
  { code: "UA", name: "Ukraine", flag: "\u{1F1FA}\u{1F1E6}" },
  { code: "AE", name: "United Arab Emirates", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "GB", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "US", name: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "UM", name: "United States Minor Outlying Islands", flag: "\u{1F1FA}\u{1F1F2}" },
  { code: "UY", name: "Uruguay", flag: "\u{1F1FA}\u{1F1FE}" },
  { code: "UZ", name: "Uzbekistan", flag: "\u{1F1FA}\u{1F1FF}" },
  { code: "VU", name: "Vanuatu", flag: "\u{1F1FB}\u{1F1FA}" },
  { code: "VE", name: "Venezuela", flag: "\u{1F1FB}\u{1F1EA}" },
  { code: "VN", name: "Viet Nam", flag: "\u{1F1FB}\u{1F1F3}" },
  { code: "VG", name: "Virgin Islands (British)", flag: "\u{1F1FB}\u{1F1EC}" },
  { code: "VI", name: "Virgin Islands (U.S.)", flag: "\u{1F1FB}\u{1F1EE}" },
  { code: "WF", name: "Wallis and Futuna", flag: "\u{1F1FC}\u{1F1EB}" },
  { code: "EH", name: "Western Sahara", flag: "\u{1F1EA}\u{1F1ED}" },
  { code: "YE", name: "Yemen", flag: "\u{1F1FE}\u{1F1EA}" },
  { code: "ZM", name: "Zambia", flag: "\u{1F1FF}\u{1F1F2}" },
  { code: "ZW", name: "Zimbabwe", flag: "\u{1F1FF}\u{1F1FC}" }
];
function findCountryByCode(code) {
  return countries.find((country) => country.code === code);
}
function findCountryByName(name) {
  return countries.find((country) => country.name.toLowerCase().includes(name.toLowerCase()));
}
function getPopularCountries() {
  const popularCodes = ["US", "GB", "CA", "AU", "DE", "FR", "JP", "CN", "IN", "BR"];
  return popularCodes.map((code) => findCountryByCode(code)).filter(Boolean);
}

// src/utils/rate-limiter.ts
var MAX_STORE_SIZE = 1e4;
var inMemoryStore = /* @__PURE__ */ new Map();
var inMemoryRateLimitStore = {
  async get(key) {
    const entry = inMemoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.resetTime) {
      inMemoryStore.delete(key);
      return null;
    }
    return entry;
  },
  async set(key, entry) {
    if (inMemoryStore.size >= MAX_STORE_SIZE && !inMemoryStore.has(key)) {
      const oldest = Array.from(inMemoryStore.entries()).sort(
        (a, b) => a[1].resetTime - b[1].resetTime
      )[0];
      if (oldest) inMemoryStore.delete(oldest[0]);
    }
    inMemoryStore.set(key, entry);
  },
  async delete(key) {
    inMemoryStore.delete(key);
  }
};
var activeStore = inMemoryRateLimitStore;
function setRateLimitStore(store) {
  activeStore = store;
  logger.info({}, "[RateLimiter] Distributed rate-limit store registered");
}
var MAX_ATTEMPTS = 5;
var WINDOW_MS = 15 * 60 * 1e3;
function isHeadersWithGet(h) {
  return "get" in h && typeof h.get === "function";
}
function getHeaderValue(headers, name) {
  if (isHeadersWithGet(headers)) {
    return headers.get(name) ?? null;
  }
  const headersObj = headers;
  const value = headersObj[name] || headersObj[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0] || null;
  }
  return value || null;
}
function getClientIp(request) {
  const forwardedFor = getHeaderValue(request.headers, "x-forwarded-for");
  const realIp = getHeaderValue(request.headers, "x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";
}
async function isRateLimited(request) {
  const ip = getClientIp(request);
  const entry = await activeStore.get(ip);
  if (!entry) return false;
  return entry.count > MAX_ATTEMPTS;
}
async function recordFailedAttempt(request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = await activeStore.get(ip);
  if (!entry) {
    await activeStore.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS
    });
    return false;
  }
  entry.count++;
  await activeStore.set(ip, entry);
  if (entry.count > MAX_ATTEMPTS) {
    logger.warn(
      {
        ipAddress: ip,
        attemptCount: entry.count,
        maxAttempts: MAX_ATTEMPTS,
        userAgent: getHeaderValue(request.headers, "user-agent") || "unspecified",
        endpoint: request.nextUrl?.pathname || "unspecified"
      },
      "Rate limit exceeded - potential brute force attack"
    );
    return true;
  }
  return false;
}
async function resetRateLimit(request) {
  const ip = getClientIp(request);
  await activeStore.delete(ip);
}

// src/utils/sql-utils.ts
function escapeLikePattern(pattern) {
  return pattern.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

// src/core/api-response.ts
function formatSuccess(data, requestId, statusCode = 200) {
  return {
    success: true,
    data,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    requestId,
    statusCode
  };
}
function formatError(error, requestId) {
  const isProd = isProduction();
  const clientMessage = isProd ? error.userMessage || "An unexpected error occurred" : error.message;
  const sanitizedDetails = error.details ? { ...error.details } : void 0;
  if (isProd && sanitizedDetails) {
    delete sanitizedDetails.stack;
    delete sanitizedDetails.message;
    if (sanitizedDetails.metadata) {
      delete sanitizedDetails.metadata;
    }
  }
  return {
    success: false,
    error: {
      id: error.id,
      type: error.type,
      message: clientMessage,
      userMessage: error.userMessage,
      severity: error.severity,
      timestamp: error.timestamp.toISOString(),
      statusCode: error.statusCode,
      details: sanitizedDetails
    },
    requestId
  };
}

// src/core/activity/ActivityLogger.ts
var ActivityEventTypes = {
  // Authentication
  LOGIN: "login",
  LOGOUT: "logout",
  REGISTER: "register",
  PASSWORD_RESET: "password_reset",
  PASSWORD_CHANGE: "password_change",
  // Profile Management
  PROFILE_UPDATE: "profile_update",
  SETTINGS_CHANGE: "settings_change",
  SETTINGS_VIEW: "settings_view",
  NOTIFICATION_SETTINGS_UPDATE: "notification_settings_update",
  // Job Management
  JOB_CREATE: "job_create",
  JOB_UPDATE: "job_update",
  JOB_DELETE: "job_delete",
  JOB_START: "job_start",
  JOB_PAUSE: "job_pause",
  JOB_RESUME: "job_resume",
  JOB_CANCEL: "job_cancel",
  JOB_VIEW: "job_view",
  // Billing & Payment Events
  CHECKOUT_INITIATED: "checkout_initiated",
  ORDER_CREATED: "order_created",
  PAYMENT_PROOF_UPLOADED: "payment_proof_uploaded",
  SUBSCRIPTION_UPGRADE: "subscription_upgrade",
  BILLING_VIEW: "billing_view",
  BILLING_HISTORY_VIEW: "billing_history_view",
  ORDER_VIEW: "order_view",
  PACKAGE_SELECTION: "package_selection",
  // Dashboard Activities
  DASHBOARD_VIEW: "dashboard_view",
  DASHBOARD_STATS_VIEW: "dashboard_stats_view",
  QUOTA_VIEW: "quota_view",
  INDEXNOW_PAGE_VIEW: "indexnow_page_view",
  MANAGE_JOBS_VIEW: "manage_jobs_view",
  // API Calls
  API_CALL: "api_call",
  GOOGLE_API_CALL: "google_api_call",
  // Admin Activities
  ADMIN_LOGIN: "admin_login",
  ADMIN_DASHBOARD_VIEW: "admin_dashboard_view",
  ADMIN_STATS_VIEW: "admin_stats_view",
  USER_MANAGEMENT: "user_management",
  USER_SUSPEND: "user_suspend",
  USER_UNSUSPEND: "user_unsuspend",
  USER_PASSWORD_RESET: "user_password_reset",
  USER_PROFILE_UPDATE: "user_profile_update",
  USER_ROLE_CHANGE: "user_role_change",
  USER_QUOTA_RESET: "user_quota_reset",
  USER_PACKAGE_CHANGE: "user_package_change",
  USER_SUBSCRIPTION_EXTEND: "user_subscription_extend",
  // Admin Settings
  ADMIN_SETTINGS: "admin_settings",
  SITE_SETTINGS_UPDATE: "site_settings_update",
  SITE_SETTINGS_VIEW: "site_settings_view",
  PAYMENT_GATEWAY_CREATE: "payment_gateway_create",
  PAYMENT_GATEWAY_UPDATE: "payment_gateway_update",
  PAYMENT_GATEWAY_DELETE: "payment_gateway_delete",
  PAYMENT_GATEWAY_VIEW: "payment_gateway_view",
  PACKAGE_CREATE: "package_create",
  PACKAGE_UPDATE: "package_update",
  PACKAGE_DELETE: "package_delete",
  PACKAGE_VIEW: "package_view",
  // Admin Orders
  ORDER_MANAGEMENT: "order_management",
  ORDER_STATUS_UPDATE: "order_status_update",
  ADMIN_ORDER_VIEW: "admin_order_view",
  ORDER_APPROVE: "order_approve",
  ORDER_REJECT: "order_reject",
  // Page Views & Navigation
  PAGE_VIEW: "page_view",
  ADMIN_PANEL_ACCESS: "admin_panel_access",
  USER_SECURITY_VIEW: "user_security_view",
  USER_ACTIVITY_VIEW: "user_activity_view",
  // Keyword Tracker Activities
  KEYWORD_ADD: "keyword_add",
  KEYWORD_DELETE: "keyword_delete",
  KEYWORD_UPDATE: "keyword_update",
  KEYWORD_BULK_DELETE: "keyword_bulk_delete",
  KEYWORD_TAG_ADD: "keyword_tag_add",
  KEYWORD_TAG_REMOVE: "keyword_tag_remove",
  DOMAIN_ADD: "domain_add",
  DOMAIN_DELETE: "domain_delete",
  DOMAIN_UPDATE: "domain_update",
  KEYWORD_TRACKER_VIEW: "keyword_tracker_view",
  RANK_HISTORY_VIEW: "rank_history_view",
  // System Events
  ERROR_OCCURRED: "error_occurred",
  SECURITY_VIOLATION: "security_violation",
  QUOTA_EXCEEDED: "quota_exceeded"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ACTIVITY_ENDPOINTS,
  ADMIN_ENDPOINTS,
  API_BASE,
  APP_METADATA,
  AUTH_ENDPOINTS,
  ActivityEventTypes,
  AdminSchemas,
  ApiEndpoints,
  AppConfig,
  AppError,
  AutoCancelJobSchema,
  BILLING_ENDPOINTS,
  BackoffStrategies,
  BaseSchemas,
  CACHE_KEYS,
  CACHE_TTL,
  CircuitBreaker,
  CircuitBreakerManager,
  CircuitState,
  ConfigSchema,
  CustomValidators,
  DASHBOARD_ENDPOINTS,
  DEFAULT_SETTINGS,
  EMAIL_TEMPLATES,
  ERROR_ENDPOINTS,
  EXTERNAL_ENDPOINTS,
  EmailJobSchema,
  ErrorHandlingService,
  ErrorSeverity,
  ErrorType,
  ExponentialBackoff,
  FIELD_LIMITS,
  FILE_UPLOAD,
  FallbackHandler,
  FallbackHandlers,
  FileValidation,
  HTTP_STATUS,
  INTEGRATION_ENDPOINTS,
  ImmediateRankCheckJobSchema,
  JOB_STATUS,
  JOB_TYPES,
  KeywordEnrichmentJobSchema,
  LEGACY_ENDPOINTS,
  NOTIFICATION_ENDPOINTS,
  NOTIFICATION_TYPES,
  NUMERIC_LIMITS,
  PAGINATION,
  PAYMENT_ENDPOINTS,
  PUBLIC_ENDPOINTS,
  PaymentSchemas,
  PaymentWebhookJobSchema,
  RANK_TRACKING,
  RANK_TRACKING_ENDPOINTS,
  RATE_LIMITS,
  REGEX_PATTERNS,
  ROLE_PERMISSIONS,
  RankTrackingSchemas,
  Resilient,
  ResilientOperationExecutor,
  SCHEDULE_TYPES,
  SYSTEM_ENDPOINTS,
  ServiceCircuitBreakers,
  TIME,
  USER_ERROR_MESSAGES,
  USER_ROLES,
  UserSchemas,
  VALIDATION_PATTERNS,
  apiRequestSchemas,
  buildEndpoint,
  capitalizeFirstLetter,
  changePasswordSchema,
  cn,
  countries,
  createApiKeySchema,
  createAppConfig,
  createFallbackHandler,
  createPaymentSchema,
  createRefundSchema,
  createSubscriptionSchema,
  customerInfoSchema,
  ensureProtocol,
  escapeLikePattern,
  extractDomain,
  findCountryByCode,
  findCountryByName,
  forgotPasswordSchema,
  formatCurrency,
  formatDate,
  formatDeviceInfo,
  formatError,
  formatLocationData,
  formatNumber,
  formatRelativeTime,
  formatSuccess,
  getClientIP,
  getCurrencySymbol,
  getPopularCountries,
  getRequestInfo,
  getSecurityRiskLevel,
  isDevelopment,
  isMaintenanceMode,
  isProduction,
  isRateLimited,
  isStaging,
  isValidEndpoint,
  isValidUrl,
  logger,
  loginSchema,
  normalizeUrl,
  parseUserAgent,
  recordFailedAttempt,
  registerSchema,
  removeUrlParameters,
  resetPasswordSchema,
  resetRateLimit,
  retryWithBackoff,
  setLoggerTransport,
  setRateLimitStore,
  sleep,
  truncateString,
  updateSiteSettingsSchema,
  updateUserProfileSchema,
  updateUserSettingsSchema,
  validatePromoCodeSchema
});
//# sourceMappingURL=index.js.map