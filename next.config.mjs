/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
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
    // Exclude @mui/icons-material from webpack's dependency analysis to prevent EMFILE errors
    // This prevents Next.js from tracing all MUI icon files during build
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mui/icons-material': false,
    }

    return config
  },
}

export default nextConfig
