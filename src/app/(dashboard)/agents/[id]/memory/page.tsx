/**
 * Agent Memory Configuration Page
 * 
 * This page allows users to configure memory settings for a specific sales agent.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AgentMemoryConfig } from '@/components/ai/agent/AgentMemoryConfig';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MemoryAnalytics } from './components/MemoryAnalytics';

export const metadata: Metadata = {
  title: 'Agent Memory Configuration',
  description: 'Configure memory settings for your sales agent',
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function AgentMemoryPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient();
  
  // Get the current user and organization
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return notFound();
  }
  
  // Get the organization ID from the user's JWT
  const organizationId = user.app_metadata?.org_id;
  
  if (!organizationId) {
    return notFound();
  }
  
  // Get the agent details
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', organizationId)
    .single();
  
  if (!agent) {
    return notFound();
  }
  
  // Get memory statistics
  const { data: memoryStats } = await supabase
    .rpc('get_agent_memory_stats', {
      p_agent_id: params.id,
      p_organization_id: organizationId,
    });
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading={`${agent.name} Memory Settings`}
        description="Configure how this sales agent uses AI memory for customer interactions"
      />
      
      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configuration" className="mt-6">
          <div className="grid gap-6">
            <AgentMemoryConfig 
              agentId={params.id} 
              organizationId={organizationId} 
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Memory Types</CardTitle>
                <CardDescription>
                  Understanding different memory types and their use cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Customer preferences, likes, dislikes, and communication style preferences.
                    </p>
                  </div>
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium">Feedback</h3>
                    <p className="text-sm text-muted-foreground">
                      Customer feedback, objections, concerns, and reactions to products or services.
                    </p>
                  </div>
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium">Interactions</h3>
                    <p className="text-sm text-muted-foreground">
                      Records of past conversations, questions, and responses between the agent and customer.
                    </p>
                  </div>
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium">Observations</h3>
                    <p className="text-sm text-muted-foreground">
                      Patterns, behaviors, and insights observed during customer interactions.
                    </p>
                  </div>
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium">Insights</h3>
                    <p className="text-sm text-muted-foreground">
                      Higher-level understanding derived from multiple interactions or observations.
                    </p>
                  </div>
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium">Decisions</h3>
                    <p className="text-sm text-muted-foreground">
                      Past decisions made by the agent and their outcomes.
                    </p>
                  </div>
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium">Tactics</h3>
                    <p className="text-sm text-muted-foreground">
                      Sales approaches, strategies, and techniques that worked or didn't work.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <MemoryAnalytics 
            agentId={params.id}
            organizationId={organizationId}
            initialStats={memoryStats || {
              total_memories: 0,
              memory_types: [],
              memory_usage: [],
              memory_feedback: { 
                average_relevance: 0, 
                average_usefulness: 0 
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
