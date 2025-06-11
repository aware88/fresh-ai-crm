'use client';

import React from 'react';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <main className="min-h-screen bg-gray-50">
      {children}
    </main>
  );
}
