import React from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

/**
 * Main application component that wraps all pages
 * This is a simplified version for deployment that removes Chakra UI
 * to avoid compatibility issues during the build process
 */
function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
