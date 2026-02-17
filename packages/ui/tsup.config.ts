import { defineConfig } from 'tsup'
import path from 'path'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  esbuildOptions(options) {
    options.alias = {
      '@/lib/utils': path.resolve(__dirname, 'src/lib/utils'),
    }
  },
  external: [
    'react', 
    'react-dom', 
    'next', 
    'lucide-react',
    '@radix-ui/react-radio-group',
    '@indexnow/shared',
    '@indexnow/auth',
    '@indexnow/database'
  ],
})
