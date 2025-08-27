"use client";

import { SessionProvider } from 'next-auth/react';
import SimpleThemeProvider from '@/components/theme/SimpleThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import FaviconHydrator from './FaviconHydrator';
import UserPreferencesPreloader from '@/components/auth/UserPreferencesPreloader';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <UserPreferencesPreloader />
      <SimpleThemeProvider>
        {children}
        <Toaster />
        <FaviconHydrator />
      </SimpleThemeProvider>
    </SessionProvider>
  );
}
