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
      href: '#',
      icon: <Calendar className="h-5 w-5" />,
      comingSoon: true
    },
    {
      title: 'Analytics',
      href: '#',
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
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">
                            Soon
                          </span>
                        )}
                        {isActive && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-full" />
                        )}
                      </Link>
                    </div>
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
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Inventory",
      href: "/dashboard/inventory/products",
      icon: <Package2 className="h-5 w-5" />,
    },
    {
      title: "Sales",
      href: "/dashboard/sales/orders",
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      title: "Supplier Management",
      href: "/dashboard/suppliers",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Email Analysis",
      href: "/dashboard/email",
      icon: <Mail className="h-5 w-5" />,
    },
    {
      title: "AI Assistant",
      href: "/dashboard/assistant",
      icon: <Brain className="h-5 w-5" />
    },
    {
      title: "Contacts",
      href: "/dashboard/contacts",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Calendar",
      href: "#",
      icon: <Calendar className="h-5 w-5" />,
      comingSoon: true
    },
    {
      title: "Analytics",
      href: "#",
      icon: <BarChart className="h-5 w-5" />,
      comingSoon: true
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
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
      title: 'Inventory',
      icon: <Package2 className="h-4 w-4" />,
      items: filteredNavItems.filter(item => 
        item.title === 'Inventory'
      ),
      isOpen: searchQuery ? true : !collapsedSections.inventory
    },
    {
      title: 'Sales',
      icon: <ShoppingCart className="h-4 w-4" />,
      items: filteredNavItems.filter(item => 
        item.title === 'Sales'
      ),
      isOpen: searchQuery ? true : !collapsedSections.sales
    },
    {
      title: 'Other',
      icon: <LayoutDashboard className="h-4 w-4" />,
      items: filteredNavItems.filter(item => 
        !['Inventory', 'Sales', 'Supplier Management'].includes(item.title)
      ),
      isOpen: searchQuery ? true : !collapsedSections.other
      {/* Mobile menu button */}
      <Button 
        variant="ghost" 
        size="icon"
        className={cn(
          "md:hidden fixed top-4 left-4 z-50 h-10 w-10 rounded-full",
          "bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md",
          "transition-all duration-200 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        )}
        onClick={toggleMenu}
        aria-expanded={isMobileMenuOpen}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-controls="sidebar-navigation"
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5 text-gray-700" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5 text-gray-700" aria-hidden="true" />
        )}
        <span className="sr-only">{isMobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
      </Button>

      {/* Sidebar */}
      <div 
        id="sidebar-navigation"
        className={cn(
          "fixed md:relative z-40 h-screen w-64 flex-shrink-0 transition-all duration-300 ease-in-out",
          "bg-white/80 backdrop-blur-lg border-r border-gray-100/50 shadow-lg md:shadow-none",
          "transform md:translate-x-0 focus:outline-none",
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          className
        )}
        onKeyDown={handleKeyDown}
        role="navigation"
        aria-label="Main navigation"
        tabIndex={-1}
      >
      {/* Logo and Brand */}
      <div className="px-6 py-5 border-b border-gray-200/30">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-3 shadow-md">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              CRM Mind
            </h2>
            <p className="text-xs text-gray-500/80">AI-powered insights</p>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-gray-200/30">
        <div className="relative">
          <label htmlFor="search-menu" className="sr-only">Search menu</label>
          <Search 
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" 
            aria-hidden="true"
          />
          <Input
            id="search-menu"
            type="search"
            placeholder="Search menu..."
            className={cn(
              "w-full pl-9 pr-8 text-sm h-9 bg-white/50 backdrop-blur-sm border-gray-200/70",
              "focus-visible:ring-1 focus-visible:ring-blue-500/50 focus-visible:ring-offset-0",
              "transition-all duration-200 placeholder:text-gray-400"
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search menu items"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full",
                "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50",
                "transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
              )}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="mb-2">
            {section.title !== 'Main' && (
              <button
                onClick={() => toggleSection(section.title.toLowerCase().replace(/\s+/g, ''))}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium",
                  "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 rounded-lg",
                  "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                )}
                aria-expanded={!collapsedSections[section.title.toLowerCase().replace(/\s+/g, '')]}
                aria-controls={`section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center">
                  <div className="p-1 mr-2 text-gray-400">
                    {section.icon}
                  </div>
                  <span className="font-medium text-xs uppercase tracking-wider">{section.title}</span>
                </div>
                {collapsedSections[section.title.toLowerCase().replace(/\s+/g, '')] ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 transition-transform" />
            )}
            role="region"
            aria-labelledby={`section-${section.title.toLowerCase().replace(/\s+/g, '-')}-header`}
          >
            {section.items.map((item) => {
              const isActive = 
                pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
                
              return (
                <div key={`${item.href}-${item.title}`} className="relative group">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium",
                      "transition-all duration-300 ease-out relative overflow-hidden",
                      isActive && !item.comingSoon
                        ? "text-blue-700 bg-gradient-to-r from-blue-50/80 to-blue-50/30" 
                        : item.comingSoon 
                          ? "text-gray-400/80 cursor-not-allowed" 
                          : "text-gray-600 hover:bg-gray-100/40 hover:text-gray-900"
                    )}
                    onClick={item.comingSoon ? (e) => e.preventDefault() : closeMenu}
                  >
                    {/* Active indicator */}
                return (
                  <div key={`${item.href}-${item.title}`} className="relative group">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium",
                        "transition-all duration-300 ease-out relative overflow-hidden",
                        isActive && !item.comingSoon
                          ? "text-blue-700 bg-gradient-to-r from-blue-50/80 to-blue-50/30" 
                          : item.comingSoon 
                            ? "text-gray-400/80 cursor-not-allowed" 
                            : "text-gray-600 hover:bg-gray-100/40 hover:text-gray-900"
                      )}
                      onClick={item.comingSoon ? (e) => e.preventDefault() : closeMenu}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {/* Active indicator */}
                      {isActive && !item.comingSoon && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
                      )}
                      
                      {/* Icon with subtle background */}
                      <div className={cn(
                        "p-1.5 rounded-xl mr-3 transition-all duration-300 relative z-10",
                        "transform group-hover:scale-110",
                        isActive 
                          ? "bg-blue-100/80 text-blue-600 shadow-sm" 
                          : item.comingSoon 
                            ? "bg-gray-100/50 text-gray-400" 
                            : "bg-white/60 text-gray-500 group-hover:bg-white/80 group-hover:text-gray-700 shadow-sm"
                      )}>
                        {item.icon}
                      </div>
                      
                      {/* Text and badge */}
                      <div className="flex-1 flex items-center justify-between transition-transform duration-300 group-hover:translate-x-1">
                        <span className="font-medium">{item.title}</span>
                        {item.comingSoon && (
                          <span className="ml-2 px-2 py-0.5 text-[11px] bg-gray-100/50 text-gray-500 rounded-full border border-gray-200/50">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      
                      {/* Hover effect */}
                      <span className={cn(
                        "absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-blue-500/0",
                        "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      )} />
                      
                      {/* Subtle shine effect on hover */}
                      <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/30 to-transparent opacity-0 
                        group-hover:opacity-100 group-hover:animate-shine pointer-events-none" />
                    </Link>
                    
                    {/* Subtle glow for active item */}
                    {isActive && !item.comingSoon && (
                      <span className="absolute inset-0 rounded-xl bg-blue-400/5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
