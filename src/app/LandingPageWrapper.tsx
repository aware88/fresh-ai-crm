'use client';

import dynamic from 'next/dynamic';

// Dynamically import the LandingPage component with SSR disabled
const LandingPage = dynamic(
  () => import('./LandingPage'),
  { ssr: false }
);

export default function LandingPageWrapper() {
  return <LandingPage />;
}
