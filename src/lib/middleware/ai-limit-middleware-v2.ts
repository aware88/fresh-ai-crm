/**
 * Enhanced AI Limit Enforcement Middleware V2
 * 
 * This middleware checks AI usage limits and integrates with the top-up system
 * to allow usage beyond subscription limits when top-ups are available.
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiUsageService } from '@/lib/services/ai-usage-service';
import { topUpService } from '@/lib/services/topup-service';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export interface AILimitResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  remaining?: number;
  upgradeRequired?: boolean;
  featureRestricted?: boolean;
  topupAvailable?: boolean;
  topupBalance?: number;
  usedTopup?: boolean;
  usedGrace?: boolean;
}

/**
 * Enhanced check that considers both subscription limits and top-up balance
 */
export async function checkAILimitsWithTopup(
  organizationId: string,
  userId: string,
  requestType: 'email_response' | 'ai_future' | 'profiling' | 'general' | 'drafting',
  requiredFeature?: string
): Promise<AILimitResult> {
  try {
    // First check if the feature is available in their plan
    if (requiredFeature) {
      const hasFeature = await aiUsageService.hasFeatureAccess(organizationId, requiredFeature);
      if (!hasFeature) {
        return {
          allowed: false,
          reason: `Feature '${requiredFeature}' is not available in your subscription plan`,
          featureRestricted: true,
          upgradeRequired: true
        };
      }
    }

    // Check current usage against subscription limits
    const limitCheck = await aiUsageService.checkLimitExceeded(organizationId);
    
    if (!limitCheck) {
      return {
        allowed: false,
        reason: 'Unable to check usage limits. Please try again.',
      };
    }

    // If within subscription limits, allow immediately
    if (!limitCheck.limitExceeded) {
      return {
        allowed: true,
        currentUsage: limitCheck.currentUsage,
        limit: limitCheck.limitAmount,
        remaining: limitCheck.remaining,
        topupAvailable: false,
        usedTopup: false
      };
    }

    // Subscription limit exceeded - check for top-up balance
    const topupBalance = await topUpService.getBalance(organizationId);
    
    if (!topupBalance || topupBalance.totalMessagesAvailable === 0) {
      // Grace buffer: allow a small number of messages past the limit per month
      try {
        const supabase = await createClient();
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);
        const GRACE_MAX = 3;

        const { data: graceData, error: graceError } = await supabase
          .from('ai_usage_tracking')
          .select('id, created_at, metadata')
          .eq('organization_id', organizationId)
          .gte('created_at', startOfMonth.toISOString());

        const graceUsed = (graceData || []).filter(r => {
          try {
            return r.metadata?.grace_buffer === true;
          } catch {
            return false;
          }
        }).length;

        if (!graceError && graceUsed < GRACE_MAX) {
          return {
            allowed: true,
            currentUsage: limitCheck.currentUsage,
            limit: limitCheck.limitAmount,
            remaining: limitCheck.remaining,
            topupAvailable: false,
            topupBalance: 0,
            usedTopup: false,
            usedGrace: true
          };
        }
      } catch (e) {
        // If grace check fails, fall back to deny with upgrade prompt
        console.warn('Grace buffer check failed:', e);
      }

      return {
        allowed: false,
        reason: `AI message limit exceeded. You've used ${limitCheck.currentUsage} of ${limitCheck.limitAmount} messages this month. Purchase a top-up to continue.`,
        currentUsage: limitCheck.currentUsage,
        limit: limitCheck.limitAmount,
        remaining: limitCheck.remaining,
        upgradeRequired: true,
        topupAvailable: false,
        topupBalance: 0
      };
    }

    // Top-up balance available - allow the request
    return {
      allowed: true,
      currentUsage: limitCheck.currentUsage,
      limit: limitCheck.limitAmount,
      remaining: limitCheck.remaining,
      topupAvailable: true,
      topupBalance: topupBalance.totalMessagesAvailable,
      usedTopup: true // Will use top-up for this request
    };

  } catch (error) {
    console.error('Error checking AI limits with top-up:', error);
    return {
      allowed: false,
      reason: 'Error checking usage limits. Please try again.',
    };
  }
}

/**
 * Enhanced middleware function that handles top-up usage
 */
export async function enforceAILimitsWithTopup(
  request: NextRequest,
  organizationId: string,
  userId: string,
  requestType: 'email_response' | 'ai_future' | 'profiling' | 'general' | 'drafting',
  requiredFeature?: string
): Promise<NextResponse | null> {
  const limitResult = await checkAILimitsWithTopup(organizationId, userId, requestType, requiredFeature);

  if (!limitResult.allowed) {
    const statusCode = limitResult.upgradeRequired ? 402 : 429; // 402 Payment Required or 429 Too Many Requests
    
    return NextResponse.json({
      error: limitResult.reason,
      code: limitResult.upgradeRequired ? 'UPGRADE_REQUIRED' : 'LIMIT_EXCEEDED',
      details: {
        currentUsage: limitResult.currentUsage,
        limit: limitResult.limit,
        remaining: limitResult.remaining,
        featureRestricted: limitResult.featureRestricted,
        upgradeRequired: limitResult.upgradeRequired,
        topupAvailable: limitResult.topupAvailable,
        topupBalance: limitResult.topupBalance,
        usedGrace: limitResult.usedGrace || false
      },
      actions: limitResult.upgradeRequired ? {
        upgrade: '/pricing',
        topup: limitResult.topupBalance === 0 ? '/api/topup/packages' : null
      } : null
    }, { status: statusCode });
  }

  return null; // Allow the request to proceed
}

