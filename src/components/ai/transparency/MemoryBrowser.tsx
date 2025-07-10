/**
 * Memory Browser Component
 * 
 * Allows users to browse, search, and manage AI memories
 */

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  Box,
  Heading,
  Text,
  Input,
  Button,
  Stack,
  Flex,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  IconButton,
  Select,
  useToast,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea
} from '@chakra-ui/react';
import { SearchIcon, DeleteIcon, EditIcon } from '@/components/icons/ChakraIcons';

interface Memory {
  id: string;
  title: string;
  content: string;
  memory_type: string;
  contact_id?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export default function MemoryBrowser() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [memoryTypeFilter, setMemoryTypeFilter] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const supabase = useSupabaseClient();
  const toast = useToast();
  
  // Fetch memories on component mount
  useEffect(() => {
    fetchMemories();
  }, []);
  
  // Fetch memories from the API
  const fetchMemories = async (query = '') => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (memoryTypeFilter) params.append('memoryType', memoryTypeFilter);
      
      const response = await fetch(`/api/ai/transparency/memories?${params.toString()}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setMemories(data.memories || []);
    } catch (error) {
      toast({
        title: 'Error fetching memories',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search
  const handleSearch = () => {
    fetchMemories(searchQuery);
  };
  
  // Handle memory type filter change
  const handleMemoryTypeChange = (e) => {
    setMemoryTypeFilter(e.target.value);
    fetchMemories(searchQuery);
  };
  
  // Open edit modal
  const handleEditClick = (memory: Memory) => {
    setSelectedMemory(memory);
    setEditedContent(memory.content);
    setEditedTitle(memory.title);
    onOpen();
  };
  
  // Save edited memory
  const handleSaveEdit = async () => {
    if (!selectedMemory) return;
    
    try {
      const response = await fetch('/api/ai/transparency/memories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedMemory.id,
          content: editedContent,
          title: editedTitle,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update the memory in the local state
      setMemories(memories.map(m => 
        m.id === selectedMemory.id ? 
          { ...m, content: editedContent, title: editedTitle } : 
          m
      ));
      
      toast({
        title: 'Memory updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error updating memory',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Delete memory
  const handleDeleteMemory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/ai/transparency/memories?id=${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Remove the memory from the local state
      setMemories(memories.filter(m => m.id !== id));
      
      toast({
        title: 'Memory deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting memory',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>Memory Browser</Heading>
      
      {/* Search and filter controls */}
      <Flex mb={4} gap={2}>
        <Input
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          flex={1}
        />
        <Select
          placeholder="Filter by type"
          value={memoryTypeFilter}
          onChange={handleMemoryTypeChange}
          w="200px"
        >
          <option value="">All Types</option>
          <option value="conversation">Conversation</option>
          <option value="contact_info">Contact Info</option>
          <option value="sales_tactic">Sales Tactic</option>
          <option value="product_info">Product Info</option>
        </Select>
        <Button
          leftIcon={<SearchIcon />}
          colorScheme="blue"
          onClick={handleSearch}
        >
          Search
        </Button>
      </Flex>
      
      {/* Memory list */}
      {loading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" />
        </Flex>
      ) : memories.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg">No memories found</Text>
        </Box>
      ) : (
        <Stack spacing={4}>
          {memories.map((memory) => (
            <Card key={memory.id}>
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">{memory.title}</Heading>
                  <Badge colorScheme="blue">{memory.memory_type}</Badge>
                </Flex>
              </CardHeader>
              <CardBody py={2}>
                <Text>{memory.content}</Text>
              </CardBody>
              <CardFooter pt={2} justify="space-between" align="center">
                <Text fontSize="sm" color="gray.500">
                  Created: {formatDate(memory.created_at)}
                </Text>
                <Flex gap={2}>
                  <IconButton
                    aria-label="Edit memory"
                    icon={<EditIcon />}
                    size="sm"
                    onClick={() => handleEditClick(memory)}
                  />
                  <IconButton
                    aria-label="Delete memory"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDeleteMemory(memory.id)}
                  />
                </Flex>
              </CardFooter>
            </Card>
          ))}
        </Stack>
      )}
      
      {/* Edit Memory Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Memory</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <Box>
                <Text mb={1} fontWeight="bold">Title</Text>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </Box>
              <Box>
                <Text mb={1} fontWeight="bold">Content</Text>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={8}
                />
              </Box>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveEdit}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
