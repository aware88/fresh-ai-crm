'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { LogoUploader } from '@/components/settings/LogoUploader';

export default function BrandingPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    redirect('/signin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Company Branding</h3>
        <p className="text-sm text-muted-foreground">
          Upload your company logo and set your company name to customize the navigation bar.
        </p>
      </div>
      <LogoUploader />
    </div>
  );
} 