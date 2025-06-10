'use client';

import React from 'react';
import Navigation from '@/components/layout/Navigation';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </>
  );
}
