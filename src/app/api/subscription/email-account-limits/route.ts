import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { canAddMoreEmailAccounts } from '@/lib/subscription-feature-check';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Get user's current organization
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', session.user.id)
      .single();

    if (prefsError || !userPrefs?.current_organization_id) {
      return NextResponse.json({ error: 'Could not find organization' }, { status: 400 });
    }

    const organizationId = userPrefs.current_organization_id;

    // Get organization subscription info
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Could not find organization details' }, { status: 400 });
    }

    // Count current email accounts for this organization
    const { count: currentCount, error: countError } = await supabase
      .from('email_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (countError) {
      return NextResponse.json({ error: 'Failed to count email accounts' }, { status: 500 });
    }

    // Check if organization can add more email accounts
    const { canAdd, limit } = await canAddMoreEmailAccounts(
      organizationId, 
      currentCount || 0
    );

    // Determine plan name from subscription tier
    let planName = 'Starter';
    let emailAccountLimit = 1;
    
    if (organization.subscription_tier?.includes('starter')) {
      planName = 'Starter';
      emailAccountLimit = 1;
    } else if (organization.subscription_tier?.includes('pro')) {
      planName = 'Pro';
      emailAccountLimit = 2;
    } else if (organization.subscription_tier?.includes('premium')) {
      planName = 'Premium';
      emailAccountLimit = 3; // Premium gets 3 email accounts
    }

    return NextResponse.json({
      emailAccountLimit,
      currentCount: currentCount || 0,
      canAdd,
      planName,
      subscriptionTier: organization.subscription_tier
    });

  } catch (error) {
    console.error('Error fetching email account limits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}