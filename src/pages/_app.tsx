import React from 'react';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/app/theme-provider';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
