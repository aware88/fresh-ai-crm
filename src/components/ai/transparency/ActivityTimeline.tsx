/**
 * Activity Timeline Component
 * 
 * Displays a timeline of agent activities with context
 */

import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { TimeIcon, ChevronDownIcon, ChevronUpIcon } from '@/components/icons/ChakraIcons';
import { FaRobot, FaComment, FaExclamationTriangle, FaLightbulb, FaCog } from 'react-icons/fa';

interface Activity {
  id: string;
  agent_id: string;
  activity_type: string;
  description: string;
  related_entity_type?: string;
  related_entity_id?: string;
  metadata?: any;
  created_at: string;
}

interface Thought {
  id: string;
  agent_id: string;
  activity_id: string;
  thought_step: number;
  reasoning: string;
  alternatives?: any[];
  confidence?: number;
  created_at: string;
}

export default function ActivityTimeline({ agentId }: { agentId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [thoughts, setThoughts] = useState<Record<string, Thought[]>>({});
  const [loading, setLoading] = useState(true);
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
  
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  
  // Fetch activities on component mount
  useEffect(() => {
    if (agentId) {
      fetchActivities();
    }
  }, [agentId]);
  
  // Fetch activities from the API
  const fetchActivities = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('agentId', agentId);
      if (activityTypeFilter) params.append('activityType', activityTypeFilter);
      
      const response = await fetch(`/api/ai/transparency/activities?${params.toString()}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setActivities(data.activities || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error fetching activities',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch thoughts for an activity
  const fetchThoughts = async (activityId: string) => {
    // If we already have thoughts for this activity, don't fetch again
    if (thoughts[activityId]) {
      return;
    }
    
    try {
      const params = new URLSearchParams();
      params.append('activityId', activityId);
      
      const response = await fetch(`/api/ai/transparency/thoughts?${params.toString()}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setThoughts(prev => ({
        ...prev,
        [activityId]: data.thoughts || []
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error fetching thoughts',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };
  
  // Handle activity type filter change
  const handleActivityTypeChange = (value: string) => {
    setActivityTypeFilter(value);
    fetchActivities();
  };
  
  // Toggle activity details
  const toggleActivityDetails = (activityId: string) => {
    if (selectedActivity === activityId) {
      setSelectedActivity(null);
    } else {
      setSelectedActivity(activityId);
      fetchThoughts(activityId);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get icon for activity type
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'process_message':
      case 'response_generated':
        return FaComment;
      case 'error':
        return FaExclamationTriangle;
      case 'decision':
        return FaLightbulb;
      case 'config_change':
        return FaCog;
      default:
        return FaRobot;
    }
  };
  
  // Get color for activity type
  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'process_message':
        return 'blue';
      case 'response_generated':
        return 'green';
      case 'error':
        return 'red';
      case 'decision':
        return 'purple';
      case 'config_change':
        return 'orange';
      default:
        return 'gray';
    }
  };
  
  return (
    <div className="p-4 border rounded-lg bg-white shadow-md">
      <h2 className="text-2xl font-bold mb-4">
        AI Activity Timeline
      </h2>
      
      <div className="flex justify-between items-center mb-4">
        <Select
          value={activityTypeFilter}
          onValueChange={handleActivityTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by activity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Activities</SelectItem>
            <SelectItem value="process_message">Process Message</SelectItem>
            <SelectItem value="response_generated">Response Generated</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="decision">Decision</SelectItem>
            <SelectItem value="config_change">Config Change</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="default"
          onClick={fetchActivities}
        >
          Refresh
        </Button>
      </div>
      
      {/* Activity list */}
      {loading ? (
        <div className="flex justify-center items-center h-[200px]">
          <Spinner size="lg" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg">No activities found</p>
          <div className="mt-4">
            <Button variant="default" onClick={fetchActivities}>Refresh</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {React.createElement(getActivityIcon(activity.activity_type), {
                      className: `w-5 h-5 text-${getActivityColor(activity.activity_type)}-500`
                    })}
                    <h3 className="text-md font-medium">{activity.description}</h3>
                  </div>
                  <Badge variant="outline">{activity.activity_type}</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="py-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 flex items-center">
                    <TimeIcon className="mr-1 h-4 w-4" />
                    {formatDate(activity.created_at)}
                  </div>
                  {activity.related_entity_type && (
                    <Badge variant="secondary">
                      {activity.related_entity_type}: {activity.related_entity_id}
                    </Badge>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 flex justify-center">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex items-center gap-1"
                  onClick={() => toggleActivityDetails(activity.id)}
                >
                  {selectedActivity === activity.id ? 'Hide Details' : 'Show Details'}
                  {selectedActivity === activity.id ? 
                    <ChevronUpIcon className="h-4 w-4" /> : 
                    <ChevronDownIcon className="h-4 w-4" />
                  }
                </Button>
              </CardFooter>
              
              {/* Thought process details */}
              {selectedActivity === activity.id && (
                <div className="px-4 pb-4">
                  <Separator className="mb-4" />
                  <h4 className="text-sm font-semibold mb-2">Thought Process</h4>
                  
                  {!thoughts[activity.id] ? (
                    <div className="flex justify-center py-4">
                      <Spinner />
                    </div>
                  ) : thoughts[activity.id].length === 0 ? (
                    <p className="text-sm text-gray-500">No thought process recorded for this activity.</p>
                  ) : (
                    <div className="space-y-3">
                      {thoughts[activity.id].map((thought) => (
                        <div 
                          key={thought.id} 
                          className="p-3 border rounded-md bg-gray-50"
                        >
                          <div className="flex justify-between mb-1">
                            <p className="font-bold">Step {thought.thought_step}</p>
                            {thought.confidence !== undefined && (
                              <Badge variant={thought.confidence > 0.7 ? 'default' : 'secondary'}>
                                Confidence: {Math.round(thought.confidence * 100)}%
                              </Badge>
                            )}
                          </div>
                          <p>{thought.reasoning}</p>
                          
                          {thought.alternatives && thought.alternatives.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-bold">Alternatives Considered:</p>
                              <div className="mt-1 space-y-1">
                                {thought.alternatives.map((alt, index) => (
                                  <p key={index} className="text-sm">
                                    • {typeof alt === 'string' ? alt : JSON.stringify(alt)}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
