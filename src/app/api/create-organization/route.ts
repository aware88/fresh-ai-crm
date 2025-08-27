import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();
    const userId = session.user.id;
    const supabase = createServiceRoleClient();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    console.log('🏢 Create: Creating organization:', name, 'for user:', userId);

    // Generate a slug from the name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create the organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        slug,
        description: description || `Organization created by ${session.user.email}`,
        created_by: userId,
        subscription_tier: 'free',
        subscription_status: 'active',
        is_active: true
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    console.log('🏢 Create: Organization created:', organization);

    // Add user as admin member
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: userId,
        role: 'admin',
        is_owner: true,
        joined_at: new Date().toISOString()
      });

    if (memberError) {
      console.error('Error adding user as member:', memberError);
      // Don't fail here, the org was created
    }

    console.log('🏢 Create: User added as admin member');

    // Update user preferences to point to this organization
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        current_organization_id: organization.id,
        theme: 'light',
        email_notifications: true,
        push_notifications: true,
        language: 'en',
        timezone: 'UTC',
        updated_at: new Date().toISOString()
      });

    if (prefsError) {
      console.error('Error updating user preferences:', prefsError);
      // Don't fail here, the org was created
    }

    console.log('🏢 Create: User preferences updated');

    return NextResponse.json({
      success: true,
      message: 'Organization created successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      },
      userRole: 'admin',
      isOwner: true
    });

  } catch (error) {
    console.error('Error in create-organization API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

