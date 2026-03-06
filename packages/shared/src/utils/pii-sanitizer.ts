/**
 * PII Sanitizer Utility
 * Scrubs sensitive information from objects and strings.
 * Performs both key-based and value-based detection.
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'card_number',
  'cvv',
  'cvc',
  'bank_account',
  'api_key',
  'client_secret',
  'private_key',
  'access_token',
  'refresh_token',
  'ssn',
  'social_security',
  'credit_card',
  'pin',
  'credentials',
  'access_key',
];

const REDACTED = '[REDACTED]';

/** Patterns that detect PII embedded in arbitrary string values. */
const PII_VALUE_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: 'email' },
  // SSN-like (XXX-XX-XXXX)
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, label: 'ssn' },
  // Credit-card-like (13–19 digit sequences with optional separators)
  { pattern: /\b(?:\d[ -]*?){13,19}\b/g, label: 'card' },
  // Phone numbers: +1-234-567-8901, (234) 567-8901, 234-567-8901, etc.
  {
    pattern: /(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{1,4}\)[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{0,4}\b/g,
    label: 'phone',
  },
];

/**
 * Minimum length a string must have before we run the (more expensive)
 * value-pattern scan. Short strings can't contain meaningful PII.
 */
const MIN_VALUE_SCAN_LENGTH = 6;

/** Replace all PII pattern matches in a string with [REDACTED]. */
function redactPIIValues(value: string): string {
  if (value.length < MIN_VALUE_SCAN_LENGTH) return value;

  let result = value;
  for (const { pattern } of PII_VALUE_PATTERNS) {
    // Reset lastIndex since we reuse the regex across calls
    pattern.lastIndex = 0;
    result = result.replace(pattern, REDACTED);
  }
  return result;
}

/**
 * Sanitizes an object by recursively replacing sensitive values.
 * (#V7 M-07) Uses a WeakSet to guard against circular references.
 *
 * Detection layers:
 *  1. Key-based — if a key name matches SENSITIVE_KEYS, the entire value is redacted.
 *  2. Value-based — string values are scanned for PII patterns (emails, SSNs, card numbers, phone numbers).
 */
export function sanitizePII(data: unknown, _seen?: WeakSet<object>): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Try to parse string as JSON if it looks like it
    const trimmed = data.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        return JSON.stringify(sanitizePII(parsed));
      } catch {
        /* PII sanitization fallback — scan raw string */
        return redactPIIValues(data);
      }
    }
    return redactPIIValues(data);
  }

  if (Array.isArray(data)) {
    const seen = _seen || new WeakSet();
    if (seen.has(data)) return '[Circular]';
    seen.add(data);
    return data.map((item) => sanitizePII(item, seen));
  }

  if (typeof data === 'object') {
    const seen = _seen || new WeakSet();
    if (seen.has(data)) return '[Circular]';
    seen.add(data);
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
        sanitized[key] = REDACTED;
      } else {
        sanitized[key] = sanitizePII(value, seen);
      }
    }
    return sanitized;
  }

  return data;
}
