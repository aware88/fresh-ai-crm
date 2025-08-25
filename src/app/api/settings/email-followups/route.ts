import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Get user's follow-up settings
    const { data: settings, error } = await supabase
      .from('user_followup_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching follow-up settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Return default settings if none exist
    const defaultSettings = {
      autoFollowupEnabled: true,
      defaultFollowupDays: 3,
      defaultPriority: 'medium',
      maxFollowupsPerContact: 3,
      excludeReplies: true,
      enableNotifications: true,
    };

    return NextResponse.json({
      success: true,
      settings: settings || defaultSettings
    });

  } catch (error) {
    console.error('Error in follow-up settings API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
    }

    const supabase = createClient();

    // Upsert the settings
    const { error } = await supabase
      .from('user_followup_settings')
      .upsert({
        user_id: session.user.id,
        auto_followup_enabled: settings.autoFollowupEnabled,
        default_followup_days: settings.defaultFollowupDays,
        default_priority: settings.defaultPriority,
        max_followups_per_contact: settings.maxFollowupsPerContact,
        exclude_replies: settings.excludeReplies,
        enable_notifications: settings.enableNotifications,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving follow-up settings:', error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    });

  } catch (error) {
    console.error('Error in follow-up settings API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}






