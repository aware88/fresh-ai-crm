import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client for rate limiting
const redis = Redis.fromEnv();

interface RateLimitOptions {
  /**
   * Maximum number of requests allowed within the window
   */
  limit: number;
  
  /**
   * Time window in seconds
   */
  window: number;
  
  /**
   * Identifier function to determine the rate limit key
   * Defaults to using the IP address
   */
  identifier?: (req: NextRequest) => Promise<string> | string;
}

/**
 * Rate limiting middleware for Next.js API routes
 * Uses Redis to track request counts
 * 
 * @param options Rate limiting options
 */
export function withRateLimit(options: RateLimitOptions) {
  const { limit, window: timeWindow, identifier } = options;
  
  return async function rateLimit(req: NextRequest) {
    try {
      // Get identifier (default to IP address)
      const id = identifier 
        ? await identifier(req) 
        : (req.ip || req.headers.get('x-forwarded-for') || 'unknown');
      
      // Create a unique key for this rate limit
      const key = `rate-limit:${id}`;
      
      // Get current count from Redis
      const currentCount = await redis.get<number>(key) || 0;
      
      // Check if limit is exceeded
      if (currentCount >= limit) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      // Increment the counter
      await redis.incr(key);
      
      // Set expiry if this is the first request in the window
      if (currentCount === 0) {
        await redis.expire(key, timeWindow);
      }
      
      // Add rate limit headers to the response
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', (limit - currentCount - 1).toString());
      
      return response;
    } catch (error) {
      console.error('Rate limiting error:', error);
      
      // If rate limiting fails, allow the request to proceed
      // This prevents blocking legitimate requests due to Redis issues
      return NextResponse.next();
    }
  };
}

/**
 * Apply rate limiting to sensitive endpoints
 * 
 * @param req Next.js request object
 */
export async function rateLimitSensitiveEndpoints(req: NextRequest) {
  // Define paths that need stricter rate limiting
  const sensitivePathPatterns = [
    // Authentication endpoints
    /^\/api\/auth\/signin/,
    /^\/api\/auth\/signup/,
    /^\/api\/auth\/reset-password/,
    
    // Admin endpoints
    /^\/api\/admin\//,
    
    // Webhook endpoints
    /^\/api\/webhooks\//,
    
    // Payment endpoints
    /^\/api\/subscriptions\/checkout/,
    /^\/api\/subscriptions\/cancel/,
  ];
  
  // Check if the current path matches any sensitive patterns
  const isSensitivePath = sensitivePathPatterns.some(pattern => 
    pattern.test(req.nextUrl.pathname)
  );
  
  if (isSensitivePath) {
    // Apply stricter rate limiting for sensitive endpoints
    const rateLimiter = withRateLimit({
      limit: 20,       // 20 requests
      window: 60,      // per minute
      identifier: async (req) => {
        // Use IP address + path for more granular limits
        const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
        return `${ip}:${req.nextUrl.pathname}`;
      }
    });
    
    return rateLimiter(req);
  }
  
  // For non-sensitive paths, apply a more lenient rate limit
  const defaultRateLimiter = withRateLimit({
    limit: 100,      // 100 requests
    window: 60,      // per minute
  });
  
  return defaultRateLimiter(req);
}
