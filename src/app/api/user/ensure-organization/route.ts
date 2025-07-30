import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Ensuring organization setup for user:', userId);
    const supabase = createServiceRoleClient();

    // Check if user already has organization memberships
    const { data: existingMemberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (membershipError) {
      console.error('Error checking existing memberships:', membershipError);
    }

    // If user already has memberships, no need to create more
    if (existingMemberships && existingMemberships.length > 0) {
      console.log('User already has organization memberships');
      return NextResponse.json({ success: true, message: 'User already has organization' });
    }

    // Create default organization for the user
    const orgName = email ? `${email.split('@')[0]}'s Organization` : 'Default Organization';
    const orgSlug = `default-${userId.substring(0, 8)}`;

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        slug: orgSlug,
        created_by: userId,
        is_active: true,
        subscription_tier: 'free',
        subscription_status: 'active',
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    console.log('Created organization:', organization.id);

    // Add user as owner of the organization
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: userId,
        role: 'owner',
        status: 'active',
      });

    if (memberError) {
      console.error('Error creating organization membership:', memberError);
      return NextResponse.json({ error: 'Failed to create organization membership' }, { status: 500 });
    }

    console.log('Created organization membership for user:', userId);

    // Create or update user preferences with the new organization
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
      }, {
        onConflict: 'user_id',
      });

    if (prefsError) {
      console.error('Error creating user preferences:', prefsError);
      // Don't fail the request for this
    }

    console.log('Successfully ensured organization setup for user:', userId);
    return NextResponse.json({ 
      success: true, 
      organization: organization,
      message: 'Organization setup completed' 
    });

  } catch (error) {
    console.error('Error in ensure-organization API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}