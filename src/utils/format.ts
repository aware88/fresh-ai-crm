/**
 * Format Utilities
 * 
 * This module provides common formatting functions used throughout the application
 */

/**
 * Formats a number as a currency string
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @param locale The locale to use for formatting (default: en-US)
 * @returns A formatted currency string
 */
export function formatCurrency(
  amount: number | undefined | null, 
  currency = 'USD', 
  locale = 'en-US'
): string {
  if (amount === undefined || amount === null) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a date as a string
 * @param date The date to format
 * @param locale The locale to use for formatting (default: en-US)
 * @param options Formatting options
 * @returns A formatted date string
 */
export function formatDate(
  date: Date | string | number | undefined | null,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  if (!date) {
    return '-';
  }

  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Formats a phone number to standard format
 * @param phone The phone number to format
 * @returns A formatted phone number string
 */
export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) {
    return '';
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Format according to length (basic US format as fallback)
  if (digits.length === 10) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  }

  // If not standard length, return cleaned digits with spaces for readability
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

/**
 * Truncates a string to a specified length and adds an ellipsis if needed
 * @param str The string to truncate
 * @param maxLength The maximum length (default: 100)
 * @returns The truncated string
 */
export function truncateString(str: string | undefined | null, maxLength = 100): string {
  if (!str) {
    return '';
  }
  
  if (str.length <= maxLength) {
    return str;
  }

  return str.substring(0, maxLength - 3) + '...';
}
