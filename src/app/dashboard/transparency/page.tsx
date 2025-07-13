/**
 * Transparency Dashboard Page
 * 
 * Main dashboard for AI transparency features including:
 * - Memory browser
 * - Agent activity timeline
 * - Agent control panel
 */

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaMemory, FaRobot, FaChartLine, FaCog } from 'react-icons/fa';

// Import our UI components instead of Chakra UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';

import MemoryBrowser from '@/components/ai/transparency/MemoryBrowser';
import ActivityTimeline from '@/components/ai/transparency/ActivityTimeline';
import AgentControlPanel from '@/components/ai/transparency/AgentControlPanel';

interface Agent {
  id: string;
  name: string;
  agent_type: string;
}

export default function TransparencyDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMemories: 0,
    totalActivities: 0,
    activeAgents: 0
  });
  
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  // Fetch agents on component mount
  useEffect(() => {
    fetchAgents();
    fetchStats();
  }, []);
  
  // Fetch agents from the database
  const fetchAgents = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('id, name, agent_type')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      setAgents(data || []);
      
      // Select the first agent by default
      if (data && data.length > 0 && !selectedAgentId) {
        setSelectedAgentId(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: 'Error fetching agents',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      // Get memory count
      const { count: memoriesCount } = await supabase
        .from('ai_memories')
        .select('*', { count: 'exact', head: true });
      
      // Get activities count
      const { count: activitiesCount } = await supabase
        .from('ai_agent_activities')
        .select('*', { count: 'exact', head: true });
      
      // Get active agents count
      const { count: agentsCount } = await supabase
        .from('ai_agents')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);
      
      setStats({
        totalMemories: memoriesCount || 0,
        totalActivities: activitiesCount || 0,
        activeAgents: agentsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  // Handle agent selection change
  const handleAgentChange = (value: string) => {
    setSelectedAgentId(value);
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">AI Transparency Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <FaMemory className="h-6 w-6 mr-2 text-blue-500" />
              <CardTitle>Total Memories</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalMemories.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Stored AI memories</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <FaChartLine className="h-6 w-6 mr-2 text-green-500" />
              <CardTitle>Total Activities</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalActivities.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Logged agent actions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <FaRobot className="h-6 w-6 mr-2 text-purple-500" />
              <CardTitle>Active Agents</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeAgents}</p>
            <p className="text-sm text-muted-foreground">Currently active AI agents</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Agent Selector */}
      {loading ? (
        <div className="flex justify-center my-8">
          <Spinner className="h-8 w-8" />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center my-8 p-6 border rounded-lg">
          <h2 className="text-xl font-bold mb-2">No Agents Found</h2>
          <p>No AI agents have been configured yet.</p>
        </div>
      ) : (
        <>
          <div className="flex mb-6 items-center">
            <p className="font-bold mr-4">Select Agent:</p>
            <Select value={selectedAgentId} onValueChange={handleAgentChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.agent_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Main Content Tabs */}
          <Tabs defaultValue="memories">
            <TabsList>
              <TabsTrigger value="memories">
                <FaMemory className="mr-2" /> Memories
              </TabsTrigger>
              <TabsTrigger value="activity">
                <FaChartLine className="mr-2" /> Activity Timeline
              </TabsTrigger>
              <TabsTrigger value="control">
                <FaCog className="mr-2" /> Agent Control
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="memories">
              <MemoryBrowser />
            </TabsContent>
            <TabsContent value="activity">
              <ActivityTimeline agentId={selectedAgentId} />
            </TabsContent>
            <TabsContent value="control">
              <AgentControlPanel agentId={selectedAgentId} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
