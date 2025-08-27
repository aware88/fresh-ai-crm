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

    const { targetOrganizationName } = await request.json();
    const userId = session.user.id;
    const supabase = createServiceRoleClient();

    console.log('🔧 Fix: Looking for organization:', targetOrganizationName, 'for user:', userId);

    // Find the organization by name
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .ilike('name', `%${targetOrganizationName}%`);

    if (orgError) {
      console.error('Error finding organization:', orgError);
      return NextResponse.json({ error: 'Failed to find organization' }, { status: 500 });
    }

    if (!organizations || organizations.length === 0) {
      return NextResponse.json({ 
        error: 'Organization not found',
        searchedFor: targetOrganizationName
      }, { status: 404 });
    }

    if (organizations.length > 1) {
      return NextResponse.json({ 
        error: 'Multiple organizations found',
        organizations: organizations.map(org => ({ id: org.id, name: org.name }))
      }, { status: 400 });
    }

    const targetOrg = organizations[0];
    console.log('🔧 Fix: Found target organization:', targetOrg);

    // Check if user is already a member of this organization
    const { data: existingMembership, error: membershipError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', targetOrg.id)
      .eq('user_id', userId)
      .single();

    console.log('🔧 Fix: Existing membership:', existingMembership);
    console.log('🔧 Fix: Membership error:', membershipError);

    // If user is not a member, add them as admin
    if (membershipError && membershipError.code === 'PGRST116') {
      console.log('🔧 Fix: User not a member, adding as admin');
      
      const { error: insertError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: targetOrg.id,
          user_id: userId,
          role: 'admin',
          is_owner: true,
          joined_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error adding user to organization:', insertError);
        return NextResponse.json({ error: 'Failed to add user to organization' }, { status: 500 });
      }

      console.log('🔧 Fix: Successfully added user as admin');
    } else if (existingMembership) {
      console.log('🔧 Fix: User already a member, updating role to admin');
      
      // Update existing membership to admin
      const { error: updateError } = await supabase
        .from('organization_members')
        .update({
          role: 'admin',
          is_owner: true
        })
        .eq('organization_id', targetOrg.id)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating membership role:', updateError);
        return NextResponse.json({ error: 'Failed to update membership role' }, { status: 500 });
      }

      console.log('🔧 Fix: Successfully updated user role to admin');
    }

    // Update user preferences to point to this organization
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        current_organization_id: targetOrg.id,
        theme: 'light',
        email_notifications: true,
        push_notifications: true,
        language: 'en',
        timezone: 'UTC',
        updated_at: new Date().toISOString()
      });

    if (prefsError) {
      console.error('Error updating user preferences:', prefsError);
      return NextResponse.json({ error: 'Failed to update user preferences' }, { status: 500 });
    }

    console.log('🔧 Fix: Successfully updated user preferences');

    return NextResponse.json({
      success: true,
      message: 'User organization fixed successfully',
      organization: {
        id: targetOrg.id,
        name: targetOrg.name
      },
      userRole: 'admin',
      isOwner: true
    });

  } catch (error) {
    console.error('Error in fix-user-organization API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

