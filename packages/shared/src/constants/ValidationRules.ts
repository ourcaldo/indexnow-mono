/**
 * Validation Rules for IndexNow Studio
 * Centralized validation rules and schemas
 */

import { z } from 'zod';

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  DOMAIN: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  CRON: /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const;

// Field length limits
export const FIELD_LIMITS = {
  EMAIL: { min: 5, max: 254 },
  PASSWORD: { min: 8, max: 128 },
  NAME: { min: 1, max: 100 },
  TITLE: { min: 1, max: 200 },
  DESCRIPTION: { min: 0, max: 1000 },
  URL: { min: 10, max: 2048 },
  PHONE: { min: 8, max: 20 },
  TAG: { min: 1, max: 50 },
  SLUG: { min: 1, max: 100 },
  MESSAGE: { min: 1, max: 5000 },
  KEYWORD: { min: 1, max: 100 },
  DOMAIN: { min: 3, max: 253 },
  JOB_NAME: { min: 1, max: 100 },
  PACKAGE_NAME: { min: 1, max: 50 },
} as const;

// Numerical limits
export const NUMERIC_LIMITS = {
  PAGINATION: { min: 1, max: 1000 }, // Increased for bulk data fetching
  QUOTA: { min: 0, max: 999999999 },
  PRICE: { min: 0, max: 999999999 },
  PERCENTAGE: { min: 0, max: 100 },
  POSITION: { min: 1, max: 100 },
  RETRY_ATTEMPTS: { min: 0, max: 10 },
  TIMEOUT: { min: 1000, max: 300000 }, // 1 second to 5 minutes
  FILE_SIZE: { min: 1, max: 5 * 1024 * 1024 }, // 1 byte to 5MB
  BULK_OPERATIONS: { min: 1, max: 1000 },
} as const;

// Base validation schemas
export const BaseSchemas = {
  email: z
    .string()
    .min(FIELD_LIMITS.EMAIL.min, 'Email is too short')
    .max(FIELD_LIMITS.EMAIL.max, 'Email is too long')
    .regex(VALIDATION_PATTERNS.EMAIL, 'Invalid email format'),

  password: z
    .string()
    .min(FIELD_LIMITS.PASSWORD.min, 'Password must be at least 8 characters')
    .max(FIELD_LIMITS.PASSWORD.max, 'Password is too long')
    .regex(
      VALIDATION_PATTERNS.PASSWORD,
      'Password must contain uppercase, lowercase, number and special character'
    ),

  url: z
    .string()
    .min(FIELD_LIMITS.URL.min, 'URL is too short')
    .max(FIELD_LIMITS.URL.max, 'URL is too long')
    .regex(VALIDATION_PATTERNS.URL, 'Invalid URL format'),

  domain: z
    .string()
    .min(FIELD_LIMITS.DOMAIN.min, 'Domain is too short')
    .max(FIELD_LIMITS.DOMAIN.max, 'Domain is too long')
    .regex(VALIDATION_PATTERNS.DOMAIN, 'Invalid domain format'),

  phone: z
    .string()
    .min(FIELD_LIMITS.PHONE.min, 'Phone number is too short')
    .max(FIELD_LIMITS.PHONE.max, 'Phone number is too long')
    .regex(VALIDATION_PATTERNS.PHONE, 'Invalid phone number format'),

  uuid: z.string().regex(VALIDATION_PATTERNS.UUID, 'Invalid UUID format'),

  cron: z.string().regex(VALIDATION_PATTERNS.CRON, 'Invalid cron expression'),

  slug: z
    .string()
    .min(FIELD_LIMITS.SLUG.min, 'Slug is too short')
    .max(FIELD_LIMITS.SLUG.max, 'Slug is too long')
    .regex(VALIDATION_PATTERNS.SLUG, 'Invalid slug format'),

  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z
      .number()
      .min(NUMERIC_LIMITS.PAGINATION.min)
      .max(NUMERIC_LIMITS.PAGINATION.max)
      .default(10),
  }),

  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),

  tags: z
    .array(z.string().min(FIELD_LIMITS.TAG.min).max(FIELD_LIMITS.TAG.max))
    .max(20, 'Too many tags'),
} as const;

