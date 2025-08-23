'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Clock,
  DollarSign,
  Users,
  Mail,
  Brain,
  Zap,
  Award,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart,
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface AnalyticsData {
  overview: {
    total_followups: number;
    response_rate: number;
    avg_response_time: number;
    automation_rate: number;
    cost_savings: number;
    time_savings: number;
    success_rate: number;
    ml_accuracy: number;
  };
  trends: Array<{
    date: string;
    followups_sent: number;
    responses_received: number;
    response_rate: number;
    avg_response_time: number;
  }>;
  performance: {
    by_priority: Array<{
      priority: string;
      count: number;
      response_rate: number;
      avg_response_time: number;
    }>;
    by_approach: Array<{
      approach: string;
      count: number;
      response_rate: number;
      success_rate: number;
    }>;
    by_timing: Array<{
      hour: number;
      day_name: string;
      response_rate: number;
      count: number;
    }>;
  };
  automation: {
    rules_active: number;
    executions_today: number;
    pending_approvals: number;
    success_rate: number;
    cost_per_execution: number;
    time_saved_hours: number;
  };
  ml_insights: {
    prediction_accuracy: number;
    top_factors: Array<{
      factor: string;
      impact: number;
      confidence: number;
    }>;
    optimization_suggestions: Array<{
      type: string;
      suggestion: string;
      potential_impact: number;
    }>;
  };
}

interface FollowUpAnalyticsDashboardProps {
  className?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function FollowUpAnalyticsDashboard({ className }: FollowUpAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch real data from the API endpoint
      const response = await fetch(`/api/email/followups/analytics?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAnalyticsData(data.analytics);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Set null to trigger empty state
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number, decimals = 1): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <div className="space-y-2">
          <p className="text-gray-500">No follow-up analytics data available</p>
          <p className="text-sm text-gray-400">Start sending follow-up emails to see insights here</p>
        </div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={loadAnalyticsData}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Check if data is empty (no follow-ups)
  if (analyticsData.overview.total_followups === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <div className="space-y-2">
          <p className="text-gray-500">No follow-up emails yet</p>
          <p className="text-sm text-gray-400">Your follow-up analytics will appear here once you start sending follow-up emails</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Follow-up Analytics</h2>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="insights">ML Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Follow-ups</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.total_followups.toLocaleString()}</p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12.5% vs last month
                      </p>
                    </div>
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Response Rate</p>
                      <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.response_rate)}%</p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +5.2% vs last month
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                      <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.avg_response_time)}h</p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        -2.1h vs last month
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cost Savings</p>
                      <p className="text-2xl font-bold">{formatCurrency(analyticsData.overview.cost_savings)}</p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +18.3% vs last month
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Automation Rate</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.automation_rate)}%</p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Time Saved</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.time_savings)}h</p>
                  </div>
                  <Activity className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.success_rate)}%</p>
                  </div>
                  <Award className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">ML Accuracy</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.ml_accuracy)}%</p>
                  </div>
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.trends}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="followups_sent" stroke="#3B82F6" fillOpacity={1} fill="url(#colorSent)" name="Follow-ups Sent" />
                  <Area type="monotone" dataKey="responses_received" stroke="#10B981" fillOpacity={1} fill="url(#colorReceived)" name="Responses Received" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance by Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.performance.by_priority}>
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Bar dataKey="response_rate" fill="#3B82F6" name="Response Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance by Approach */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Approach</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.performance.by_approach}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ approach, response_rate }) => `${approach}: ${response_rate.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="response_rate"
                    >
                      {analyticsData.performance.by_approach.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Timing Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Optimal Timing Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.performance.by_timing}>
                  <XAxis dataKey="day_name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="response_rate" fill="#10B981" name="Response Rate %" />
                  <Bar dataKey="count" fill="#F59E0B" name="Follow-ups Sent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          {/* Automation Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Rules</p>
                    <p className="text-2xl font-bold">{analyticsData.automation.rules_active}</p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Executions Today</p>
                    <p className="text-2xl font-bold">{analyticsData.automation.executions_today}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                    <p className="text-2xl font-bold">{analyticsData.automation.pending_approvals}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Automation Efficiency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(analyticsData.automation.success_rate)}%</p>
                  <p className="text-xs text-gray-500 mt-1">Of automated follow-ups</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Cost per Execution</p>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(analyticsData.automation.cost_per_execution)}</p>
                  <p className="text-xs text-gray-500 mt-1">Average AI + processing cost</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Time Saved Today</p>
                  <p className="text-3xl font-bold text-purple-600">{formatNumber(analyticsData.automation.time_saved_hours)}h</p>
                  <p className="text-xs text-gray-500 mt-1">Through automation</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* ML Accuracy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Machine Learning Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {formatNumber(analyticsData.ml_insights.prediction_accuracy)}%
                </div>
                <p className="text-gray-600">Overall Prediction Accuracy</p>
                <div className="mt-4 flex justify-center">
                  <Badge variant="secondary" className="text-sm">
                    Industry Leading Performance
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Factors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Prediction Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.ml_insights.top_factors.map((factor, index) => (
                  <div key={factor.factor} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{factor.factor}</p>
                        <p className="text-sm text-gray-500">Impact: {(factor.impact * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {(factor.confidence * 100).toFixed(1)}% confidence
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimization Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>AI Optimization Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.ml_insights.optimization_suggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.type}
                          </Badge>
                          <span className="text-sm font-medium text-green-600">
                            +{formatNumber(suggestion.potential_impact)}% improvement
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{suggestion.suggestion}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

