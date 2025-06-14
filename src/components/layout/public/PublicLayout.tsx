'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '../Header';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isSignInPage = pathname === '/signin';
  const isSignUpPage = pathname === '/signup';
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Don't show header on home page, sign-in page, or sign-up page */}
      {!isHomePage && !isSignInPage && !isSignUpPage && <Header />}
      <main>
        {children}
      </main>
    </div>
  );
}
