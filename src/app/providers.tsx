"use client";

import { SessionProvider } from 'next-auth/react';
import GlobalThemeProvider from '@/components/theme/GlobalThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import FaviconHydrator from './FaviconHydrator';
import UserPreferencesPreloader from '@/components/auth/UserPreferencesPreloader';
import EmailLearningNotificationBanner from '@/components/email/EmailLearningNotificationBanner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <UserPreferencesPreloader />
      <GlobalThemeProvider>
        {children}
        <Toaster />
        <EmailLearningNotificationBanner />
        <FaviconHydrator />
      </GlobalThemeProvider>
    </SessionProvider>
  );
}
