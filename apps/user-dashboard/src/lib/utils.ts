/**
 * Shared UI utility helpers for the user dashboard.
 */

const DATE_FMT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

/**
 * Format an ISO date/timestamp string as "Mar 1, 2026".
 * Always uses en-US locale for consistency across browsers.
 */
export function fmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', DATE_FMT)
}

/**
 * Format an ISO timestamp string as "Mar 1, 2026, 2:45 PM".
 * Use for events where the time is meaningful (e.g. transactions).
 */
export function fmtDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { ...DATE_FMT, hour: '2-digit', minute: '2-digit' })
}
