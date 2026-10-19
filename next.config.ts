import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/blog/**": ["./content/**/*"],
  },
};

export default nextConfig;