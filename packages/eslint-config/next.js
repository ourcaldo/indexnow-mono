/**
 * ESLint configuration for Next.js apps.
 * Rules-only config — designed to be used alongside `eslint-config-next`
 * which already provides the TypeScript parser and plugins.
 */
export default [
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/.turbo/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // ── Type safety (aligned with project type-safety.md rules) ──
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-expect-error': 'allow-with-description',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // ── Code quality ──
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],

      // ── Next.js specific ──
      'react/react-in-jsx-scope': 'off',
    },
  },
];
