import baseConfig from "@indexnow/eslint-config/base";

// (#V7 L-44) Root config ignores all dirs because each app/package has its own
// eslint config (eslint.config.mjs or eslint.config.js). This root config
// exists only to satisfy IDE integrations that look for a root eslint config.
export default [
  ...baseConfig,
  { ignores: ["apps/", "packages/", "_archive/", "database-schema/", "*.config.*"] },
];
