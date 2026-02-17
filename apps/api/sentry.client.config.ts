/**
 * Sentry Client-Side Configuration — API App
 *
 * This file configures Sentry for client-side error tracking.
 * It is automatically loaded by @sentry/nextjs via the Next.js plugin.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import { initializeSentry } from '@indexnow/shared'

// Delegate to the shared Sentry client initializer which reads
// NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_SENTRY_ENVIRONMENT, and
// sample-rate env vars from the analytics config.
initializeSentry()
