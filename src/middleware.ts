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
  
  // CRITICAL FIX: Use a more aggressive approach to prevent middleware caching issues
  // This is based on the proven solution from Next.js GitHub issues and community
  
  let token;
  try {
    token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  } catch (error) {
    console.error('🚨 Error getting token in middleware:', error);
    token = null;
  }
  
  // If no token found, redirect to signin
  if (!token) {
    const url = new URL('/signin', request.url);
    // Add the original URL as a callback parameter
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    const redirectResponse = NextResponse.redirect(url);
    // CRITICAL FIX: Disable middleware cache to prevent cookie reading issues
    redirectResponse.headers.set('x-middleware-cache', 'no-cache');
    redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
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
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
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
  
  // Ensure critical cache control headers are preserved
  if (!response.headers.has('x-middleware-cache')) {
    response.headers.set('x-middleware-cache', 'no-cache');
  }
  if (!response.headers.has('Cache-Control')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  if (!response.headers.has('Pragma')) {
    response.headers.set('Pragma', 'no-cache');
  }
  if (!response.headers.has('Expires')) {
    response.headers.set('Expires', '0');
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
