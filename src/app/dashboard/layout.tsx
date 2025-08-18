'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { Navigation } from "@/components/layout/Navigation";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";

function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Fixed Sidebar */}
      <div className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        <Sidebar className={`border-r border-gray-100 h-full transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`} />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <Navigation className="sticky top-0 z-10" />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 p-6 sm:p-8">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}