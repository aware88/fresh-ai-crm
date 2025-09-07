"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function Spinner({ size = 'md', className, children }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  if (children) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
        <span className="text-sm text-muted-foreground">{children}</span>
      </div>
    );
  }

  return (
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </Loader2>
  );
}
