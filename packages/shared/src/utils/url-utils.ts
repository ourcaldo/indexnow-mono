/**
 * URL Utility Functions
 * 
 * Helper functions for URL manipulation and sanitization
 */

import { isPrivateOrReservedIP, isValidIPv4, isValidIPv6 } from './ip-device-utils';

const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain', '[::1]']);

/**
 * Check whether a hostname is a private/internal address (SSRF protection).
 * Returns true for: private IPs, loopback, link-local, localhost, IPv6 ULA/link-local.
 * For non-IP hostnames (e.g. "example.com"), returns false (DNS resolution cannot be done synchronously).
 */
function isPrivateHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lower)) return true;

  // Strip IPv6 bracket notation: [::1] → ::1
  const bare = lower.startsWith('[') && lower.endsWith(']') ? lower.slice(1, -1) : lower;

  if (isValidIPv4(bare) || isValidIPv6(bare)) {
    return isPrivateOrReservedIP(bare);
  }

  return false;
}

/**
 * Remove query parameters from URL
 * Example: "https://example.com/page?param=value" -> "https://example.com/page"
 * 
 * This is used to clean URLs before storing in database to ensure consistency
 * and prevent storing tracking parameters like ?srsltid=...
 */
export function removeUrlParameters(url: string | null): string | null {
  if (!url) {
    return null
  }

  try {
    // Parse URL
    const urlObj = new URL(url)
    
    // Build clean URL without query parameters or hash
    const cleanUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`
    
    // Remove trailing slash if present (unless it's root path)
    return cleanUrl.endsWith('/') && urlObj.pathname !== '/' 
      ? cleanUrl.slice(0, -1) 
      : cleanUrl
      
  } catch (error) {
    // If URL parsing fails, try manual cleanup
    const questionMarkIndex = url.indexOf('?')
    const hashIndex = url.indexOf('#')
    
    let endIndex = url.length
    
    // Find the earliest special character
    if (questionMarkIndex !== -1) {
      endIndex = questionMarkIndex
    }
    if (hashIndex !== -1 && hashIndex < endIndex) {
      endIndex = hashIndex
    }
    
    return url.substring(0, endIndex)
  }
}

/**
 * Extract clean domain from URL.
 * Throws if the extracted hostname is a private/internal IP (SSRF protection).
 * Example: "https://www.example.com/page" -> "example.com"
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    const domain = urlObj.hostname.toLowerCase().replace(/^www\./, '')

    if (isPrivateHostname(domain)) {
      throw new Error(`Domain resolves to a private/internal address: ${domain}`)
    }

    return domain
  } catch (error) {
    // Re-throw SSRF errors from the try block
    if (error instanceof Error && error.message.startsWith('Domain resolves to')) {
      throw error
    }
    // If URL parsing fails, try to extract domain manually
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
    const domain = cleanUrl.toLowerCase()

    if (isPrivateHostname(domain)) {
      throw new Error(`Domain resolves to a private/internal address: ${domain}`)
    }

    return domain
  }
}

/**
 * Normalize URL for comparison
 * - Removes protocol
 * - Removes www
 * - Removes trailing slash
 * - Converts to lowercase
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    let normalized = `${urlObj.hostname}${urlObj.pathname}`
    normalized = normalized.replace(/^www\./, '')
    normalized = normalized.replace(/\/$/, '')
    return normalized.toLowerCase()
  } catch (error) {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
  }
}

/**
 * Check if URL is valid.
 * Returns false for URLs pointing to private/internal IPs (SSRF protection).
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    if (isPrivateHostname(urlObj.hostname)) {
      return false
    }
    return true
  } catch (error) {
    return false
  }
}

/**
 * Add protocol to URL if missing
 */
export function ensureProtocol(url: string, protocol: 'http' | 'https' = 'https'): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `${protocol}://${url}`
}
