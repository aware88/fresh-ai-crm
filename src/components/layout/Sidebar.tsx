'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Mail, 
  Users, 
  Calendar, 
  Settings, 
  BarChart,
  Brain,
  Package,
  X,
  Menu,
  Package2,
  ShoppingCart,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobileMenu } from '@/hooks/use-mobile-menu';
import { useOrganization } from '@/hooks/useOrganization';
import { useOrganizationBranding } from '@/hooks/useOrganizationBranding';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { useSidebar } from '@/contexts/SidebarContext';

// Types
interface SidebarProps {
  className?: string;
}

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  special?: boolean;
};

// Universal navigation configuration for all organizations
const NAVIGATION_CONFIG = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'Email',
      href: '/dashboard/email',
      icon: <Mail className="h-5 w-5" />,
    },
    {
      title: 'Suppliers',
      href: '/dashboard/suppliers',
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: 'Products',
      href: '/dashboard/products',
      icon: <Package2 className="h-5 w-5" />,
    },
    {
      title: 'Orders',
      href: '/dashboard/orders',
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      title: 'Contacts',
      href: '/dashboard/contacts',
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: 'Team Collaboration',
      href: '/dashboard/team',
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: 'Interactions',
      href: '/dashboard/interactions',
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: 'CRM Assistant',
      href: '/dashboard/ai-future',
      icon: (
        <div className="relative">
          <Brain className="h-5 w-5" />
          <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500" />
        </div>
      ),
      special: true
    },
    {
      title: 'Analytics',
      href: '/dashboard/analytics',
      icon: <BarChart className="h-5 w-5" />
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />
    },
    // Coming Soon Features at the bottom
    {
      title: 'WhatsApp',
      href: '/dashboard/whatsapp',
      icon: <MessageSquare className="h-5 w-5" />,
      comingSoon: true,
    },
    {
      title: 'Calendar',
      href: '#calendar',
      icon: <Calendar className="h-5 w-5" />,
      comingSoon: true
    }
];

// Memoized NavItem component for better performance
const NavItemComponent = memo(({ 
  item, 
  isActive, 
  onClick,
  isCollapsed
}: { 
  item: NavItem; 
  isActive: boolean; 
  onClick: () => void;
  isCollapsed: boolean;
}) => {
  const itemContent = (
    <div className="flex items-center">
      <span className={cn("flex items-center justify-center w-6 h-6 rounded-md", isActive ? "text-primary" : "text-muted-foreground")}>
        {item.icon}
      </span>
      {!isCollapsed && (
        <>
          <span className="ml-3">{item.title}</span>
          {item.comingSoon && (
            <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              Soon
            </span>
          )}
        </>
      )}
    </div>
  );

  if (item.comingSoon) {
    return (
      <div
        className={cn(
          'text-sm font-medium rounded-md transition-colors cursor-not-allowed',
          'text-muted-foreground/60 hover:bg-muted/50',
          isActive && 'bg-muted/50',
          isCollapsed ? 'px-2 py-2 flex justify-center' : 'px-3 py-2'
        )}
        title={isCollapsed ? item.title + " (Coming soon)" : "Coming soon"}
      >
        {itemContent}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'block text-sm font-medium rounded-xl transition-all duration-200',
        item.special && !isActive
          ? 'aris-gradient text-white border border-gray-200 shadow-sm'
          : item.special && isActive
          ? 'aris-gradient text-white border border-gray-300 font-semibold shadow-md'
          : isActive
          ? 'bg-gray-50 text-foreground font-medium'
          : 'text-muted-foreground hover:bg-gray-50 hover:text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-color)]/20 hover:scale-[1.01]',
        isCollapsed ? 'px-2 py-2 flex justify-center' : 'px-3 py-2'
      )}
      onClick={onClick}
      title={isCollapsed ? item.title : undefined}
    >
      {itemContent}
    </Link>
  );
});

NavItemComponent.displayName = 'NavItemComponent';

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname() || '';
  const { isOpen: isMobileMenuOpen, toggleMenu, closeMenu } = useMobileMenu();
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  // Get organization data and branding
  const { organization, loading: orgLoading } = useOrganization();
  const { branding, loading: brandingLoading } = useOrganizationBranding();
  const { hasFeature } = useSubscriptionFeatures(organization?.id || '');

  // Get derived values from branding - fully dynamic
  const logoPath = branding?.logo_url || null;
  const companyName = organization?.name || 'ARIS';

  // Close mobile menu when pathname changes
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  // Add timeout for loading state to prevent infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 3000); // 3 second timeout

    if (!orgLoading && !brandingLoading) {
      clearTimeout(timer);
      setLoadingTimeout(false);
    }

    return () => clearTimeout(timer);
  }, [orgLoading, brandingLoading]);

  // Get navigation items - same for all organizations
  const navItems = useMemo<NavItem[]>(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Sidebar organization check:', { 
        organization, 
        orgLoading, 
        brandingLoading,
        loadingTimeout,
        orgSlug: organization?.slug, 
        orgName: organization?.name 
      });
    }

    // If still loading organization and no timeout, return empty array
    if ((orgLoading || brandingLoading) && !loadingTimeout) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⏳ Organization or branding still loading, showing loading state');
      }
      return [];
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Using universal navigation configuration for:', organization?.name || 'ARIS');
    }
    // Universal navigation for all organizations
    return NAVIGATION_CONFIG;
  }, [organization, orgLoading, brandingLoading, loadingTimeout]);

  // Filter nav items based on subscription features
  const filteredNavItems = navItems.filter(item => {
    // Filter out Team Collaboration if user doesn't have access
    if (item.href === '/dashboard/team') {
      return hasFeature('TEAM_COLLABORATION');
    }
    return true;
  });

  // Handle keyboard navigation for menu toggle
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  };

  // Render the sidebar content
  return (
    <div className="relative">
      {/* Mobile menu button */}
      <Button 
        variant="ghost" 
        size="icon"
        className="md:hidden absolute right-4 top-4 z-50"
        onClick={toggleMenu}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Sidebar */}
      <div 
        className={cn(
          "md:relative z-40 h-screen flex-shrink-0 transition-all duration-300 ease-in-out",
          "bg-white/80 backdrop-blur-lg border-r border-gray-100/50 shadow-lg md:shadow-none",
          "transform md:translate-x-0 focus:outline-none",
          "fixed md:static",
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Collapse Button - Always at top */}
        <div className={cn("flex h-16 items-center border-b border-gray-100 px-2", isCollapsed ? "justify-center" : "justify-start pl-4")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:flex h-8 w-8 rounded-md hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="h-4 w-4 text-gray-600" />
          </Button>
        </div>



        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-1.5 overflow-y-auto ${isCollapsed ? 'px-1' : 'px-2'}`}>
          {(orgLoading || brandingLoading) && !loadingTimeout ? (
            // Loading state with timeout
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          ) : (
            // Navigation items
            filteredNavItems.map((item) => {
              const isActive = 
                pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              
              return (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  onClick={closeMenu}
                  isCollapsed={isCollapsed}
                />
              );
            })
          )}
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;