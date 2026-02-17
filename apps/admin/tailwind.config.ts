import type { Config } from "tailwindcss";
import sharedConfig from "@indexnow/ui/tailwind.config";

export default {
  presets: [sharedConfig],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
} satisfies Config;
