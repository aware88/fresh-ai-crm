import { NextResponse } from 'next/server';
import { analyzeEmail } from '@/lib/openai/client';
import { checkRateLimit } from '@/lib/rate-limit';

// Maximum number of characters allowed in the email content
const MAX_EMAIL_LENGTH = 20000; // ~5,000 tokens

export async function POST(request: Request) {
  try {
    // Check rate limit
    const rateLimit = await checkRateLimit(request);
    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimit.error?.retryAfter,
          limit: rateLimit.error?.limit,
          remaining: rateLimit.error?.remaining
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.error?.retryAfter || 10),
            'X-RateLimit-Limit': String(rateLimit.error?.limit || 5),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.error?.retryAfter ? 
              Math.floor(Date.now() / 1000) + rateLimit.error.retryAfter : 
              Math.floor(Date.now() / 1000) + 10)
          }
        }
      );
    }

    const { emailContent } = await request.json();

    // Validate input
    if (!emailContent || typeof emailContent !== 'string') {
      return NextResponse.json(
        { error: 'Email content is required and must be a string' }, 
        { status: 400 }
      );
    }

    // Limit email content length to prevent abuse
    if (emailContent.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { 
          error: `Email content too long. Maximum ${MAX_EMAIL_LENGTH} characters allowed.`,
          maxLength: MAX_EMAIL_LENGTH,
          actualLength: emailContent.length
        }, 
        { status: 400 }
      );
    }

    // Add a timeout for the analysis
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const analysis = await analyzeEmail(emailContent);
      clearTimeout(timeout);

      return NextResponse.json({ 
        analysis,
        metadata: {
          processedAt: new Date().toISOString(),
          length: emailContent.length
        }
      }, {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(Math.floor((rateLimit.resetTime || Date.now() + 10000) / 1000))
        }
      });
    } catch (error: any) {
      clearTimeout(timeout);
      
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Analysis timed out' },
          { status: 504 }
        );
      }
      
      console.error('Error in analyze-email API:', error);
      return NextResponse.json(
        { 
          error: error.message || 'Failed to analyze email',
          code: error.code
        }, 
        { status: error.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in analyze-email API:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, 
      { status: 500 }
    );
  }
}
