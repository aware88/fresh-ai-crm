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

    const { name, description, adminEmails } = await request.json();
    const userId = session.user.id;
    const supabase = createServiceRoleClient();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    if (!adminEmails || !Array.isArray(adminEmails) || adminEmails.length === 0) {
      return NextResponse.json({ error: 'At least one admin email is required' }, { status: 400 });
    }

    console.log('🏢 Create: Creating organization:', name, 'with admins:', adminEmails);

    // Generate a slug from the name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if organization already exists
    const { data: existingOrg, error: existingOrgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', name.trim())
      .single();

    if (existingOrgError && existingOrgError.code !== 'PGRST116') {
      console.error('Error checking existing organization:', existingOrgError);
      return NextResponse.json({ error: 'Failed to check existing organization' }, { status: 500 });
    }

    let organization;
    if (existingOrg) {
      console.log('🏢 Create: Organization already exists:', existingOrg);
      organization = existingOrg;
    } else {
      // Create the organization
      const { data: newOrg, error: orgError } = await supabase
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

      console.log('🏢 Create: Organization created:', newOrg);
      organization = newOrg;
    }

    // Find all admin users by email
    const adminUserIds = [];
    const missingAdmins = [];
    const addedAdmins = [];

    for (const email of adminEmails) {
      // Find user by email
      const { data: user, error: userError } = await supabase.auth.admin.listUsers({
        email: email
      });

      if (userError) {
        console.error('Error finding user by email:', userError);
        missingAdmins.push({ email, error: 'Failed to find user' });
        continue;
      }

      if (!user.users || user.users.length === 0) {
        console.log('🏢 Create: User not found for email:', email);
        missingAdmins.push({ email, error: 'User not found' });
        continue;
      }

      const adminUserId = user.users[0].id;
      adminUserIds.push(adminUserId);

      // Check if user is already a member
      const { data: existingMember, error: memberError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('user_id', adminUserId)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('Error checking existing membership:', memberError);
        missingAdmins.push({ email, error: 'Failed to check membership' });
        continue;
      }

      if (existingMember) {
        // Update existing membership to admin
        const { error: updateError } = await supabase
          .from('organization_members')
          .update({
            role: 'admin',
            is_owner: true
          })
          .eq('id', existingMember.id);

        if (updateError) {
          console.error('Error updating membership:', updateError);
          missingAdmins.push({ email, error: 'Failed to update membership' });
          continue;
        }

        addedAdmins.push({ email, userId: adminUserId, action: 'updated' });
      } else {
        // Add user as admin member
        const { error: insertError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: organization.id,
            user_id: adminUserId,
            role: 'admin',
            is_owner: true,
            joined_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error adding user as member:', insertError);
          missingAdmins.push({ email, error: 'Failed to add as member' });
          continue;
        }

        addedAdmins.push({ email, userId: adminUserId, action: 'added' });
      }

      // Update user preferences to point to this organization
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: adminUserId,
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
        // Don't fail here, the user was added as admin
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Organization created/updated successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      },
      addedAdmins,
      missingAdmins
    });

  } catch (error) {
    console.error('Error in create-organization-with-admins API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
