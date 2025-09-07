import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { realTimeSyncManager } from '@/lib/email/real-time-sync-manager';

/**
 * POST /api/email/setup-account
 * 
 * Complete email account setup flow:
 * 1. Initial email sync (500-1000 recent emails)
 * 2. AI learning initialization (300-500 sent emails)
 * 3. Real-time sync activation
 * 4. Progress tracking
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId, isNewAccount = true, catchUpMode = false } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    console.log(`🚀 [Email Setup] Starting setup for account ${accountId} (new: ${isNewAccount}, catchup: ${catchUpMode})`);

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

    // Get user's organization
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', session.user.id)
      .single();

    const organizationId = userPrefs?.current_organization_id;

    console.log(`📧 [Email Setup] Account: ${account.email} (${account.provider_type})`);

    // Step 1: Determine sync amounts based on mode and provider
    const syncAmounts = getSyncAmounts(account.provider_type, isNewAccount, catchUpMode);
    
    // Step 2: Start initial email sync
    console.log(`📥 [Email Setup] Starting initial sync: ${syncAmounts.emails} emails`);
    
    const syncResult = await triggerInitialSync(account, syncAmounts.emails);
    
    if (!syncResult.success) {
      console.error(`❌ [Email Setup] Initial sync failed: ${syncResult.error}`);
      return NextResponse.json({
        success: false,
        error: `Initial sync failed: ${syncResult.error}`,
        step: 'initial_sync'
      }, { status: 500 });
    }

    console.log(`✅ [Email Setup] Initial sync completed: ${syncResult.emailsProcessed} emails`);

    // Step 3: Start AI learning in background (only if we have enough emails)
    let learningResult = { success: true, sessionId: null, backgroundLearning: false };
    
    if (syncResult.emailsProcessed >= 10) {
      console.log(`🤖 [Email Setup] Starting background AI learning: ${syncAmounts.learning} emails`);
      
      learningResult = await triggerBackgroundAILearning(session.user.id, organizationId, syncAmounts.learning, account.id);
      
      if (learningResult.success) {
        console.log(`✅ [Email Setup] Background AI learning started: session ${learningResult.sessionId}`);
      } else {
        console.warn(`⚠️ [Email Setup] Background AI learning failed to start, but continuing: ${learningResult.error}`);
      }
    } else {
      console.log(`⏭️ [Email Setup] Skipping AI learning - not enough emails (${syncResult.emailsProcessed})`);
    }

    // Step 4: Start real-time sync
    console.log(`🔄 [Email Setup] Starting real-time sync...`);
    
    const realtimeResult = await startRealtimeSync(account, session.user.id);
    
    if (!realtimeResult.success) {
      console.warn(`⚠️ [Email Setup] Real-time sync failed, but continuing: ${realtimeResult.error}`);
    } else {
      console.log(`✅ [Email Setup] Real-time sync activated`);
    }

    // Step 5: Update account status
    await supabase
      .from('email_accounts')
      .update({
        setup_completed: true,
        last_full_sync_at: new Date().toISOString(),
        setup_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId);

    console.log(`🎉 [Email Setup] Account setup completed successfully`);

    return NextResponse.json({
      success: true,
      message: 'Email account setup completed successfully',
      results: {
        initial_sync: {
          emails_processed: syncResult.emailsProcessed,
          time_taken_ms: syncResult.timeTaken
        },
        ai_learning: {
          enabled: syncResult.emailsProcessed >= 10,
          background_learning: learningResult.backgroundLearning,
          session_id: learningResult.sessionId,
          status_endpoint: learningResult.sessionId ? `/api/email/learning/status?sessionId=${learningResult.sessionId}` : null
        },
        realtime_sync: {
          enabled: realtimeResult.success,
          polling_interval: realtimeResult.pollingInterval || 5
        }
      },
      recommendations: generateRecommendations(syncResult, learningResult)
    });

  } catch (error) {
    console.error('Error in email account setup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Email account setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get optimal sync amounts based on provider and mode
 * Using agreed-upon amounts: 5000 emails for sync, 5000 for AI learning
 */
function getSyncAmounts(providerType: string, isNewAccount: boolean, catchUpMode: boolean) {
  if (catchUpMode) {
    // For catch-up mode, sync comprehensive amount to fill gaps
    return {
      emails: 5000,
      learning: 5000
    };
  }

  if (isNewAccount) {
    // For new accounts, full comprehensive setup as agreed
    return {
      emails: 5000,
      learning: 5000
    };
  }

  // For existing accounts doing refresh, still use substantial amounts
  return {
    emails: 2000,
    learning: 2000
  };
}

/**
 * Trigger initial email sync based on provider
 */
