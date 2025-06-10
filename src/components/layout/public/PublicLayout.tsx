'use client';

import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <main className="min-h-screen bg-gray-50">
      {children}
    </main>
  );
}
