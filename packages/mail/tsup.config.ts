import { defineConfig } from 'tsup'
import { cpSync } from 'fs'

export default defineConfig((options) => ({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: !options.watch,
    external: [
        '@indexnow/shared',
        'nodemailer',
        'handlebars',
    ],
    onSuccess: async () => {
        // Copy email templates to dist so they're available after bundling
        cpSync('src/templates', 'dist/templates', { recursive: true })
    },
}))
