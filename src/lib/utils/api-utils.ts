/**
 * API Utilities
 * 
 * Common utilities for API calls.
 */

/**
 * Get the base URL for API calls
 * Works in both client and server environments
 */
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }
  
  // Server-side rendering should use absolute URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Local development
  return `http://localhost:${process.env.PORT || 3000}`;
}
