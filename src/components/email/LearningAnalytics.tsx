'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Target,
  Zap,
  Brain,
  MessageSquare,
  CheckCircle,
  Edit3,
  X,
  Loader2,
  Calendar,
  PieChart,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  stats: {
    total_patterns: number;
    high_quality_patterns: number;
    active_patterns: number;
    avg_confidence: number;
    avg_success_rate: number;
    most_used_pattern_type: string;
    total_drafts: number;
    cache_hit_rate: number;
    total_cost_usd: number;
    avg_cost_per_draft: number;
    user_satisfaction: number;
    feedback_distribution: Record<string, number>;
  };
  analytics: {
    pattern_performance: Array<{
      id: string;
      pattern_type: string;
      confidence_score: number;
      success_rate: number;
      usage_count: number;
    }>;
    cost_analysis: {
      monthly_cost: number;
      cost_by_model: Record<string, number>;
      savings_vs_baseline: number;
    };
    usage_patterns: {
      drafts_per_day: Record<string, number>;
      pattern_usage_distribution: Record<string, number>;
    };
  };
}

export default function LearningAnalytics() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    if (session?.user?.id) {
      loadAnalytics();
    }
  }, [session, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/email/learning/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        throw new Error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load learning analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (value: number, threshold: { good: number; fair: number }) => {
    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.fair) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (value: number, threshold: { good: number; fair: number }) => {
    if (value >= threshold.good) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value >= threshold.fair) return <BarChart3 className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center p-8">
        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Start using the email learning system to see analytics.</p>
      </div>
    );
  }

  const { stats, analytics } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <CardTitle>Learning Analytics</CardTitle>
            </div>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="patterns">Pattern Performance</SelectItem>
                  <SelectItem value="costs">Cost Analysis</SelectItem>
                  <SelectItem value="usage">Usage Patterns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Overview */}
      {selectedMetric === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Patterns</p>
                    <div className="text-2xl font-bold">{stats.total_patterns}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.high_quality_patterns} high quality
                    </p>
                  </div>
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <div className={`text-2xl font-bold ${getPerformanceColor(stats.avg_success_rate, { good: 0.8, fair: 0.6 })}`}>
                      {formatPercentage(stats.avg_success_rate)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Pattern effectiveness
                    </p>
                  </div>
                  {getPerformanceIcon(stats.avg_success_rate, { good: 0.8, fair: 0.6 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                    <div className={`text-2xl font-bold ${getPerformanceColor(stats.cache_hit_rate, { good: 0.8, fair: 0.6 })}`}>
                      {formatPercentage(stats.cache_hit_rate)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Instant retrievals
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(analytics.cost_analysis.monthly_cost)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Avg {formatCurrency(stats.avg_cost_per_draft)}/draft
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Satisfaction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                User Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Satisfaction</span>
                  <div className="flex items-center gap-2">
                    <Progress value={stats.user_satisfaction * 100} className="w-32" />
                    <span className={`text-sm font-bold ${getPerformanceColor(stats.user_satisfaction, { good: 0.8, fair: 0.6 })}`}>
                      {formatPercentage(stats.user_satisfaction)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-green-600">
                      {stats.feedback_distribution.approved || 0}
                    </div>
                    <div className="text-xs text-gray-600">Approved</div>
                  </div>
                  
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <Edit3 className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-yellow-600">
                      {stats.feedback_distribution.edited || 0}
                    </div>
                    <div className="text-xs text-gray-600">Edited</div>
                  </div>
                  
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <X className="h-6 w-6 text-red-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-red-600">
                      {stats.feedback_distribution.rejected || 0}
                    </div>
                    <div className="text-xs text-gray-600">Rejected</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Pattern Performance */}
      {selectedMetric === 'patterns' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Pattern Performance Analysis
            </CardTitle>
            <CardDescription>
              Detailed breakdown of how each pattern is performing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.pattern_performance.slice(0, 10).map((pattern, index) => (
                <div key={pattern.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{pattern.pattern_type.replace('_', ' ')}</div>
                      <div className="text-sm text-gray-500">Used {pattern.usage_count} times</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className={`text-sm font-bold ${getPerformanceColor(pattern.confidence_score, { good: 0.8, fair: 0.6 })}`}>
                        {formatPercentage(pattern.confidence_score)}
                      </div>
                      <div className="text-xs text-gray-500">Confidence</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-sm font-bold ${getPerformanceColor(pattern.success_rate, { good: 0.8, fair: 0.6 })}`}>
                        {formatPercentage(pattern.success_rate)}
                      </div>
                      <div className="text-xs text-gray-500">Success</div>
                    </div>
                    
                    {getPerformanceIcon(pattern.success_rate, { good: 0.8, fair: 0.6 })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Analysis */}
      {selectedMetric === 'costs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {Object.entries(analytics.cost_analysis.cost_by_model).map(([model, cost]) => (
                  <div key={model} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{model}</span>
                    <span className="text-sm font-bold">{formatCurrency(cost)}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Monthly Total</span>
                  <span className="font-bold text-lg">{formatCurrency(analytics.cost_analysis.monthly_cost)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Cost Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(analytics.cost_analysis.savings_vs_baseline)}
                </div>
                <div className="text-sm text-gray-600">Saved vs. baseline GPT-4</div>
                
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-800">
                    <strong>Smart model selection</strong> has saved you{' '}
                    {Math.round((analytics.cost_analysis.savings_vs_baseline / (analytics.cost_analysis.monthly_cost + analytics.cost_analysis.savings_vs_baseline)) * 100)}%{' '}
                    on AI costs this month.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Patterns */}
      {selectedMetric === 'usage' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Usage Patterns
            </CardTitle>
            <CardDescription>
              How and when the learning system is being used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Pattern Type Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.usage_patterns.pattern_usage_distribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => {
                      const total = Object.values(analytics.usage_patterns.pattern_usage_distribution)
                        .reduce((sum, c) => sum + c, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm">{type.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="w-20" />
                            <span className="text-sm font-medium w-12">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Daily Draft Generation</h4>
                <div className="text-sm text-gray-600">
                  Average: {Math.round(Object.values(analytics.usage_patterns.drafts_per_day).reduce((sum, count) => sum + count, 0) / Math.max(Object.keys(analytics.usage_patterns.drafts_per_day).length, 1))} drafts per day
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.avg_success_rate < 0.7 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  <strong>Improvement Opportunity:</strong> Your pattern success rate is below 70%. 
                  Consider reviewing and refining patterns that are frequently edited or rejected.
                </div>
              </div>
            )}
            
            {stats.cache_hit_rate < 0.5 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Performance Tip:</strong> Your cache hit rate is below 50%. 
                  More email learning sessions could improve background draft generation.
                </div>
              </div>
            )}
            
            {analytics.cost_analysis.savings_vs_baseline > 10 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800">
                  <strong>Great Job!</strong> You're saving significant costs with smart model selection. 
                  Keep using the learning system to maintain these savings.
                </div>
              </div>
            )}
            
            {stats.high_quality_patterns / Math.max(stats.total_patterns, 1) > 0.8 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-sm text-purple-800">
                  <strong>Excellent Quality:</strong> Over 80% of your patterns are high quality. 
                  Your email learning system is working very effectively!
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


