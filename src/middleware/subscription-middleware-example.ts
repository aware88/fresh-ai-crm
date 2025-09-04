import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This would run on every request and add subscription data to headers
export async function subscriptionMiddleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  if (!token?.sub) {
    return NextResponse.next();
  }

  // Get subscription from cache or database
  const subscription = await getSubscriptionForUser(token.sub);
  
  // Add to request headers for API routes to use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-subscription-tier', subscription.tier);
  requestHeaders.set('x-subscription-limits', JSON.stringify(subscription.limits));
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

// In your API routes, you can now just read from headers:
// const tier = request.headers.get('x-subscription-tier');
// const limits = JSON.parse(request.headers.get('x-subscription-limits') || '{}');