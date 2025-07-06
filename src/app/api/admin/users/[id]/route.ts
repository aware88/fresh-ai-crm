import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase/server';
import { isAdmin } from '@/utils/auth/admin';
import { logActivityServer } from '@/utils/activity-logger';

// GET a specific user by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  
  // Check if user is admin
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const userId = params.id;
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, organizations(name, id)')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's auth details from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError) {
      console.error('Error fetching auth user:', authError);
      // We still return the user data even if auth data fails
    }

    // Combine user and auth data
    const userData = {
      ...user,
      email: authUser?.user?.email || null,
      email_confirmed_at: authUser?.user?.email_confirmed_at || null,
      last_sign_in_at: authUser?.user?.last_sign_in_at || null,
      created_at: authUser?.user?.created_at || user.created_at,
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PATCH to update a user
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  
  // Check if user is admin
  const { data: adminUser, error: adminError } = await supabase.auth.getUser();
  if (adminError || !adminUser.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const userId = params.id;
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const requestData = await req.json();
    const { role, organization_id, is_active } = requestData;

    // Validate the request data
    if (!role && organization_id === undefined && is_active === undefined) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: { role?: string; organization_id?: string | null; is_active?: boolean } = {};
    
    if (role !== undefined) {
      // Validate role
      const validRoles = ['admin', 'org_admin', 'user'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updateData.role = role;
    }
    
    if (organization_id !== undefined) {
      // If organization_id is provided, validate it exists
      if (organization_id) {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('id', organization_id)
          .single();

        if (orgError || !org) {
          return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
        }
      }
      updateData.organization_id = organization_id || null;
    }
    
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    // Update the user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Log the activity
    await logActivityServer({
      user_id: adminUser.user.id,
      action: 'update',
      entity_type: 'user',
      entity_id: userId,
      details: {
        changes: updateData,
        updated_by: adminUser.user.id
      },
      organization_id: existingUser.organization_id
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE to deactivate a user (we don't actually delete users, just mark them as inactive)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  
  // Check if user is admin
  const { data: adminUser, error: adminError } = await supabase.auth.getUser();
  if (adminError || !adminUser.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const userId = params.id;
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Check if user exists and get organization_id
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('id', userId)
      .single();

    if (userError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't allow deactivating yourself
    if (userId === adminUser.user.id) {
      return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 });
    }

    // Deactivate the user (don't delete)
    const { data: deactivatedUser, error: updateError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error deactivating user:', updateError);
      return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
    }

    // Log the activity
    await logActivityServer({
      user_id: adminUser.user.id,
      action: 'delete',
      entity_type: 'user',
      entity_id: userId,
      details: {
        deactivated_by: adminUser.user.id
      },
      organization_id: existingUser.organization_id
    });

    return NextResponse.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
