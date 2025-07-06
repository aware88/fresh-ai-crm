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
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  Box,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Flex,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { FaMemory, FaRobot, FaChartLine, FaCog } from 'react-icons/fa';

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
  
  const supabase = useSupabaseClient();
  const toast = useToast();
  
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
    } catch (error) {
      toast({
        title: 'Error fetching agents',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
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
  const handleAgentChange = (e) => {
    setSelectedAgentId(e.target.value);
  };
  
  return (
    <Box p={6}>
      <Heading size="xl" mb={6}>AI Transparency Dashboard</Heading>
      
      {/* Stats Overview */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <Flex align="center">
                <Icon as={FaMemory} boxSize={6} mr={2} color="blue.500" />
                <StatLabel>Total Memories</StatLabel>
              </Flex>
              <StatNumber>{stats.totalMemories.toLocaleString()}</StatNumber>
              <StatHelpText>Stored AI memories</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <Flex align="center">
                <Icon as={FaChartLine} boxSize={6} mr={2} color="green.500" />
                <StatLabel>Total Activities</StatLabel>
              </Flex>
              <StatNumber>{stats.totalActivities.toLocaleString()}</StatNumber>
              <StatHelpText>Logged agent actions</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <Flex align="center">
                <Icon as={FaRobot} boxSize={6} mr={2} color="purple.500" />
                <StatLabel>Active Agents</StatLabel>
              </Flex>
              <StatNumber>{stats.activeAgents}</StatNumber>
              <StatHelpText>Currently active AI agents</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Agent Selector */}
      {loading ? (
        <Flex justify="center" my={8}>
          <Spinner size="xl" />
        </Flex>
      ) : agents.length === 0 ? (
        <Box textAlign="center" my={8} p={6} borderWidth="1px" borderRadius="lg">
          <Heading size="md" mb={2}>No Agents Found</Heading>
          <Text>No AI agents have been configured yet.</Text>
        </Box>
      ) : (
        <>
          <Flex mb={6} align="center">
            <Text fontWeight="bold" mr={4}>Select Agent:</Text>
            <Select
              value={selectedAgentId}
              onChange={handleAgentChange}
              w="300px"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.agent_type})
                </option>
              ))}
            </Select>
          </Flex>
          
          {/* Main Content Tabs */}
          <Tabs isLazy>
            <TabList>
              <Tab><Icon as={FaMemory} mr={2} /> Memories</Tab>
              <Tab><Icon as={FaChartLine} mr={2} /> Activity Timeline</Tab>
              <Tab><Icon as={FaCog} mr={2} /> Agent Control</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel>
                <MemoryBrowser />
              </TabPanel>
              <TabPanel>
                <ActivityTimeline agentId={selectedAgentId} />
              </TabPanel>
              <TabPanel>
                <AgentControlPanel agentId={selectedAgentId} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </>
      )}
    </Box>
  );
}
