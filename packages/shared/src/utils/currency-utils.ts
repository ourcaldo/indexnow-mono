/**
 * Currency utility functions for USD-only pricing
 * All prices are displayed in USD. Paddle handles currency conversion at checkout.
 */

/**
 * Formats currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Gets currency symbol (always $)
 */
export function getCurrencySymbol(): string {
  return '$'
}
