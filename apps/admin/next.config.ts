import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // TODO: Migrate to nonce-based CSP for script-src to remove 'unsafe-inline'
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.sentry.io https://*.posthog.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self';",
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@indexnow/shared',
    '@indexnow/ui',
    '@indexnow/auth',
    '@indexnow/database',
    '@indexnow/analytics',
    '@indexnow/supabase-client',
  ],
  turbopack: {
    root: '../../',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  hideSourceMaps: true,
  autoInstrumentServerFunctions: false,
});
