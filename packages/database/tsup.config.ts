import { defineConfig } from 'tsup'

export default defineConfig({
    entry: [
        'src/index.ts',
        'src/types.ts',
        'src/client.ts',
        'src/server.ts',
        'src/middleware.ts'
    ],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['next/headers', 'next/server', 'react'],
    banner: {
        js: '"use client";'
    }
})
