import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  typescript: {
    // Keep ignoreBuildErrors for now until all types are fixed
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cbu01.alicdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.alicdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.alicdn.com',
        pathname: '/**',
      },
    ],
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
