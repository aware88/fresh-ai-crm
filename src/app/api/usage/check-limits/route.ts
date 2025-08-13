/**
 * Check Usage Limits API
 * 
 * Quick endpoint to check if user can make AI requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUID } from '@/lib/auth/utils';
import { aiUsageService } from '@/lib/services/ai-usage-service';
import { featureFlagService } from '@/lib/services/feature-flag-service';
import { checkAILimits } from '@/lib/middleware/ai-limit-middleware';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const organizationId = await featureFlagService.getUserOrganization(uid);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const requestType = searchParams.get('type') as 'email_response' | 'ai_future' | 'profiling' | 'general' | 'drafting' || 'general';
    const feature = searchParams.get('feature');

    // Check limits
    const limitResult = await checkAILimits(organizationId, uid, requestType, feature || undefined);

    return NextResponse.json({
      allowed: limitResult.allowed,
      reason: limitResult.reason,
      usage: {
        current: limitResult.currentUsage,
        limit: limitResult.limit,
        remaining: limitResult.remaining
      },
      restrictions: {
        featureRestricted: limitResult.featureRestricted,
        upgradeRequired: limitResult.upgradeRequired
      }
    });

  } catch (error) {
    console.error('Error checking usage limits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const organizationId = await featureFlagService.getUserOrganization(uid);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      requestType = 'general',
      feature,
      tokensUsed = 1,
      costUsd = 0,
      featureUsed,
      metadata = {}
    } = body;

    // Check if request is allowed
    const limitResult = await checkAILimits(organizationId, uid, requestType, feature);
    
    if (!limitResult.allowed) {
      return NextResponse.json({
        success: false,
        allowed: false,
        reason: limitResult.reason,
        usage: {
          current: limitResult.currentUsage,
          limit: limitResult.limit,
          remaining: limitResult.remaining
        },
        restrictions: {
          featureRestricted: limitResult.featureRestricted,
          upgradeRequired: limitResult.upgradeRequired
        }
      }, { status: limitResult.upgradeRequired ? 402 : 429 });
    }

    // Log the usage
    const usageId = await aiUsageService.logUsage({
      organizationId,
      userId: uid,
      messageType: requestType,
      tokensUsed,
      costUsd,
      featureUsed,
      metadata
    });

    // Get updated usage stats
    const updatedUsage = await aiUsageService.getCurrentUsage(organizationId);
    const updatedLimitCheck = await aiUsageService.checkLimitExceeded(organizationId);

    return NextResponse.json({
      success: true,
      allowed: true,
      usageId,
      usage: {
        current: updatedUsage?.currentMessages || 0,
        limit: updatedLimitCheck?.limitAmount || 50,
        remaining: updatedLimitCheck?.remaining || 0
      }
    });

  } catch (error) {
    console.error('Error processing usage check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}