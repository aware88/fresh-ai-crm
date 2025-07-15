'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Eye, 
  Zap, 
  MessageSquare, 
  Settings, 
  Play, 
  Pause, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Users,
  BarChart3,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentState, AgentThought, AgentTask, AgentEvent } from '@/lib/agents/types';

interface AgentDashboardProps {
  agents: AgentState[];
  systemMetrics: any;
  onStartSystem: () => void;
  onStopSystem: () => void;
  onCreateAgent: (name: string, type: string) => void;
  onRemoveAgent: (agentId: string) => void;
  isSystemRunning: boolean;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  agents,
  systemMetrics,
  onStartSystem,
  onStopSystem,
  onCreateAgent,
  onRemoveAgent,
  isSystemRunning,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [thoughtFilter, setThoughtFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const thoughtsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new thoughts arrive
  useEffect(() => {
    if (autoScroll && thoughtsEndRef.current) {
      thoughtsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agents, autoScroll]);

  const selectedAgentData = selectedAgent ? agents.find(a => a.id === selectedAgent) : null;

  const getStatusColor = (status: AgentState['status']) => {
    switch (status) {
      case 'idle': return 'bg-gray-500';
      case 'thinking': return 'bg-blue-500 animate-pulse';
      case 'acting': return 'bg-green-500 animate-pulse';
      case 'waiting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getThoughtIcon = (type: AgentThought['type']) => {
    switch (type) {
      case 'observation': return <Eye className="w-4 h-4" />;
      case 'reasoning': return <Brain className="w-4 h-4" />;
      case 'planning': return <Settings className="w-4 h-4" />;
      case 'action': return <Zap className="w-4 h-4" />;
      case 'reflection': return <MessageSquare className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getThoughtColor = (type: AgentThought['type']) => {
    switch (type) {
      case 'observation': return 'text-blue-600 bg-blue-50';
      case 'reasoning': return 'text-purple-600 bg-purple-50';
      case 'planning': return 'text-green-600 bg-green-50';
      case 'action': return 'text-orange-600 bg-orange-50';
      case 'reflection': return 'text-pink-600 bg-pink-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredThoughts = selectedAgentData?.thoughts.filter(thought => {
    const matchesFilter = thoughtFilter === 'all' || thought.type === thoughtFilter;
    const matchesSearch = searchQuery === '' || 
      thought.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Agent Command Center
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor and control your autonomous AI agents in real-time
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={isSystemRunning ? onStopSystem : onStartSystem}
              className={`${
                isSystemRunning 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {isSystemRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop System
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start System
                </>
              )}
            </Button>

            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/agents/test-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ testType: 'full_flow' })
                  });
                  const result = await response.json();
                  if (result.success) {
                    console.log('✅ Email agent test successful:', result.data);
                  } else {
                    console.error('❌ Email agent test failed:', result.error);
                  }
                } catch (error) {
                  console.error('❌ Test request failed:', error);
                }
              }}
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Test Email Agent
            </Button>
            
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isSystemRunning ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isSystemRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Agents</p>
                  <p className="text-2xl font-bold">{systemMetrics.activeAgents}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Queued Tasks</p>
                  <p className="text-2xl font-bold">{systemMetrics.queuedTasks}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{systemMetrics.completedTasks}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed Tasks</p>
                  <p className="text-2xl font-bold">{systemMetrics.failedTasks}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agents List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Active Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agents.map((agent) => (
                  <motion.div
                    key={agent.id}
                    layout
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAgent === agent.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedAgent(agent.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-gray-600 capitalize">{agent.type}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {agent.status}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Tasks: {agent.metrics.tasksCompleted}</span>
                      <span>Success: {(agent.metrics.successRate * 100).toFixed(1)}%</span>
                    </div>
                  </motion.div>
                ))}
                
                {agents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No agents created yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agent Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  {selectedAgentData ? `${selectedAgentData.name} - Thinking Process` : 'Select an Agent'}
                </CardTitle>
                
                {selectedAgentData && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAutoScroll(!autoScroll)}
                    >
                      {autoScroll ? 'Disable' : 'Enable'} Auto-scroll
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {selectedAgentData && (
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search thoughts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  <Select value={thoughtFilter} onValueChange={setThoughtFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Thoughts</SelectItem>
                      <SelectItem value="observation">Observations</SelectItem>
                      <SelectItem value="reasoning">Reasoning</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="action">Actions</SelectItem>
                      <SelectItem value="reflection">Reflections</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              {selectedAgentData ? (
                <div className="space-y-4">
                  {/* Agent Status */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${getStatusColor(selectedAgentData.status)}`} />
                        <span className="font-medium">Status: {selectedAgentData.status}</span>
                      </div>
                      {selectedAgentData.currentTask && (
                        <Badge variant="secondary">
                          Task: {selectedAgentData.currentTask.slice(0, 8)}...
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Thoughts Stream */}
                  <div className="h-96 overflow-y-auto space-y-3 bg-white border rounded-lg p-4">
                    <AnimatePresence>
                      {filteredThoughts.map((thought, index) => (
                        <motion.div
                          key={thought.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className={`p-3 rounded-lg ${getThoughtColor(thought.type)}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {getThoughtIcon(thought.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {thought.type}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {thought.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm">{thought.content}</p>
                              {thought.metadata && (
                                <div className="mt-2 text-xs text-gray-600">
                                  <pre>{JSON.stringify(thought.metadata, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {filteredThoughts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No thoughts to display</p>
                        <p className="text-sm">The agent hasn't started thinking yet</p>
                      </div>
                    )}
                    
                    <div ref={thoughtsEndRef} />
                  </div>

                  {/* Agent Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">Total Thoughts</p>
                      <p className="text-lg font-bold text-blue-800">
                        {selectedAgentData.metrics.totalThoughts}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600">Total Actions</p>
                      <p className="text-lg font-bold text-green-800">
                        {selectedAgentData.metrics.totalActions}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select an agent to view its thinking process</p>
                  <p className="text-sm">Watch AI agents think, reason, and act in real-time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard; 