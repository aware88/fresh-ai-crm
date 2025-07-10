import { NextResponse } from 'next/server';
import { fetchAllEmails } from '@/lib/email/emailFetcher';

// This API route is meant to be called by a scheduled job (cron)
// It should be protected by a secret key in production

export async function POST(request: Request) {
  try {
    // Validate API key for security
    const authHeader = request.headers.get('authorization');
    
    if (!process.env.CRON_SECRET_KEY) {
      console.warn('CRON_SECRET_KEY is not set in environment variables');
    }
    
    const expectedAuth = `Bearer ${process.env.CRON_SECRET_KEY}`;
    
    // Skip auth check in development, but require it in production
    if (process.env.NODE_ENV === 'production' && (!authHeader || authHeader !== expectedAuth)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting email fetch cron job');
    const result = await fetchAllEmails();
    
    return NextResponse.json({
      success: true,
      message: `Email fetch complete. Processed ${result.accountsFetched} accounts, fetched ${result.emailsFetched} emails`,
      ...result
    });
  } catch (error: any) {
    console.error('Error in fetch emails cron job:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An error occurred during email fetching' 
      },
      { status: 500 }
    );
  }
}

// Also allow GET for easier testing, but only in development
export async function GET(request: Request) {
  // Only allow GET in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'Method not allowed' },
      { status: 405 }
    );
  }
  
  // Re-use the POST handler
  return POST(request);
}
