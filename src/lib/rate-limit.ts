// In-memory store for rate limiting
interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitData>();
const RATE_LIMIT_WINDOW_MS = 10 * 1000; // 10 seconds
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per window

// Helper function to get the IP address from the request headers
const getIP = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(/, /)[0] : '127.0.0.1';
  return ip;
};

// Middleware to check rate limit for API routes
export const checkRateLimit = async (request: Request) => {
  const ip = getIP(request);
  const now = Date.now();
  
  // Get or initialize rate limit data for this IP
  let rateLimitData = rateLimitStore.get(ip);
  
  // If no data or window has expired, reset the counter
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    };
    rateLimitStore.set(ip, rateLimitData);
  }
  
  // Increment the request count
  rateLimitData.count++;
  
  // Calculate remaining requests and reset time
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - rateLimitData.count);
  const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);
  
  // Check if rate limit is exceeded
  if (rateLimitData.count > RATE_LIMIT_MAX_REQUESTS) {
    return {
      success: false,
      error: {
        message: 'Too many requests',
        retryAfter,
        limit: RATE_LIMIT_MAX_REQUESTS,
        remaining: 0,
      },
    };
  }
  
  return {
    success: true,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining,
    resetTime: rateLimitData.resetTime,
  };
};
