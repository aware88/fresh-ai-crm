import React from 'react';
import { cn } from '@/lib/utils';

// Typography components inspired by Linear's clean design system

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

export function H1({ children, className }: TypographyProps) {
  return (
    <h1 className={cn(
      "text-3xl font-semibold tracking-tight text-foreground",
      "leading-none",
      className
    )}>
      {children}
    </h1>
  );
}

export function H2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn(
      "text-2xl font-semibold tracking-tight text-foreground",
      "leading-tight",
      className
    )}>
      {children}
    </h2>
  );
}

export function H3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn(
      "text-xl font-medium tracking-tight text-foreground",
      "leading-tight",
      className
    )}>
      {children}
    </h3>
  );
}

export function H4({ children, className }: TypographyProps) {
  return (
    <h4 className={cn(
      "text-lg font-medium text-foreground",
      "leading-tight",
      className
    )}>
      {children}
    </h4>
  );
}

export function Body({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "text-sm text-muted-foreground",
      "leading-relaxed",
      className
    )}>
      {children}
    </p>
  );
}

export function BodyLarge({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "text-base text-foreground",
      "leading-relaxed",
      className
    )}>
      {children}
    </p>
  );
}

export function Caption({ children, className }: TypographyProps) {
  return (
    <span className={cn(
      "text-xs text-muted-foreground font-medium",
      "leading-none uppercase tracking-wider",
      className
    )}>
      {children}
    </span>
  );
}

export function Label({ children, className }: TypographyProps) {
  return (
    <label className={cn(
      "text-sm font-medium text-foreground",
      "leading-none",
      className
    )}>
      {children}
    </label>
  );
}

// Lead component for compatibility
export function Lead({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "text-xl text-muted-foreground",
      "leading-7",
      className
    )}>
      {children}
    </p>
  );
}

export function Muted({ children, className }: TypographyProps) {
  return (
    <span className={cn(
      "text-sm text-muted-foreground",
      className
    )}>
      {children}
    </span>
  );
}

export function Small({ children, className }: TypographyProps) {
  return (
    <small className={cn(
      "text-xs text-muted-foreground",
      "leading-none",
      className
    )}>
      {children}
    </small>
  );
}

export function Code({ children, className }: TypographyProps) {
  return (
    <code className={cn(
      "relative rounded bg-muted px-[0.3rem] py-[0.2rem]",
      "font-mono text-sm font-medium text-foreground",
      className
    )}>
      {children}
    </code>
  );
}

// Metric display components
export function MetricValue({ children, className }: TypographyProps) {
  return (
    <div className={cn(
      "text-2xl font-semibold tabular-nums text-foreground",
      "leading-none",
      className
    )}>
      {children}
    </div>
  );
}

export function MetricLabel({ children, className }: TypographyProps) {
  return (
    <div className={cn(
      "text-sm text-muted-foreground font-medium",
      "leading-tight",
      className
    )}>
      {children}
    </div>
  );
}

// Status indicators
interface StatusTextProps extends TypographyProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export function StatusText({ children, className, status }: StatusTextProps) {
  const statusClasses = {
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    neutral: 'text-muted-foreground'
  };

  return (
    <span className={cn(
      "text-sm font-medium",
      statusClasses[status],
      className
    )}>
      {children}
    </span>
  );
}

// Linear-style section headers
export function SectionHeader({ children, className }: TypographyProps) {
  return (
    <h3 className={cn(
      "text-lg font-semibold text-foreground",
      "border-b border-border pb-2 mb-4",
      className
    )}>
      {children}
    </h3>
  );
}

// Page titles with subtle styling
export function PageTitle({ children, className }: TypographyProps) {
  return (
    <h1 className={cn(
      "text-2xl font-semibold tracking-tight text-foreground",
      "mb-2",
      className
    )}>
      {children}
    </h1>
  );
}

export function PageDescription({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "text-muted-foreground",
      "mb-6",
      className
    )}>
      {children}
    </p>
  );
}