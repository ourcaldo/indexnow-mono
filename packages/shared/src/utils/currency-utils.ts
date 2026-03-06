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

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  KRW: '₩',
};

/**
 * Gets the display symbol for a currency code (ISO 4217).
 * Falls back to the uppercase currency code itself for unknown currencies.
 */
export function getCurrencySymbol(currency: string = 'USD'): string {
  const code = currency.toUpperCase();
  return CURRENCY_SYMBOLS[code] ?? code;
}
