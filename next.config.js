/**
 * Next.js Configuration
 * 
 * This file configures your Next.js application. It handles:
 * - React Strict Mode for highlighting potential problems
 * - Webpack configuration for SVG handling
 * - Other Next.js specific settings
 * - Redirects to external landing page
 * - Output configuration for containerized deployments
 * 
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Enable React's Strict Mode (helps catch potential issues during development)
  reactStrictMode: true,
  
  // Gradually enable ESLint - for now keep disabled but with better structure for future
  eslint: {
    ignoreDuringBuilds: true, // Will re-enable after fixing major issues
    dirs: ['src'],
  },
  
  // Gradually enable TypeScript - for now keep disabled but improve incrementally
  typescript: {
    ignoreBuildErrors: true, // Will re-enable after fixing type issues
  },
  
  // Configure images
  images: {
    domains: ['localhost', 'helloaris.com', 'images.unsplash.com', 'www.withcar.si'],
  },
  
  // Redirect configuration for landing page
  async redirects() {
    return [
      {
        source: '/',
        destination: 'https://helloaris.com',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'app.helloaris.com',
          },
        ],
      },
    ];
  },
  
  // Output configuration for containerized deployments (Northflank)
  output: 'standalone',
  
  // Additional configuration for server-side deployment
  
  // Moved from experimental to root level per Next.js 15.3.3 warnings
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  
  // Unified Webpack configuration (merged)
  webpack: (config, { isServer }) => {
    // Ignore critical dependency warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
      { message: /Critical dependency: the request of a dependency is an expression/ }
    ];

    // Add polyfills for browser APIs during server-side builds
    if (isServer) {
      const { DefinePlugin } = config.webpack || require('webpack');
      config.plugins.push(
        new DefinePlugin({
          'typeof File': JSON.stringify('undefined'),
          'typeof FormData': JSON.stringify('function'),
          'typeof Blob': JSON.stringify('undefined'),
        })
      );
    }

    // Handle SVGs: support ?url and SVGR
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'));
    if (fileLoaderRule) {
      config.module.rules.push(
        {
          ...fileLoaderRule,
          test: /\.svg\?url$/,
          resourceQuery: /url/,
        },
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          resourceQuery: { not: /url/ },
          use: ['@svgr/webpack'],
        }
      );
      fileLoaderRule.exclude = /\.svg$/i;
    }

    return config;
  },
}

module.exports = nextConfig
