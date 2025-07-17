import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { requirePermission } from '@/lib/auth/middleware';
import { cookies } from 'next/headers';
import { RoleService } from '@/services/RoleService';

// GET /api/admin/organizations - List organizations
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view organizations
    const auth = await requirePermission('admin.organizations.view');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = await createServerClient();

    // Get organizations with user count
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        *,
        users:organization_members(count)
      `);

    if (error) {
      console.error('Error fetching organizations:', error);
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    // Process the data to get user counts
    const orgsWithUserCount = organizations.map((org: any) => ({
      ...org,
      user_count: org.users?.[0]?.count || 0,
      users: undefined // Remove the users array
    }));

    return NextResponse.json({ organizations: orgsWithUserCount });
  } catch (error) {
    console.error('Error in organizations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/organizations - Create a new organization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, admin_user_id, subscription_plan } = body;
    let isSignupFlow = false;
    
    // If admin_user_id is provided, this is coming from the signup flow
    // Otherwise, check admin permissions
    if (!admin_user_id) {
      // Check if user has permission to create organizations
      const auth = await requirePermission('admin.organizations.create');
      if (!auth.success && auth.redirect) {
        return NextResponse.redirect(new URL(auth.redirect, request.url));
      } else if (!auth.success) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      isSignupFlow = true;
    }

    // Validate input
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Validate slug format (only lowercase letters, numbers, and hyphens)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Check if slug is already in use
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug is already in use' },
        { status: 400 }
      );
    }

    // Prepare organization data
    let createdBy = admin_user_id; // For signup flow
    
    if (!isSignupFlow) {
      // For regular admin flow, get current user from auth
      const { data: { user } } = await supabase.auth.getUser();
      createdBy = user?.id;
    }
    
    if (!createdBy) {
      return NextResponse.json(
        { error: 'Unable to determine user for organization creation' },
        { status: 400 }
      );
    }
    
    // For signup flow, verify the user exists in auth.users
    if (isSignupFlow) {
      const { data: userExists, error: userCheckError } = await supabase.auth.admin.getUserById(createdBy);
      if (userCheckError || !userExists.user) {
        console.error('User not found in auth.users:', createdBy, userCheckError);
        return NextResponse.json(
          { error: 'User not found. Please ensure the user account is created first.' },
          { status: 400 }
        );
      }
    }
    
    const orgData: any = { 
      name, 
      slug,
      created_by: createdBy
    };
    
    // Add subscription plan if provided
    if (subscription_plan) {
      orgData.subscription_tier = subscription_plan;
      orgData.subscription_status = 'active';
    }

    // Create the organization
    console.log('Creating organization with data:', orgData);
    
    // Use service role client for organization creation if it's signup flow
    const clientToUse = isSignupFlow ? createServiceRoleClient() : supabase;
    
    const { data: organization, error } = await clientToUse
      .from('organizations')
      .insert(orgData)
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return NextResponse.json(
        { error: 'Failed to create organization', details: error.message },
        { status: 500 }
      );
    }
    
    // If this is from signup flow and admin_user_id is provided, assign admin role
    if (isSignupFlow && admin_user_id && organization) {
      try {
        // Use service role client to bypass RLS for initial organization member creation
        const serviceSupabase = createServiceRoleClient();
        
        console.log('Adding user to organization:', { 
          user_id: admin_user_id, 
          organization_id: organization.id,
          role: 'admin',
          is_owner: true 
        });
        
        // Add user to organization with admin role and owner status
        const { error: userOrgError } = await serviceSupabase
          .from('organization_members')
          .insert({
            user_id: admin_user_id,
            organization_id: organization.id,
            role: 'admin',
            is_owner: true
          });
        
        if (userOrgError) {
          console.error('Error assigning user to organization:', userOrgError);
          // Don't fail the request, but log the error
        } else {
          console.log('Successfully added user to organization');
        }
      } catch (memberError) {
        console.error('Exception during member assignment:', memberError);
      }
    }

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    console.error('Error in organizations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
