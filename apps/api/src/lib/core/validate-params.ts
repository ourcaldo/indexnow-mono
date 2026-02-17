import { z } from 'zod';

/**
 * UUID v4 validation schema
 * Used across all API routes that accept ID parameters
 */
export const uuidParamSchema = z.string().uuid('Invalid ID format — must be a valid UUID');

/**
 * Validates a route parameter as a UUID.
 * Returns the validated UUID string, or null if invalid.
 */
export function validateUuidParam(value: string | undefined | null): string | null {
  if (!value) return null;
  const result = uuidParamSchema.safeParse(value);
  return result.success ? result.data : null;
}
