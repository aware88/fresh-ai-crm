import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string or Date object into a human-readable format
 * @param dateString ISO date string or Date object
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Default options for date formatting
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
}
