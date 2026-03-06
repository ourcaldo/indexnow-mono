/**
 * IP Address and Device Detection Utilities for Activity Logging
 * Comprehensive tracking for security and analytics purposes
 */

import { NextRequest } from 'next/server';
import { logger } from './logger';

// ── In-memory geolocation cache (TTL-based with size limit) ──
interface GeoCacheEntry {
  data: LocationData;
  expiresAt: number;
}

const GEO_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const GEO_CACHE_MAX_ENTRIES = 10_000;
const geoCache = new Map<string, GeoCacheEntry>();

function geoCacheGet(ip: string): LocationData | null {
  const entry = geoCache.get(ip);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    geoCache.delete(ip);
    return null;
  }
  return entry.data;
}

function geoCacheSet(ip: string, data: LocationData): void {
  // Evict oldest entries when at capacity
  if (geoCache.size >= GEO_CACHE_MAX_ENTRIES) {
    const now = Date.now();
    // First pass: remove expired entries
    for (const [key, entry] of geoCache) {
      if (now > entry.expiresAt) {
        geoCache.delete(key);
      }
    }
    // If still over limit, delete oldest 10% by insertion order
    if (geoCache.size >= GEO_CACHE_MAX_ENTRIES) {
      const toDelete = Math.ceil(GEO_CACHE_MAX_ENTRIES * 0.1);
      let deleted = 0;
      for (const key of geoCache.keys()) {
        if (deleted >= toDelete) break;
        geoCache.delete(key);
        deleted++;
      }
    }
  }
  geoCache.set(ip, { data, expiresAt: Date.now() + GEO_CACHE_TTL_MS });
}

// Strict IPv4 pattern: 1-3 digits per octet, dot-separated
const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

// Simplified IPv6: hex groups with colons, allows :: shorthand and IPv4-mapped (::ffff:x.x.x.x)
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;
const IPV4_MAPPED_IPV6_REGEX = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i;

/**
 * Validate that a string is a well-formed IPv4 address with valid octets (0-255).
 */
