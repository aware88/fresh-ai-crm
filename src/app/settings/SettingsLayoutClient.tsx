'use client';

import React, { useMemo, useState } from 'react';
import { SidebarNav } from '@/components/sidebar-nav';
import Link from 'next/link';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  
  // Track expanded state for each group
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Toggle group expansion
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  // Filter navigation items based on subscription
  const filteredNavItems = useMemo(() => {
    // For now, show Team for all organizations (we can add subscription logic later)
    // TODO: Add proper subscription tier checking when subscription system is implemented
    return sidebarNavItems;
  }, [sidebarNavItems]);

  // Group navigation items
  const groupedNavItems = useMemo(() => {
    const groups: Record<string, SidebarNavItem[]> = {};
    filteredNavItems.forEach((item) => {
      const group = item.group || 'Other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    
    // Initialize expanded state for all groups (collapsed by default)
    if (Object.keys(expandedGroups).length === 0) {
      const initialExpandedState: Record<string, boolean> = {};
      Object.keys(groups).forEach(group => {
        // Check if this group contains the current active page
        const hasActivePage = groups[group].some(item => item.href === pathname);
        // Only expand the group that contains the active page
        initialExpandedState[group] = hasActivePage;
      });
      setExpandedGroups(initialExpandedState);
    }
    
    return groups;
  }, [filteredNavItems, expandedGroups.length]);

  return (
    <div className="h-screen bg-gray-50/50 flex flex-col overflow-hidden">
      <div className="container mx-auto p-6 max-w-7xl flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Modern header - fixed height */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
              </div>
            </div>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Modern layout with better spacing - takes remaining height */}
          <div className="grid grid-cols-12 gap-8 mt-6 flex-1 min-h-0">
            {/* Enhanced sidebar navigation - scrollable */}
            <div className="col-span-3 flex flex-col min-h-0">
              <div className="overflow-y-auto pr-2 h-full">
                <div className="space-y-1">
                  {Object.entries(groupedNavItems).map(([group, items]) => (
                    <Collapsible 
                      key={group} 
                      open={expandedGroups[group]} 
                      onOpenChange={() => toggleGroup(group)}
                      className="overflow-hidden"
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
                          <h3 className="text-base font-semibold text-gray-900">{group}</h3>
                          <div className="flex items-center justify-center w-5 h-5">
                            {expandedGroups[group] ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <nav className="pl-6 py-1 space-y-1">
                          {items.map((item) => {
                            const active = pathname === item.href;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                  "flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200",
                                  active
                                    ? "font-medium text-blue-600 bg-blue-50"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                              >
                                {item.title}
                              </Link>
                            );
                          })}
                        </nav>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced main content area - auto-height with scrolling only when needed */}
            <div className="col-span-9 flex flex-col min-h-0">
              <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-8 overflow-y-auto flex-1">
                  <div className="max-w-4xl mx-auto">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}