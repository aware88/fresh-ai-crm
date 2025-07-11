import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerSession } from '@/lib/auth';
import { OrganizationBranding } from '@/types/branding';

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
    
    // Safely extract the organization ID from params
    const organizationId = context.params.id;
    // Create Supabase client properly with await
    const supabase = await createServerClient();
    
    // Check if user belongs to the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', session.user.id)
      .single();
    
    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get organization branding
    const { data: branding, error: brandingError } = await supabase
      .from('organization_branding')
      .select('*')
      .eq('organization_id', organizationId)
      .single();
    
    if (brandingError && brandingError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching organization branding:', brandingError);
      return NextResponse.json({ error: 'Failed to fetch organization branding' }, { status: 500 });
    }
    
    return NextResponse.json({ branding });
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
    
    // Safely extract the organization ID from params
    const organizationId = context.params.id;
    // Create Supabase client properly with await
    const supabase = await createServerClient();
    
    // Check if user is an admin of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', session.user.id)
      .single();
    
    if (membershipError || !membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }
    
    // Get request body
    const brandingData = await request.json();
    
    // Check if branding record exists
    const { data: existingBranding } = await supabase
      .from('organization_branding')
      .select('id')
      .eq('organization_id', organizationId)
      .single();
    
    let result;
    
    if (existingBranding) {
      // Update existing branding
      result = await supabase
        .from('organization_branding')
        .update({
          ...brandingData,
          updated_at: new Date().toISOString(),
          updated_by: session.user.id
        })
        .eq('organization_id', organizationId)
        .select('*')
        .single();
    } else {
      // Create new branding record
      result = await supabase
        .from('organization_branding')
        .insert({
          ...brandingData,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: session.user.id,
          updated_by: session.user.id
        })
        .select('*')
        .single();
    }
    
    if (result.error) {
      console.error('Error updating organization branding:', result.error);
      return NextResponse.json({ error: 'Failed to update organization branding' }, { status: 500 });
    }
    
    return NextResponse.json({ branding: result.data });
  } catch (error) {
    console.error('Error in organization branding API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
