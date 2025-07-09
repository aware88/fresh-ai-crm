'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarNavItem {
  title: string;
  href: string;
  disabled?: boolean;
}

interface SidebarNavProps {
  items: SidebarNavItem[];
  className?: string;
}

export function SidebarNav({ items, className }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn('flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1', className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.disabled ? '#' : item.href}
          className={cn(
            'flex items-center rounded-md px-3 py-2 text-sm font-medium',
            pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted hover:text-foreground',
            item.disabled && 'pointer-events-none opacity-60'
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