export function isValidIPv4(ip: string): boolean {
  const match = IPV4_REGEX.exec(ip);
  if (!match) return false;
  return match.slice(1, 5).every((octet) => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Validate that a string is a well-formed IPv6 address.
 * Handles full, compressed (::), and IPv4-mapped (::ffff:x.x.x.x) forms.
 */
export function isValidIPv6(ip: string): boolean {
  // Handle IPv4-mapped IPv6
  const mappedMatch = IPV4_MAPPED_IPV6_REGEX.exec(ip);
  if (mappedMatch) return isValidIPv4(mappedMatch[1]);

  if (!IPV6_REGEX.test(ip)) return false;

  // Must not start or end with single colon (but :: is allowed)
  if ((ip.startsWith(':') && !ip.startsWith('::')) || (ip.endsWith(':') && !ip.endsWith('::')))
    return false;

  const parts = ip.split('::');
  if (parts.length > 2) return false; // Only one :: allowed

  const left = parts[0] ? parts[0].split(':') : [];
  const right = parts.length === 2 && parts[1] ? parts[1].split(':') : [];
  const totalGroups = left.length + right.length;

  if (parts.length === 2) {
    // With ::, total groups must be <= 7 (:: represents at least one group)
    if (totalGroups > 7) return false;
  } else {
    // Without ::, must have exactly 8 groups
    if (totalGroups !== 8) return false;
  }

  // Each group must be 1-4 hex digits
  return [...left, ...right].every((g) => g.length >= 1 && g.length <= 4);
}

/**
 * Validate that a string is a well-formed IP address (IPv4 or IPv6).
 */
export function isValidIP(ip: string): boolean {
  return isValidIPv4(ip) || isValidIPv6(ip);
}

/**
 * Check if an IPv4 address falls within private/reserved ranges.
 */
function isPrivateIPv4(ip: string): boolean {
  const match = IPV4_REGEX.exec(ip);
  if (!match) return true; // Treat unparseable as private (deny by default)
  const [a, b] = match.slice(1, 3).map((o) => parseInt(o, 10));

  return (
    a === 10 || // 10.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) || // 192.168.0.0/16
    a === 127 || // 127.0.0.0/8 (loopback)
    (a === 169 && b === 254) || // 169.254.0.0/16 (link-local)
    a === 0 || // 0.0.0.0/8 (current network)
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 (carrier-grade NAT)
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15 (benchmarking)
    a >= 224 // 224.0.0.0+ (multicast & reserved)
  );
}

/**
 * Check if an IPv6 address is a private/reserved address.
 */
function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::1') return true; // Loopback
  if (lower === '::') return true; // Unspecified

  // IPv4-mapped IPv6 — delegate to IPv4 check
  const mappedMatch = IPV4_MAPPED_IPV6_REGEX.exec(lower);
  if (mappedMatch) return isPrivateIPv4(mappedMatch[1]);

  // Expand :: for prefix comparison
  const normalized = lower.replace('::', ':0000:');
  const firstGroup = normalized.split(':')[0];
  if (!firstGroup) return true;

  const prefix = parseInt(firstGroup, 16);
  if (isNaN(prefix)) return true;

  return (
    (prefix & 0xfe00) === 0xfc00 || // fc00::/7 (unique local)
    (prefix & 0xffc0) === 0xfe80 || // fe80::/10 (link-local)
    firstGroup === 'ff00' || // Multicast (simplified check)
    prefix === 0 // ::/128 or ::/0 range
  );
}

/**
 * Returns true if the IP address is private, reserved, or otherwise
 * unsuitable for external geolocation lookups (SSRF prevention).
 */
export function isPrivateOrReservedIP(ip: string): boolean {
  if (isValidIPv4(ip)) return isPrivateIPv4(ip);
  if (isValidIPv6(ip)) return isPrivateIPv6(ip);
  return true; // Unrecognised format → treat as blocked
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  version?: string;
}

export interface LocationData {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
}

/**
 * Extract real IP address from various headers considering proxies.
 * Returns null if no valid IP is found.
 */
export function getClientIP(request?: {
  headers: { get(name: string): string | null };
}): string | null {
  if (request) {
    // Check various headers for real IP (for server-side API routes)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = request.headers.get('x-client-ip');

    let candidate: string | null = null;

    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      candidate = forwarded.split(',')[0].trim();
    } else if (realIP) {
      candidate = realIP.trim();
    } else if (clientIP) {
      candidate = clientIP.trim();
    }

    // Only return well-formed IP addresses to prevent injection via headers
    if (candidate && isValidIP(candidate)) {
      return candidate;
    }

    return null;
  }

  // Client-side extraction not available without request context
  return null;
}

/**
 * Parse User-Agent string to extract device information
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Determine device type
  let type: DeviceInfo['type'] = 'desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    type = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    type = 'tablet';
  }

  // Determine browser
  let browser = 'Unrecognized Browser';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opr') || ua.includes('opera')) {
    browser = 'Opera';
  }

  // Determine OS
  let os = 'Unrecognized OS';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }

  return { type, browser, os };
}

/**
 * Get comprehensive device and location info from request
 */
