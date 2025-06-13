import React from 'react';
import type { AppProps } from 'next/app';
import { ChakraProvider, createSystem } from '@chakra-ui/react';
import '../styles/globals.css';

// Create a basic system for Chakra UI v3
const system = createSystem();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider value={system}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
