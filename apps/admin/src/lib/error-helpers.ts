import { format } from 'date-fns'

/**
 * Shared helpers for admin error pages (list + detail).
 * Eliminates duplicated severity/status/formatting logic.
 */

/** Severity → dot indicator color class */
export function getSeverityDotColor(severity: string): string {
  if (severity === 'critical' || severity === 'error') return 'bg-red-500'
  if (severity === 'warning') return 'bg-amber-500'
  return 'bg-gray-400'
}

/** Error status derived from resolved_at / acknowledged_at timestamps */
export function getErrorStatus(err: {
  resolved_at: string | null
  acknowledged_at: string | null
}): { label: string; colorClass: string } {
  if (err.resolved_at) return { label: 'Resolved', colorClass: 'text-emerald-600' }
  if (err.acknowledged_at) return { label: 'Acknowledged', colorClass: 'text-blue-600' }
  return { label: 'Unresolved', colorClass: 'text-amber-600' }
}

/** Standard error timestamp format */
export function formatErrorDate(date: string): string {
  return format(new Date(date), 'MMM d, yyyy HH:mm:ss')
}

/** Whether metadata is present and non-empty */
export function hasMetadata(metadata: unknown): metadata is Record<string, unknown> {
  return !!metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0
}
