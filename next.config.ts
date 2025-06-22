import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Mastra packages can be bundled by Next.js edge/server runtimes
  serverExternalPackages: ["@mastra/*"],
};

export default nextConfig;
