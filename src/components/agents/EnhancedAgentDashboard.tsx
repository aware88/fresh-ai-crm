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
  RefreshCw,
  Mail,
  Database,
  Target,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentState, AgentThought, AgentTask, AgentEvent } from '@/lib/agents/types';

// Import MagicUI components
import { AnimatedBeam } from '@/components/magicui/animated-beam';
import { BorderBeam } from '@/components/magicui/border-beam';
import { BentoCard, BentoGrid } from '@/components/magicui/bento-grid';

interface AgentDashboardProps {
  agents: AgentState[];
  systemMetrics: any;
  onStartSystem: () => void;
  onStopSystem: () => void;
  onCreateAgent: (name: string, type: string) => void;
  onRemoveAgent: (agentId: string) => void;
  isSystemRunning: boolean;
}

// Enhanced Agent Communication Flow Visualization
const AgentCommunicationFlow: React.FC<{ agents: AgentState[]; isSystemRunning: boolean }> = ({ 
  agents, 
  isSystemRunning 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const emailAgentRef = useRef<HTMLDivElement>(null);
  const analysisAgentRef = useRef<HTMLDivElement>(null);
  const crmAgentRef = useRef<HTMLDivElement>(null);
  const coordinatorRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef}
      className="relative h-64 w-full overflow-hidden rounded-lg bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950/50 dark:to-blue-950/20 p-8"
    >
      {/* Email Agent */}
      <div 
        ref={emailAgentRef}
        className="absolute top-8 left-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-blue-200 dark:border-blue-800"
      >
        <Mail className="w-8 h-8 text-blue-600 mb-2" />
        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Email Agent</div>
        <div className="text-xs text-gray-500">Processing</div>
        {isSystemRunning && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />}
      </div>

      {/* Analysis Agent */}
      <div 
        ref={analysisAgentRef}
        className="absolute top-8 right-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-purple-200 dark:border-purple-800"
      >
        <Brain className="w-8 h-8 text-purple-600 mb-2" />
        <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Analysis Agent</div>
        <div className="text-xs text-gray-500">Analyzing</div>
        {isSystemRunning && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />}
      </div>

      {/* CRM Agent */}
      <div 
        ref={crmAgentRef}
        className="absolute bottom-8 left-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-green-200 dark:border-green-800"
      >
        <Database className="w-8 h-8 text-green-600 mb-2" />
        <div className="text-sm font-medium text-green-700 dark:text-green-300">CRM Agent</div>
        <div className="text-xs text-gray-500">Updating</div>
        {isSystemRunning && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />}
      </div>

      {/* Coordinator Agent */}
      <div 
        ref={coordinatorRef}
        className="absolute bottom-8 right-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-orange-200 dark:border-orange-800"
      >
        <Target className="w-8 h-8 text-orange-600 mb-2" />
        <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Coordinator</div>
        <div className="text-xs text-gray-500">Orchestrating</div>
        {isSystemRunning && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />}
      </div>

      {/* Animated Beams showing agent communication */}
      {isSystemRunning && (
        <>
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={emailAgentRef}
            toRef={analysisAgentRef}
            gradientStartColor="#3b82f6"
            gradientStopColor="#8b5cf6"
            delay={0}
            duration={3}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={analysisAgentRef}
            toRef={coordinatorRef}
            gradientStartColor="#8b5cf6"
            gradientStopColor="#f59e0b"
            delay={1}
            duration={3}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={coordinatorRef}
            toRef={crmAgentRef}
            gradientStartColor="#f59e0b"
            gradientStopColor="#10b981"
            delay={2}
            duration={3}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={crmAgentRef}
            toRef={emailAgentRef}
            gradientStartColor="#10b981"
            gradientStopColor="#3b82f6"
            delay={3}
            duration={3}
            reverse={true}
          />
        </>
      )}

      {/* Flow labels */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <Badge variant="secondary" className="bg-white/80 text-gray-700">
          {isSystemRunning ? 'Active Communication Flow' : 'System Stopped'}
        </Badge>
      </div>
    </div>
  );
};

export const EnhancedAgentDashboard: React.FC<AgentDashboardProps> = ({
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Agent Command Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor and control your autonomous AI agents in real-time
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={isSystemRunning ? onStopSystem : onStartSystem}
              className={`relative overflow-hidden ${
                isSystemRunning 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {!isSystemRunning && <BorderBeam size={60} duration={8} delay={0} />}
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
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300"
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

        {/* Agent Communication Flow Visualization */}
        <Card className="border-0 shadow-lg relative overflow-hidden">
          <BorderBeam size={100} duration={20} delay={0} />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Agent Communication Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AgentCommunicationFlow agents={agents} isSystemRunning={isSystemRunning} />
          </CardContent>
        </Card>

        {/* Enhanced System Metrics using Bento Grid */}
        <BentoGrid className="w-full auto-rows-[12rem] grid-cols-4 gap-4">
          <BentoCard
            name="Active Agents"
            className="col-span-1 relative"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{systemMetrics.activeAgents}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Currently Running</div>
                </div>
              </div>
            }
            Icon={Users}
            description="AI agents currently active"
            href="#"
            cta="View Details"
          />

          <BentoCard
            name="Queued Tasks"
            className="col-span-1"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{systemMetrics.queuedTasks}</div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending Tasks</div>
                </div>
              </div>
            }
            Icon={Clock}
            description="Tasks waiting to be processed"
            href="#"
            cta="View Queue"
          />

          <BentoCard
            name="Success Rate"
            className="col-span-1"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">{systemMetrics.successRate}%</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Task Success</div>
                </div>
              </div>
            }
            Icon={CheckCircle}
            description="Successful task completion rate"
            href="#"
            cta="View Stats"
          />

          <BentoCard
            name="System Health"
            className="col-span-1"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{systemMetrics.uptime}%</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Uptime</div>
                </div>
              </div>
            }
            Icon={Activity}
            description="Overall system health"
            href="#"
            cta="View Health"
          />
        </BentoGrid>

        {/* Agent List and Details - Enhanced Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <Card className="lg:col-span-1 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Active Agents
                </span>
                <Badge variant="secondary">{agents.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedAgent === agent.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                  onClick={() => setSelectedAgent(agent.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-sm">{agent.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{agent.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                      <span className="text-xs capitalize">{agent.status}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    {agent.currentTask || 'Idle'}
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Agent Details */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  {selectedAgentData ? `${selectedAgentData.name} - Thought Process` : 'Select an Agent'}
                </CardTitle>
                {selectedAgentData && (
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedAgentData.status === 'acting' ? 'default' : 'secondary'}>
                      {selectedAgentData.status}
                    </Badge>
                  </div>
                )}
              </div>
              {selectedAgentData && (
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search thoughts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={thoughtFilter} onValueChange={setThoughtFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
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
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {filteredThoughts.map((thought, index) => (
                      <motion.div
                        key={`${thought.timestamp}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-4 rounded-lg border-l-4 ${
                          thought.type === 'observation' ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20' :
                          thought.type === 'reasoning' ? 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20' :
                          thought.type === 'planning' ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20' :
                          thought.type === 'action' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20' :
                          'border-l-pink-500 bg-pink-50 dark:bg-pink-950/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${getThoughtColor(thought.type)}`}>
                            {getThoughtIcon(thought.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="capitalize text-xs">
                                {thought.type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(thought.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{thought.content}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={thoughtsEndRef} />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select an agent to view its thought process</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

