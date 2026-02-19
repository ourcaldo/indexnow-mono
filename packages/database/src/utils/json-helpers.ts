/**
 * Type-safe JSON conversion helpers for Supabase.
 *
 * Supabase's `Json` type is a recursive union (`string | number | boolean | null | { [key: string]: Json } | Json[]`).
 * TypeScript can't structurally match it against domain interfaces (e.g. `EnrichmentJobConfig`, `OrderMetadata`).
 * These helpers encapsulate the `as unknown as` bridge in one place so callsites stay clean.
 *
 * Usage:
 *   import { toJson, fromJson } from '@indexnow/database';
 *   // Writing to Supabase: typed object → Json column
 *   await supabase.from('table').insert({ config: toJson(myConfig) });
 *   // Reading from Supabase: Json column → typed object
 *   const config = fromJson<MyConfig>(row.config);
 */

import type { Json } from '@indexnow/shared';

/**
 * Convert a typed object to Supabase `Json` for column storage.
 * The runtime value is unchanged — this is a compile-time bridge only.
 */
export function toJson<T>(value: T): Json {
  return value as unknown as Json;
}

/**
 * Convert a Supabase `Json` column value back to a typed object.
 * The runtime value is unchanged — this is a compile-time bridge only.
 *
 * ⚠ TRUST CAST (#V7 H-01): No runtime validation is performed.
 * The caller is responsible for ensuring the JSON structure matches `T`.
 * For untrusted / user-supplied JSON, prefer `fromJsonSafe()` with a Zod schema.
 */
export function fromJson<T>(value: Json | null | undefined): T {
  return value as unknown as T;
}

/**
 * Convert a Supabase `Json` column value to a typed object with runtime validation.
 * Returns `null` if parsing fails.
 */
export function fromJsonSafe<T>(
  value: Json | null | undefined,
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }
): T | null {
  if (value === null || value === undefined) return null;
  const result = schema.safeParse(value);
  return result.success ? (result.data as T) : null;
}

/**
 * Convert a Supabase `Json` column value to a typed object, with a fallback default.
 * Returns `defaultValue` when the input is `null` or `undefined`.
 */
export function fromJsonOr<T>(value: Json | null | undefined, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  return value as unknown as T;
}
