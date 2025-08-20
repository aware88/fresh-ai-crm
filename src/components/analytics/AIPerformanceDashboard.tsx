'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Database,
  Zap,
  Activity
} from 'lucide-react';

interface AIMetrics {
  totalProcessed: number;
  cacheHitRate: number;
  averageProcessingTime: number;
  successRate: number;
  modelPerformance: Array<{
    model: string;
    usage: number;
    averageRating: number;
    responseTime: number;
  }>;
  dailyStats: Array<{
    date: string;
    processed: number;
    cached: number;
    errors: number;
  }>;
  cacheStats: {
    totalEntries: number;
    hitRate: number;
    missRate: number;
    avgAge: number;
  };
}

export default function AIPerformanceDashboard() {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/ai-performance');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load AI metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshMetrics = async () => {
    setRefreshing(true);
    await loadMetrics();
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 animate-spin" />
          <span>Loading AI performance metrics...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No AI performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Performance Dashboard</h2>
          <p className="text-gray-600">Monitor AI processing efficiency and cache performance</p>
        </div>
        <Button 
          onClick={refreshMetrics} 
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <Activity className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <TrendingUp className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Processed</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalProcessed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.cacheHitRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Processing</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.averageProcessingTime.toFixed(1)}s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Model Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Processing Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Processing Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="processed" fill="#8884d8" name="Processed" />
                    <Bar dataKey="cached" fill="#82ca9d" name="From Cache" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cache Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Hit Rate</span>
                      <span>{metrics.cacheStats.hitRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.cacheStats.hitRate} className="mt-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Total Entries</span>
                      <span>{metrics.cacheStats.totalEntries.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Average Age</span>
                      <span>{(metrics.cacheStats.avgAge / 3600).toFixed(1)}h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.modelPerformance.map((model, index) => (
                  <div key={model.model} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{model.model}</h4>
                      <Badge variant={model.averageRating >= 4 ? 'default' : 'secondary'}>
                        ⭐ {model.averageRating.toFixed(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Usage</span>
                        <p className="font-medium">{model.usage.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Response</span>
                        <p className="font-medium">{model.responseTime.toFixed(1)}s</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Efficiency</span>
                        <Progress 
                          value={Math.min(100, (5 - model.responseTime) * 20)} 
                          className="mt-1" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cache Hit vs Miss</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Cache Hits', value: metrics.cacheStats.hitRate },
                        { name: 'Cache Misses', value: metrics.cacheStats.missRate }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {metrics.cacheStats.totalEntries.toLocaleString()}
                    </div>
                    <p className="text-gray-600">Total Cache Entries</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Hit Rate</span>
                      <Badge variant="default">{metrics.cacheStats.hitRate.toFixed(1)}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Miss Rate</span>
                      <Badge variant="secondary">{metrics.cacheStats.missRate.toFixed(1)}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Entry Age</span>
                      <Badge variant="outline">{(metrics.cacheStats.avgAge / 3600).toFixed(1)}h</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="processed" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Total Processed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cached" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="From Cache"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errors" 
                    stroke="#ff7300" 
                    strokeWidth={2}
                    name="Errors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}