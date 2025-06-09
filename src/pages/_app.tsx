import { ChakraProvider } from '@chakra-ui/react';
import type { AppProps } from 'next/app';
import { Navigation } from '../components/layout/Navigation';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Component {...pageProps} />
      </main>
    </ChakraProvider>
  );
}

export default MyApp;
