/**
 * Premium Invitation Acceptance API
 * Handles accepting Premium organization invitations
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

// POST - Accept premium invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invitationToken } = body;

    if (!invitationToken) {
      return NextResponse.json({
        error: 'Invitation token is required'
      }, { status: 400 });
    }

    logger.info('Processing premium invitation acceptance', {
      userId: session.user.id,
      userEmail: session.user.email,
      invitationToken
    });

    // Validate token format
    const tokenRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!tokenRegex.test(invitationToken)) {
      return NextResponse.json({
        error: 'Invalid invitation token format'
      }, { status: 400 });
    }

    try {
      // Use the database function to accept the invitation
      const { data: result, error: acceptError } = await supabase
        .rpc('accept_premium_invitation', {
          token: invitationToken,
          user_id: session.user.id
        });

      if (acceptError) {
        logger.error('Database error accepting invitation', acceptError);
        return NextResponse.json({
          error: 'Failed to process invitation. Please contact support.'
        }, { status: 500 });
      }

      const acceptResult = result?.[0];
      if (!acceptResult?.success) {
        logger.warn('Invitation acceptance failed', {
          userId: session.user.id,
          invitationToken,
          message: acceptResult?.message
        });
        
        return NextResponse.json({
          error: acceptResult?.message || 'Invalid or expired invitation'
        }, { status: 400 });
      }

      logger.info('Premium invitation accepted successfully', {
        userId: session.user.id,
        organizationId: acceptResult.organization_id,
        invitationToken
      });

      return NextResponse.json({
        success: true,
        message: 'Premium organization created successfully!',
        organizationId: acceptResult.organization_id
      });

    } catch (dbError) {
      logger.error('Error calling database function', dbError);
      
      // Fallback to manual process if function doesn't exist
      return await handleManualAcceptance(invitationToken, session.user.id);
    }

  } catch (error) {
    logger.error('Error in premium invitation acceptance', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Validate invitation token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({
        error: 'Invitation token is required'
      }, { status: 400 });
    }

    try {
      // Use database function to get invitation details
      const { data: invitation, error } = await supabase
        .rpc('get_premium_invitation_by_token', { token });

      if (error) {
        logger.error('Error validating invitation token', error);
        return NextResponse.json({
          error: 'Failed to validate invitation'
        }, { status: 500 });
      }

      const invitationDetails = invitation?.[0];
      if (!invitationDetails) {
        return NextResponse.json({
          error: 'Invitation not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        valid: invitationDetails.is_valid,
        invitation: {
          email: invitationDetails.email,
          firstName: invitationDetails.first_name,
          lastName: invitationDetails.last_name,
          organizationName: invitationDetails.organization_name,
          subscriptionTier: invitationDetails.subscription_tier,
          message: invitationDetails.message,
          invitedBy: invitationDetails.invited_by_email,
          expiresAt: invitationDetails.expires_at
        }
      });

    } catch (dbError) {
      logger.error('Database function not available', dbError);
      
      // Fallback to direct query
      return await handleManualValidation(token);
    }

  } catch (error) {
    logger.error('Error validating invitation', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fallback manual acceptance (if database functions aren't available yet)
async function handleManualAcceptance(invitationToken: string, userId: string) {
  try {
    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('premium_invitations')
      .select('*')
      .eq('invitation_token', invitationToken)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({
        error: 'Invalid or expired invitation'
      }, { status: 400 });
    }

    // Generate organization slug
    let orgSlug = invitation.organization_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure slug is unique
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .single();

    if (existingOrg) {
      orgSlug = `${orgSlug}-${Date.now()}`;
    }

    // Create organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: invitation.organization_name,
        slug: orgSlug,
        description: 'Premium organization created via invitation',
        subscription_tier: invitation.subscription_tier,
        created_by: userId,
        beta_early_adopter: true
      })
      .select()
      .single();

    if (orgError) {
      logger.error('Error creating organization', orgError);
      return NextResponse.json({
        error: 'Failed to create organization'
      }, { status: 500 });
    }

    // Add user as organization admin
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: newOrg.id,
        user_id: userId,
        role: 'admin',
        status: 'active'
      });

    if (memberError) {
      logger.error('Error adding user to organization', memberError);
    }

    // Update user preferences
    const { error: prefError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        current_organization_id: newOrg.id,
        theme: 'light',
        email_notifications: true,
        push_notifications: true
      });

    if (prefError) {
      logger.error('Error updating user preferences', prefError);
    }

    // Mark invitation as accepted
    await supabase
      .from('premium_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('invitation_token', invitationToken);

    return NextResponse.json({
      success: true,
      message: 'Premium organization created successfully!',
      organizationId: newOrg.id
    });

  } catch (error) {
    logger.error('Error in manual acceptance', error);
    return NextResponse.json({
      error: 'Failed to process invitation'
    }, { status: 500 });
  }
}

// Fallback manual validation
async function handleManualValidation(token: string) {
  try {
    const { data: invitation, error } = await supabase
      .from('premium_invitations')
      .select(`
        *,
        inviter:invited_by(email)
      `)
      .eq('invitation_token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({
        error: 'Invitation not found'
      }, { status: 404 });
    }

    const isValid = invitation.status === 'pending' && 
                   new Date(invitation.expires_at) > new Date();

    return NextResponse.json({
      success: true,
      valid: isValid,
      invitation: {
        email: invitation.email,
        firstName: invitation.first_name,
        lastName: invitation.last_name,
        organizationName: invitation.organization_name,
        subscriptionTier: invitation.subscription_tier,
        message: invitation.message,
        invitedBy: invitation.inviter?.email,
        expiresAt: invitation.expires_at
      }
    });

  } catch (error) {
    logger.error('Error in manual validation', error);
    return NextResponse.json({
      error: 'Failed to validate invitation'
    }, { status: 500 });
  }
}