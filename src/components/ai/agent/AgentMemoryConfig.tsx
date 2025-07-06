/**
 * Agent Memory Configuration Component
 * 
 * This component allows users to configure memory settings for a sales agent,
 * including enabling/disabling memory features and setting memory parameters.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/client';
import { AIMemoryType } from '@/lib/ai/memory/ai-memory-service';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Switch, 
  Button, 
  Input, 
  Slider, 
  Checkbox 
} from '@/components/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

// Define form schema
const formSchema = z.object({
  enableMemoryCreation: z.boolean(),
  enableMemoryRetrieval: z.boolean(),
  maxMemoriesToRetrieve: z.number().min(1).max(50),
  minRelevanceScore: z.number().min(0).max(1),
  memoryTypes: z.array(z.string())
});

type FormValues = z.infer<typeof formSchema>;

interface AgentMemoryConfigProps {
  agentId: string;
  organizationId: string;
}

export function AgentMemoryConfig({ agentId, organizationId }: AgentMemoryConfigProps) {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enableMemoryCreation: true,
      enableMemoryRetrieval: true,
      maxMemoriesToRetrieve: 10,
      minRelevanceScore: 0.7,
      memoryTypes: [
        AIMemoryType.PREFERENCE,
        AIMemoryType.FEEDBACK,
        AIMemoryType.INTERACTION,
        AIMemoryType.OBSERVATION,
        AIMemoryType.INSIGHT
      ]
    }
  });
  
  // Memory type options
  const memoryTypeOptions = [
    { value: AIMemoryType.PREFERENCE, label: 'Preferences' },
    { value: AIMemoryType.FEEDBACK, label: 'Feedback' },
    { value: AIMemoryType.INTERACTION, label: 'Interactions' },
    { value: AIMemoryType.OBSERVATION, label: 'Observations' },
    { value: AIMemoryType.INSIGHT, label: 'Insights' },
    { value: AIMemoryType.DECISION, label: 'Decisions' },
    { value: AIMemoryType.TACTIC, label: 'Tactics' }
  ];
  
  // Load agent memory config
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('agent_memory_config')
          .select('*')
          .eq('agent_id', agentId)
          .eq('organization_id', organizationId)
          .single();
        
        if (error) {
          console.error('Error loading agent memory config:', error);
          return;
        }
        
        if (data) {
          form.reset({
            enableMemoryCreation: data.enable_memory_creation,
            enableMemoryRetrieval: data.enable_memory_retrieval,
            maxMemoriesToRetrieve: data.max_memories_to_retrieve,
            minRelevanceScore: data.min_relevance_score,
            memoryTypes: data.memory_types
          });
        }
      } catch (error) {
        console.error('Error loading agent memory config:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadConfig();
  }, [agentId, organizationId, supabase, form]);
  
  // Save agent memory config
  async function onSubmit(values: FormValues) {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('agent_memory_config')
        .upsert({
          agent_id: agentId,
          organization_id: organizationId,
          enable_memory_creation: values.enableMemoryCreation,
          enable_memory_retrieval: values.enableMemoryRetrieval,
          max_memories_to_retrieve: values.maxMemoriesToRetrieve,
          min_relevance_score: values.minRelevanceScore,
          memory_types: values.memoryTypes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'agent_id,organization_id'
        });
      
      if (error) {
        console.error('Error saving agent memory config:', error);
        toast({
          title: 'Error',
          description: 'Failed to save memory configuration',
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'Memory configuration saved successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error saving agent memory config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save memory configuration',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Memory Configuration</CardTitle>
        <CardDescription>
          Configure how this sales agent uses AI memory for customer interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Memory Creation */}
              <FormField
                control={form.control}
                name="enableMemoryCreation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Memory Creation</FormLabel>
                      <FormDescription>
                        Create memories from customer interactions
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Memory Retrieval */}
              <FormField
                control={form.control}
                name="enableMemoryRetrieval"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Memory Retrieval</FormLabel>
                      <FormDescription>
                        Use memories to enhance responses
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            {/* Max Memories */}
            <FormField
              control={form.control}
              name="maxMemoriesToRetrieve"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Memories</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-4">
                      <Slider
                        min={1}
                        max={50}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        disabled={!form.watch('enableMemoryRetrieval')}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        disabled={!form.watch('enableMemoryRetrieval')}
                        className="w-20"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Maximum number of memories to retrieve per interaction
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Relevance Score */}
            <FormField
              control={form.control}
              name="minRelevanceScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Relevance Score</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-4">
                      <Slider
                        min={0}
                        max={1}
                        step={0.05}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        disabled={!form.watch('enableMemoryRetrieval')}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={field.value.toFixed(2)}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        disabled={!form.watch('enableMemoryRetrieval')}
                        className="w-20"
                        step={0.05}
                        min={0}
                        max={1}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Minimum relevance score for memories (0-1)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Memory Types */}
            <FormField
              control={form.control}
              name="memoryTypes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Memory Types</FormLabel>
                    <FormDescription>
                      Select which types of memories to use
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {memoryTypeOptions.map((option) => (
                      <FormField
                        key={option.value}
                        control={form.control}
                        name="memoryTypes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.value}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, option.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== option.value
                                          )
                                        )
                                  }}
                                  disabled={!form.watch('enableMemoryRetrieval')}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
