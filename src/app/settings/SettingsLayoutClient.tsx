'use client';

import React, { useMemo } from 'react';
import { SidebarNav } from '@/components/sidebar-nav';
import Link from 'next/link';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarNavItem {
  title: string;
  href: string;
  group?: string;
  icon?: string;
}

interface SettingsLayoutClientProps {
  children: React.ReactNode;
  sidebarNavItems: SidebarNavItem[];
}

export default function SettingsLayoutClient({ children, sidebarNavItems }: SettingsLayoutClientProps) {
  const { data: session } = useOptimizedAuth();
  const { organization } = useOrganization();
  const pathname = usePathname();

  // Filter navigation items based on subscription
  const filteredNavItems = useMemo(() => {
    // For now, show Team for all organizations (we can add subscription logic later)
    // TODO: Add proper subscription tier checking when subscription system is implemented
    return sidebarNavItems;
  }, [sidebarNavItems]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your account settings and preferences.</p>
            </div>
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Main layout with sidebar and content */}
          <div className="flex gap-6">
            {/* Left sidebar navigation */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <nav className="space-y-1">
                  {filteredNavItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          active
                            ? "bg-[var(--accent-color)] text-white"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main content area */}
            <div className="flex-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}