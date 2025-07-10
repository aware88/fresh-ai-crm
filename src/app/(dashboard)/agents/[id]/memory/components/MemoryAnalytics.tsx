'use client';

/**
 * Memory Analytics Component
 * 
 * This component displays analytics and insights about an agent's memory usage,
 * including memory types, usage patterns, and feedback metrics.
 */

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/client-hook';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, PieChart, LineChart } from '@/components/ui/charts';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { AIMemoryType } from '@/lib/ai/memory/ai-memory-service';

// Memory type display names
const memoryTypeLabels: Record<string, string> = {
  [AIMemoryType.PREFERENCE]: 'Preferences',
  [AIMemoryType.FEEDBACK]: 'Feedback',
  [AIMemoryType.INTERACTION]: 'Interactions',
  [AIMemoryType.OBSERVATION]: 'Observations',
  [AIMemoryType.INSIGHT]: 'Insights',
  [AIMemoryType.DECISION]: 'Decisions',
  [AIMemoryType.TACTIC]: 'Tactics'
};

// Memory type colors
const memoryTypeColors: Record<string, string> = {
  [AIMemoryType.PREFERENCE]: '#4f46e5',
  [AIMemoryType.FEEDBACK]: '#10b981',
  [AIMemoryType.INTERACTION]: '#f59e0b',
  [AIMemoryType.OBSERVATION]: '#ef4444',
  [AIMemoryType.INSIGHT]: '#8b5cf6',
  [AIMemoryType.DECISION]: '#06b6d4',
  [AIMemoryType.TACTIC]: '#ec4899'
};

interface MemoryStats {
  total_memories: number;
  memory_types: Array<{
    memory_type: string;
    count: number;
  }>;
  memory_usage: Array<{
    date: string;
    count: number;
  }>;
  memory_feedback: {
    average_relevance: number;
    average_usefulness: number;
  };
}

interface MemoryAnalyticsProps {
  agentId: string;
  organizationId: string;
  initialStats: MemoryStats;
}

export function MemoryAnalytics({ 
  agentId, 
  organizationId,
  initialStats 
}: MemoryAnalyticsProps) {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [stats, setStats] = useState<MemoryStats>(initialStats);
  
  // Load memory statistics
  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .rpc('get_agent_memory_stats', {
            p_agent_id: agentId,
            p_organization_id: organizationId,
            p_days: timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
          });
        
        if (error) {
          console.error('Error loading memory stats:', error);
          return;
        }
        
        if (data) {
          setStats(data);
        }
      } catch (error) {
        console.error('Error loading memory stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadStats();
  }, [agentId, organizationId, timeRange, supabase]);
  
  // Prepare chart data
  const memoryTypeData = stats.memory_types.map(item => ({
    name: memoryTypeLabels[item.memory_type] || item.memory_type,
    value: item.count,
    color: memoryTypeColors[item.memory_type] || '#888888'
  }));
  
  const memoryUsageData = stats.memory_usage.map(item => ({
    name: new Date(item.date).toLocaleDateString(),
    Memories: item.count
  }));
  
  const feedbackData = [
    {
      name: 'Relevance',
      value: stats.memory_feedback.average_relevance * 100
    },
    {
      name: 'Usefulness',
      value: stats.memory_feedback.average_usefulness * 100
    }
  ];
  
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid gap-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Memory Overview</CardTitle>
            <div className="flex items-center space-x-2">
              <TabsList>
                <TabsTrigger 
                  value="7d" 
                  onClick={() => setTimeRange('7d')}
                  className={timeRange === '7d' ? 'bg-primary text-primary-foreground' : ''}
                >
                  7 Days
                </TabsTrigger>
                <TabsTrigger 
                  value="30d" 
                  onClick={() => setTimeRange('30d')}
                  className={timeRange === '30d' ? 'bg-primary text-primary-foreground' : ''}
                >
                  30 Days
                </TabsTrigger>
                <TabsTrigger 
                  value="90d" 
                  onClick={() => setTimeRange('90d')}
                  className={timeRange === '90d' ? 'bg-primary text-primary-foreground' : ''}
                >
                  90 Days
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          <CardDescription>
            Overview of memory usage and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Total Memories
              </div>
              <div className="text-3xl font-bold">
                {stats.total_memories.toLocaleString()}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Avg. Relevance Score
              </div>
              <div className="text-3xl font-bold">
                {(stats.memory_feedback.average_relevance * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Avg. Usefulness Score
              </div>
              <div className="text-3xl font-bold">
                {(stats.memory_feedback.average_usefulness * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Memory Types Chart */}
            <div>
              <h3 className="text-sm font-medium mb-3">Memory Types</h3>
              <div className="h-64">
                {stats.memory_types.length > 0 ? (
                  <PieChart
                    data={memoryTypeData}
                    index="name"
                    valueKey="value"
                    category="name"
                    colors={memoryTypeData.map(d => d.color)}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No memory data available
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {stats.memory_types.map(type => (
                  <Badge 
                    key={type.memory_type}
                    variant="outline"
                    style={{ 
                      borderColor: memoryTypeColors[type.memory_type] || '#888888',
                      color: memoryTypeColors[type.memory_type] || '#888888'
                    }}
                  >
                    {memoryTypeLabels[type.memory_type] || type.memory_type}: {type.count}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Memory Usage Chart */}
            <div>
              <h3 className="text-sm font-medium mb-3">Memory Creation Over Time</h3>
              <div className="h-64">
                {stats.memory_usage.length > 0 ? (
                  <LineChart
                    data={memoryUsageData}
                    index="name"
                    categories={["Memories"]}
                    colors={["#4f46e5"]}
                    valueFormatter={(value) => `${value} memories`}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No usage data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Feedback Card */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Feedback</CardTitle>
          <CardDescription>
            How relevant and useful are the memories being retrieved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <BarChart
              data={feedbackData}
              index="name"
              categories={["value"]}
              colors={["#4f46e5"]}
              valueFormatter={(value) => `${value.toFixed(1)}%`}
              yAxisWidth={48}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                What is Relevance?
              </div>
              <p className="text-sm">
                Relevance measures how closely related retrieved memories are to the current conversation context.
                Higher scores indicate better semantic matching between memories and customer queries.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                What is Usefulness?
              </div>
              <p className="text-sm">
                Usefulness measures how much impact memories have on the agent's decision-making process.
                Higher scores indicate memories that significantly influenced the agent's responses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
