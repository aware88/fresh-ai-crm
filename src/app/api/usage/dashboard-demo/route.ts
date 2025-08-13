import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    console.log('Usage dashboard demo: Getting real AI usage data');
    
    const supabase = await createServerClient();
    
    // Use Withcar organization ID directly
    const organizationId = '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
    
    // Get real usage data from database
    const { data: usageData, error: usageError } = await supabase
      .from('ai_usage_tracking')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('created_at', { ascending: false });
    
    if (usageError) {
      console.error('Error fetching usage data:', usageError);
    }
    
    // Calculate metrics from real data
    const usage = usageData || [];
    const totalRequests = usage.length;
    const totalTokensUsed = usage.reduce((sum, record) => sum + (record.tokens_used || 0), 0);
    const totalCostUsd = usage.reduce((sum, record) => sum + (record.cost_usd || 0), 0);
    
    // Calculate time savings (estimate 5 minutes saved per AI request)
    const totalMinutesSaved = totalRequests * 5;
    const totalHoursSaved = totalMinutesSaved / 60;
    const totalWorkDaysSaved = totalHoursSaved / 8;
    
    // Calculate cost savings (assume $50/hour rate)
    const hourlyRateUsd = 50;
    const costSavedUsd = totalHoursSaved * hourlyRateUsd;
    
    // Group usage by type
    const usageByType = usage.reduce((acc, record) => {
      const type = record.agent_type || 'general';
      acc[type] = (acc[type] || 0) + (record.tokens_used || 0);
      return acc;
    }, {} as Record<string, number>);
    
    const response = {
      organization: {
        id: organizationId,
        name: 'Withcar',
        subscription_tier: 'premium',
        subscription_status: 'active'
      },
      usage: {
        current: {
          requests: totalRequests,
          tokens: totalTokensUsed,
          costUsd: totalCostUsd
        },
        limits: {
          requests: 10000,
          tokens: 1000000,
          costUsd: 500
        },
        percentage: {
          requests: Math.min((totalRequests / 10000) * 100, 100),
          tokens: Math.min((totalTokensUsed / 1000000) * 100, 100),
          costUsd: Math.min((totalCostUsd / 500) * 100, 100)
        }
      },
      savings: {
        time: {
          minutes: Math.round(totalMinutesSaved),
          hours: Math.round(totalHoursSaved * 10) / 10,
          workDays: Math.round(totalWorkDaysSaved * 10) / 10
        },
        cost: {
          hourlyRateUsd,
          savedUsd: Math.round(costSavedUsd * 100) / 100
        },
        breakdown: {
          minutesByType: Object.keys(usageByType).reduce((acc, type) => {
            acc[type] = Math.round((usageByType[type] / totalTokensUsed || 0) * totalMinutesSaved);
            return acc;
          }, {} as Record<string, number>)
        },
        topContributor: Object.keys(usageByType).length > 0 ? 
          Object.keys(usageByType).reduce((a, b) => usageByType[a] > usageByType[b] ? a : b) : null
      },
      quality: {
        acceptanceRate: totalRequests > 0 ? 85 : 0, // Mock quality metrics
        sampleSize: totalRequests,
        avgChanges: 2.3,
        avgLengthChangePct: 15,
        autoVsSemi: {
          autoApproved: Math.floor(totalRequests * 0.6),
          requiresReview: Math.floor(totalRequests * 0.3),
          completed: Math.floor(totalRequests * 0.1)
        }
      },
      history: usage.slice(0, 10).map(record => ({
        timestamp: record.created_at,
        type: record.agent_type || 'general',
        tokens: record.tokens_used || 0,
        cost: record.cost_usd || 0
      })),
      features: {
        aiAssistant: true,
        emailGeneration: true,
        memorySystem: true,
        advancedAnalytics: true
      }
    };
    
    console.log('Usage dashboard demo: Returning data with', totalRequests, 'usage records');
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Usage dashboard demo error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch usage data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
