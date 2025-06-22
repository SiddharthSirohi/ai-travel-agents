import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Mastra packages can be bundled by Next.js edge/server runtimes
  serverExternalPackages: ["@mastra/*"],
  // Expose Maps API key to the browser (pulled from server env at build time)
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
};

export default nextConfig;
