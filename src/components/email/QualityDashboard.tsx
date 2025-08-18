'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Lightbulb,
  Target,
  Activity,
  Zap,
  Brain,
  Users,
  DollarSign,
  Clock,
  Loader2,
  Settings,
  BarChart3,
  AlertCircle,
  Info,
  Star
} from 'lucide-react';

interface QualityMetrics {
  pattern_quality_score: number;
  draft_quality_score: number;
  user_satisfaction_score: number;
  system_performance_score: number;
  overall_quality_score: number;
}

interface QualityAlert {
  id: string;
  type: 'pattern_degradation' | 'low_satisfaction' | 'cost_spike' | 'performance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  created_at: string;
  resolved: boolean;
}

interface QualityInsight {
  category: 'patterns' | 'costs' | 'performance' | 'satisfaction';
  insight: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  action_items: string[];
}

interface PatternHealthReport {
  pattern_id: string;
  pattern_type: string;
  health_score: number;
  issues: string[];
  recommendations: string[];
}

export default function QualityDashboard() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [insights, setInsights] = useState<QualityInsight[]>([]);
  const [patternHealth, setPatternHealth] = useState<PatternHealthReport[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [autoImproving, setAutoImproving] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'alerts' | 'insights' | 'patterns'>('overview');

  useEffect(() => {
    if (session?.user?.id) {
      loadQualityData();
    }
  }, [session, timeRange]);

  const loadQualityData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeRange,
        includeAlerts: 'true',
        includeInsights: 'true',
        includePatternHealth: 'true'
      });

      const response = await fetch(`/api/email/learning/quality?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setAlerts(data.alerts || []);
        setInsights(data.insights || []);
        setPatternHealth(data.pattern_health || []);
      } else {
        throw new Error('Failed to load quality data');
      }
    } catch (error) {
      console.error('Error loading quality data:', error);
      toast({
        title: "Error",
        description: "Failed to load quality dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerAutoImprovement = async () => {
    try {
      setAutoImproving(true);
      const response = await fetch('/api/email/learning/quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'auto_improve' })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Auto-Improvement Complete",
          description: `Improved ${data.result.improved_patterns} patterns, disabled ${data.result.disabled_patterns} poor performers`,
        });
        await loadQualityData(); // Refresh data
      } else {
        throw new Error('Failed to trigger auto-improvement');
      }
    } catch (error) {
      console.error('Error in auto-improvement:', error);
      toast({
        title: "Error",
        description: "Failed to run auto-improvement",
        variant: "destructive"
      });
    } finally {
      setAutoImproving(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 0.6) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'patterns': return <Brain className="h-4 w-4" />;
      case 'costs': return <DollarSign className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'satisfaction': return <Users className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center p-8">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Quality Data</h3>
        <p className="text-gray-600">Start using the email learning system to see quality metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <CardTitle>Quality Assurance Dashboard</CardTitle>
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
              
              <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="alerts">Alerts</SelectItem>
                  <SelectItem value="insights">Insights</SelectItem>
                  <SelectItem value="patterns">Pattern Health</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={triggerAutoImprovement}
                disabled={autoImproving}
                className="flex items-center gap-2"
              >
                {autoImproving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                Auto-Improve
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quality Overview */}
      {selectedView === 'overview' && (
        <>
          {/* Overall Quality Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Overall Quality Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center">
                    <div className={`text-4xl font-bold ${getQualityColor(metrics.overall_quality_score)}`}>
                      {Math.round(metrics.overall_quality_score * 100)}%
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-full border-8 border-transparent">
                    <div 
                      className={`w-full h-full rounded-full border-8 ${
                        metrics.overall_quality_score >= 0.8 ? 'border-green-500' :
                        metrics.overall_quality_score >= 0.6 ? 'border-yellow-500' :
                        'border-red-500'
                      }`}
                      style={{
                        background: `conic-gradient(from 0deg, currentColor 0deg, currentColor ${metrics.overall_quality_score * 360}deg, transparent ${metrics.overall_quality_score * 360}deg)`
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Patterns</span>
                  </div>
                  <div className={`text-lg font-bold ${getQualityColor(metrics.pattern_quality_score)}`}>
                    {Math.round(metrics.pattern_quality_score * 100)}%
                  </div>
                  <Progress value={metrics.pattern_quality_score * 100} className="mt-2" />
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Drafts</span>
                  </div>
                  <div className={`text-lg font-bold ${getQualityColor(metrics.draft_quality_score)}`}>
                    {Math.round(metrics.draft_quality_score * 100)}%
                  </div>
                  <Progress value={metrics.draft_quality_score * 100} className="mt-2" />
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Satisfaction</span>
                  </div>
                  <div className={`text-lg font-bold ${getQualityColor(metrics.user_satisfaction_score)}`}>
                    {Math.round(metrics.user_satisfaction_score * 100)}%
                  </div>
                  <Progress value={metrics.user_satisfaction_score * 100} className="mt-2" />
                </div>
                
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Performance</span>
                  </div>
                  <div className={`text-lg font-bold ${getQualityColor(metrics.system_performance_score)}`}>
                    {Math.round(metrics.system_performance_score * 100)}%
                  </div>
                  <Progress value={metrics.system_performance_score * 100} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Alerts Summary */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Active Alerts ({alerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.slice(0, 3).map(alert => (
                    <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{alert.title}</AlertTitle>
                      <AlertDescription className="text-sm">
                        {alert.description}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {alerts.length > 3 && (
                    <div className="text-center pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedView('alerts')}
                      >
                        View All {alerts.length} Alerts
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Alerts View */}
      {selectedView === 'alerts' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Quality Alerts ({alerts.length})
            </CardTitle>
            <CardDescription>
              Issues that require attention to maintain system quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
                <p className="text-gray-600">No quality alerts at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => (
                  <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      {alert.title}
                      <Badge variant="outline" className="ml-2">
                        {alert.severity}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 space-y-2">
                        <p>{alert.description}</p>
                        <div className="p-3 bg-white/50 rounded border-l-4 border-blue-500">
                          <p className="text-sm font-medium text-blue-800">Recommendation:</p>
                          <p className="text-sm text-blue-700">{alert.recommendation}</p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Insights View */}
      {selectedView === 'insights' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Quality Insights ({insights.length})
            </CardTitle>
            <CardDescription>
              AI-generated insights to help improve your email learning system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length === 0 ? (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Yet</h3>
                <p className="text-gray-600">Use the system more to generate insights.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <Card key={index} className="border-l-4 border-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(insight.category)}
                          {getImpactIcon(insight.impact)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="capitalize">
                              {insight.category}
                            </Badge>
                            <Badge variant="secondary">
                              {Math.round(insight.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-800 mb-3">{insight.insight}</p>
                          {insight.action_items.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Action Items:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {insight.action_items.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-1">•</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pattern Health View */}
      {selectedView === 'patterns' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Pattern Health Analysis ({patternHealth.length})
            </CardTitle>
            <CardDescription>
              Detailed health assessment of individual learning patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {patternHealth.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Patterns to Analyze</h3>
                <p className="text-gray-600">Create some learning patterns to see health analysis.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patternHealth.map(pattern => (
                  <Card key={pattern.pattern_id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {pattern.pattern_type.replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getQualityIcon(pattern.health_score)}
                            <span className={`text-sm font-medium ${getQualityColor(pattern.health_score)}`}>
                              {Math.round(pattern.health_score * 100)}% Health
                            </span>
                          </div>
                        </div>
                        <Progress value={pattern.health_score * 100} className="w-24" />
                      </div>
                      
                      {pattern.issues.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-red-700 mb-1">Issues:</p>
                          <ul className="text-sm text-red-600 space-y-1">
                            {pattern.issues.map((issue, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <AlertCircle className="h-3 w-3 mt-1 flex-shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {pattern.recommendations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Recommendations:</p>
                          <ul className="text-sm text-blue-600 space-y-1">
                            {pattern.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Star className="h-3 w-3 mt-1 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