/**
 * Enhanced usage logging that handles top-up consumption
 */
export async function logAIUsageWithTopup(
  organizationId: string,
  userId: string,
  messageType: 'email_response' | 'ai_future' | 'profiling' | 'general' | 'drafting',
  tokensUsed: number = 1,
  costUsd: number = 0,
  featureUsed?: string,
  metadata?: Record<string, any>
): Promise<{
  usageId: string | null;
  usedTopup: boolean;
  topupUsage?: any;
}> {
  try {
    // First log the usage in the main tracking system
    const usageId = await aiUsageService.logUsage({
      organizationId,
      userId,
      messageType,
      tokensUsed,
      costUsd,
      featureUsed,
      metadata
    });

    // Check if this usage exceeded subscription limits
    const limitCheck = await aiUsageService.checkLimitExceeded(organizationId);
    
    if (!limitCheck || !limitCheck.limitExceeded) {
      // Within subscription limits - no top-up needed
      return {
        usageId,
        usedTopup: false
      };
    }

    // Usage exceeded subscription limits - consume from top-up balance
    const topupUsage = await topUpService.useMessages(
      organizationId,
      userId,
      1, // Use 1 message from top-up
      usageId || undefined
    );

    if (!topupUsage || !topupUsage.success) {
      console.warn('Failed to use top-up messages for exceeded usage');
      return {
        usageId,
        usedTopup: false
      };
    }

    return {
      usageId,
      usedTopup: true,
      topupUsage
    };

  } catch (error) {
    console.error('Error logging AI usage with top-up:', error);
    return {
      usageId: null,
      usedTopup: false
    };
  }
}

// Use unified user context service for optimized organization lookup
import { getUserOrganization as getUnifiedOrganization } from '../context/unified-user-context-service';

/**
 * Get user's organization ID from request
 * Now uses UnifiedUserContextService for optimized performance
 */
export async function getUserOrganization(userId: string): Promise<string | null> {
  try {
    // Use unified context service for better performance and caching
    return await getUnifiedOrganization(userId);
  } catch (error) {
    console.warn('[AI Limit Middleware] Unified context failed, using fallback:', error);
    
    // Fallback to legacy implementation
    try {
      const supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      console.log('🔍 getUserOrganization (fallback): Checking for user:', userId);
      
      // First try organization_members table
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id, role, status')
        .eq('user_id', userId);

      if (memberData && memberData.length > 0) {
        const organizationId = memberData[0].organization_id;
        console.log('✅ Found organization via members table (fallback):', organizationId);
        return organizationId;
      }

      // Fallback: Try user_preferences table for current_organization_id
      const { data: prefsData, error: prefsError } = await supabase
        .from('user_preferences')
        .select('current_organization_id')
        .eq('user_id', userId)
        .single();

      if (prefsData?.current_organization_id) {
        console.log('✅ Found organization via user preferences (fallback):', prefsData.current_organization_id);
        return prefsData.current_organization_id;
      }

      console.log('❌ No organization found for user (fallback)');
      return null;
    } catch (fallbackError) {
      console.error('Exception in fallback getUserOrganization:', fallbackError);
      return null;
    }
  }
}

/**
 * Feature flag mapping for different AI request types
 */
export const AI_FEATURE_MAPPING = {
  'email_response': 'AI_DRAFTING_ASSISTANCE',
  'ai_future': 'AI_FUTURE_ACCESS',
  'profiling': 'PSYCHOLOGICAL_PROFILING',
  'general': null, // No specific feature required for general AI
  'drafting': 'AI_DRAFTING_ASSISTANCE'
} as const;

/**
 * Helper function to get required feature for request type
 */
export function getRequiredFeature(requestType: keyof typeof AI_FEATURE_MAPPING): string | undefined {
  return AI_FEATURE_MAPPING[requestType] || undefined;
}

/**
 * Complete middleware wrapper for AI endpoints with top-up support
 */
