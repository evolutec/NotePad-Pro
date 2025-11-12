/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Temporarily disabled for dynamic icon imports
  distDir: 'out',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  webpack: (config, { isServer }) => {
    // Fix for Material UI and other libraries using import.meta
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };

    // Handle ESM modules that might cause issues
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    return config;
  },
}

export default nextConfig
