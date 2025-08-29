import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    
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

    const organizationId = preferences.current_organization_id;

    // Try file-based branding storage first (same as branding API)
    try {
      const { promises: fs } = require('fs');
      const path = require('path');
      
      const brandingDir = path.join(process.cwd(), 'data', 'branding');
      const brandingFile = path.join(brandingDir, `${organizationId}.json`);
      
      // Try to read existing branding file
      const brandingData = await fs.readFile(brandingFile, 'utf8');
      const existingBranding = JSON.parse(brandingData);
      
      if (existingBranding.logo_url) {
        console.log('Found logo in branding file for organization:', organizationId);
        return NextResponse.json({ 
          success: true,
          logoUrl: existingBranding.logo_url,
          organizationId: organizationId
        });
      }
    } catch (fileError) {
      // File doesn't exist or is invalid, continue to database fallback
      console.log('No branding file found for organization:', organizationId);
    }

    // Fallback to database branding (legacy support)
    try {
      const { data: branding, error } = await supabase
        .from('organization_branding')
        .select('logo_url')
        .eq('organization_id', organizationId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Database error fetching logo:', error);
        return NextResponse.json({ error: 'Failed to fetch logo' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        logoUrl: branding?.logo_url || null,
        organizationId: organizationId
      });
    } catch (dbError) {
      console.error('Database fallback error:', dbError);
      return NextResponse.json({ 
        success: true,
        logoUrl: null,
        organizationId: organizationId
      });
    }
    
  } catch (error) {
    console.error('Error fetching logo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logo' },
      { status: 500 }
    );
  }
}
