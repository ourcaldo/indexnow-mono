/**
 * IP Address and Device Detection Utilities for Activity Logging
 * Comprehensive tracking for security and analytics purposes
 */

import { NextRequest } from 'next/server';

// Safely load GeoIP with error handling for missing data files
let geoip: any = null;
try {
  geoip = require('geoip-lite');
  if (geoip) {
    geoip.lookup('8.8.8.8'); // Test lookup
  }
} catch (error: any) {
  console.warn('GeoIP-lite failed to initialize:', error?.message || 'Unknown error');
  geoip = null;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  version?: string;
}

export interface LocationData {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
}

/**
 * Extract real IP address
 */
export function getClientIP(request?: NextRequest): string | null {
  if (request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = request.headers.get('x-client-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) return realIP;
    if (clientIP) return clientIP;
    
    return null;
  }
  return null;
}

/**
 * Parse User-Agent string
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  let type: DeviceInfo['type'] = 'desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    type = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    type = 'tablet';
  }
  
  let browser = 'Unknown';
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
  
  let os = 'Unknown';
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
 * Get comprehensive device and location info
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
    ipAddress = getClientIP(request);
    userAgent = request.headers.get('user-agent');
    
    if (userAgent) {
      deviceInfo = parseUserAgent(userAgent);
    }
    
    if (ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '::1' && !ipAddress.startsWith('192.168.') && !ipAddress.startsWith('10.')) {
      if (geoip) {
        try {
          const geoData = geoip.lookup(ipAddress);
          if (geoData) {
            locationData = {
              country: geoData.country,
              region: geoData.region,
              city: geoData.city,
              timezone: geoData.timezone,
              latitude: geoData.ll?.[0],
              longitude: geoData.ll?.[1],
            };
          }
        } catch (geoError: any) {
          console.warn('GeoIP-lite lookup failed:', ipAddress, geoError?.message);
        }
      }
      
      if (!locationData) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,regionName,city,timezone,lat,lon,isp`, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'IndexNow-Pro/1.0'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const ipApiData = await response.json();
            if (ipApiData.status === 'success') {
              locationData = {
                country: ipApiData.country,
                region: ipApiData.regionName,
                city: ipApiData.city,
                timezone: ipApiData.timezone,
                latitude: ipApiData.lat,
                longitude: ipApiData.lon,
                isp: ipApiData.isp
              };
            }
          }
        } catch (ipApiError: any) {
          console.warn('IP-API lookup failed:', ipAddress, ipApiError?.message);
        }
      }
    }
    
    if (!locationData) {
      const country = request.headers.get('cf-ipcountry') || request.headers.get('x-country-code');
      const region = request.headers.get('cf-region') || request.headers.get('x-region');
      const city = request.headers.get('cf-ipcity') || request.headers.get('x-city');
      const timezone = request.headers.get('cf-timezone') || request.headers.get('x-timezone');
      
      if (country || region || city || timezone) {
        locationData = { 
          country: country || undefined, 
          region: region || undefined, 
          city: city || undefined, 
          timezone: timezone || undefined 
        };
      }
    }
  } else if (typeof window !== 'undefined') {
    userAgent = navigator.userAgent;
    if (userAgent) {
      deviceInfo = parseUserAgent(userAgent);
    }
  }
  
  return { ipAddress, userAgent, deviceInfo, locationData };
}

/**
 * Format device info
 */
export function formatDeviceInfo(deviceInfo?: DeviceInfo | null): string {
  if (!deviceInfo) return 'Unknown Device';
  const { type, browser, os } = deviceInfo;
  return `${browser} on ${os} (${type.charAt(0).toUpperCase() + type.slice(1)})`;
}

/**
 * Format location data
 */
export function formatLocationData(locationData?: LocationData | null): string {
  if (!locationData) return 'Unknown Location';
  const parts = [];
  if (locationData.city) parts.push(locationData.city);
  if (locationData.region) parts.push(locationData.region);
  if (locationData.country) parts.push(locationData.country);
  return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
}

/**
 * Get security risk level
 */
export function getSecurityRiskLevel(
  ipAddress: string | null,
  deviceInfo: DeviceInfo | null,
  locationData: LocationData | null,
  previousIPs: string[] = [],
  previousDevices: DeviceInfo[] = []
): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  
  if (ipAddress && !previousIPs.includes(ipAddress)) {
    riskScore += 1;
  }
  
  if (deviceInfo && !previousDevices.some(d => d.type === deviceInfo.type && d.browser === deviceInfo.browser)) {
    riskScore += 1;
  }
  
  if (locationData?.country) {
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR'];
    if (highRiskCountries.includes(locationData.country)) {
      riskScore += 2;
    }
  }
  
  if (riskScore >= 3) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}
