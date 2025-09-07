import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  heading: string;
  subheading?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ heading, subheading, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight leading-tight">{heading}</h1>
        {subheading && (
          <p className="text-lg text-muted-foreground leading-relaxed">{subheading}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-4 mt-2">
          {children}
        </div>
      )}
    </div>
  );
}
