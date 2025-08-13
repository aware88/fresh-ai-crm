/**
 * AI Limit Enforcement Middleware
 * 
 * This middleware checks AI usage limits before processing AI requests
 * and enforces subscription-based restrictions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiUsageService } from '@/lib/services/ai-usage-service';
import { createClient } from '@/lib/supabase/server';

export interface AILimitResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  remaining?: number;
  upgradeRequired?: boolean;
  featureRestricted?: boolean;
}

/**
 * Check if AI request is allowed based on subscription limits
 */
export async function checkAILimits(
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

    // Check current usage against limits
    const limitCheck = await aiUsageService.checkLimitExceeded(organizationId);
    
    if (!limitCheck) {
      return {
        allowed: false,
        reason: 'Unable to check usage limits. Please try again.',
      };
    }

    if (limitCheck.limitExceeded) {
      return {
        allowed: false,
        reason: `AI message limit exceeded. You've used ${limitCheck.currentUsage} of ${limitCheck.limitAmount} messages this month.`,
        currentUsage: limitCheck.currentUsage,
        limit: limitCheck.limitAmount,
        remaining: limitCheck.remaining,
        upgradeRequired: true
      };
    }

    return {
      allowed: true,
      currentUsage: limitCheck.currentUsage,
      limit: limitCheck.limitAmount,
      remaining: limitCheck.remaining
    };

  } catch (error) {
    console.error('Error checking AI limits:', error);
    return {
      allowed: false,
      reason: 'Error checking usage limits. Please try again.',
    };
  }
}

/**
 * Middleware function to enforce AI limits on API routes
 */
export async function enforceAILimits(
  request: NextRequest,
  organizationId: string,
  userId: string,
  requestType: 'email_response' | 'ai_future' | 'profiling' | 'general' | 'drafting',
  requiredFeature?: string
): Promise<NextResponse | null> {
  const limitResult = await checkAILimits(organizationId, userId, requestType, requiredFeature);

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
        upgradeRequired: limitResult.upgradeRequired
      }
    }, { status: statusCode });
  }

  return null; // Allow the request to proceed
}

/**
 * Log AI usage after successful request
 */
export async function logAIUsageAfterRequest(
  organizationId: string,
  userId: string,
  messageType: 'email_response' | 'ai_future' | 'profiling' | 'general' | 'drafting',
  tokensUsed: number = 1,
  costUsd: number = 0,
  featureUsed?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await aiUsageService.logUsage({
      organizationId,
      userId,
      messageType,
      tokensUsed,
      costUsd,
      featureUsed,
      metadata
    });
  } catch (error) {
    console.error('Error logging AI usage:', error);
    // Don't throw error - logging failure shouldn't break the main request
  }
}

/**
 * Get user's organization ID from request
 */
export async function getUserOrganization(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error getting user organization:', error);
      return null;
    }

    return data.organization_id;
  } catch (error) {
    console.error('Exception getting user organization:', error);
    return null;
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
 * Complete middleware wrapper for AI endpoints
 */
export async function withAILimitCheck(
  request: NextRequest,
  userId: string,
  requestType: 'email_response' | 'ai_future' | 'profiling' | 'general' | 'drafting',
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Get user's organization
  const organizationId = await getUserOrganization(userId);
  if (!organizationId) {
    return NextResponse.json({
      error: 'Organization not found',
      code: 'NO_ORGANIZATION'
    }, { status: 400 });
  }

  // Check limits and feature access
  const requiredFeature = getRequiredFeature(requestType);
  const limitResponse = await enforceAILimits(
    request, 
    organizationId, 
    userId, 
    requestType, 
    requiredFeature
  );

  if (limitResponse) {
    return limitResponse; // Return limit exceeded response
  }

  // Execute the handler
  const response = await handler();

  // Log usage after successful request (only if response is successful)
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

    // Log the usage
    await logAIUsageAfterRequest(
      organizationId,
      userId,
      requestType,
      tokensUsed,
      costUsd,
      requiredFeature,
      {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        timestamp: new Date().toISOString()
      }
    );
  }

  return response;
}