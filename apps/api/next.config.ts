import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // API app serves no pages — strict CSP
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'none'; script-src 'self' 'unsafe-eval'; style-src 'self'; connect-src 'self' https://*.supabase.co https://*.sentry.io; frame-ancestors 'none'; object-src 'none'; base-uri 'self';",
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@indexnow/shared',
    '@indexnow/ui',
    '@indexnow/auth',
    '@indexnow/database',
    '@indexnow/services',
    '@indexnow/mail',
    '@indexnow/analytics',
    '@indexnow/supabase-client',
    '@indexnow/api-middleware',
  ],
  turbopack: {
    root: '../../',
  },
  typescript: {
    ignoreBuildErrors: false,
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
  // tunnelRoute: "/monitoring",
});
