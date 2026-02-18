import baseConfig from "@indexnow/eslint-config/base";

export default [
  ...baseConfig,
  { ignores: ["apps/", "packages/", "_archive/", "database-schema/", "*.config.*"] },
];
