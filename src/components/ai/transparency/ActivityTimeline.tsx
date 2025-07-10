/**
 * Activity Timeline Component
 * 
 * Displays a timeline of agent activities with context
 */

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Stack,
  Badge,
  Button,
  Select,
  useToast,
  Spinner,
  Divider,
  Icon,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Collapse,
  useDisclosure
} from '@chakra-ui/react';
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
  const toast = useToast();
  
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
      toast({
        title: 'Error fetching activities',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
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
      toast({
        title: 'Error fetching thoughts',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle activity type filter change
  const handleActivityTypeChange = (e) => {
    setActivityTypeFilter(e.target.value);
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
    <Box p={4}>
      <Heading size="lg" mb={4}>Agent Activity Timeline</Heading>
      
      {/* Filter controls */}
      <Flex mb={4} gap={2}>
        <Select
          placeholder="Filter by activity type"
          value={activityTypeFilter}
          onChange={handleActivityTypeChange}
          w="250px"
        >
          <option value="">All Activities</option>
          <option value="process_message">Process Message</option>
          <option value="response_generated">Response Generated</option>
          <option value="error">Error</option>
          <option value="decision">Decision</option>
          <option value="config_change">Config Change</option>
        </Select>
        <Button
          colorScheme="blue"
          onClick={fetchActivities}
        >
          Refresh
        </Button>
      </Flex>
      
      {/* Activity list */}
      {loading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" />
        </Flex>
      ) : activities.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg">No activities found</Text>
        </Box>
      ) : (
        <Stack spacing={4}>
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={2}>
                    <Icon 
                      as={getActivityIcon(activity.activity_type)} 
                      boxSize={5} 
                      color={`${getActivityColor(activity.activity_type)}.500`}
                    />
                    <Heading size="md">{activity.description}</Heading>
                  </Flex>
                  <Badge colorScheme={getActivityColor(activity.activity_type)}>
                    {activity.activity_type}
                  </Badge>
                </Flex>
              </CardHeader>
              
              <CardBody py={2}>
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">
                    <TimeIcon mr={1} />
                    {formatDate(activity.created_at)}
                  </Text>
                  {activity.related_entity_type && (
                    <Badge>
                      {activity.related_entity_type}: {activity.related_entity_id}
                    </Badge>
                  )}
                </Flex>
              </CardBody>
              
              <CardFooter pt={2} justify="center">
                <Button
                  size="sm"
                  variant="ghost"
                  rightIcon={selectedActivity === activity.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  onClick={() => toggleActivityDetails(activity.id)}
                >
                  {selectedActivity === activity.id ? 'Hide Details' : 'Show Details'}
                </Button>
              </CardFooter>
              
              {/* Thought process details */}
              <Collapse in={selectedActivity === activity.id}>
                <Box px={4} pb={4}>
                  <Divider mb={4} />
                  <Heading size="sm" mb={2}>Thought Process</Heading>
                  
                  {!thoughts[activity.id] ? (
                    <Flex justify="center" py={4}>
                      <Spinner />
                    </Flex>
                  ) : thoughts[activity.id].length === 0 ? (
                    <Text fontSize="sm" color="gray.500">No thought process recorded for this activity.</Text>
                  ) : (
                    <Stack spacing={3}>
                      {thoughts[activity.id].map((thought) => (
                        <Box 
                          key={thought.id} 
                          p={3} 
                          borderWidth="1px" 
                          borderRadius="md"
                          bg="gray.50"
                        >
                          <Flex justify="space-between" mb={1}>
                            <Text fontWeight="bold">Step {thought.thought_step}</Text>
                            {thought.confidence !== undefined && (
                              <Badge colorScheme={thought.confidence > 0.7 ? 'green' : 'yellow'}>
                                Confidence: {Math.round(thought.confidence * 100)}%
                              </Badge>
                            )}
                          </Flex>
                          <Text>{thought.reasoning}</Text>
                          
                          {thought.alternatives && thought.alternatives.length > 0 && (
                            <Box mt={2}>
                              <Text fontSize="sm" fontWeight="bold">Alternatives Considered:</Text>
                              <Stack mt={1}>
                                {thought.alternatives.map((alt, index) => (
                                  <Text key={index} fontSize="sm">
                                    • {typeof alt === 'string' ? alt : JSON.stringify(alt)}
                                  </Text>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Collapse>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
