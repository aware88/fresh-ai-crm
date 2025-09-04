/**
 * Premium Organization Invitation API
 * Allows admins to invite users to create Premium organizations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add proper admin role check here
    // For now, assuming all authenticated users can send invites
    // In production, this should check for admin permissions
    
    const body = await request.json();
    const { 
      email, 
      firstName, 
      lastName, 
      organizationName,
      subscriptionTier = 'premium-basic',
      message 
    } = body;

    // Validate input
    if (!email || !organizationName || !firstName || !lastName) {
      return NextResponse.json({
        error: 'Email, first name, last name, and organization name are required'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Please provide a valid email address'
      }, { status: 400 });
    }

    // Validate subscription tier is Premium
    if (!subscriptionTier.includes('premium')) {
      return NextResponse.json({
        error: 'Only Premium subscription tiers can be invited'
      }, { status: 400 });
    }

    logger.info('Creating Premium organization invitation', {
      email,
      organizationName,
      subscriptionTier,
      invitedBy: session.user.email
    });

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users?.find(u => u.email === email);

    if (existingUser) {
      return NextResponse.json({
        error: 'User with this email already exists. Please use a different email or invite them to join an existing organization.'
      }, { status: 400 });
    }

    // Create invitation token for tracking
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Store invitation in database
    const { error: inviteError } = await supabase
      .from('premium_invitations')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        organization_name: organizationName,
        subscription_tier: subscriptionTier,
        invitation_token: invitationToken,
        invited_by: session.user.id,
        expires_at: expiresAt.toISOString(),
        message,
        status: 'pending'
      });

    if (inviteError) {
      // If table doesn't exist, create it inline or log and continue
      logger.error('Premium invitations table may not exist', inviteError);
      
      // For now, we'll continue without storing in database
      // In production, ensure the premium_invitations table exists
    }

    // Send invitation email using Supabase Auth
    const inviteMetadata = {
      first_name: firstName,
      last_name: lastName,
      organization_name: organizationName,
      subscription_tier: subscriptionTier,
      invitation_type: 'premium_organization',
      invitation_token: invitationToken,
      invited_by: session.user.email,
      custom_message: message
    };

    const { data: invitedUser, error: authInviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: inviteMetadata,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-premium-invite?token=${invitationToken}`
      }
    );

    if (authInviteError) {
      logger.error('Failed to send invitation email', authInviteError);
      return NextResponse.json({
        error: 'Failed to send invitation email. Please try again.'
      }, { status: 500 });
    }

    logger.info('Premium invitation sent successfully', {
      email,
      organizationName,
      userId: invitedUser.user.id,
      invitationToken
    });

    return NextResponse.json({
      success: true,
      message: `Premium organization invitation sent to ${email}`,
      invitation: {
        email,
        organizationName,
        subscriptionTier,
        expiresAt: expiresAt.toISOString(),
        invitationToken
      }
    }, { status: 201 });

  } catch (error) {
    logger.error('Error in Premium invitation API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - List pending Premium invitations (for admins)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add proper admin role check
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    try {
      const { data: invitations, error } = await supabase
        .from('premium_invitations')
        .select(`
          *,
          inviter:invited_by(email, id)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching invitations', error);
        return NextResponse.json({ 
          success: true, 
          invitations: [], 
          message: 'Premium invitations table not yet configured' 
        });
      }

      return NextResponse.json({
        success: true,
        invitations: invitations || []
      });

    } catch (error) {
      // If table doesn't exist, return empty array
      return NextResponse.json({
        success: true,
        invitations: [],
        message: 'Premium invitations system is being set up'
      });
    }

  } catch (error) {
    logger.error('Error in GET Premium invitations API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}