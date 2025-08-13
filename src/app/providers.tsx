"use client";

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as OrgThemeProvider } from '@/components/theme/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import FaviconHydrator from './FaviconHydrator';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <OrgThemeProvider>
        {children}
        <Toaster />
        <FaviconHydrator />
      </OrgThemeProvider>
    </SessionProvider>
  );
}
