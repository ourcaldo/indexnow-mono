/**
 * Shared async utilities — consolidated from duplicate implementations.
 */

/**
 * Pause execution for a specified duration.
 * Use this instead of creating per-class `private sleep()` methods.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
