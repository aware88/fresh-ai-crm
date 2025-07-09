'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider, createSystem } from '@chakra-ui/react';
import { ColorModeScript } from '@chakra-ui/color-mode';
import { SessionProvider } from 'next-auth/react';

// Create a default system for Chakra UI
const defaultSystem = createSystem({
  theme: {
    initialColorMode: 'light',
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif',
    },
  },
});

export function Providers({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <SessionProvider>
      <CacheProvider>
        <ChakraProvider value={defaultSystem}>
          <ColorModeScript initialColorMode="light" />
          {children}
        </ChakraProvider>
      </CacheProvider>
    </SessionProvider>
  );
}
