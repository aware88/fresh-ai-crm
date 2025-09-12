'use client';

import { useState, useMemo, memo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Mail, 
  Users, 
  Calendar, 
  Settings, 
  BarChart3,
  Brain,
  Package,
  Target,
  MessageSquare,
  Zap,
  TrendingUp,
  Building2,
  ShoppingCart,
  Menu,
  Sparkles,
  UserCheck,
  Truck
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
  SidebarGroupAction,
} from '@/components/ui/sidebar';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useOrganization } from '@/hooks/useOrganization';
import { useOrganizationBranding } from '@/hooks/useOrganizationBranding';

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  special?: boolean;
  group?: 'main' | 'ai' | 'business' | 'settings';
};

// ARIS Navigation Configuration - organized by groups
const ARIS_NAVIGATION_CONFIG: NavItem[] = [
  // Main Navigation
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    group: 'main'
  },
  {
    title: 'Email',
    href: '/dashboard/email',
    icon: <Mail className="h-4 w-4" />,
    group: 'main'
  },
  {
    title: 'Leads',
    href: '/dashboard/leads',
    icon: <Users className="h-4 w-4" />,
    group: 'main'
  },
  {
    title: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: <Target className="h-4 w-4" />,
    group: 'main'
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    group: 'main'
  },
  {
    title: 'Calendar',
    href: '/dashboard/calendar',
    icon: <Calendar className="h-4 w-4" />,
    group: 'main'
  },
  // Business Management - Add Assistant at the top
  {
    title: 'Assistant',
    href: '/dashboard/ai-future',
    icon: <Brain className="h-4 w-4" />,
    group: 'business'
  },
  {
    title: 'Contacts',
    href: '/dashboard/contacts',
    icon: <UserCheck className="h-4 w-4" />,
    group: 'business'
  },
  {
    title: 'Suppliers',
    href: '/dashboard/suppliers',
    icon: <Truck className="h-4 w-4" />,
    group: 'business'
  },
  {
    title: 'Products',
    href: '/dashboard/products',
    icon: <Package className="h-4 w-4" />,
    group: 'business'
  },
  {
    title: 'Orders',
    href: '/dashboard/orders',
    icon: <ShoppingCart className="h-4 w-4" />,
    group: 'business'
  },

  // AI Tools
  {
    title: 'Voice Patterns',
    href: '/dashboard/interactions',
    icon: <MessageSquare className="h-4 w-4" />,
    group: 'ai'
  },
  {
    title: 'Sales Pipeline',
    href: '/dashboard/pipeline',
    icon: <TrendingUp className="h-4 w-4" />,
    group: 'ai'
  },
  {
    title: 'Automation',
    href: '/dashboard/team',
    icon: <Zap className="h-4 w-4" />,
    group: 'ai'
  },

  // Settings
  {
    title: 'Settings',
    href: '/settings',
    icon: <Settings className="h-4 w-4" />,
    group: 'settings'
  },
];

// Enhanced Navigation Item Component with shadcn
const NavItemComponent = memo(({ 
  item, 
  isActive 
}: { 
  item: NavItem; 
  isActive: boolean; 
}) => {
  // If coming soon, render as disabled menu item
  if (item.comingSoon) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          className="opacity-60 cursor-not-allowed"
          disabled
          tooltip={`${item.title} (Coming Soon)`}
        >
          {item.icon}
          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        asChild
        isActive={isActive}
        tooltip={item.title}
      >
        <Link href={item.href}>
          {item.icon}
          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

NavItemComponent.displayName = 'NavItemComponent';

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() || '';
  const { toggleSidebar } = useSidebar();
  const [businessOpen, setBusinessOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  
  // Get organization data for navigation features
  const { organization } = useOrganization();
  const { branding } = useOrganizationBranding();
  


  // Get navigation items - enhanced with ARIS structure
  const navItems = useMemo<NavItem[]>(() => {
    return ARIS_NAVIGATION_CONFIG;
  }, []);

  // Filter nav items based on subscription features (preserve existing logic)
  const filteredNavItems = useMemo(() => {
    return navItems.filter(() => {
      // Keep all items for now - subscription filtering can be added later if needed
      return true;
    });
  }, [navItems]);

  // Group navigation items
  const groupedNavItems = useMemo(() => {
    const groups = {
      main: filteredNavItems.filter(item => item.group === 'main' || !item.group),
      business: filteredNavItems.filter(item => item.group === 'business'),
      ai: filteredNavItems.filter(item => item.group === 'ai'),
      settings: filteredNavItems.filter(item => item.group === 'settings')
    };
    return groups;
  }, [filteredNavItems]);

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar variant="inset" collapsible="icon" className={cn("bg-background [&_[data-sidebar=sidebar]]:bg-background", className)} {...props}>
        <SidebarHeader>
          <div className="flex items-center justify-end p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-7 w-7"
              title="Toggle sidebar (Ctrl+B)"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>
        </SidebarHeader>
      
      <SidebarContent>
        {/* Main Navigation */}
        {groupedNavItems.main.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedNavItems.main.map((item) => (
                  <NavItemComponent
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Business Management - Collapsible */}
        {groupedNavItems.business.length > 0 && (
          <Collapsible open={businessOpen} onOpenChange={setBusinessOpen}>
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden text-sm font-semibold">Business Management</span>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden",
                      businessOpen ? "" : "-rotate-90"
                    )}
                  />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupedNavItems.business.map((item) => (
                      <NavItemComponent
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* AI Tools - Collapsible */}
        {groupedNavItems.ai.length > 0 && (
          <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden text-sm font-semibold">AI Tools & Insights</span>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden",
                      aiOpen ? "" : "-rotate-90"
                    )}
                  />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupedNavItems.ai.map((item) => (
                      <NavItemComponent
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>

      <SidebarFooter>
        {/* Settings */}
        {groupedNavItems.settings.length > 0 && (
          <SidebarMenu>
            {groupedNavItems.settings.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
    </TooltipProvider>
  );
}