import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to add security headers to all responses
 * This helps protect against common web vulnerabilities
 */
export function middleware(request: NextRequest) {
  // Get the response
  const response = NextResponse.next();
  
  // Add security headers
  
  // Content Security Policy (CSP)
  // Helps prevent XSS attacks by specifying which resources can be loaded
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.stripe.com; frame-src 'self' https://*.stripe.com;"
  );
  
  // HTTP Strict Transport Security (HSTS)
  // Forces browsers to use HTTPS for the website
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // X-Content-Type-Options
  // Prevents browsers from MIME-sniffing a response away from the declared content-type
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  // Prevents clickjacking attacks by ensuring the site cannot be embedded in an iframe
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  // Enables the Cross-site scripting (XSS) filter in browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  // Controls how much referrer information is included with requests
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy
  // Limits which features and APIs can be used in the browser
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  return response;
}

/**
 * Configure which paths this middleware runs on
 * We want to apply security headers to all routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
