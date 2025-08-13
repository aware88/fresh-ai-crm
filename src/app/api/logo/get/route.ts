import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Get user's current organization from preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', session.user.id)
      .single();

    if (!preferences?.current_organization_id) {
      return NextResponse.json({ 
        success: true,
        logoUrl: null,
        message: 'No organization selected'
      });
    }

    // Get organization branding
    const { data: branding, error } = await supabase
      .from('organization_branding')
      .select('logo_url')
      .eq('organization_id', preferences.current_organization_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error fetching logo:', error);
      return NextResponse.json({ error: 'Failed to fetch logo' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      logoUrl: branding?.logo_url || null,
      organizationId: preferences.current_organization_id
    });
    
  } catch (error) {
    console.error('Error fetching logo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logo' },
      { status: 500 }
    );
  }
}
