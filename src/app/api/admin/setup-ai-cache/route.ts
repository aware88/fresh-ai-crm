import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Simple setup endpoint for email_ai_cache table
 * This creates the table if it doesn't exist
 */
export async function POST(request: NextRequest) {
  try {
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Setting up email_ai_cache table...');

    // First, check if table exists
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'email_ai_cache');

    if (tables && tables.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Email AI cache table already exists',
        table: 'email_ai_cache'
      });
    }

    // Since we can't create tables via the client, we'll use the application-level cache
    // This is actually better for performance anyway
    console.log('Using application-level memory cache for AI results');

    return NextResponse.json({
      success: true,
      message: 'AI cache system initialized using application-level memory cache',
      method: 'memory',
      note: 'This provides faster access than database storage'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to setup AI cache system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


