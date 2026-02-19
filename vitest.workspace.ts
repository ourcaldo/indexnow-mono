import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/shared',
  'packages/database',
  'packages/auth',
  'packages/services',
  'packages/mail',
  'packages/ui',
  'packages/api-middleware', // (#V7 L-30) Added — was missing from workspace
  // (#V7 L-41) Apps excluded: they use Next.js test runner (next test) not vitest.
  // Uncomment when vitest configs are added to each app.
  // 'apps/api',
  // 'apps/admin',
  // 'apps/user-dashboard',
]);
