'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { Navigation } from "@/components/layout/Navigation";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-white">
        <ErrorBoundary>
          <Sidebar className="w-64 hidden md:block flex-shrink-0 border-r border-gray-100" />
        </ErrorBoundary>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navigation Bar */}
          <ErrorBoundary>
            <Navigation className="sticky top-0 z-10" />
          </ErrorBoundary>
          
          {/* Main Content */}
          <main className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto">
              <div className="py-8 px-6 sm:px-8">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </div>
              
              {/* Footer */}
              <footer className="py-6 px-6 sm:px-8 border-t border-gray-100 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <span>&copy; {new Date().getFullYear()}</span>
                  <span className="text-aris-gradient font-semibold">ARIS</span>
                  <span>All rights reserved.</span>
                </div>
              </footer>
            </div>
          </main>
        </div>
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}
