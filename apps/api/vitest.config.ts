import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    passWithNoTests: true,
    // Each test file gets its own isolated module registry so vi.mock works correctly
    isolate: true,
    // Stub env vars so AppConfig zod schema passes in the test runner
    // NODE_ENV is forced to 'development' because 'test' is not in the allowed enum
    env: {
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-placeholder',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key-placeholder',
      NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/app/api/**/*.ts'],
      exclude: ['src/**/*.{test,spec}.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@indexnow/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@indexnow/database': path.resolve(__dirname, '../../packages/database/src'),
      '@indexnow/database/client': path.resolve(__dirname, '../../packages/database/src/client'),
      '@indexnow/auth': path.resolve(__dirname, '../../packages/auth/src'),
      '@indexnow/auth/server': path.resolve(__dirname, '../../packages/auth/src/server'),
      '@indexnow/services': path.resolve(__dirname, '../../packages/services/src'),
      '@indexnow/mail': path.resolve(__dirname, '../../packages/mail/src'),
      '@indexnow/analytics': path.resolve(__dirname, '../../packages/analytics/src'),
      '@indexnow/supabase-client': path.resolve(__dirname, '../../packages/supabase-client/src'),
      '@indexnow/api-middleware': path.resolve(__dirname, '../../packages/api-middleware/src'),
    },
  },
});
