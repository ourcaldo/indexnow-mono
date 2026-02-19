import { NextRequest } from 'next/server';
import { z } from 'zod';
import { redisRateLimiter } from '@/lib/rate-limiting/redis-rate-limiter';

// Enhanced Zod schemas for payment validation
const customerInfoSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  email: z
    .string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters'),
  phone: z
    .string()
    .optional()
    .refine(
      (phone) => !phone || /^\+?[\d\s\-\(\)]{7,20}$/.test(phone),
      'Invalid phone number format'
    ),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(200, 'Address must be less than 200 characters'),
  city: z.string().min(1, 'City is required').max(100, 'City must be less than 100 characters'),
  state: z.string().min(1, 'State is required').max(100, 'State must be less than 100 characters'),
  zip_code: z
    .string()
    .min(1, 'ZIP code is required')
    .max(20, 'ZIP code must be less than 20 characters'),
  country: z
    .string()
    .min(1, 'Country is required')
    .max(100, 'Country must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

const paymentRequestSchema = z.object({
  package_id: z.string().uuid('Invalid package ID format'),
  billing_period: z.enum(['monthly', 'annual', 'lifetime', 'one-time'], {
    errorMap: () => ({
      message: 'Invalid billing period. Must be monthly, annual, lifetime, or one-time',
    }),
  }),
  customer_info: customerInfoSchema,
});

// Validation result type
export interface ValidationResult {
  success: boolean;
  data: z.infer<typeof paymentRequestSchema> | null;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }> | null;
}

// Business rules validation
interface ValidatedPaymentData {
  customer_info: {
    email: string;
    phone?: string;
    country: string;
  };
}

async function validateBusinessRules(data: ValidatedPaymentData): Promise<void> {
  // Validate email domain (basic spam prevention)
  const email = data.customer_info.email.toLowerCase();
  const suspiciousDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];

  if (suspiciousDomains.some((domain) => email.includes(domain))) {
    throw new Error('Temporary email addresses are not allowed');
  }

  // Validate country-specific requirements
  if (data.customer_info.country === 'Indonesia' && !data.customer_info.phone) {
    throw new Error('Phone number is required for Indonesian customers');
  }
}

// Enhanced validation function with detailed error reporting
export async function validatePaymentRequest(request: NextRequest): Promise<ValidationResult> {
  try {
    const body = await request.json();

    // Validate the request body structure
    const validatedData = paymentRequestSchema.parse(body);

    // Additional business logic validation
    await validateBusinessRules(validatedData);

    return {
      success: true,
      data: validatedData,
      errors: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      return {
        success: false,
        data: null,
        errors: formattedErrors,
      };
    }

    // Handle other validation errors
    return {
      success: false,
      data: null,
      errors: [
        {
          field: 'general',
          message: error instanceof Error ? error.message : 'Validation failed',
          code: 'validation_error',
        },
      ],
    };
  }
}

// Rate limiting implementation (Redis-backed)
export async function checkRateLimit(
  userKey: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
  blockDurationMs: number = 60 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const config = { maxAttempts, windowMs, blockDurationMs };
  const result = await redisRateLimiter.check(`billing_${userKey}`, config);
  if (!result.allowed) {
    // Auto-increment on check (this function was check+track in one)
    await redisRateLimiter.increment(`billing_${userKey}`, config);
  }
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetTime: Date.now() + result.retryAfter * 1000,
  };
}

// Input sanitization helper
export function sanitizeInput<T>(input: T): T {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential XSS characters
      .substring(0, 1000) as T; // Limit string length
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (typeof value === 'string' || typeof value === 'object') {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized as T;
  }

  return input;
}

// Generate unique request ID for tracing
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
