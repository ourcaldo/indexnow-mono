import { z } from 'zod';
import { type Json } from './types/common/Json';
import { VALIDATION_PATTERNS, FIELD_LIMITS, NUMERIC_LIMITS } from './constants/ValidationRules';

// Password complexity: at least 8 chars, 1 uppercase, 1 lowercase, 1 digit (#12)
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Auth schemas for Supabase integration
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z.string().min(8, 'Please confirm your password'),
    phoneNumber: z
      .string()
      .min(3, 'Please enter a valid phone number')
      .regex(/^\+?[0-9\s\-\(\)]+$/, 'Phone number can only contain numbers, spaces, +, -, ( and )'),
    country: z.string().min(2, 'Please select a country'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// IndexNow specific schemas
export const urlSubmissionSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  keyLocation: z.string().url('Key location URL').optional(),
});

export const indexStatusSchema = z.object({
  url: z.string().url(),
  status: z.enum(['pending', 'submitted', 'indexed', 'failed', 'skipped']),
  submittedAt: z.string().datetime(),
  indexedAt: z.string().datetime().optional(),
  errorMessage: z.string().optional(),
});

// Job creation schemas
export const createJobSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  type: z.enum(['manual']),
  schedule_type: z.enum(['one-time', 'hourly', 'daily', 'weekly', 'monthly']).default('one-time'),
  source_data: z.object({
    urls: z.array(z.string().url()).optional(),
  }),
});

// User profile schemas
export const updateUserProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').optional(),
  email_notifications: z.boolean().optional(),
  phone_number: z.string().optional(),
});

export const updateUserSettingsSchema = z.object({
  timeout_duration: z.number().min(1000).max(300000).optional(), // 1s to 5min
  retry_attempts: z.number().min(1).max(10).optional(),
  email_job_completion: z.boolean().optional(),
  email_job_failure: z.boolean().optional(),
  email_quota_alerts: z.boolean().optional(),
  default_schedule: z.enum(['one-time', 'hourly', 'daily', 'weekly', 'monthly']).optional(),
  email_daily_report: z.boolean().optional(),
});

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  });

// Site settings schema with SEO management
export const updateSiteSettingsSchema = z.object({
  site_name: z.string().min(1, 'Site name is required').optional(),
  site_tagline: z.string().optional(),
  site_description: z.string().optional(),
  site_logo_url: z.string().url().optional().or(z.literal('')),
  white_logo: z.string().url().optional().or(z.literal('')),
  site_icon_url: z.string().url().optional().or(z.literal('')),
  site_favicon_url: z.string().url().optional().or(z.literal('')),
  contact_email: z.string().email().optional().or(z.literal('')),
  support_email: z.string().email().optional().or(z.literal('')),
  maintenance_mode: z.boolean().optional(),
  registration_enabled: z.boolean().optional(),
});

// Type exports
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type UrlSubmission = z.infer<typeof urlSubmissionSchema>;
export type IndexStatus = z.infer<typeof indexStatusSchema>;
export type CreateJobRequest = z.infer<typeof createJobSchema>;
export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserSettingsRequest = z.infer<typeof updateUserSettingsSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type UpdateSiteSettingsRequest = z.infer<typeof updateSiteSettingsSchema>;

