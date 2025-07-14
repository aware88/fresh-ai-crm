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
  Search,
  X,
  Menu,
  Package2,
  ShoppingCart,
  MessageSquare
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMobileMenu } from '@/hooks/use-mobile-menu';

// Types
interface SidebarProps {
  className?: string;
}

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
};

// Memoized NavItem component for better performance
const NavItemComponent = memo(({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: NavItem; 
  isActive: boolean; 
  onClick: () => void;
}) => {
  const itemContent = (
    <div className="flex items-center">
      <span className={cn("flex items-center justify-center w-6 h-6 rounded-md", isActive ? "text-primary" : "text-muted-foreground")}>
        {item.icon}
      </span>
      <span className="ml-3">{item.title}</span>
      {item.comingSoon && (
        <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
          Soon
        </span>
      )}
    </div>
  );

  if (item.comingSoon) {
    return (
      <div
        className={cn(
          'px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-not-allowed',
          'text-muted-foreground/60 hover:bg-muted/50',
          isActive && 'bg-muted/50'
        )}
        title="Coming soon"
      >
        {itemContent}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'block px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200',
        isActive
          ? 'bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 text-foreground font-medium'
          : 'text-muted-foreground hover:bg-gray-50 hover:text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:scale-[1.01]'
      )}
      onClick={onClick}
    >
      {itemContent}
    </Link>
  );
});

NavItemComponent.displayName = 'NavItemComponent';

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname() || '';
  const { isOpen: isMobileMenuOpen, toggleMenu, closeMenu } = useMobileMenu();
  const [searchQuery, setSearchQuery] = useState('');

  // Close mobile menu when pathname changes
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  // Navigation items configuration - memoized to prevent recreation on each render
  const navItems = useMemo<NavItem[]>(() => [
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
      title: 'Interactions',
      href: '/dashboard/interactions',
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: 'AI Assistant',
      href: '/dashboard/assistant',
      icon: <Brain className="h-5 w-5" />
    },
    {
      title: 'Calendar',
      href: '#calendar',
      icon: <Calendar className="h-5 w-5" />,
      comingSoon: true
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
    }
  ], []);

  // Filter nav items based on search query
  const filteredNavItems = searchQuery 
    ? navItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.href.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : navItems;

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
          "fixed md:relative z-40 h-screen w-64 flex-shrink-0 transition-all duration-300 ease-in-out",
          "bg-white/80 backdrop-blur-lg border-r border-gray-100/50 shadow-lg md:shadow-none",
          "transform md:translate-x-0 focus:outline-none",
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          className
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center justify-center">
            <div className="flex items-center">
              <Image 
                src="/images/aris-logo.svg" 
                alt="ARIS Logo" 
                width={40}
                height={40}
                className="object-contain" 
                priority
              />
              <span className="ml-2 font-semibold text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">ARIS</span>
            </div>
          </Link>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-9 bg-white/50 focus-visible:ring-1 focus-visible:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = 
              pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            
            const itemContent = (
              <div className="flex items-center">
                <span className={cn("flex items-center justify-center w-6 h-6 rounded-md", isActive ? "text-primary" : "text-muted-foreground")}>
                  {item.icon}
                </span>
                <span className="ml-3">{item.title}</span>
                {item.comingSoon && (
                  <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </div>
            );

            if (item.comingSoon) {
              return (
                <div
                  key={item.href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-not-allowed',
                    'text-muted-foreground/60 hover:bg-muted/50',
                    isActive && 'bg-muted/50'
                  )}
                  title="Coming soon"
                >
                  {itemContent}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-gray-50 hover:text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:scale-[1.01]'
                )}
                onClick={closeMenu}
              >
                {itemContent}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;
