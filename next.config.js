/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {},
  trailingSlash: false,
  async redirects() {
    return [];
  },
  async rewrites() {
    return [];
  },
}

module.exports = nextConfig