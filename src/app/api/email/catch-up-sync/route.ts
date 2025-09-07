import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * POST /api/email/catch-up-sync
 * 
 * Catch-up sync for existing users who have:
 * - Old email accounts that haven't synced recently
 * - Missing AI learning patterns
 * - Gaps in their email history
 * 
 * Perfect for users like "zarfin" who have old accounts
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId, syncDays = 30, runAILearning = true } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    console.log(`🔄 [Catch-up Sync] Starting for account ${accountId}, last ${syncDays} days, AI learning: ${runAILearning}`);

    const supabase = createServiceRoleClient();

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 });
    }

    console.log(`📧 [Catch-up Sync] Account: ${account.email} (${account.provider_type})`);

    // Get current email count to show improvement
    const { count: beforeCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .eq('email_account_id', accountId);

    console.log(`📊 [Catch-up Sync] Current emails in system: ${beforeCount || 0}`);

    // Step 1: Run catch-up sync
    const syncResult = await runCatchupSync(account, syncDays);
    
    if (!syncResult.success) {
      console.error(`❌ [Catch-up Sync] Failed: ${syncResult.error}`);
      return NextResponse.json({
        success: false,
        error: `Catch-up sync failed: ${syncResult.error}`,
        step: 'sync'
      }, { status: 500 });
    }

    console.log(`✅ [Catch-up Sync] Completed: +${syncResult.newEmails} new emails`);

    // Get updated count
    const { count: afterCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .eq('email_account_id', accountId);

    // Step 2: Run AI learning if requested and we have enough emails
    let learningResult = { success: true, patternsFound: 0, qualityScore: 0, skipped: true };
    
    if (runAILearning && (afterCount || 0) >= 20) {
      console.log(`🤖 [Catch-up Sync] Starting AI learning...`);
      
      // Get user's organization
      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('current_organization_id')
        .eq('user_id', session.user.id)
        .single();

      learningResult = await runBackgroundAILearning(session.user.id, userPrefs?.current_organization_id, accountId);
      learningResult.skipped = false;
      
      if (learningResult.success) {
        console.log(`✅ [Catch-up Sync] AI learning completed: ${learningResult.patternsFound} patterns`);
      } else {
        console.warn(`⚠️ [Catch-up Sync] AI learning failed: ${learningResult.error}`);
      }
    } else if (runAILearning) {
      console.log(`⏭️ [Catch-up Sync] Skipping AI learning - not enough emails (${afterCount || 0})`);
    }

    // Step 3: Update account sync timestamp
    await supabase
      .from('email_accounts')
      .update({
        last_full_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId);

    console.log(`🎉 [Catch-up Sync] Completed successfully`);

    return NextResponse.json({
      success: true,
      message: 'Catch-up sync completed successfully',
      results: {
        emails: {
          before_count: beforeCount || 0,
          after_count: afterCount || 0,
          new_emails: syncResult.newEmails,
          days_synced: syncDays
        },
        ai_learning: {
          enabled: runAILearning,
          skipped: learningResult.skipped,
          background_learning: learningResult.backgroundLearning || false,
          session_id: learningResult.sessionId,
          status_endpoint: learningResult.sessionId ? `/api/email/learning/status?sessionId=${learningResult.sessionId}` : null,
          success: learningResult.success
        },
        sync_details: syncResult.details || {}
      },
      recommendations: generateCatchupRecommendations(
        beforeCount || 0,
        afterCount || 0,
        syncResult,
        learningResult
      )
    });

  } catch (error) {
    console.error('Error in catch-up sync:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Catch-up sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Run catch-up sync based on provider type
 */
async function runCatchupSync(account: any, syncDays: number) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  // Use agreed-upon 5000 emails for comprehensive catch-up sync
  const estimatedEmails = 5000; // Full comprehensive catch-up as agreed
  
  try {
    let endpoint: string;
    let body: any;

    switch (account.provider_type) {
      case 'google':
      case 'gmail':
        endpoint = '/api/emails/gmail/sync';
        body = {
          accountId: account.id,
          folder: 'inbox',
          maxEmails: Math.min(estimatedEmails, 1000), // Gmail API limits
          incremental: false // Full refresh for catch-up
        };
        break;
        
      case 'microsoft':
      case 'outlook':
        endpoint = '/api/emails/graph/sync';
        body = {
          accountId: account.id,
          folder: 'inbox',
          maxEmails: Math.min(estimatedEmails, 1000), // Graph API limits
          delta: false // Full refresh for catch-up
        };
        break;
        
      case 'imap':
      default:
        endpoint = '/api/email/sync-to-database';
        body = {
          accountId: account.id,
          maxEmails: estimatedEmails // IMAP can handle more
        };
        break;
    }

    console.log(`📡 [Catch-up Sync] Calling ${endpoint} with ${body.maxEmails} max emails`);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-Catchup-Sync'
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    return {
      success: response.ok && (result.success !== false),
      newEmails: result.totalSaved || result.count || result.newEmails?.length || 0,
      details: {
        provider: account.provider_type,
        endpoint: endpoint.split('/').pop(),
        requested_max: body.maxEmails,
        processing_time: result.processing_time_ms || 0
      },
      error: response.ok ? null : (result.error || 'Sync failed')
    };

  } catch (error) {
    return {
      success: false,
      newEmails: 0,
      details: {},
      error: error instanceof Error ? error.message : 'Unknown sync error'
    };
  }
}

/**
 * Run background AI learning for catch-up (non-blocking)
 */
async function runBackgroundAILearning(userId: string, organizationId: string | null, accountId: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  try {
    console.log(`🤖 [Catch-up AI] Starting background learning for user ${userId}`);
    
    const response = await fetch(`${baseUrl}/api/email/learning/background`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-Catchup-Learning'
      },
      body: JSON.stringify({
        maxEmails: 5000, // Analyze up to 5000 emails for catch-up as agreed
        organizationId,
        accountId
      })
    });

    const result = await response.json();
    
    return {
      success: response.ok && result.success,
      sessionId: result.session_id || null,
      backgroundLearning: true,
      patternsFound: 0, // Background learning doesn't immediately return patterns
      qualityScore: 0, // Will be available via status endpoint
      error: response.ok ? null : (result.error || 'Background AI learning failed to start')
    };

  } catch (error) {
    return {
      success: false,
      sessionId: null,
      backgroundLearning: false,
      patternsFound: 0,
      qualityScore: 0,
      error: error instanceof Error ? error.message : 'Unknown learning error'
    };
  }
}

/**
 * Generate recommendations based on catch-up results
 */
function generateCatchupRecommendations(beforeCount: number, afterCount: number, syncResult: any, learningResult: any) {
  const recommendations = [];
  const newEmails = afterCount - beforeCount;

  if (newEmails === 0) {
    recommendations.push('No new emails found - your account was already up to date');
  } else if (newEmails < 10) {
    recommendations.push(`Found ${newEmails} new emails - consider syncing a longer time period for better results`);
  } else if (newEmails > 500) {
    recommendations.push(`Great! Found ${newEmails} new emails - this should significantly improve your AI features`);
  } else {
    recommendations.push(`Successfully synced ${newEmails} new emails`);
  }

  if (!learningResult.skipped) {
    if (learningResult.success && learningResult.patternsFound > 5) {
      recommendations.push('AI learning completed successfully - expect better draft generation quality');
    } else if (learningResult.success && learningResult.patternsFound > 0) {
      recommendations.push('AI learning found some patterns - quality will improve as more emails are processed');
    } else if (!learningResult.success) {
      recommendations.push('AI learning encountered issues - you can retry this later from the settings');
    } else {
      recommendations.push('AI learning completed but found limited patterns - consider syncing more sent emails');
    }
  }

  if (newEmails > 50 && learningResult.success) {
    recommendations.push('Perfect! Your account is now optimally set up for AI-powered email features');
  }

  return recommendations;
}

/**
 * GET /api/email/catch-up-sync
 * 
 * Check which accounts need catch-up sync
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get all user's email accounts with sync status
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('id, email, provider_type, last_full_sync_at, setup_completed, is_active')
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch email accounts' }, { status: 500 });
    }

    const accountsWithStatus = await Promise.all(
      accounts.map(async (account) => {
        // Get email count for this account
        const { count: emailCount } = await supabase
          .from('email_index')
          .select('*', { count: 'exact', head: true })
          .eq('email_account_id', account.id);

        // Calculate days since last sync
        const daysSinceSync = account.last_full_sync_at
          ? Math.floor((Date.now() - new Date(account.last_full_sync_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // Determine if catch-up is needed
        const needsCatchup = !account.setup_completed || daysSinceSync > 7 || (emailCount || 0) < 10;

        return {
          ...account,
          email_count: emailCount || 0,
          days_since_sync: daysSinceSync,
          needs_catchup: needsCatchup,
          priority: needsCatchup ? (daysSinceSync > 30 ? 'high' : daysSinceSync > 7 ? 'medium' : 'low') : 'none'
        };
      })
    );

    const needsCatchup = accountsWithStatus.filter(a => a.needs_catchup);

    return NextResponse.json({
      success: true,
      accounts: accountsWithStatus,
      summary: {
        total_accounts: accounts.length,
        needs_catchup: needsCatchup.length,
        high_priority: needsCatchup.filter(a => a.priority === 'high').length,
        recommendations: needsCatchup.length > 0 
          ? [`${needsCatchup.length} account(s) need catch-up sync to improve AI features`]
          : ['All accounts are up to date!']
      }
    });

  } catch (error) {
    console.error('Error checking catch-up status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check catch-up status' },
      { status: 500 }
    );
  }
}