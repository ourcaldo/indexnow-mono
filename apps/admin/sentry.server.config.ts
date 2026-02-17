/**
 * Sentry Server-Side Configuration — Admin App
 *
 * This file configures Sentry for server-side error tracking.
 * It is automatically loaded by @sentry/nextjs via the Next.js plugin.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import { initializeServerSentry } from '@indexnow/shared'

initializeServerSentry()
