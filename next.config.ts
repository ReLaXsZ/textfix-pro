import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Разрешава успеха на билдването дори при наличие на TypeScript грешки
    ignoreBuildErrors: true,
  },
  eslint: {
    // Игнорира ESLint грешки по време на build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;