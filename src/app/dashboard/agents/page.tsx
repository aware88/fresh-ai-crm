'use client';

import React, { useState, useEffect } from 'react';
// Simple toast replacement for now
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message),
};
import AgentDashboard from '@/components/agents/AgentDashboard';
import { AgentState } from '@/lib/agents/types';

interface AgentSystemData {
  agents: AgentState[];
  systemMetrics: any;
  config: any;
  isRunning: boolean;
}

export default function AgentsPage() {
  const [systemData, setSystemData] = useState<AgentSystemData>({
    agents: [],
    systemMetrics: {
      totalAgents: 0,
      activeAgents: 0,
      queuedTasks: 0,
      processingTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      pendingApprovals: 0,
      isRunning: false,
    },
    config: {},
    isRunning: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch system data
  const fetchSystemData = async () => {
    try {
      const response = await fetch('/api/agents');
      const result = await response.json();
      
      if (result.success) {
        setSystemData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch system data');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching system data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Start system
  const handleStartSystem = async () => {
    try {
      const response = await fetch('/api/agents/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Agent system started successfully');
        await fetchSystemData();
      } else {
        toast.error(result.error || 'Failed to start system');
      }
    } catch (err) {
      toast.error('Network error occurred');
      console.error('Error starting system:', err);
    }
  };

  // Stop system
  const handleStopSystem = async () => {
    try {
      const response = await fetch('/api/agents/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Agent system stopped successfully');
        await fetchSystemData();
      } else {
        toast.error(result.error || 'Failed to stop system');
      }
    } catch (err) {
      toast.error('Network error occurred');
      console.error('Error stopping system:', err);
    }
  };

  // Create agent
  const handleCreateAgent = async (name: string, type: string) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Agent "${name}" created successfully`);
        await fetchSystemData();
      } else {
        toast.error(result.error || 'Failed to create agent');
      }
    } catch (err) {
      toast.error('Network error occurred');
      console.error('Error creating agent:', err);
    }
  };

  // Remove agent
  const handleRemoveAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents?agentId=${agentId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Agent removed successfully');
        await fetchSystemData();
      } else {
        toast.error(result.error || 'Failed to remove agent');
      }
    } catch (err) {
      toast.error('Network error occurred');
      console.error('Error removing agent:', err);
    }
  };

  // Create some default agents on first load
  const createDefaultAgents = async () => {
    const defaultAgents = [
      { name: 'Email Assistant', type: 'email' },
      { name: 'Sales Agent', type: 'sales' },
      { name: 'Customer Success Agent', type: 'customer_success' },
      { name: 'Data Analyst', type: 'data_analyst' },
    ];

    for (const agent of defaultAgents) {
      await handleCreateAgent(agent.name, agent.type);
    }
  };

  // Auto-refresh data every 2 seconds when system is running
  useEffect(() => {
    fetchSystemData();
    
    const interval = setInterval(() => {
      if (systemData.isRunning) {
        fetchSystemData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [systemData.isRunning]);

  // Initial load
  useEffect(() => {
    fetchSystemData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Agent System...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">System Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSystemData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AgentDashboard
        agents={systemData.agents}
        systemMetrics={systemData.systemMetrics}
        onStartSystem={handleStartSystem}
        onStopSystem={handleStopSystem}
        onCreateAgent={handleCreateAgent}
        onRemoveAgent={handleRemoveAgent}
        isSystemRunning={systemData.isRunning}
      />
      
      {/* Quick Actions Floating Button */}
      {systemData.agents.length === 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={createDefaultAgents}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">🤖</span>
            Create Default Agents
          </button>
        </div>
      )}
    </div>
  );
} 