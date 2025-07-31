import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/signin',
  '/signup',
  '/auth/callback',
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
    const url = new URL('/signin', request.url);
    // Add the original URL as a callback parameter
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return applySecurityHeaders(NextResponse.redirect(url));
  }
  
  // TEMPORARY: Allow all authenticated requests to proceed
  // This will help us debug the organization setup issue
  console.log('🔍 Middleware: Token found, allowing request to proceed');
  console.log('🔍 Token details:', {
    id: token.sub,
    email: token.email,
    iat: token.iat,
    organizationSetup: (token as any).organizationSetup,
    tokenAge: Date.now() - ((token.iat as number) * 1000)
  });
  
  // If token is found, user is authenticated, proceed with the request
  return applySecurityHeaders(NextResponse.next());
}

/**
 * Apply security headers to the response
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
  
  return response;
}

/**
 * Configure which paths this middleware runs on
 * We want to apply authentication and security headers to all routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for specific static assets
     * that don't need authentication checks
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
