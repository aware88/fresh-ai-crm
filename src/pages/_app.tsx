import { ChakraProvider, createSystem } from '@chakra-ui/react';
import type { AppProps } from 'next/app';

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
