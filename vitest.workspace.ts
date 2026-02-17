import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/shared',
  'packages/database',
  'packages/auth',
  'packages/services',
  'packages/mail',
  'packages/ui',
  // Apps can be added here when they have test configs
  // 'apps/api',
  // 'apps/admin',
  // 'apps/user-dashboard',
]);
