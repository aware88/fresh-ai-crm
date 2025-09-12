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

    const userId = (session.user as any).id;
    console.log(`🚀 Starting real-time sync for all accounts for user: ${userId}`);

    // Get all active accounts for the user
    const supabase = createServiceRoleClient();
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('id, user_id, email, provider_type, is_active')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error || !accounts) {
      console.error('Failed to fetch user email accounts:', error);
      return NextResponse.json({ error: 'Failed to fetch email accounts' }, { status: 500 });
    }

    const results = [];
    
    for (const account of accounts) {
      const syncConfig = {
        provider: account.provider_type as 'microsoft' | 'google' | 'imap',
        accountId: account.id,
        userId: account.user_id,
        email: account.email,
        enableWebhooks: true,
        pollingInterval: 0.5, // 30 seconds for real-time sync
        enableAI: true,
        enableDraftPreparation: true
      };

      try {
        await realTimeSyncManager.startRealTimeSync(syncConfig);
        results.push({
          email: account.email,
          provider: account.provider_type,
          status: 'success',
          message: 'Real-time sync started with 30s polling + webhooks'
        });
        console.log(`✅ Real-time sync started for ${account.email}`);
      } catch (error) {
        results.push({
          email: account.email,
          provider: account.provider_type,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ Failed to start sync for ${account.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Real-time sync initialized for ${accounts.length} accounts`,
      accounts: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error starting real-time sync:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start real-time sync' },
      { status: 500 }
    );
  }
}

// Allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}


