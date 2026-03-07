import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
    entry: [
        'src/index.ts',
        'src/server.ts',
        'src/client.ts',
        'src/middleware-utils.ts',
    ],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: !options.watch,
    external: [
        'react',
        'next/headers',
        'next/server',
        'server-only',
        '@indexnow/shared',
        '@supabase/supabase-js',
        '@supabase/ssr',
    ],
}))
