import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerSession } from '@/lib/auth';
import { OrganizationBranding } from '@/types/branding';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/organizations/[id]/branding
 * Get organization branding settings
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Get session first before using params
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Safely extract the organization ID from params using async pattern for Next.js 15+
    const params = await context.params;
    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const organizationId = id;
    
    // Create Supabase client properly with await
    const supabase = await createServerClient();
    
    // Try file-based branding storage first
    const brandingDir = path.join(process.cwd(), 'data', 'branding');
    const brandingFile = path.join(brandingDir, `${organizationId}.json`);
    
    try {
      // Ensure branding directory exists
      await fs.mkdir(brandingDir, { recursive: true });
      
      // Try to read existing branding file
      const brandingData = await fs.readFile(brandingFile, 'utf8');
      const existingBranding = JSON.parse(brandingData);
      
      console.log('Found existing branding file for organization:', organizationId);
      return NextResponse.json({ branding: existingBranding });
      
    } catch (fileError) {
      // File doesn't exist or is invalid, return null for default branding
      console.log('No branding file found for organization:', organizationId);
      return NextResponse.json({ branding: null });
    }
    
    // Unreachable legacy DB path retained for reference only
    // (Real DB-backed branding can be re-enabled later.)
  } catch (error) {
    console.error('Error in organization branding API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/organizations/[id]/branding
 * Update organization branding settings
 */
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Get session first before using params
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Safely extract the organization ID from params using async pattern for Next.js 15+
    const params = await context.params;
    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const organizationId = id;
    
    // Create Supabase client properly with await
    const supabase = await createServerClient();
    
    // Check if user is admin for this organization (simplified check)
    try {
      // Direct query to organization_members table
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', session.user.id)
        .single();

      if (membershipError || !membership) {
        return NextResponse.json({ 
          error: 'Forbidden: User is not a member of this organization' 
        }, { status: 403 });
      }

      if (membership.role !== 'admin') {
        return NextResponse.json({ 
          error: 'Forbidden: Only organization administrators can modify branding settings' 
        }, { status: 403 });
      }
      
      console.log('✅ Admin permission verified for organization branding update:', organizationId);
    } catch (adminError) {
      console.error('Error checking admin permissions:', adminError);
      return NextResponse.json({ 
        error: 'Unable to verify admin permissions' 
      }, { status: 500 });
    }
    
    // Get request body
    const brandingData = await request.json();
    
    // Use file-based storage instead of database
    const brandingDir = path.join(process.cwd(), 'data', 'branding');
    const brandingFile = path.join(brandingDir, `${organizationId}.json`);
    
    try {
      // Ensure branding directory exists
      await fs.mkdir(brandingDir, { recursive: true });
      
      // Create complete branding record
      const brandingRecord = {
        id: `branding_${organizationId}`,
        organization_id: organizationId,
        ...brandingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: session.user.id,
        updated_by: session.user.id
      };
      
      // Save to file
      await fs.writeFile(brandingFile, JSON.stringify(brandingRecord, null, 2), 'utf8');
      
      console.log('Successfully saved branding for organization:', organizationId);
      return NextResponse.json({ branding: brandingRecord });
      
    } catch (fileError) {
      console.error('Error saving branding file:', fileError);
      return NextResponse.json({ error: 'Failed to save organization branding' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in organization branding API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
