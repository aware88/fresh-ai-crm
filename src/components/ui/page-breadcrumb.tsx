'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

interface BreadcrumbSegment {
  name: string;
  href?: string;
}

interface PageBreadcrumbProps {
  segments?: BreadcrumbSegment[];
  className?: string;
}

export function PageBreadcrumb({ segments, className }: PageBreadcrumbProps) {
  const pathname = usePathname();
  
  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbs = React.useMemo(() => {
    if (segments) return segments;
    
    const paths = pathname.split('/').filter(Boolean);
    const generated: BreadcrumbSegment[] = [];
    
    paths.forEach((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const name = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      generated.push({
        name,
        href: index < paths.length - 1 ? href : undefined
      });
    });
    
    return generated;
  }, [pathname, segments]);

  if (breadcrumbs.length === 0) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.name}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}