// User validation schemas
export const UserSchemas = {
  register: z.object({
    email: BaseSchemas.email,
    password: BaseSchemas.password,
    fullName: z
      .string()
      .min(FIELD_LIMITS.NAME.min, 'Name is required')
      .max(FIELD_LIMITS.NAME.max, 'Name is too long'),
    phoneNumber: BaseSchemas.phone.optional(),
    country: z.string().min(2).max(3).optional(),
  }),

  login: z.object({
    email: BaseSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),

  profile: z.object({
    fullName: z
      .string()
      .min(FIELD_LIMITS.NAME.min, 'Name is required')
      .max(FIELD_LIMITS.NAME.max, 'Name is too long'),
    phoneNumber: BaseSchemas.phone.optional(),
    country: z.string().min(2).max(3).optional(),
    emailNotifications: z.boolean().default(true),
  }),

  changePassword: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: BaseSchemas.password,
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),

  settings: z.object({
    timeoutDuration: z
      .number()
      .min(NUMERIC_LIMITS.TIMEOUT.min)
      .max(NUMERIC_LIMITS.TIMEOUT.max)
      .default(30000),
    retryAttempts: z
      .number()
      .min(NUMERIC_LIMITS.RETRY_ATTEMPTS.min)
      .max(NUMERIC_LIMITS.RETRY_ATTEMPTS.max)
      .default(3),
    emailJobCompletion: z.boolean().default(true),
    emailJobFailure: z.boolean().default(true),
    emailQuotaAlerts: z.boolean().default(true),
    emailDailyReport: z.boolean().default(true),
    defaultSchedule: z
      .enum(['one-time', 'hourly', 'daily', 'weekly', 'monthly'])
      .default('one-time'),
  }),
} as const;

// Rank tracking validation schemas
export const RankTrackingSchemas = {
  keyword: z.object({
    keyword: z
      .string()
      .min(FIELD_LIMITS.KEYWORD.min, 'Keyword is required')
      .max(FIELD_LIMITS.KEYWORD.max, 'Keyword is too long'),
    domain: BaseSchemas.domain,
    country: z.string().length(2, 'Invalid country code'),
    device: z.enum(['desktop', 'mobile', 'tablet']).default('desktop'),
    searchEngine: z.enum(['google', 'bing', 'yahoo']).default('google'),
    tags: BaseSchemas.tags.optional(),
    targetUrl: BaseSchemas.url.optional(),
  }),

  bulkKeywords: z.object({
    keywords: z
      .array(
        z.object({
          keyword: z.string().min(FIELD_LIMITS.KEYWORD.min).max(FIELD_LIMITS.KEYWORD.max),
          domain: BaseSchemas.domain,
          country: z.string().length(2),
          device: z.enum(['desktop', 'mobile', 'tablet']).default('desktop'),
          searchEngine: z.enum(['google', 'bing', 'yahoo']).default('google'),
          tags: BaseSchemas.tags.optional(),
          targetUrl: BaseSchemas.url.optional(),
        })
      )
      .min(1, 'At least one keyword is required')
      .max(NUMERIC_LIMITS.BULK_OPERATIONS.max, 'Too many keywords'),
  }),

  domain: z.object({
    domain: BaseSchemas.domain,
    name: z
      .string()
      .min(FIELD_LIMITS.NAME.min, 'Domain name is required')
      .max(FIELD_LIMITS.NAME.max, 'Domain name is too long'),
    isActive: z.boolean().default(true),
  }),

  rankCheck: z.object({
    keywordIds: z
      .array(BaseSchemas.uuid)
      .min(1, 'At least one keyword is required')
      .max(NUMERIC_LIMITS.BULK_OPERATIONS.max, 'Too many keywords'),
    forceRefresh: z.boolean().default(false),
  }),
} as const;

