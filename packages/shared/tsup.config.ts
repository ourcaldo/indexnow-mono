import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts', 'src/schema.ts'],
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
        'lucide-react', 
        '@supabase/supabase-js',
        '@supabase/ssr',
        '@tanstack/react-query',
        '@indexnow/ui'
    ],
})
