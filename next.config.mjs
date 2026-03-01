/** @type {import('next').NextConfig} */

// Check if building for mobile (Capacitor)
const isMobileBuild = process.env.BUILD_TARGET === 'mobile';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Limit webpack cache size to prevent ENOSPC errors
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: 'filesystem',
        maxMemoryGenerations: 1,
        compression: 'gzip',
      }
    }
    return config
  },
  // Use static export for mobile builds
  ...(isMobileBuild && {
    output: 'export',
    trailingSlash: true,
    distDir: 'out',
  }),
  // Fix for Capacitor mobile app - always use empty paths
  assetPrefix: '',
  basePath: '',
  // Ensure environment variables are available in client
  env: {
    NEXT_PUBLIC_API_URL: 'https://youth-handbook.onrender.com',
  },
}

export default nextConfig
