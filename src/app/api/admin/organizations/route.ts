import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/middleware/auth-middleware';
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

    const supabase = createServerClient();

    // Get organizations with user count
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        *,
        users:user_organizations(count)
      `);

    if (error) {
      console.error('Error fetching organizations:', error);
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    // Process the data to get user counts
    const orgsWithUserCount = organizations.map(org => ({
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

    const supabase = createServerClient();

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
    const orgData: any = { name, slug };
    
    // Add subscription plan if provided
    if (subscription_plan) {
      orgData.subscription_tier = subscription_plan;
      orgData.subscription_status = 'active';
    }

    // Create the organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert(orgData)
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }
    
    // If this is from signup flow and admin_user_id is provided, assign admin role
    if (isSignupFlow && admin_user_id && organization) {
      // Add user to organization with admin role
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: admin_user_id,
          organization_id: organization.id,
          role: 'admin'
        });
      
      if (userOrgError) {
        console.error('Error assigning user to organization:', userOrgError);
        // Don't fail the request, but log the error
      }
      
      // Get predefined role IDs for admin and owner
      try {
        const supabase = createServerClient();
        
        // Get admin role ID
        const { data: adminRole } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'admin')
          .single();
          
        // Get owner role ID
        const { data: ownerRole } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'owner')
          .single();
        
        if (adminRole?.id) {
          // Assign admin role to user
          const { error: adminRoleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: admin_user_id,
              role_id: adminRole.id
            });
            
          if (adminRoleError) {
            console.error('Error assigning admin role to user:', adminRoleError);
          }
        }
        
        if (ownerRole?.id) {
          // Assign owner role to user
          const { error: ownerRoleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: admin_user_id,
              role_id: ownerRole.id
            });
            
          if (ownerRoleError) {
            console.error('Error assigning owner role to user:', ownerRoleError);
          }
        }
      } catch (roleError) {
        console.error('Error assigning roles to user:', roleError);
        // Don't fail the request, but log the error
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
