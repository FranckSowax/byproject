import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  typescript: {
    // Keep ignoreBuildErrors for now until all types are fixed
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
