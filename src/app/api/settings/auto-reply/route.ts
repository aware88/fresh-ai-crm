import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's auto-reply settings
    const { data: settings, error } = await supabase
      .from('user_preferences')
      .select('auto_reply_settings')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    // Default settings
    const defaultSettings = {
      enabled: false,
      delayMinutes: 5,
      enabledAgents: [],
      excludeUrgent: true,
      excludeDisputes: true,
      requireConfirmation: false,
      maxDailyReplies: 50
    };

    return NextResponse.json({
      success: true,
      settings: settings?.auto_reply_settings || defaultSettings
    });

  } catch (error) {
    console.error('Failed to get auto-reply settings:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get auto-reply settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();

    // Validate settings
    if (typeof settings.enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid settings: enabled must be boolean' },
        { status: 400 }
      );
    }

    if (typeof settings.delayMinutes !== 'number' || settings.delayMinutes < 1) {
      return NextResponse.json(
        { error: 'Invalid settings: delayMinutes must be a positive number' },
        { status: 400 }
      );
    }

    // Upsert user preferences
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.user.id,
        auto_reply_settings: settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw error;
    }

    // If auto-reply is enabled, start the background processor
    if (settings.enabled) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auto-reply/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userEmail: session.user.email })
        });
      } catch (processorError) {
        console.error('Failed to start auto-reply processor:', processorError);
        // Don't fail the settings save if processor start fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-reply settings saved successfully'
    });

  } catch (error) {
    console.error('Failed to save auto-reply settings:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save auto-reply settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




