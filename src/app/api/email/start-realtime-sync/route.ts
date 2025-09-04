import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { realTimeSyncManager } from '@/lib/email/real-time-sync-manager';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    // Get account details
    const supabase = createServiceRoleClient();
    const { data: account, error } = await supabase
      .from('email_accounts')
      .select('id, user_id, email, provider_type, is_active')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .single();

    if (error || !account) {
      return NextResponse.json({ error: 'Email account not found or access denied' }, { status: 404 });
    }

    // Configure real-time sync
    const syncConfig = {
      provider: account.provider_type as 'microsoft' | 'google' | 'imap',
      accountId: account.id,
      userId: account.user_id,
      email: account.email,
      enableWebhooks: true,
      pollingInterval: getPollingInterval(account.provider_type),
      enableAI: true,
      enableDraftPreparation: true
    };

    // Start real-time sync
    await realTimeSyncManager.startRealTimeSync(syncConfig);

    console.log(`✅ Real-time sync started for ${account.email}`);

    return NextResponse.json({
      success: true,
      message: `Real-time sync started for ${account.email}`,
      config: {
        provider: syncConfig.provider,
        pollingInterval: syncConfig.pollingInterval,
        webhooksEnabled: syncConfig.enableWebhooks,
        aiEnabled: syncConfig.enableAI
      }
    });

  } catch (error) {
    console.error('Error starting real-time sync:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start real-time sync' },
      { status: 500 }
    );
  }
}

function getPollingInterval(providerType: string): number {
  switch (providerType) {
    case 'microsoft':
    case 'outlook':
      return 5; // 5 minutes (has webhooks)
    case 'google':
    case 'gmail':
      return 3; // 3 minutes (has push notifications)
    case 'imap':
      return 2; // 2 minutes (polling only)
    default:
      return 5;
  }
}