// Payment validation schemas - Define customerInfo first
const customerInfoSchema = z.object({
  firstName: z
    .string()
    .min(FIELD_LIMITS.NAME.min, 'First name is required')
    .max(FIELD_LIMITS.NAME.max, 'First name is too long'),
  lastName: z
    .string()
    .min(FIELD_LIMITS.NAME.min, 'Last name is required')
    .max(FIELD_LIMITS.NAME.max, 'Last name is too long'),
  email: BaseSchemas.email,
  phone: BaseSchemas.phone,
  address: z.string().max(200, 'Address is too long').optional().or(z.literal('')),
  city: z.string().max(50, 'City name is too long').optional().or(z.literal('')),
  postalCode: z.string().max(10, 'Postal code is too long').optional().or(z.literal('')),
  country: z.string().min(2, 'Country code is required').max(3, 'Invalid country code'),
});

export const PaymentSchemas = {
  customerInfo: customerInfoSchema,

  paymentRequest: z.object({
    packageId: BaseSchemas.uuid,
    billingPeriod: z.enum(['monthly', 'quarterly', 'biannual', 'annual']),
    paymentMethod: z.enum(['paddle', 'credit-card']),
    customerInfo: customerInfoSchema,
    promoCode: z.string().optional(),
    isTrialToSubscription: z.boolean().default(false),
  }),

  webhookPayload: z.object({
    order_id: z.string(),
    status_code: z.string(),
    transaction_status: z.string(),
    fraud_status: z.string().optional(),
    payment_type: z.string().optional(),
    gross_amount: z.string(),
    signature_key: z.string(),
  }),
} as const;

// Admin validation schemas
export const AdminSchemas = {
  userManagement: z.object({
    userId: BaseSchemas.uuid,
    action: z.enum([
      'suspend',
      'activate',
      'reset-password',
      'extend-subscription',
      'change-package',
    ]),
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .max(FIELD_LIMITS.MESSAGE.max, 'Reason is too long'),
    additionalData: z.record(z.string(), z.unknown()).optional(),
  }),

  packageManagement: z.object({
    name: z
      .string()
      .min(FIELD_LIMITS.PACKAGE_NAME.min, 'Package name is required')
      .max(FIELD_LIMITS.PACKAGE_NAME.max, 'Package name is too long'),
    description: z
      .string()
      .min(FIELD_LIMITS.DESCRIPTION.min)
      .max(FIELD_LIMITS.DESCRIPTION.max, 'Description is too long'),
    price: z.number().min(NUMERIC_LIMITS.PRICE.min).max(NUMERIC_LIMITS.PRICE.max),
    quotaLimits: z.object({
      dailyUrls: z.number().min(0),
      keywords: z.number().min(0),
      concurrentJobs: z.number().min(0),
    }),
    features: z.array(z.string()),
    isActive: z.boolean().default(true),
  }),

  siteSettings: z.object({
    siteName: z
      .string()
      .min(FIELD_LIMITS.NAME.min, 'Site name is required')
      .max(FIELD_LIMITS.NAME.max, 'Site name is too long'),
    siteDescription: z.string().max(FIELD_LIMITS.DESCRIPTION.max, 'Description is too long'),
    contactEmail: BaseSchemas.email.optional(),
    supportEmail: BaseSchemas.email.optional(),
    maintenanceMode: z.boolean().default(false),
    registrationEnabled: z.boolean().default(true),
  }),
} as const;

// File upload validation
export const FileValidation = {
  validateFileType: (fileName: string, allowedTypes: string[]): boolean => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return allowedTypes.includes(extension);
  },

  validateFileSize: (fileSize: number, maxSize: number = NUMERIC_LIMITS.FILE_SIZE.max): boolean => {
    return fileSize <= maxSize && fileSize >= NUMERIC_LIMITS.FILE_SIZE.min;
  },

  validateUrlList: (content: string): string[] => {
    const urls = content
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    const validUrls: string[] = [];
    const errors: string[] = [];

    urls.forEach((url, index) => {
      if (VALIDATION_PATTERNS.URL.test(url)) {
        validUrls.push(url);
      } else {
        errors.push(`Invalid URL at line ${index + 1}: ${url}`);
      }
    });

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }

    return validUrls;
  },
} as const;

