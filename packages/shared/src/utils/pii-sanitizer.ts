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
  'refresh_token'
];

/**
 * Sanitizes an object by recursively replacing sensitive values
 */
export function sanitizePII(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Try to parse string as JSON if it looks like it
    if ((data.startsWith('{') && data.endsWith('}')) || (data.startsWith('[') && data.endsWith(']'))) {
      try {
        const parsed = JSON.parse(data);
        return JSON.stringify(sanitizePII(parsed));
      } catch {
        return data;
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizePII(item));
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizePII(value);
      }
    }
    return sanitized;
  }

  return data;
}
