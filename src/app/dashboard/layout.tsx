'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { Navigation } from "@/components/layout/Navigation";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar className="w-64 hidden md:block flex-shrink-0 border-r border-gray-200" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <Navigation className="sticky top-0 z-10" />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto">
            <div className="py-6 px-4 sm:px-6">
              {children}
            </div>
            
            {/* Footer */}
            <footer className="py-4 px-4 sm:px-8 border-t border-gray-200 text-center text-gray-500 text-xs">
              &copy; {new Date().getFullYear()} AI CRM. All rights reserved.
            </footer>
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
