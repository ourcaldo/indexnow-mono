import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [
        'react',
        'react-dom',
        'next',
        'next/navigation',
        'next/server',
        'next/headers',
        'server-only',
        '@indexnow/database',
        '@indexnow/shared',
        '@supabase/supabase-js',
        '@supabase/ssr',
        'crypto-js',
    ],
})
