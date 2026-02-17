import baseConfig from './base.js';

/**
 * ESLint configuration for shared library packages (non-Next.js).
 * Enforces stricter rules for reusable code.
 */
export default [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Libraries should not have console.log
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
];
