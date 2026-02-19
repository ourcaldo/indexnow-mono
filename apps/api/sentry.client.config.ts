/**
 * Sentry Client-Side Configuration — API App
 *
 * (#V7 L-45) The API app has no browser pages (it’s a server-only Next.js app),
 * but @sentry/nextjs requires a client config file to exist. If this file is
 * missing, the Sentry webpack plugin errors during build. The config is a no-op
 * for the API app since there are no client-side errors to capture.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import { initializeSentry } from '@indexnow/analytics';

// Delegate to the shared Sentry client initializer which reads
// NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_SENTRY_ENVIRONMENT, and
// sample-rate env vars from the analytics config.
initializeSentry();