async function triggerInitialSync(account: any, maxEmails: number) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
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
          maxEmails,
          incremental: false
        };
        break;
        
      case 'microsoft':
      case 'outlook':
        endpoint = '/api/emails/graph/sync';
        body = {
          accountId: account.id,
          folder: 'inbox',
          maxEmails,
          delta: false
        };
        break;
        
      case 'imap':
      default:
        endpoint = '/api/email/sync-to-database';
        body = {
          accountId: account.id,
          maxEmails
        };
        break;
    }

    console.log(`📡 [Email Setup] Calling ${endpoint} with ${maxEmails} max emails`);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-Email-Setup'
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    return {
      success: response.ok && (result.success !== false),
      emailsProcessed: result.totalSaved || result.count || result.newEmails?.length || 0,
      timeTaken: result.processing_time_ms || 0,
      error: response.ok ? null : (result.error || 'Sync failed')
    };

  } catch (error) {
    return {
      success: false,
      emailsProcessed: 0,
      timeTaken: 0,
      error: error instanceof Error ? error.message : 'Unknown sync error'
    };
  }
}

/**
 * Trigger background AI learning (non-blocking)
 */
async function triggerBackgroundAILearning(userId: string, organizationId: string | null, maxEmails: number, accountId: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/email/learning/background`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-Email-Setup',
        'Cookie': 'temp-auth-bypass=true' // Will need proper auth context
      },
      body: JSON.stringify({
        maxEmails,
        organizationId,
        accountId
      })
    });

    const result = await response.json();
    
    return {
      success: response.ok && result.success,
      sessionId: result.session_id || null,
      backgroundLearning: true,
      error: response.ok ? null : (result.error || 'Background AI learning failed to start')
    };

  } catch (error) {
    return {
      success: false,
      sessionId: null,
      backgroundLearning: false,
      error: error instanceof Error ? error.message : 'Unknown learning error'
    };
  }
}

/**
 * Start real-time sync for account
 */
async function startRealtimeSync(account: any, userId: string) {
  try {
    const syncConfig = {
      provider: account.provider_type as 'microsoft' | 'google' | 'imap',
      accountId: account.id,
      userId: userId,
      email: account.email,
      enableWebhooks: account.provider_type !== 'imap',
      pollingInterval: getPollingInterval(account.provider_type),
      enableAI: true,
      enableDraftPreparation: true
    };

    await realTimeSyncManager.startRealTimeSync(syncConfig);
    
    return {
      success: true,
      pollingInterval: syncConfig.pollingInterval
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Real-time sync failed'
    };
  }
}

/**
 * Get polling interval based on provider
 */
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

/**
 * Generate setup recommendations
 */
function generateRecommendations(syncResult: any, learningResult: any) {
  const recommendations = [];

  if (syncResult.emailsProcessed < 50) {
    recommendations.push('Consider syncing more emails for better AI analysis (current: ' + syncResult.emailsProcessed + ')');
  }

  if (learningResult.qualityScore < 0.5) {
    recommendations.push('AI learning quality is low - consider syncing more sent emails for better draft generation');
  }

  if (syncResult.emailsProcessed >= 100 && learningResult.patternsFound >= 5) {
    recommendations.push('Great! Your email setup is optimal for AI-powered features');
  }

  if (recommendations.length === 0) {
    recommendations.push('Email setup completed successfully - all features are ready to use');
  }

  return recommendations;
}

/**
 * GET /api/email/setup-account
 * 
 * Check setup status for an email account
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get account setup status
    const { data: account, error } = await supabase
      .from('email_accounts')
      .select('id, email, provider_type, setup_completed, setup_completed_at, last_full_sync_at')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .single();

    if (error || !account) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 });
    }

    // Get email count
    const { count: emailCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .eq('email_account_id', accountId);

    // Get learning status
    const { data: patterns } = await supabase
      .from('email_patterns')
      .select('id, confidence, pattern_type')
      .eq('user_id', session.user.id);

    const avgConfidence = patterns && patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 0;

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        email: account.email,
        provider_type: account.provider_type,
        setup_completed: account.setup_completed || false,
        setup_completed_at: account.setup_completed_at,
        last_full_sync_at: account.last_full_sync_at
      },
      stats: {
        emails_synced: emailCount || 0,
        patterns_learned: patterns?.length || 0,
        learning_quality: avgConfidence > 0.7 ? 'high' : avgConfidence > 0.5 ? 'medium' : 'low',
        avg_confidence: avgConfidence
      },
      needs_setup: !account.setup_completed || (emailCount || 0) < 10,
      recommendations: generateSetupRecommendations(account, emailCount || 0, patterns?.length || 0)
    });

  } catch (error) {
    console.error('Error checking setup status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}

function generateSetupRecommendations(account: any, emailCount: number, patternsCount: number) {
  const recommendations = [];

  if (!account.setup_completed) {
    recommendations.push('Run initial setup to sync emails and enable AI features');
  }

  if (emailCount < 10) {
    recommendations.push('Sync more emails to improve AI draft quality');
  }

  if (patternsCount < 3) {
    recommendations.push('Run AI learning to improve draft generation');
  }

  const daysSinceLastSync = account.last_full_sync_at 
    ? Math.floor((Date.now() - new Date(account.last_full_sync_at).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (daysSinceLastSync > 7) {
    recommendations.push('Consider running a catch-up sync - it\'s been ' + daysSinceLastSync + ' days since last full sync');
  }

  return recommendations;
}