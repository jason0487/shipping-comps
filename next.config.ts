import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable caching for deployment updates
  generateEtags: false,
  poweredByHeader: false,
  
  // Disable linting during build for production deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Force cache invalidation
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
