/**
 * Next.js Instrumentation Hook
 * Initializes server-side monitoring and error tracking
 * Runs when the server starts up
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    const { initializeServerSentry } = await import('@indexnow/analytics');
    initializeServerSentry();
  }
}
