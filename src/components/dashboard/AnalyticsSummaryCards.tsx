'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  DollarSign,
  Zap,
  Target,
  Activity
} from 'lucide-react';

interface AnalyticsSummary {
  aiPerformance: {
    timeSaved: string;
    costSaved: string;
    topFeature: string;
  };
  followUp: {
    totalFollowUps: number;
    conversionRate: string;
    avgResponseTime: string;
  };
  revenue: {
    upsellOpportunities: number;
    potentialRevenue: string;
    conversionRate: string;
  };
}

export default function AnalyticsSummaryCards() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // Fetch AI metrics
        const aiResponse = await fetch('/api/usage/dashboard-v2');
        let aiData = null;
        if (aiResponse.ok) {
          aiData = await aiResponse.json();
        }

        // Fetch follow-up analytics summary
        const followUpResponse = await fetch('/api/email/followups/analytics?summary=true');
        let followUpData = null;
        if (followUpResponse.ok) {
          const result = await followUpResponse.json();
          followUpData = result.analytics;
        }

        // Create summary object
        const summaryData: AnalyticsSummary = {
          aiPerformance: {
            timeSaved: aiData?.savings?.time?.hours 
              ? `${Math.round(aiData.savings.time.hours)}h` 
              : '0h',
            costSaved: aiData?.savings?.cost?.savedUsd 
              ? `$${Math.round(aiData.savings.cost.savedUsd)}` 
              : '$0',
            topFeature: aiData?.insights?.savings?.topContributor || 'Email Response'
          },
          followUp: {
            totalFollowUps: followUpData?.overview?.total_followups || 0,
            conversionRate: followUpData?.overview?.response_rate 
              ? `${Math.round(followUpData.overview.response_rate)}%` 
              : '0%',
            avgResponseTime: followUpData?.overview?.avg_response_time 
              ? `${Math.round(followUpData.overview.avg_response_time)}h`
              : 'N/A'
          },
          revenue: {
            upsellOpportunities: followUpData?.ml_insights?.optimization_suggestions?.length || 0,
            potentialRevenue: followUpData?.overview?.cost_savings 
              ? `$${Math.round(followUpData.overview.cost_savings)}` 
              : '$0',
            conversionRate: followUpData?.overview?.success_rate 
              ? `${Math.round(followUpData.overview.success_rate)}%`
              : '0%'
          }
        };

        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching analytics summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* AI Performance Summary */}
      <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-4 translate-x-4"></div>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
            <Sparkles className="mr-2 h-4 w-4 text-blue-600" />
            AI Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-blue-600">
                {summary?.aiPerformance.timeSaved}
              </span>
              <span className="text-sm text-muted-foreground">saved</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="text-green-600 font-medium">
                {summary?.aiPerformance.costSaved}
              </span>
              <span className="text-muted-foreground">cost savings</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Top: {summary?.aiPerformance.topFeature}
            </p>
            <Link href="/dashboard/analytics?tab=ai-performance">
              <Button variant="ghost" size="sm" className="w-full mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                View Details
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Analytics Summary */}
      <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-full -translate-y-4 translate-x-4"></div>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
            <Clock className="mr-2 h-4 w-4 text-green-600" />
            Follow-up Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-green-600">
                {summary?.followUp.totalFollowUps}
              </span>
              <span className="text-sm text-muted-foreground">follow-ups</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Target className="h-3 w-3 text-green-600" />
              <span className="text-green-600 font-medium">
                {summary?.followUp.conversionRate}
              </span>
              <span className="text-muted-foreground">conversion</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Avg response: {summary?.followUp.avgResponseTime}
            </p>
            <Link href="/dashboard/analytics?tab=email-analytics">
              <Button variant="ghost" size="sm" className="w-full mt-3 text-green-600 hover:text-green-700 hover:bg-green-50">
                View Details
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Analytics Summary */}
      <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -translate-y-4 translate-x-4"></div>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
            <TrendingUp className="mr-2 h-4 w-4 text-purple-600" />
            Revenue Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-purple-600">
                {summary?.revenue.upsellOpportunities}
              </span>
              <span className="text-sm text-muted-foreground">opportunities</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Zap className="h-3 w-3 text-purple-600" />
              <span className="text-purple-600 font-medium">
                {summary?.revenue.potentialRevenue}
              </span>
              <span className="text-muted-foreground">potential</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.revenue.conversionRate} success rate
            </p>
            <Link href="/dashboard/analytics?tab=revenue-analytics">
              <Button variant="ghost" size="sm" className="w-full mt-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                View Details
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
