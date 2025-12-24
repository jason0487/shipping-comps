import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable caching for deployment updates
  generateEtags: false,
  poweredByHeader: false,
  
  // Disable linting during build for production deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure serverless function timeout for long-running analysis
  // Railway supports up to 900 seconds (15 minutes) for Pro plans
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
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