export async function getRequestInfo(request?: NextRequest): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo: DeviceInfo | null;
  locationData: LocationData | null;
}> {
  let ipAddress: string | null = null;
  let userAgent: string | null = null;
  let deviceInfo: DeviceInfo | null = null;
  let locationData: LocationData | null = null;

  if (request) {
    // Server-side extraction
    ipAddress = getClientIP(request);
    userAgent = request.headers.get('user-agent');

    if (userAgent) {
      deviceInfo = parseUserAgent(userAgent);
    }

    // Get location data using multiple methods
    if (ipAddress && isValidIP(ipAddress) && !isPrivateOrReservedIP(ipAddress)) {
      // Check in-memory cache first to avoid external HTTP per request
      const cached = geoCacheGet(ipAddress);
      if (cached) {
        locationData = cached;
      } else {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          // Safe URL construction — encode the IP to prevent path traversal / injection
          const geoUrl = new URL(`/${encodeURIComponent(ipAddress)}/json/`, 'https://ipapi.co');

          const response = await fetch(geoUrl.toString(), {
            signal: controller.signal,
            headers: {
              'User-Agent': 'IndexNow-Pro/1.0',
            },
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const ipApiData = await response.json();
            // ipapi.co returns { error: true } on failure, otherwise flat object with country_name, region, city, etc.
            if (ipApiData && typeof ipApiData === 'object' && !ipApiData.error) {
              locationData = {
                country: ipApiData.country_name || ipApiData.country,
                countryCode: ipApiData.country,
                region: ipApiData.region || ipApiData.regionName,
                city: ipApiData.city,
                timezone: ipApiData.timezone,
                latitude: ipApiData.latitude || ipApiData.lat,
                longitude: ipApiData.longitude || ipApiData.lon,
                isp: ipApiData.org || ipApiData.isp,
              };
              geoCacheSet(ipAddress, locationData);
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logger.warn({ ipAddress }, `IP geolocation lookup failed: ${message}`);
        }
      }
    }

    // Fallback: Extract location from headers if available (from CDN/proxy)
    if (!locationData) {
      const country = request.headers.get('cf-ipcountry') || request.headers.get('x-country-code');
      const region = request.headers.get('cf-region') || request.headers.get('x-region');
      const city = request.headers.get('cf-ipcity') || request.headers.get('x-city');
      const timezone = request.headers.get('cf-timezone') || request.headers.get('x-timezone');

      if (country || region || city || timezone) {
        locationData = {
          country: country || undefined,
          countryCode: country || undefined,
          region: region || undefined,
          city: city || undefined,
          timezone: timezone || undefined,
        };
      }
    }
  } else {
    // Client-side extraction - use browser APIs if available
    if (typeof window !== 'undefined') {
      userAgent = navigator.userAgent;
      if (userAgent) {
        deviceInfo = parseUserAgent(userAgent);
      }
    }
  }

  return {
    ipAddress,
    userAgent,
    deviceInfo,
    locationData,
  };
}

/**
 * Format device info for display
 */
export function formatDeviceInfo(deviceInfo?: DeviceInfo | null): string {
  if (!deviceInfo) return 'Unrecognized Device';

  const { type, browser, os } = deviceInfo;
  return `${browser} on ${os} (${type.charAt(0).toUpperCase() + type.slice(1)})`;
}

/**
 * Format location data for display
 */
export function formatLocationData(locationData?: LocationData | null): string {
  if (!locationData) return 'Unrecognized Location';

  const parts = [];
  if (locationData.city) parts.push(locationData.city);
  if (locationData.region) parts.push(locationData.region);
  if (locationData.country) parts.push(locationData.country);

  return parts.length > 0 ? parts.join(', ') : 'Unrecognized Location';
}

/**
 * Get security risk level based on device/location patterns
 */
export function getSecurityRiskLevel(
  ipAddress: string | null,
  deviceInfo: DeviceInfo | null,
  locationData: LocationData | null,
  previousIPs: string[] = [],
  previousDevices: DeviceInfo[] = []
): 'low' | 'medium' | 'high' {
  let riskScore = 0;

  // New IP address
  if (ipAddress && !previousIPs.includes(ipAddress)) {
    riskScore += 1;
  }

  // New device type
  if (
    deviceInfo &&
    !previousDevices.some((d) => d.type === deviceInfo.type && d.browser === deviceInfo.browser)
  ) {
    riskScore += 1;
  }

  // (#V7 L-09) Location-based risk: compares against ISO 3166-1 alpha-2 codes
  // using the dedicated countryCode field. The geolocation service provides
  // both country_name (display) and country (ISO code); we compare against the ISO code.
  if (locationData?.countryCode) {
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR'];
    if (highRiskCountries.includes(locationData.countryCode)) {
      riskScore += 2;
    }
  }

  // Determine risk level
  if (riskScore >= 3) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}
