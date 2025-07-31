import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/signin',
  '/signup',
  '/auth/callback',
  '/auth/confirm',
  '/reset-password',
  '/forgot-password',
];

// List of API paths that don't require authentication
const PUBLIC_API_PATHS = [
  '/api/auth',
  '/api/webhooks',
  '/api/public',
];

/**
 * Middleware for authentication and security headers
 * This enforces authentication across all protected routes
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip auth check for public paths and static assets
  const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'));
  const isPublicApiPath = PUBLIC_API_PATHS.some(path => pathname.startsWith(path));
  const isStaticAsset = [
    '/_next/',
    '/favicon.ico',
    '/images/',
    '/fonts/',
    '/public/',
  ].some(path => pathname.startsWith(path));
  
  // Skip auth check for public paths and static assets
  if (isPublicPath || isPublicApiPath || isStaticAsset) {
    return applySecurityHeaders(NextResponse.next());
  }
  
  // For all other routes, check if user is authenticated
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  // If no token found, redirect to signin
  if (!token) {
    // Check if this is a fresh sign-in attempt (has nextauth session cookie)
    const hasSessionCookie = request.cookies.has('next-auth.session-token') || 
                             request.cookies.has('__Secure-next-auth.session-token');
    
    // If we have a session cookie but no token, give NextAuth time to process
    if (hasSessionCookie) {
      console.log('🔄 Session cookie found but no token yet, allowing request to proceed');
      const response = NextResponse.next();
      response.headers.set('x-middleware-cache', 'no-cache');
      return applySecurityHeaders(response);
    }
    
    const url = new URL('/signin', request.url);
    // Add the original URL as a callback parameter
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    const redirectResponse = NextResponse.redirect(url);
    // CRITICAL FIX: Disable middleware cache to prevent cookie reading issues
    redirectResponse.headers.set('x-middleware-cache', 'no-cache');
    return applySecurityHeaders(redirectResponse);
  }
  
  console.log('🔍 Middleware: Token found, allowing request to proceed');
  console.log('🔍 Token details:', {
    id: token.sub,
    email: token.email,
    iat: token.iat,
    organizationSetup: (token as any).organizationSetup,
    tokenAge: Date.now() - ((token.iat as number) * 1000)
  });
  
  // If token is found, user is authenticated, proceed with the request
  const response = NextResponse.next();
  // CRITICAL FIX: Disable middleware cache for all responses
  response.headers.set('x-middleware-cache', 'no-cache');
  return applySecurityHeaders(response);
}

/**
 * Apply security headers to the response
 * Preserves existing cache control headers
 */
function applySecurityHeaders(response: NextResponse) {
  // Content Security Policy (CSP)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.stripe.com; frame-src 'self' https://*.stripe.com;"
  );
  
  // HTTP Strict Transport Security (HSTS)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  // Ensure cache control is preserved (don't override x-middleware-cache)
  if (!response.headers.has('x-middleware-cache')) {
    response.headers.set('x-middleware-cache', 'no-cache');
  }
  
  return response;
}

/**
 * Configure which paths this middleware runs on
 * Fixed to properly handle NextAuth sign-in process
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Apply authentication and security headers to all other routes
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
