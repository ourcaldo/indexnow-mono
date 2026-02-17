/**
 * SQL/PostgREST utility functions for safe query construction
 */

/**
 * Escapes SQL LIKE/ILIKE wildcard characters from user input.
 * Prevents injection of `%`, `_`, and `\` into PostgREST filter strings.
 *
 * @param pattern - Raw user input to be used in ilike/like filters
 * @returns Escaped string safe for use in PostgREST .ilike() / .or() filters
 */
export function escapeLikePattern(pattern: string): string {
  return pattern
    .replace(/\\/g, '\\\\')  // Escape backslash first
    .replace(/%/g, '\\%')    // Escape percent
    .replace(/_/g, '\\_');   // Escape underscore
}
