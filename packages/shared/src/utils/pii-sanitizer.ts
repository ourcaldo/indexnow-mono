/**
 * PII Sanitizer Utility
 * Scrubs sensitive information from objects and strings
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'card_number',
  'cvv',
  'bank_account',
  'api_key',
  'client_secret',
  'private_key',
  'access_token',
  'refresh_token',
];

/**
 * Sanitizes an object by recursively replacing sensitive values.
 * (#V7 M-07) Uses a WeakSet to guard against circular references.
 */
export function sanitizePII(data: unknown, _seen?: WeakSet<object>): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Try to parse string as JSON if it looks like it
    if (
      (data.startsWith('{') && data.endsWith('}')) ||
      (data.startsWith('[') && data.endsWith(']'))
    ) {
      try {
        const parsed = JSON.parse(data) as unknown;
        return JSON.stringify(sanitizePII(parsed));
      } catch {
        /* PII sanitization fallback — return raw data */
        return data;
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    const seen = _seen || new WeakSet();
    if (seen.has(data)) return '[Circular]';
    seen.add(data);
    return data.map((item) => sanitizePII(item, seen));
  }

  if (typeof data === 'object') {
    const seen = _seen || new WeakSet();
    if (seen.has(data as object)) return '[Circular]';
    seen.add(data as object);
    const sanitized: Record<string, unknown> = {};
    const record = data as Record<string, unknown>;

    for (const [key, value] of Object.entries(record)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizePII(value, seen);
      }
    }
    return sanitized;
  }

  return data;
}
