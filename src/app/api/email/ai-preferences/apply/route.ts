import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { aiPreferencesService } from '@/lib/ai/ai-preferences-service';
import { v4 as uuidv4 } from 'uuid';

interface EmailPreferenceSuggestion {
  type: 'email_filter' | 'response_rule' | 'exclusion_rule' | 'content_rule' | 'style_preference';
  name: string;
  description: string;
  rule: any;
  preview?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[AI Preferences Apply] Request received');
    
    const session = await getServerSession(authOptions);
    console.log('[AI Preferences Apply] Session:', session?.user?.id ? 'Found' : 'Not found');
    
    if (!session?.user?.id) {
      console.log('[AI Preferences Apply] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[AI Preferences Apply] Request body:', JSON.stringify(body, null, 2));
    
    const { preferences } = body;
    
    if (!preferences || !Array.isArray(preferences)) {
      console.log('[AI Preferences Apply] Invalid preferences format:', preferences);
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    console.log('[AI Preferences Apply] Processing', preferences.length, 'preferences');

    // Get current preferences
    const currentPrefs = await aiPreferencesService.getUserPreferences(session.user.id);
    console.log('[AI Preferences Apply] Current preferences loaded:', !!currentPrefs);
    
    // Build the preferences object to save
    const prefsToSave: any = {
      ai_enabled: true // Ensure AI is enabled when applying preferences
    };

    // Process each preference suggestion
    for (const pref of preferences as EmailPreferenceSuggestion[]) {
      switch (pref.type) {
        case 'email_filter':
          const existingFilters = currentPrefs?.email_filters || [];
          prefsToSave.email_filters = [
            ...existingFilters,
            {
              id: uuidv4(),
              ...pref.rule,
              active: true
            }
          ];
          break;

        case 'response_rule':
          const existingRules = currentPrefs?.response_rules || [];
          prefsToSave.response_rules = [
            ...existingRules,
            {
              id: uuidv4(),
              ...pref.rule,
              active: true
            }
          ];
          break;

        case 'exclusion_rule':
          const existingExclusions = currentPrefs?.exclusion_rules || [];
          prefsToSave.exclusion_rules = [
            ...existingExclusions,
            {
              id: uuidv4(),
              ...pref.rule,
              active: true
            }
          ];
          break;

        case 'content_rule':
          const existingContent = currentPrefs?.content_rules || [];
          prefsToSave.content_rules = [
            ...existingContent,
            {
              id: uuidv4(),
              ...pref.rule,
              active: true
            }
          ];
          break;

        case 'style_preference':
          // Style preferences are applied directly to the main preferences
          if (pref.rule.response_style) prefsToSave.response_style = pref.rule.response_style;
          if (pref.rule.response_tone) prefsToSave.response_tone = pref.rule.response_tone;
          if (pref.rule.response_length) prefsToSave.response_length = pref.rule.response_length;
          break;
      }
    }

    // Save preferences
    console.log('[AI Preferences Apply] Preferences to save:', JSON.stringify(prefsToSave, null, 2));
    
    const success = await aiPreferencesService.savePreferencesFromChat(
      session.user.id,
      prefsToSave,
      `Applied ${preferences.length} preference(s) manually from chat interface`
    );

    console.log('[AI Preferences Apply] Save result:', success);

    if (!success) {
      console.log('[AI Preferences Apply] Failed to save preferences');
      return NextResponse.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      );
    }

    console.log('[AI Preferences Apply] Successfully applied preferences');
    return NextResponse.json({
      success: true,
      message: `Successfully applied ${preferences.length} preference(s)`,
      appliedCount: preferences.length
    });

  } catch (error) {
    console.error('[AI Preferences Apply] Error applying preferences:', error);
    
    // Check if it's a database table missing error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('relation "public.user_ai_email_preferences" does not exist') || 
        errorMessage.includes('user_ai_email_preferences') && errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'AI preferences system not set up yet. Please run the database migration first.',
          setup_required: true,
          instructions: 'Run the SQL migration in your Supabase SQL editor to create the required table.'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to apply preferences: ${errorMessage}` },
      { status: 500 }
    );
  }
} 