// Dashboard stats type
export interface DashboardStats {
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

// Enhanced API Request Validation Schemas (Enhancement #2)
export const apiRequestSchemas = {
  // Admin user management schemas
  adminUserAction: z.object({
    userId: z.string().regex(VALIDATION_PATTERNS.UUID, 'Invalid user ID format'),
    action: z.enum([
      'suspend',
      'activate',
      'reset-password',
      'reset-quota',
      'extend-subscription',
      'change-package',
    ]),
    reason: z.string().min(10).max(FIELD_LIMITS.MESSAGE.max),
    additionalData: z.record(z.unknown()).optional(),
  }),

  // Query parameter schemas
  paginationQuery: z.object({
    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(1).max(1000))
      .optional()
      .default('1'),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(1).max(1000))
      .optional()
      .default('10'),
  }),

  ordersQuery: z.object({
    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(1).max(1000))
      .optional()
      .default('1'),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(1).max(100))
      .optional()
      .default('10'),
    status: z.enum(['pending', 'proof_uploaded', 'completed', 'failed', 'cancelled']).optional(),
    customer: z.string().max(100).optional(),
    package_id: z.string().regex(VALIDATION_PATTERNS.UUID).optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
    amount_min: z
      .string()
      .transform((val) => parseFloat(val))
      .pipe(z.number().min(0))
      .optional(),
    amount_max: z
      .string()
      .transform((val) => parseFloat(val))
      .pipe(z.number().min(0))
      .optional(),
  }),

  adminActivityQuery: z.object({
    days: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(1).max(365))
      .optional()
      .default('7'),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(1).max(500))
      .optional()
      .default('100'),
    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(1).max(1000))
      .optional()
      .default('1'),
    user: z.string().regex(VALIDATION_PATTERNS.UUID).optional(),
    search: z.string().max(100).optional(),
    event_type: z
      .enum([
        'all',
        'login',
        'logout',
        'admin_action',
        'order_management',
        'user_management',
        'system_action',
      ])
      .optional()
      .default('all'),
  }),

  keywordsQuery: z.object({
    domain_id: z.string().regex(VALIDATION_PATTERNS.UUID, 'Invalid domain ID').optional(),
    device_type: z.enum(['desktop', 'mobile', 'tablet']).optional(),
    country_id: z.string().regex(VALIDATION_PATTERNS.UUID, 'Invalid country ID').optional(),
    tags: z.string().optional(),
    search: z.string().max(100).optional(),
    sort: z.enum(['keyword', 'position', 'created_at', 'updated_at']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(1).max(1000))
      .optional()
      .default('1'),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(1).max(1000))
      .optional()
      .default('20'),
  }),

  // URL parameter schemas
  idParam: z.object({
    id: z.string().regex(VALIDATION_PATTERNS.UUID, 'Invalid ID format'),
  }),

  // Bulk operation schemas
  bulkKeywordDelete: z.object({
    keyword_ids: z
      .array(z.string().regex(VALIDATION_PATTERNS.UUID))
      .min(1)
      .max(NUMERIC_LIMITS.BULK_OPERATIONS.max),
    confirm: z.boolean().refine((val) => val === true, 'Confirmation required for bulk delete'),
  }),

  // Rank tracking schemas
  keywordCreate: z.object({
    keyword: z.string().min(FIELD_LIMITS.KEYWORD.min).max(FIELD_LIMITS.KEYWORD.max),
    domain: z.string().regex(VALIDATION_PATTERNS.DOMAIN),
    country: z.string().length(2),
    device: z.enum(['desktop', 'mobile', 'tablet']).default('desktop'),
    search_engine: z.enum(['google', 'bing', 'yahoo']).default('google'),
    target_url: z.string().url().optional(),
    tags: z.array(z.string().max(FIELD_LIMITS.TAG.max)).max(10).optional(),
  }),

  rankCheckTrigger: z.object({
    keyword_ids: z.array(z.string().regex(VALIDATION_PATTERNS.UUID)).min(1).max(100),
    force_refresh: z.boolean().default(false),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
  }),

  // Settings and configuration
  siteSettingsUpdate: z.object({
    id: z.string().regex(VALIDATION_PATTERNS.UUID).optional(), // For updates
    site_name: z.string().min(1).max(100).optional(),
    site_tagline: z.string().max(200).optional(),
    site_description: z.string().max(500).optional(),
    site_logo_url: z.string().url().optional(),
    white_logo: z.string().url().optional(),
    site_icon_url: z.string().url().optional(),
    site_favicon_url: z.string().url().optional(),
    contact_email: z.string().regex(VALIDATION_PATTERNS.EMAIL).optional(),
    support_email: z.string().regex(VALIDATION_PATTERNS.EMAIL).optional(),
    maintenance_mode: z.boolean().optional(),
    registration_enabled: z.boolean().optional(),
  }),

  // Admin user management request bodies
  adminChangePackage: z.object({
    packageId: z.string().regex(VALIDATION_PATTERNS.UUID, 'Invalid package ID'),
    reason: z.string().min(10).max(FIELD_LIMITS.MESSAGE.max),
    effectiveDate: z.string().datetime().optional(),
    notifyUser: z.boolean().default(true),
  }),

  adminResetPassword: z.object({
    newPassword: z.string().min(8).max(128),
    reason: z.string().min(10).max(FIELD_LIMITS.MESSAGE.max),
    forcePasswordChange: z.boolean().default(true),
    notifyUser: z.boolean().default(true),
  }),

  adminExtendSubscription: z.object({
    extensionPeriod: z.number().min(1).max(365), // Days
    reason: z.string().min(10).max(FIELD_LIMITS.MESSAGE.max),
    addToExisting: z.boolean().default(true),
  }),

  // URL Parameter validation schemas for dynamic routes
  uuidParam: z.object({
    id: z.string().regex(VALIDATION_PATTERNS.UUID, 'Invalid ID format - must be a valid UUID'),
  }),

  slugParam: z.object({
    slug: z
      .string()
      .regex(
        VALIDATION_PATTERNS.SLUG,
        'Invalid slug format - must contain only lowercase letters, numbers, and dashes'
      ),
  }),

  keywordIdParam: z.object({
    keywordId: z.string().regex(VALIDATION_PATTERNS.UUID, 'Invalid keyword ID format'),
  }),

  domainIdParam: z.object({
    domainId: z.string().regex(VALIDATION_PATTERNS.UUID, 'Invalid domain ID format'),
  }),
};
// API Response types
/** @deprecated Use ApiResponse from core/api-response instead */
export interface ApiResponse<T = Json> {
  data?: T;
  error?: string;
  message?: string;
  details?: Json;
}

export interface PaginatedResponse<T = Json> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
