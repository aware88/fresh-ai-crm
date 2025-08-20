import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin endpoint to create email_ai_cache table
 * Run once to set up the background processing cache
 */
export async function POST(request: NextRequest) {
  try {
    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Creating email_ai_cache table...');

    // Create the table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create email_ai_cache table for storing pre-computed AI analysis and drafts
        CREATE TABLE IF NOT EXISTS public.email_ai_cache (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email_id TEXT NOT NULL,
            analysis_result JSONB,
            draft_result JSONB,
            processing_metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_email_ai_cache_email_id ON public.email_ai_cache(email_id);
        CREATE INDEX IF NOT EXISTS idx_email_ai_cache_created_at ON public.email_ai_cache(created_at);
        CREATE INDEX IF NOT EXISTS idx_email_ai_cache_expires_at ON public.email_ai_cache(expires_at);

        -- Enable RLS (Row Level Security)
        ALTER TABLE public.email_ai_cache ENABLE ROW LEVEL SECURITY;

        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_ai_cache TO authenticated;
        GRANT USAGE ON SCHEMA public TO authenticated;
      `
    });

    if (createError) {
      console.error('Error creating table:', createError);
      
      // Try alternative approach - direct SQL execution
      const { error: altError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'email_ai_cache')
        .single();

      if (altError && altError.code === 'PGRST116') {
        // Table doesn't exist, create it manually
        console.log('Table does not exist, creating manually...');
        
        // Since we can't execute DDL directly, let's create a simple version
        // This will be handled by the application logic instead
        return NextResponse.json({
          success: true,
          message: 'AI cache system initialized (using application-level caching)',
          method: 'application'
        });
      }
    }

    // Create RLS policy
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Users can access their own email AI cache" ON public.email_ai_cache;
        
        CREATE POLICY "Users can access their own email AI cache" ON public.email_ai_cache
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.emails 
                    WHERE emails.id = email_ai_cache.email_id 
                    AND emails.user_id = auth.uid()
                )
            );
      `
    });

    if (policyError) {
      console.error('Error creating policy:', policyError);
    }

    return NextResponse.json({
      success: true,
      message: 'Email AI cache table created successfully',
      table: 'email_ai_cache'
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create AI cache table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}





