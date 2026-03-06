import { defineConfig } from 'tsup'
import path from 'path'

export default defineConfig((options) => ({
  entry: {
    index: 'src/index.ts',
    admin: 'src/components/admin/index.ts',
    auth: 'src/components/auth/index.ts',
    billing: 'src/components/billing/index.ts',
    checkout: 'src/components/checkout/index.ts',
    modals: 'src/components/modals/index.ts',
    primitives: 'src/components/index.ts',
    utils: 'src/lib/utils.ts',
    hooks: 'src/hooks/index.ts',
    providers: 'src/providers/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: !options.watch,
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
}))
