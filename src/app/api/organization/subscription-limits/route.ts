import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { EnhancedSubscriptionService } from '@/lib/services/subscription-service-extension';

/**
 * GET /api/organization/subscription-limits
 * Get current subscription limits and usage for the organization
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;

    if (!organizationId) {
      return NextResponse.json({ 
        error: 'User not associated with an organization' 
      }, { status: 400 });
    }

    const supabase = await createServerClient();
    const enhancedSubscriptionService = new EnhancedSubscriptionService();

    // Get current subscription plan
    const { data: planData, error: planError } = await enhancedSubscriptionService.getOrganizationSubscriptionPlan(organizationId);
    
    if (planError || !planData) {
      return NextResponse.json({ 
        error: 'No active subscription found' 
      }, { status: 404 });
    }

    // Get current usage counts
    const [contactsResult, usersResult] = await Promise.all([
      supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId),
      supabase
        .from('user_organizations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
    ]);

    if (contactsResult.error || usersResult.error) {
      console.error('Error counting resources:', contactsResult.error, usersResult.error);
      return NextResponse.json({ 
        error: 'Failed to get current usage' 
      }, { status: 500 });
    }

    const currentContacts = contactsResult.count || 0;
    const currentUsers = usersResult.count || 0;

    // Get plan limits
    const contactLimit = typeof planData.features?.MAX_CONTACTS === 'number' ? planData.features.MAX_CONTACTS : 0;
    const userLimit = typeof planData.features?.MAX_USERS === 'number' ? planData.features.MAX_USERS : 0;
    const aiMessagesLimit = typeof planData.features?.AI_MESSAGES_LIMIT === 'number' ? planData.features.AI_MESSAGES_LIMIT : 0;

    // Calculate remaining capacity
    const remainingContacts = contactLimit === -1 ? 'unlimited' : Math.max(0, contactLimit - currentContacts);
    const remainingUsers = userLimit === -1 ? 'unlimited' : Math.max(0, userLimit - currentUsers);

    // Check if limits are reached
    const contactLimitReached = contactLimit !== -1 && currentContacts >= contactLimit;
    const userLimitReached = userLimit !== -1 && currentUsers >= userLimit;

    return NextResponse.json({
      plan: {
        name: planData.name,
        id: planData.id,
        price: planData.price
      },
      limits: {
        contacts: {
          current: currentContacts,
          max: contactLimit === -1 ? 'unlimited' : contactLimit,
          remaining: remainingContacts,
          isLimitReached: contactLimitReached
        },
        users: {
          current: currentUsers,
          max: userLimit === -1 ? 'unlimited' : userLimit,
          remaining: remainingUsers,
          isLimitReached: userLimitReached
        },
        aiMessages: {
          max: aiMessagesLimit === -1 ? 'unlimited' : aiMessagesLimit,
          // Note: Current AI message usage would need to be tracked separately
          current: 0,
          remaining: aiMessagesLimit === -1 ? 'unlimited' : aiMessagesLimit
        }
      },
      usage: {
        contactsPercentage: contactLimit === -1 || contactLimit === 0 ? 0 : Math.round((currentContacts / contactLimit) * 100),
        usersPercentage: userLimit === -1 || userLimit === 0 ? 0 : Math.round((currentUsers / userLimit) * 100)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error in subscription limits API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 