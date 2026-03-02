import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: !options.watch,
    external: [
        '@supabase/supabase-js',
        '@indexnow/database',
        '@indexnow/database/client',
        '@indexnow/shared',
        '@indexnow/supabase-client',
    ],
}))
