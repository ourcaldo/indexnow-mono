import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
    entry: {
        index: 'src/index.ts',
        server: 'src/sentry-server.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: !options.watch,
    external: [
        'react',
        'next',
        '@sentry/nextjs',
        '@sentry/browser',
        '@indexnow/shared',
    ],
}))
