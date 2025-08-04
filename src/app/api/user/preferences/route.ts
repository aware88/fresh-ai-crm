import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user preferences from Supabase
    console.log('🔍 Fetching preferences for user:', session.user.id);
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    console.log('📋 Raw preferences data:', preferences);
    console.log('❌ Preferences error:', error);

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, return default preferences
        return NextResponse.json({
          user_id: session.user.id,
          theme: 'light',
          current_organization_id: null,
          email_notifications: true,
          browser_notifications: true,
          marketing_emails: false
        });
      }
      
      console.error('Error fetching user preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('User preferences API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      theme,
      current_organization_id,
      email_notifications,
      browser_notifications,
      marketing_emails
    } = body;

    // Update user preferences in Supabase
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.user.id,
        theme: theme || 'light',
        current_organization_id,
        email_notifications: email_notifications !== false,
        browser_notifications: browser_notifications !== false,
        marketing_emails: marketing_emails === true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('User preferences API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}