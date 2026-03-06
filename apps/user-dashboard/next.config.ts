import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// Build CSP connect-src dynamically to include the API server
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const connectSrc = [
  "'self'",
  'https://*.supabase.co',
  'https://*.paddle.com',
  'https://*.google-analytics.com',
  'https://*.posthog.com',
  'https://*.sentry.io',
  // In dev the API runs on a different port, so we must whitelist its origin
  ...(apiBaseUrl ? [new URL(apiBaseUrl).origin] : []),
].join(' ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // (#V7 H-18) TODO: Migrate to nonce-based CSP for script-src to remove 'unsafe-inline'.
  // Requires Next.js middleware nonce injection — see https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
  {
    key: 'Content-Security-Policy',
    value:
      `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com https://*.googletagmanager.com https://*.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' data:; connect-src ${connectSrc}; frame-src 'self' https://*.paddle.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self';`,
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
  // Organization token for source map uploads (separate from SENTRY_INTEGRATION_TOKEN used at runtime)
  authToken: process.env.SENTRY_ORG_AUTH_TOKEN,
  silent: !process.env.CI,
  hideSourceMaps: true,
  autoInstrumentServerFunctions: false,
});
