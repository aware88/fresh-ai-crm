'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  User, 
  Settings, 
  Mail, 
  Bell, 
  LayoutDashboard, 
  Palette, 
  Shield, 
  Zap,
  ChevronRight,
  CreditCard,
  Building,
  MessageCircle,
  Database,
  FileText,
  Bot,
  BookOpen,
  Users,
  Clock
} from 'lucide-react';

interface SidebarNavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  group?: string;
}

interface SidebarNavProps {
  items: SidebarNavItem[];
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  'Profile': <User className="mr-3 h-4 w-4" />,
  'Account': <Settings className="mr-3 h-4 w-4" />,
  'Subscription': <CreditCard className="mr-3 h-4 w-4" />,
  'Team': <Users className="mr-3 h-4 w-4" />,
  'Company Branding': <Building className="mr-3 h-4 w-4" />,
  'Data Management': <Database className="mr-3 h-4 w-4" />,
  'File Management': <FileText className="mr-3 h-4 w-4" />,
  'Email Accounts': <Mail className="mr-3 h-4 w-4" />,
  'AI Email Settings': <Bot className="mr-3 h-4 w-4" />,
  'Email Learning': <BookOpen className="mr-3 h-4 w-4" />,
  'Email Follow-ups': <Clock className="mr-3 h-4 w-4" />,
  'Notifications': <Bell className="mr-3 h-4 w-4" />,
  'Appearance': <Palette className="mr-3 h-4 w-4" />,
  'Display': <LayoutDashboard className="mr-3 h-4 w-4" />,
  'Security': <Shield className="mr-3 h-4 w-4" />,
  'Integrations': <Zap className="mr-3 h-4 w-4" />,
  'Metakocka': <Database className="mr-3 h-4 w-4" />
};

export function SidebarNav({ items, className }: SidebarNavProps) {
  const pathname = usePathname();
  
  // Group items by their group property
  const groupedItems = items.reduce<Record<string, SidebarNavItem[]>>((acc, item) => {
    const group = item.group || 'General';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <div className={cn('w-full lg:w-64 space-y-6', className)}>
      {Object.entries(groupedItems).map(([group, groupItems]) => (
        <div key={group} className="space-y-1">
          {group !== 'General' && (
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </h3>
          )}
          <nav className="space-y-1">
            {groupItems.map((item) => {
              const isActive = pathname ? 
                (pathname === item.href || (item.href !== '/settings' && pathname.startsWith(item.href)))
                : false;
              
              return (
                <Link
                  key={item.href}
                  href={item.disabled ? '#' : item.href}
                  className={cn(
                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive 
                      ? 'bg-accent text-accent-foreground font-semibold' 
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    item.disabled && 'pointer-events-none opacity-60',
                    'justify-between'
                  )}
                >
                  <div className="flex items-center">
                    {iconMap[item.title] || <span className="mr-3 h-4 w-4" />}
                    {item.title}
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}