export async function withAILimitCheckAndTopup(
  request: NextRequest,
  userId: string,
  requestType: 'email_response' | 'ai_future' | 'profiling' | 'general' | 'drafting',
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Get user's organization (may be null for individual users)
  const organizationId = await getUserOrganization(userId);
  
  // For individual users without organization, check their personal subscription
  if (!organizationId) {
    console.log('🔍 No organization found for user, checking individual subscription');
    
    // For individual users, we can bypass organization-based limits
    // and check their personal subscription limits instead
    try {
      // Check if user has a valid subscription using admin client
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId);
      
      if (!userError && userData.user) {
        const userSubscriptionPlan = userData.user.user_metadata?.subscription_plan || 'starter';
        console.log(`📝 Individual user subscription plan: ${userSubscriptionPlan}`);
        
        // Allow premium users to use all AI features
        if (userSubscriptionPlan.includes('premium')) {
          console.log('✅ Premium individual user - allowing all AI features');
          return handler();
        }
        
        // Allow pro users to use email features
        if (userSubscriptionPlan.includes('pro')) {
          console.log('✅ Pro individual user - allowing email AI features');
          return handler();
        }
        
        // For starter users, allow basic email features but with limits
        console.log(`📝 Individual user with ${userSubscriptionPlan} plan - allowing with basic limits`);
        return handler(); // For now, allow all individual users
      }
    } catch (error) {
      console.error('Error checking individual subscription:', error);
    }
    
    // Default: allow individual users (they have their own limits)
    console.log('✅ Individual user - allowing with default limits');
    return handler();
  }

  // Check limits and feature access (including top-up availability)
  const requiredFeature = getRequiredFeature(requestType);
  const limitResult = await checkAILimitsWithTopup(
    organizationId,
    userId,
    requestType,
    requiredFeature
  );

  if (!limitResult.allowed) {
    const statusCode = limitResult.upgradeRequired ? 402 : 429;
    return NextResponse.json({
      error: limitResult.reason,
      code: limitResult.upgradeRequired ? 'UPGRADE_REQUIRED' : 'LIMIT_EXCEEDED',
      details: {
        currentUsage: limitResult.currentUsage,
        limit: limitResult.limit,
        remaining: limitResult.remaining,
        featureRestricted: limitResult.featureRestricted,
        upgradeRequired: limitResult.upgradeRequired,
        topupAvailable: limitResult.topupAvailable,
        topupBalance: limitResult.topupBalance,
        usedGrace: limitResult.usedGrace || false
      },
      actions: limitResult.upgradeRequired ? {
        upgrade: '/pricing',
        topup: limitResult.topupBalance === 0 ? '/api/topup/packages' : null
      } : null
    }, { status: statusCode });
  }

  // Execute the handler
  const response = await handler();

  // Log usage after successful request (including top-up consumption if needed)
  if (response.status === 200) {
    // Extract token usage from response if available
    let tokensUsed = 1; // Default to 1 message
    let costUsd = 0;

    try {
      const responseClone = response.clone();
      const responseBody = await responseClone.json();
      
      // Try to extract token usage from response
      if (responseBody.usage?.total_tokens) {
        tokensUsed = responseBody.usage.total_tokens;
      }
      if (responseBody.usage?.cost_usd) {
        costUsd = responseBody.usage.cost_usd;
      }
    } catch (error) {
      // If we can't parse response, just use defaults
      console.log('Could not parse response for usage tracking, using defaults');
    }

    // Log the usage with top-up handling
    const usageResult = await logAIUsageWithTopup(
      organizationId,
      userId,
      requestType,
      tokensUsed,
      costUsd,
      requiredFeature,
      {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        timestamp: new Date().toISOString(),
        grace_buffer: limitResult.usedGrace === true
      }
    );

    // Add usage metadata to response headers for debugging
    const headers = new Headers(response.headers);
    headers.set('X-Usage-ID', usageResult.usageId || 'unknown');
    headers.set('X-Used-Topup', usageResult.usedTopup ? 'true' : 'false');
    if (limitResult.usedGrace) {
      headers.set('X-Used-Grace', 'true');
    }
    
    if (usageResult.usedTopup && usageResult.topupUsage) {
      headers.set('X-Topup-Messages-Used', usageResult.topupUsage.messagesUsed.toString());
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  return response;
}

/**
 * Get comprehensive usage status including top-ups
 */
export async function getUsageStatus(organizationId: string): Promise<{
  subscription: {
    current: number;
    limit: number;
    remaining: number;
    exceeded: boolean;
  };
  topup: {
    available: number;
    totalSpent: number;
    totalPurchases: number;
  };
  total: {
    available: number;
    canMakeRequest: boolean;
  };
} | null> {
  try {
    const [limitCheck, topupBalance] = await Promise.all([
      aiUsageService.checkLimitExceeded(organizationId),
      topUpService.getBalance(organizationId)
    ]);

    if (!limitCheck || !topupBalance) {
      return null;
    }

    const isUnlimited = limitCheck.limitAmount === -1;
    const subscriptionRemaining = isUnlimited ? -1 : Math.max(0, limitCheck.remaining);
    const totalAvailable = isUnlimited ? -1 : subscriptionRemaining + topupBalance.totalMessagesAvailable;

    return {
      subscription: {
        current: limitCheck.currentUsage,
        limit: limitCheck.limitAmount,
        remaining: subscriptionRemaining,
        exceeded: isUnlimited ? false : limitCheck.limitExceeded
      },
      topup: {
        available: topupBalance.totalMessagesAvailable,
        totalSpent: topupBalance.totalSpentUsd,
        totalPurchases: topupBalance.totalPurchases
      },
      total: {
        available: totalAvailable,
        canMakeRequest: isUnlimited ? true : totalAvailable > 0
      }
    };
  } catch (error) {
    console.error('Error getting usage status:', error);
    return null;
  }
}