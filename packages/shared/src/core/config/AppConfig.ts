import { z } from 'zod';

/**
 * Zod schemas for configuration validation
 */

const AppSchema = z.object({
  name: z.string().default('IndexNow Studio'),
  version: z.string().default('1.0.0'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  baseUrl: z.string().url().default('http://localhost:3000'),
  port: z.coerce.number().default(3000),
});

const SupabaseSchema = z.object({
  url: z.string().url(),
  anonKey: z.string().min(1),
  serviceRoleKey: z.string().min(1).optional(),
  jwtSecret: z.string().min(1).optional(),
  bucketName: z.string().default('indexnow-public'),
});

const SecuritySchema = z.object({
  encryptionKey: z.string().min(1).optional(),
  encryptionMasterKey: z.string().min(1).optional(),
  jwtSecret: z.string().min(1).optional(),
  systemApiKey: z.string().min(1).optional(),
});

const RedisSchema = z.object({
  host: z.string().optional(),
  port: z.coerce.number().optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  url: z.string().optional(),
});

const BullMQSchema = z.object({
  concurrency: z.object({
    rankCheck: z.coerce.number().default(5),
    email: z.coerce.number().default(10),
    payments: z.coerce.number().default(3),
  }),
  rateLimit: z.object({
    rankCheck: z.object({
      max: z.coerce.number().default(28),
      duration: z.coerce.number().default(60000),
    }),
    email: z.object({
      max: z.coerce.number().default(50),
      duration: z.coerce.number().default(60000),
    }),
  }),
});

const PaddleSchema = z.object({
  apiKey: z.string().min(1).optional(),
  webhookSecret: z.string().min(1).optional(),
  clientToken: z.string().min(1),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
});

const MonitoringSchema = z.object({
  sentry: z.object({
    dsn: z.string().url().optional(),
    environment: z.string().default('development'),
    traceSampleRate: z.coerce.number().default(0.1),
    replaysSessionRate: z.coerce.number().default(0.1),
    replaysErrorRate: z.coerce.number().default(1.0),
  }),
  posthog: z.object({
    key: z.string().optional(),
    host: z.string().url().default('https://app.posthog.com'),
  }),
  ga4: z.object({
    measurementId: z.string().optional(),
  }),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const EmailSchema = z.object({
  smtp: z.object({
    host: z.string().optional(),
    port: z.coerce.number().optional(),
    user: z.string().optional(),
    pass: z.string().optional(),
    fromName: z.string().default('IndexNow'),
    fromEmail: z.string().optional(),
  }),
});

/**
 * Combined Config Schema
 */
export const ConfigSchema = z.object({
  app: AppSchema,
  supabase: SupabaseSchema,
  security: SecuritySchema,
  redis: RedisSchema,
  bullmq: BullMQSchema,
  paddle: PaddleSchema,
  monitoring: MonitoringSchema,
  email: EmailSchema,
});

export type AppConfigType = z.infer<typeof ConfigSchema>;

/**
 * Creates an AppConfig instance based on environment variables
 */
export const createAppConfig = (): AppConfigType => {
  const rawConfig = {
    app: {
      name: process.env.NEXT_PUBLIC_APP_NAME,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      environment: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      port: process.env.PORT,
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecret: process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET,
      bucketName: process.env.SUPABASE_BUCKET_NAME,
    },
    security: {
      encryptionKey: process.env.ENCRYPTION_KEY,
      encryptionMasterKey: process.env.ENCRYPTION_MASTER_KEY,
      jwtSecret: process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET,
      systemApiKey: process.env.SYSTEM_API_KEY,
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      user: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      url: process.env.REDIS_URL,
    },
    bullmq: {
      concurrency: {
        rankCheck: process.env.BULLMQ_CONCURRENCY_RANK_CHECK,
        email: process.env.BULLMQ_CONCURRENCY_EMAIL,
        payments: process.env.BULLMQ_CONCURRENCY_PAYMENTS,
      },
      rateLimit: {
        rankCheck: {
          max: process.env.BULLMQ_RATE_LIMIT_RANK_CHECK_MAX,
          duration: process.env.BULLMQ_RATE_LIMIT_RANK_CHECK_DURATION,
        },
        email: {
          max: process.env.BULLMQ_RATE_LIMIT_EMAIL_MAX,
          duration: process.env.BULLMQ_RATE_LIMIT_EMAIL_DURATION,
        },
      },
    },
    paddle: {
      apiKey: process.env.PADDLE_API_KEY,
      webhookSecret: process.env.PADDLE_WEBHOOK_SECRET,
      clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV,
    },
    monitoring: {
      sentry: {
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
        traceSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE,
        replaysSessionRate: process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_RATE,
        replaysErrorRate: process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_RATE,
      },
      posthog: {
        key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      },
      ga4: {
        measurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
      },
      logLevel: process.env.LOG_LEVEL,
    },
    email: {
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        fromName: process.env.SMTP_FROM_NAME,
        fromEmail: process.env.SMTP_FROM_EMAIL,
      },
    },
  };

  const parsed = ConfigSchema.safeParse(rawConfig);

  if (!parsed.success) {
    if (typeof window === 'undefined') {
      console.error('❌ Invalid configuration:', parsed.error.format());
      // In production server-side, we might want to throw
      // throw new Error('Invalid configuration');
    }
    // Return a default safe config or throw if critical
    // Using a minimal valid object to satisfy the schema or just throw
    if (process.env.NODE_ENV === 'test') {
       // For testing, we might want to allow partial configs or mocks
       return ConfigSchema.parse({}); 
    }
    // For now, return what we have even if invalid
    // We attempt to parse an empty object to get defaults
    console.warn('⚠️ Config validation failed, using partial/default values');
    // Attempt to parse an empty object to get defaults
    const defaults = ConfigSchema.safeParse({});
    if (defaults.success) {
        return defaults.data;
    }
    // If even defaults fail (shouldn't happen with proper schema), we must return a valid AppConfigType.
    // We force parsing of empty object which should have defaults for all required fields
    // or we throw. Since we are here, we might as well throw if we can't recover.
    return ConfigSchema.parse({});
  }

  return parsed.data;
};

// Singleton instance
export const AppConfig = createAppConfig();

// Helper functions
export const isProduction = (): boolean => AppConfig.app.environment === 'production';
export const isDevelopment = (): boolean => AppConfig.app.environment === 'development';
export const isStaging = (): boolean => AppConfig.app.environment === 'staging';
export const isMaintenanceMode = (): boolean => false; // Implement as needed
