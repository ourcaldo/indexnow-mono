import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@indexnow/shared", "@indexnow/ui", "@indexnow/auth", "@indexnow/database"],
};

export default nextConfig;
