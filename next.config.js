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
  reactStrictMode: false,
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
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
  
  // Webpack configuration to handle dynamic imports
  webpack: (config, { isServer }) => {
    // Ignore critical dependency warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
      { message: /Critical dependency: the request of a dependency is an expression/ }
    ];
    
    // Add polyfills for browser APIs during server-side builds
    if (isServer) {
      // Define browser APIs as undefined during server builds
      config.plugins.push(
        new config.webpack.DefinePlugin({
          'typeof File': JSON.stringify('undefined'),
          'typeof FormData': JSON.stringify('function'),
          'typeof Blob': JSON.stringify('undefined'),
        })
      );
    }
    
    return config;
  },

  /**
   * Webpack configuration for handling SVGs and other assets
   * This setup allows two ways to import SVGs:
   * 1. As React components: `import Logo from './logo.svg'`
   * 2. As URLs: `import logoUrl from './logo.svg?url'`
   */
  webpack(config) {
    // Find the existing file loader rule that handles SVG files
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
    )

    // Add new rules for SVG handling
    config.module.rules.push(
      // Handle SVG imports with ?url suffix as file URLs
      {
        ...fileLoaderRule,
        test: /\.svg\?url$/,
        resourceQuery: /url/, // Matches ?url in import statements
      },
      // Convert all other SVG imports to React components
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/, // Only process SVGs imported in JS/TS/JSX/TSX files
        resourceQuery: { not: /url/ }, // Exclude SVGs with ?url
        use: ['@svgr/webpack'], // Use SVGR to transform SVGs into React components
      }
    )

    // Exclude SVGs from the default file loader since we're handling them above
    fileLoaderRule.exclude = /\.svg$/i

    return config
  },
}

module.exports = nextConfig
