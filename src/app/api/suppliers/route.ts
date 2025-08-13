import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase/server';
import { createServiceRoleClient } from '../../../lib/supabase/service-role';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Helper function to get organization ID from session
function getOrganizationId(session: any): string | null {
  // session.user.id is not the organization id; prefer preferences or membership
  return (session?.user as any)?.organizationId || null;
}

// GET /api/suppliers - Get all suppliers for the organization
export async function GET(request: NextRequest) {
  try {
    // Get session and organization ID
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve organization id from DB
    const supabaseRW = await createServerClient();
    let organizationId = getOrganizationId(session);
    try {
      if (!organizationId) {
        const { data: prefs } = await supabaseRW
          .from('user_preferences')
          .select('current_organization_id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (prefs?.current_organization_id) organizationId = prefs.current_organization_id;
        if (!organizationId) {
          const { data: member } = await supabaseRW
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .maybeSingle();
          if (member?.organization_id) organizationId = member.organization_id;
        }
      }
    } catch {}

    const supabase = createServiceRoleClient();
    // Fetch suppliers for organization OR created by the user
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .or(`organization_id.eq.${organizationId || '00000000-0000-0000-0000-000000000000'},user_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json({ error: 'Failed to fetch suppliers', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ suppliers: suppliers || [] });
  } catch (err) {
    console.error('Error in suppliers API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name } = body;
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Get session and organization ID
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = getOrganizationId(session);
    
    // Use service role client to bypass RLS issues
    const supabase = createServiceRoleClient();
    
    // Add organization_id and user_id to the supplier data
    const supplierData = {
      ...body,
      organization_id: organizationId,
      user_id: session.user.id, // Keep for audit trail
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating supplier:', error);
      return NextResponse.json({ error: 'Failed to create supplier', details: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ supplier: data }, { status: 201 });
  } catch (err) {
    console.error('Error in suppliers API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/suppliers - Update an existing supplier
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { id, name, email } = body;
    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    
    // Get session and organization ID
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = getOrganizationId(session);
    
    // Use service role client to bypass RLS issues
    const supabase = createServiceRoleClient();
    
    // Update in database (organization members can update shared suppliers)
    const { data, error } = await supabase
      .from('suppliers')
      .update(body)
      .eq('id', id)
      .eq('organization_id', organizationId)  // Ensure user can only update organization suppliers
      .select()
      .single();
    
    if (error) {
      console.error('Error updating supplier:', error);
      return NextResponse.json({ error: 'Failed to update supplier', details: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Supplier not found or not accessible by your organization' }, { status: 404 });
    }
    
    return NextResponse.json({ supplier: data });
  } catch (err) {
    console.error('Error in suppliers API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/suppliers - Delete a supplier
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }
    
    // Get session and organization ID
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = getOrganizationId(session);
    
    // Use service role client to bypass RLS issues
    const supabase = createServiceRoleClient();
    
    // Delete from database (organization members can delete shared suppliers)
    const { data, error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)  // Ensure user can only delete organization suppliers
      .select()
      .single();
    
    if (error) {
      console.error('Error deleting supplier:', error);
      return NextResponse.json({ error: 'Failed to delete supplier', details: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Supplier not found or not accessible by your organization' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in suppliers API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
