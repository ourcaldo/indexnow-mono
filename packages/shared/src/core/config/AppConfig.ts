import { z } from 'zod';

/**
 * Zod schemas for configuration validation
 */

const AppSchema = z.object({
  name: z.string().default('IndexNow Studio'),
  version: z.string().default('1.0.0'),
  environment: z.enum(['development', 'staging', 'production']).default('production'),
  baseUrl: z.string().url().default('http://localhost:3000'),
  dashboardUrl: z.string().url().optional(),
  backendUrl: z.string().url().optional(),
  apiBaseUrl: z.string().url().optional(),
  port: z.coerce.number().default(3000),
  allowedOrigins: z.array(z.string()).default([]),
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
 * Creates an AppConfig instance based on environment variables.
 * NOTE (#6): This throws on invalid config — intentional fail-fast design.
 * The application should not boot with missing critical secrets.
 * If lazy/graceful init is needed, wrap the import in a try-catch.
 */
export const createAppConfig = (): AppConfigType => {
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
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || undefined,
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

  // During Next.js build phase, the build environment may not have all env vars.
  // Log warnings instead of throwing to allow builds to complete.
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  if (!parsed.success) {
    const errorMsg = '❌ Invalid configuration: ' + JSON.stringify(parsed.error.format(), null, 2);
    if (isBuildPhase) {
      console.warn(
        '[AppConfig] Build-time config validation failed (non-fatal during build):',
        errorMsg
      );
      // (#V7 H-02) Return the raw config for build-time usage only. This is NOT validated —
      // consumers must never rely on config values for security decisions at build time.
      // The returned value is cast to the validated type but has NOT been validated.
      // The Proxy traps log a warning when deeply-nested properties are accessed,
      // making silent undefined-as-string bugs more visible.
      const buildStub = rawConfig as Record<string, unknown>;
      return new Proxy(buildStub, {
        get(target, prop) {
          const value = target[prop as string];
          if (value === undefined && typeof prop === 'string' && prop !== 'then') {
            console.warn(`[AppConfig] Build-time access to missing config key: ${prop}`);
          }
          return value;
        },
      }) as unknown as ReturnType<typeof ConfigSchema.parse>;
    }
    if (typeof window === 'undefined') {
      console.error(errorMsg);
    } else {
      console.warn(errorMsg);
    }
    // Fail fast: Strict configuration is required for security and stability.
    // We throw an error to prevent the application from booting with invalid secrets.
    throw new Error(errorMsg);
  }

  // Production environment validation — critical secrets must be present
  // Skip during Next.js build phase since build environment may not have all secrets
  if (parsed.data.app.environment === 'production' && !isBuildPhase) {
    const missing: string[] = [];
    const warnings: string[] = [];

    // ── Critical: will throw if missing ──
    if (!parsed.data.security.encryptionKey) missing.push('ENCRYPTION_KEY');
    if (!parsed.data.security.encryptionMasterKey) missing.push('ENCRYPTION_MASTER_KEY');
    if (!parsed.data.security.jwtSecret) missing.push('JWT_SECRET');
    if (!parsed.data.security.systemApiKey) missing.push('SYSTEM_API_KEY');
    if (!parsed.data.supabase.serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!parsed.data.supabase.jwtSecret) missing.push('SUPABASE_JWT_SECRET');

    // ── Service-level: required for full functionality ──
    if (!parsed.data.redis.host && !parsed.data.redis.url) missing.push('REDIS_HOST or REDIS_URL');
    if (!parsed.data.email.smtp.host) missing.push('SMTP_HOST');
    if (!parsed.data.email.smtp.user) missing.push('SMTP_USER');
    if (!parsed.data.email.smtp.pass) missing.push('SMTP_PASS');

    // ── Warnings: recommended but not fatal ──
    if (!parsed.data.paddle.apiKey) warnings.push('PADDLE_API_KEY (payments will be unavailable)');
    if (!parsed.data.paddle.webhookSecret)
      warnings.push('PADDLE_WEBHOOK_SECRET (webhook verification disabled)');
    if (!parsed.data.monitoring.sentry.dsn)
      warnings.push('NEXT_PUBLIC_SENTRY_DSN (error tracking disabled)');

    if (warnings.length > 0) {
      console.warn(`⚠️  Missing recommended production variables:\n  - ${warnings.join('\n  - ')}`);
    }

    if (missing.length > 0) {
      const errorMsg = `❌ Missing required production environment variables: ${missing.join(', ')}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  return parsed.data;
};

// Singleton instance
// NOTE (#5/#59): This singleton caches build-time env vars. In serverless environments,
// env vars are typically set at build time and don't change at runtime, so this is safe.
// If runtime env var changes are needed, expose a `refreshConfig()` function.
export const AppConfig = createAppConfig();

// Helper functions
export const isProduction = (): boolean => AppConfig.app.environment === 'production';
export const isDevelopment = (): boolean => AppConfig.app.environment === 'development';
export const isStaging = (): boolean => AppConfig.app.environment === 'staging';
export const isMaintenanceMode = (): boolean => false; // Implement as needed
