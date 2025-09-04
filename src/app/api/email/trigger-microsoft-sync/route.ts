import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Find Microsoft email accounts for this user
    const { data: microsoftAccounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('id, email, provider_type')
      .eq('user_id', (session.user as any).id)
      .eq('provider_type', 'microsoft')
      .eq('is_active', true);

    if (accountsError) {
      console.error('❌ Error finding Microsoft accounts:', accountsError);
      return NextResponse.json(
        { success: false, error: 'Failed to find Microsoft email accounts' },
        { status: 500 }
      );
    }

    if (!microsoftAccounts || microsoftAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active Microsoft email accounts found. Please connect a Microsoft account first.',
        accountsFound: 0
      });
    }

    console.log(`📧 Found ${microsoftAccounts.length} Microsoft accounts to sync`);

    const syncResults = [];

    for (const account of microsoftAccounts) {
      console.log(`🔄 Triggering sync for Microsoft account: ${account.email}`);
      
      try {
        // Call the Microsoft Graph sync endpoint
        const syncResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/email/sync-microsoft-graph`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify({
            accountId: account.id,
            maxEmails: 100 // Start with 100 emails for initial sync
          })
        });

        const syncResult = await syncResponse.json();

        syncResults.push({
          accountId: account.id,
          email: account.email,
          success: syncResult.success,
          totalSaved: syncResult.totalSaved || 0,
          error: syncResult.error || null
        });

        if (syncResult.success) {
          console.log(`✅ Successfully synced ${syncResult.totalSaved || 0} emails for ${account.email}`);
        } else {
          console.error(`❌ Failed to sync emails for ${account.email}:`, syncResult.error);
        }

      } catch (syncError) {
        console.error(`❌ Error triggering sync for ${account.email}:`, syncError);
        syncResults.push({
          accountId: account.id,
          email: account.email,
          success: false,
          totalSaved: 0,
          error: syncError instanceof Error ? syncError.message : 'Unknown sync error'
        });
      }
    }

    const successfulSyncs = syncResults.filter(r => r.success);
    const totalEmailsSynced = successfulSyncs.reduce((sum, r) => sum + r.totalSaved, 0);

    return NextResponse.json({
      success: successfulSyncs.length > 0,
      message: `Synced ${totalEmailsSynced} emails from ${successfulSyncs.length}/${microsoftAccounts.length} Microsoft accounts`,
      accountsProcessed: microsoftAccounts.length,
      successfulSyncs: successfulSyncs.length,
      totalEmailsSynced,
      results: syncResults
    });

  } catch (error) {
    console.error('❌ Error triggering Microsoft sync:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger Microsoft email sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}