'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ChevronDown,
  ChevronRight
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

type CollapsibleSection = {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
  isOpen: boolean;
};

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname() || '';
  const { isOpen: isMobileMenuOpen, toggleMenu, closeMenu } = useMobileMenu();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    inventory: false,
    sales: false,
    other: false,
    supplier: false
  });

  // Close mobile menu when pathname changes
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  // Toggle collapsible section
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Navigation items configuration
  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'Inventory',
      href: '/dashboard/inventory/products',
      icon: <Package2 className="h-5 w-5" />,
    },
    {
      title: 'Sales',
      href: '/dashboard/sales/orders',
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      title: 'Supplier Management',
      href: '/dashboard/suppliers',
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: 'Email Analysis',
      href: '/dashboard/email',
      icon: <Mail className="h-5 w-5" />,
    },
    {
      title: 'AI Assistant',
      href: '/dashboard/assistant',
      icon: <Brain className="h-5 w-5" />
    },
    {
      title: 'Contacts',
      href: '/dashboard/contacts',
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: 'Calendar',
      href: '#calendar',
      icon: <Calendar className="h-5 w-5" />,
      comingSoon: true
    },
    {
      title: 'Analytics',
      href: '#analytics',
      icon: <BarChart className="h-5 w-5" />,
      comingSoon: true
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  // Filter nav items based on search query
  const filteredNavItems = searchQuery 
    ? navItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.href.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : navItems;

  // Auto-expand sections when searching
  useEffect(() => {
    if (searchQuery) {
      setCollapsedSections({
        inventory: false,
        sales: false,
        other: false,
        supplier: false
      });
    }
  }, [searchQuery]);

  // Group navigation items into collapsible sections
  const navSections: CollapsibleSection[] = [
    {
      title: 'Main',
      icon: <LayoutDashboard className="h-4 w-4" />,
      items: filteredNavItems.filter(item => 
        ['Dashboard', 'AI Assistant', 'Email Analysis'].includes(item.title)
      ),
      isOpen: true
    },
    {
      title: 'Inventory',
      icon: <Package2 className="h-4 w-4" />,
      items: filteredNavItems.filter(item => item.title === 'Inventory'),
      isOpen: searchQuery ? true : !collapsedSections.inventory
    },
    {
      title: 'Sales',
      icon: <ShoppingCart className="h-4 w-4" />,
      items: filteredNavItems.filter(item => item.title === 'Sales'),
      isOpen: searchQuery ? true : !collapsedSections.sales
    },
    {
      title: 'Supplier Management',
      icon: <Package className="h-4 w-4" />,
      items: filteredNavItems.filter(item => item.title === 'Supplier Management'),
      isOpen: searchQuery ? true : !collapsedSections.supplier
    },
    {
      title: 'Other',
      icon: <Settings className="h-4 w-4" />,
      items: filteredNavItems.filter(item => 
        ![
          'Dashboard', 'Inventory', 'Sales', 'Supplier Management', 
          'AI Assistant', 'Email Analysis'
        ].includes(item.title)
      ),
      isOpen: searchQuery ? true : !collapsedSections.other
    }
  ].filter(section => section.items.length > 0);

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
        {/* Logo and Brand */}
        <div className="flex h-16 items-center px-6 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Package2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">AI CRM</span>
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
          {navSections.map((section) => (
            <div key={section.title} className="mb-2">
              {section.title !== 'Main' && (
                <button
                  onClick={() => toggleSection(section.title.toLowerCase().replace(/\s+/g, ''))}
                  className="flex items-center w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  aria-expanded={section.isOpen}
                >
                  <span className="flex items-center">
                    {section.icon}
                    <span className="ml-3">{section.title}</span>
                  </span>
                  {section.isOpen ? (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </button>
              )}
              
              <div
                className={cn(
                  'space-y-1 overflow-hidden transition-all duration-200',
                  section.isOpen ? 'max-h-96' : 'max-h-0 opacity-0',
                  section.title === 'Main' && 'pt-0',
                  section.title !== 'Main' && 'pl-4 border-l-2 border-muted/50 ml-2'
                )}
              >
                {section.items.map((item) => {
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
                        'block px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-primary/5'
                      )}
                      onClick={closeMenu}
                    >
                      {itemContent}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;
