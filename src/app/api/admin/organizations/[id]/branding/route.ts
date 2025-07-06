import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { OrganizationBranding, BrandingFormData } from '@/types/branding';
import { logActivityServer } from '@/utils/activity-logger';

// Temporarily define isAdmin function here until we can properly import it
async function isAdmin(): Promise<boolean> {
  try {
    const supabase = createServerClient();
    
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Error getting user:', userError);
      return false;
    }
    
    // Get the user's role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();
    
    if (roleError) {
      console.error('Error getting user role:', roleError);
      return false;
    }
    
    // Check if the user has the admin role
    return userRole?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// GET /api/admin/organizations/[id]/branding - Get organization branding
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const organizationId = params.id;
    const supabase = createServerClient();

    // Check if organization exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get organization branding
    const { data: branding, error } = await supabase
      .from('organization_branding')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      console.error('Error fetching organization branding:', error);
      return NextResponse.json({ error: 'Failed to fetch organization branding' }, { status: 500 });
    }

    return NextResponse.json({ branding: branding || {} });
  } catch (error) {
    console.error('Error in organization branding API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/organizations/[id]/branding - Update organization branding
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin and get user info
    const supabase = createServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const organizationId = params.id;
    const body = await request.json();
    const brandingData = body as BrandingFormData;

    // Validate input
    if (!brandingData || typeof brandingData !== 'object') {
      return NextResponse.json(
        { error: 'Valid branding data is required' },
        { status: 400 }
      );
    }

    // Check if organization exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if branding record exists
    const { data: existingBranding, error: brandingError } = await supabase
      .from('organization_branding')
      .select('id')
      .eq('organization_id', organizationId)
      .single();

    let result;

    if (brandingError && brandingError.code === 'PGRST116') {
      // No branding record exists, create a new one
      const { data: newBranding, error: createError } = await supabase
        .from('organization_branding')
        .insert({
          organization_id: organizationId,
          ...brandingData
        })
        .select('*')
        .single();

      if (createError) {
        console.error('Error creating organization branding:', createError);
        return NextResponse.json(
          { error: 'Failed to create organization branding' },
          { status: 500 }
        );
      }

      result = newBranding;

      // Log activity
      await logActivityServer({
        user_id: userData.user.id,
        action: 'create',
        entity_type: 'organization',
        entity_id: organizationId,
        details: { branding: 'created' },
        organization_id: organizationId
      });
    } else {
      // Update existing branding record
      const { data: updatedBranding, error: updateError } = await supabase
        .from('organization_branding')
        .update(brandingData)
        .eq('organization_id', organizationId)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating organization branding:', updateError);
        return NextResponse.json(
          { error: 'Failed to update organization branding' },
          { status: 500 }
        );
      }

      result = updatedBranding;

      // Log activity
      await logActivityServer({
        user_id: userData.user.id,
        action: 'update',
        entity_type: 'organization',
        entity_id: organizationId,
        details: { branding: 'updated' },
        organization_id: organizationId
      });
    }

    return NextResponse.json({ branding: result });
  } catch (error) {
    console.error('Error in organization branding API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
