/**
 * Next.js Configuration
 * 
 * This file configures your Next.js application. It handles:
 * - React Strict Mode for highlighting potential problems
 * - Webpack configuration for SVG handling
 * - Other Next.js specific settings
 * 
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Enable React's Strict Mode (helps catch potential issues during development)
  reactStrictMode: true,

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
