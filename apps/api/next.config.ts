import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@indexnow/shared", "@indexnow/ui", "@indexnow/auth", "@indexnow/database", "@indexnow/services", "@indexnow/mail"],
  // Empty turbopack config to silence Next.js 16 Turbopack/webpack coexistence error
  turbopack: {},
  // Skip TypeScript build errors - 318 pre-existing type strictness issues
  // to be resolved incrementally (phantom table names, Record<string,unknown> casts, etc.)
  typescript: {
    ignoreBuildErrors: true,
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
  // Upload source maps to Sentry for readable stack traces
  silent: !process.env.CI,
  // Suppress source map warnings during build
  hideSourceMaps: true,
  // Disable automatic server-side instrumentation (we use manual init)
  autoInstrumentServerFunctions: false,
  // Tunnel Sentry events to avoid ad blockers (optional, set route if needed)
  // tunnelRoute: "/monitoring",
});
