import { NextRequest, NextResponse } from 'next/server';
import { realTimeSyncManager } from '@/lib/email/real-time-sync-manager';

/**
 * Initialize real-time sync for all active email accounts
 * This should be called on app startup or deployment
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal call (from deployment or admin)
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.INTERNAL_API_KEY || process.env.CRON_SECRET_KEY;
    
    if (apiKey && (!authHeader || authHeader !== `Bearer ${apiKey}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Initializing real-time email sync for all accounts...');

    // Start real-time sync for all active accounts
    await realTimeSyncManager.startAllActiveSyncs();

    return NextResponse.json({
      success: true,
      message: 'Real-time email sync initialized for all active accounts',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error initializing real-time sync:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize real-time sync',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Allow GET for testing in development
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  return POST(request);
}


