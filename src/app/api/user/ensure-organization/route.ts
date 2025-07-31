import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Ensuring user preferences setup for user:', userId);
    const supabase = createServiceRoleClient();

    // SIMPLIFIED: Just ensure user has preferences (no organization required)
    const { data: existingPreferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (preferencesError) {
      console.error('Error checking existing preferences:', preferencesError);
    }

    // If user already has preferences, they're all set
    if (existingPreferences && existingPreferences.length > 0) {
      console.log('User already has preferences');
      return NextResponse.json({ success: true, message: 'User preferences exist' });
    }

    // SIMPLIFIED: Just create user preferences (no organization needed)
    console.log('Creating user preferences for independent user');
    
    const { error: createPrefsError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        current_organization_id: null, // Independent users don't need organizations
        theme: 'light',
        email_notifications: true,
        push_notifications: true,
        language: 'en',
        timezone: 'UTC'
      });

    if (createPrefsError) {
      console.error('Error creating user preferences:', createPrefsError);
      return NextResponse.json({ 
        error: 'Failed to create user preferences', 
        details: createPrefsError 
      }, { status: 500 });
    }

    console.log('Created user preferences for independent user');

    return NextResponse.json({ 
      success: true, 
      message: 'User preferences created successfully (no organization needed)'
    });

  } catch (error) {
    console.error('Error in ensure-organization API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}