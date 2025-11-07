import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  typescript: {
    // Keep ignoreBuildErrors for now until all types are fixed
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/admin/supplier-request',
        destination: '/admin/supplier-requests',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
