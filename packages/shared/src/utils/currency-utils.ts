/**
 * Currency utility functions.
 * Default currency is USD. Paddle handles multi-currency conversion at checkout.
 * (#V7 L-03) The currency parameter is accepted so callers can pass non-USD amounts
 * (e.g. IDR from the database) — Intl.NumberFormat handles formatting for any ISO 4217 code.
 */

/**
 * Formats currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Gets currency symbol (always $)
 */
export function getCurrencySymbol(): string {
  return '$';
}
