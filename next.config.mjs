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
  // Only use static export for mobile builds
  ...(isMobileBuild && {
    output: 'export',
    trailingSlash: true,
    distDir: 'out',
  }),
  // Fix for Capacitor mobile app
  assetPrefix: '',
  basePath: '',
}

export default nextConfig
