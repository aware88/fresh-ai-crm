/**
 * API Endpoint: Email Cache Cleanup
 * 
 * This endpoint cleans up expired email cache entries.
 * Can be called manually or triggered by external cron services.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify admin/service access (optional - you can add authentication here)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CACHE_CLEANUP_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧹 Starting email cache cleanup...');

    // Call the cleanup function
    const { data: deletedCount, error } = await supabase.rpc('cleanup_expired_email_cache');

    if (error) {
      console.error('Cache cleanup failed:', error);
      return NextResponse.json(
        { error: 'Cache cleanup failed', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Cache cleanup completed: ${deletedCount} entries removed`);

    return NextResponse.json({
      success: true,
      deletedEntries: deletedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error during cache cleanup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: 'Email Cache Cleanup Endpoint',
    usage: 'POST to this endpoint to trigger cache cleanup',
    authentication: 'Set CACHE_CLEANUP_TOKEN environment variable for security'
  });
}
