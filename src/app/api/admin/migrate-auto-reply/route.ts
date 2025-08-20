import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Create pending_auto_replies table
    const { error: tableError } = await supabase.rpc('create_pending_auto_replies_table', {});
    
    if (tableError && !tableError.message.includes('already exists')) {
      throw tableError;
    }

    // Create the table manually if RPC doesn't work
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS pending_auto_replies (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        draft_content TEXT NOT NULL,
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        agent_type TEXT DEFAULT 'auto_reply',
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'cancelled', 'failed')),
        sent_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_pending_auto_replies_user_email ON pending_auto_replies(user_email);
      CREATE INDEX IF NOT EXISTS idx_pending_auto_replies_status ON pending_auto_replies(status);
      CREATE INDEX IF NOT EXISTS idx_pending_auto_replies_scheduled_at ON pending_auto_replies(scheduled_at);

      -- Add RLS policies
      ALTER TABLE pending_auto_replies ENABLE ROW LEVEL SECURITY;

      CREATE POLICY IF NOT EXISTS "Users can manage their own auto replies" ON pending_auto_replies
        FOR ALL USING (auth.jwt() ->> 'email' = user_email);
    `;

    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (sqlError) {
      // Try direct SQL execution
      const { error: directError } = await supabase
        .from('pending_auto_replies')
        .select('id')
        .limit(1);
      
      // If table doesn't exist, create it step by step
      if (directError?.message?.includes('does not exist')) {
        console.log('Creating auto-reply tables manually...');
        
        // Note: In a real implementation, you'd need to execute this SQL
        // through a proper database migration system or admin interface
        console.log('SQL to execute:', createTableSQL);
        
        return NextResponse.json({
          success: true,
          message: 'Auto-reply table creation queued - please run the SQL manually',
          sql: createTableSQL
        });
      }
    }

    // Also update user_preferences to include auto_reply_settings if not exists
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_preferences 
        ADD COLUMN IF NOT EXISTS auto_reply_settings JSONB DEFAULT '{
          "enabled": false,
          "delayMinutes": 5,
          "enabledAgents": [],
          "excludeUrgent": true,
          "excludeDisputes": true,
          "requireConfirmation": false,
          "maxDailyReplies": 50
        }'::jsonb;
      `
    });

    if (alterError) {
      console.log('Note: Could not alter user_preferences table:', alterError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-reply tables created/verified successfully',
      table: 'pending_auto_replies'
    });

  } catch (error) {
    console.error('Failed to create auto-reply tables:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create auto-reply tables',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




