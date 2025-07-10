'use client';

import React from 'react';
import Header from './header';

interface ShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Shell component providing consistent layout with header and container
 * This is a minimal implementation to unblock the build
 */
export default function Shell({ children, title, subtitle }: ShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
      <footer className="py-4 px-6 border-t text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Fresh AI CRM
      </footer>
    </div>
  );
}