// Custom validation functions
export const CustomValidators = {
  isStrongPassword: (password: string): boolean => {
    return VALIDATION_PATTERNS.PASSWORD.test(password);
  },

  isValidCronExpression: (cron: string): boolean => {
    return VALIDATION_PATTERNS.CRON.test(cron);
  },

  isValidDomain: (domain: string): boolean => {
    return VALIDATION_PATTERNS.DOMAIN.test(domain);
  },

  isBusinessEmail: (email: string): boolean => {
    const freeEmailDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'aol.com',
      'icloud.com',
      'protonmail.com',
      'tempmail.org',
      '10minutemail.com',
      'guerrillamail.com',
    ];

    if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
      return false;
    }

    const domain = email.split('@')[1].toLowerCase();
    return !freeEmailDomains.includes(domain);
  },

  /**
   * Comprehensive XSS sanitizer that encodes dangerous characters and strips
   * known attack vectors including script injection, event handlers, dangerous
   * URIs, style-based XSS, SVG/MathML payloads, and template literal injection.
   */
  sanitizeInput: (input: string): string => {
    let sanitized = input;

    // 1. Decode HTML entities to catch encoded payloads (&#x3C;, &#60;, etc.)
    sanitized = sanitized
      .replace(/&#x([0-9a-fA-F]+);?/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\d+);?/g, (_m, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&(lt|gt|amp|quot|apos|Tab|NewLine);/gi, (m) => {
        const map: Record<string, string> = {
          '&lt;': '<',
          '&gt;': '>',
          '&amp;': '&',
          '&quot;': '"',
          '&apos;': "'",
          '&Tab;': '\t',
          '&NewLine;': '\n',
        };
        return map[m.toLowerCase()] ?? m;
      });

    // 2. Strip null bytes and zero-width characters used to bypass filters
    sanitized = sanitized.replace(/[\x00\u200B\u200C\u200D\uFEFF]/g, '');

    // 3. Remove <script>, <iframe>, <object>, <embed>, <applet>, <form>,
    //    <svg>, <math>, <base>, <link>, <meta>, <style> tags and their contents
    const dangerousTags = [
      'script',
      'iframe',
      'object',
      'embed',
      'applet',
      'form',
      'svg',
      'math',
      'base',
      'link',
      'meta',
      'style',
      'template',
      'xmp',
      'xml',
      'xss',
    ];
    for (const tag of dangerousTags) {
      const openClose = new RegExp(`<${tag}\\b[^]*?<\\/${tag}\\s*>`, 'gi');
      sanitized = sanitized.replace(openClose, '');
      const selfClosing = new RegExp(`<\\/?${tag}\\b[^>]*\\/?>`, 'gi');
      sanitized = sanitized.replace(selfClosing, '');
    }

    // 4. Strip event handler attributes (on*="...", on*='...', on*=...)
    sanitized = sanitized.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

    // 5. Remove dangerous URI schemes (javascript:, data:, vbscript:, etc.)
    //    Handles whitespace/newline obfuscation within the scheme
    sanitized = sanitized.replace(
      /(?:java\s*s\s*c\s*r\s*i\s*p\s*t|v\s*b\s*s\s*c\s*r\s*i\s*p\s*t|data)\s*:/gi,
      ''
    );

    // 6. Remove style-based XSS: expression(), url(), -moz-binding, behavior, etc.
    sanitized = sanitized.replace(
      /expression\s*\(|url\s*\(|@import\b|-moz-binding\s*:|behavior\s*:|binding\s*:/gi,
      ''
    );

    // 7. Remove template literal injection vectors: ${ ... }
    sanitized = sanitized.replace(/\$\{[^}]*\}/g, '');

    // 8. HTML-encode the core dangerous characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized.trim();
  },
} as const;
