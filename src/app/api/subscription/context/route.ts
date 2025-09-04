import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * GET /api/subscription/context
 * Returns comprehensive subscription data for the entire app context
 * This should be called once on login and cached
 * 
 * CRITICAL: This endpoint must be reliable as it's used app-wide
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🔄 /api/subscription/context - Starting request');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ /api/subscription/context - No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('👤 /api/subscription/context - User ID:', userId);

    const supabase = createServiceRoleClient();

    // Step 1: Get user's organization with fallback
    let organizationId: string | null = null;
    
    try {
      const { data: userPrefs, error: prefsError } = await supabase
        .from('user_preferences')
        .select('current_organization_id')
        .eq('user_id', userId)
        .single();

      if (!prefsError && userPrefs?.current_organization_id) {
        organizationId = userPrefs.current_organization_id;
        console.log('🏢 /api/subscription/context - Found organization:', organizationId);
      } else {
        console.warn('⚠️ /api/subscription/context - No organization in user_preferences:', prefsError?.message);
      }
    } catch (prefError) {
      console.warn('⚠️ /api/subscription/context - Error getting user preferences:', prefError);
    }

    // Fallback: Individual user subscription (for users without organizations)
    if (!organizationId) {
      console.log('🔄 /api/subscription/context - No organization, using individual subscription');
      
      const fallbackData = {
        tier: 'starter',
        limits: {
          emailAccounts: 1,
          aiTokens: 300,
          aiTokensUsed: 0,
          teamMembers: 1
        },
        features: ['basic_ai'],
        isUnlimited: false,
        canChangePlans: true,
        metadata: null,
        isBetaUser: false,
        isIndividualUser: true
      };
      
      console.log('✅ /api/subscription/context - Returning fallback data');
      return NextResponse.json(fallbackData);
    }

    // Step 2: Get organization subscription details
    let org: any = null;
    
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('subscription_tier, subscription_metadata, beta_early_adopter')
        .eq('id', organizationId)
        .single();

      if (!orgError && orgData) {
        org = orgData;
        console.log('🏢 /api/subscription/context - Found organization data:', {
          tier: org.subscription_tier,
          beta: org.beta_early_adopter
        });
      } else {
        console.warn('⚠️ /api/subscription/context - Error fetching organization:', orgError?.message);
      }
    } catch (orgFetchError) {
      console.warn('⚠️ /api/subscription/context - Exception fetching organization:', orgFetchError);
    }

    // Step 3: Determine subscription tier with robust fallback
    const tier = (org?.subscription_tier?.toLowerCase() || 'starter').trim();
    console.log('📊 /api/subscription/context - Processing tier:', tier);
    
    let limits = {
      emailAccounts: 1,
      aiTokens: 300,
      aiTokensUsed: 0,
      teamMembers: 1
    };
    
    let features: string[] = ['basic_ai'];
    let canChangePlans = true;

    // Step 4: Get current usage data
    let currentUsage = { aiTokensUsed: 0 };
    try {
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_ai_token_usage', { 
          organization_uuid: organizationId,
          days_back: 30 
        });
      
      if (!usageError && usageData?.[0]) {
        currentUsage.aiTokensUsed = usageData[0].total_tokens_used || 0;
        console.log('📊 /api/subscription/context - Usage data:', currentUsage);
      } else {
        console.log('⚠️ /api/subscription/context - No usage data found, using defaults');
      }
    } catch (usageErr) {
      console.warn('⚠️ /api/subscription/context - Error fetching usage:', usageErr);
    }

    // Set limits based on subscription tier
    if (tier.includes('premium-enterprise') || tier.includes('premium_enterprise')) {
      limits = {
        emailAccounts: 3,
        aiTokens: -1, // Unlimited
        aiTokensUsed: currentUsage.aiTokensUsed,
        teamMembers: -1 // Unlimited
      };
      features = ['unlimited_ai', 'priority_support', 'custom_integrations', 'advanced_analytics'];
      canChangePlans = false; // Premium plans managed by admin
      console.log('💎 /api/subscription/context - Premium Enterprise tier detected');
    } else if (tier.includes('premium')) {
      limits = {
        emailAccounts: 3,
        aiTokens: 10000,
        aiTokensUsed: currentUsage.aiTokensUsed,
        teamMembers: 20
      };
      features = ['advanced_ai', 'priority_support', 'custom_integrations'];
      canChangePlans = false;
      console.log('💎 /api/subscription/context - Premium tier detected');
    } else if (tier.includes('pro')) {
      limits = {
        emailAccounts: 2,
        aiTokens: 1000,
        aiTokensUsed: currentUsage.aiTokensUsed,
        teamMembers: 5
      };
      features = ['advanced_ai', 'team_collaboration'];
      console.log('⚡ /api/subscription/context - Pro tier detected');
    } else {
      limits.aiTokensUsed = currentUsage.aiTokensUsed;
      console.log('🆓 /api/subscription/context - Starter tier (default)');
    }

    const subscriptionData = {
      tier: org?.subscription_tier || 'starter',
      limits,
      features,
      isUnlimited: limits.aiTokens === -1,
      canChangePlans,
      metadata: org?.subscription_metadata || null,
      isBetaUser: org?.beta_early_adopter || false,
      organizationId,
      isIndividualUser: false
    };

    const duration = Date.now() - startTime;
    console.log(`✅ /api/subscription/context - Success in ${duration}ms:`, {
      tier: subscriptionData.tier,
      limits: subscriptionData.limits,
      features: subscriptionData.features.length,
      canChangePlans: subscriptionData.canChangePlans
    });

    return NextResponse.json(subscriptionData);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ /api/subscription/context - Fatal error after ${duration}ms:`, error);
    
    // Return safe fallback to prevent app breaking
    const emergencyFallback = {
      tier: 'starter',
      limits: {
        emailAccounts: 1,
        aiTokens: 300,
        aiTokensUsed: 0,
        teamMembers: 1
      },
      features: ['basic_ai'],
      isUnlimited: false,
      canChangePlans: true,
      metadata: null,
      isBetaUser: false,
      error: 'Fallback mode - please refresh',
      isEmergencyFallback: true
    };
    
    console.log('🚨 /api/subscription/context - Returning emergency fallback');
    return NextResponse.json(emergencyFallback, { status: 200 }); // Don't return error status
  }
}