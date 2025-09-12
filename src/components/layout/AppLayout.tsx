'use client';

import React, { useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Settings, User, LogOut } from "lucide-react";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { DropdownProvider, useDropdown } from "@/contexts/DropdownContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { useOrganization } from "@/hooks/useOrganization";
import { useOrganizationBranding } from "@/hooks/useOrganizationBranding";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// Inner component that has access to sidebar context
function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const { organization } = useOrganization();
  const { branding } = useOrganizationBranding();
  const { data: session } = useOptimizedAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { activeDropdown, setActiveDropdown } = useDropdown();
  const [profileOpen, setProfileOpen] = useState(false);
  
  const isExpanded = sidebarState === 'expanded';

  // Handle profile dropdown state
  useEffect(() => {
    if (activeDropdown && activeDropdown !== 'profile') {
      setProfileOpen(false);
    }
  }, [activeDropdown]);

  // Add keyboard shortcut for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    router.push('/settings');
  };

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar - positioned absolutely */}
      <div 
        className={cn(
          "fixed left-0 top-0 h-full z-30 transition-all duration-300 ease-in-out",
          isExpanded ? "w-64" : "w-12"
        )}
      >
        <AppSidebar />
      </div>
      
      {/* Main content area with dynamic margin */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isExpanded ? "ml-64" : "ml-12"
        )}
      >
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur-sm px-4 shadow-sm">
          
          {/* Organization Logo */}
          {branding?.logo_url && (
            <div className="flex items-center">
              <img 
                src={branding.logo_url} 
                alt={organization?.name || 'Organization'} 
                className="h-8 w-auto object-contain logo-transparent"
                style={{
                  mixBlendMode: 'multiply',
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
                }}
              />
            </div>
          )}
          
          {/* Spacer to push right side content to the right */}
          <div className="flex-1"></div>

          {/* Header Actions - Right Side */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="w-80">
              <GlobalSearch placeholder="Search leads, campaigns, or insights..." />
            </div>

            {/* Notifications */}
            <NotificationCenter />

            {/* User Menu */}
            <DropdownMenu open={profileOpen} onOpenChange={(open) => {
              setProfileOpen(open);
              if (open) {
                setActiveDropdown('profile');
              } else if (activeDropdown === 'profile') {
                setActiveDropdown(null);
              }
            }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-4 w-4" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-white border border-gray-200" 
                align="end" 
                forceMount
                style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', zIndex: 999999 }}
              >
                <DropdownMenuLabel className="font-normal bg-white" style={{ backgroundColor: '#ffffff' }}>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {(session?.user as any)?.user_metadata?.full_name || session?.user?.email || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer bg-white hover:bg-gray-50"
                  onClick={handleProfileClick}
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer bg-white hover:bg-gray-50"
                  onClick={handleSettingsClick}
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer bg-white hover:bg-gray-50"
                  onClick={handleSignOut}
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full w-full overflow-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <DropdownProvider>
      <SidebarProvider defaultOpen={true}>
        <AppLayoutInner>{children}</AppLayoutInner>
      </SidebarProvider>
    </DropdownProvider>
  );
}