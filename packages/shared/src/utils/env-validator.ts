import { z } from 'zod';

/**
 * Common environment variable schema for all applications
 */
export const commonEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * API-specific environment variable schema
 */
export const apiEnvSchema = commonEnvSchema.extend({
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  // External Services
  PADDLE_API_KEY: z.string().optional(),
  PADDLE_WEBHOOK_SECRET: z.string().optional(),
  SERANKING_API_TOKEN: z.string().optional(),
});

/**
 * Validates environment variables against a schema
 * @param schema Zod schema to validate against
 * @param env Environment variables object (default: process.env)
 * @returns Validated environment variables
 * @throws Error if validation fails
 */
export function validateEnv<T extends z.ZodType>(schema: T, env: Record<string, unknown> = process.env): z.infer<T> {
  const result = schema.safeParse(env);

  if (!result.success) {
    const errorMessages = result.error.issues.map((issue) => {
      return `${issue.path.join('.')}: ${issue.message}`;
    }).join('\n');

    throw new Error(`Invalid environment variables:\n${errorMessages}`);
  }

  return result.data;
}
