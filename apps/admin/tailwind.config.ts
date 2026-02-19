import type { Config } from 'tailwindcss';
import sharedConfig from '@indexnow/ui/tailwind.config';

export default {
  presets: [sharedConfig],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // (#V7 L-25) ./lib/ doesn't exist in admin, but pattern is harmless (Tailwind skips missing dirs).
    // Next.js src/ prefix is handled by the framework's content detection.
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
} satisfies Config;
