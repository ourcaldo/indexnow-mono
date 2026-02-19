/**
 * Shared async utilities — consolidated from duplicate implementations.
 */

/**
 * Pause execution for a specified duration.
 * Use this instead of creating per-class `private sleep()` methods.
 * (#V7 L-11) Clamps to 0 for negative values.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}
