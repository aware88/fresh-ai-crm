import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Spinner,
  Text,
  Badge,
  VStack,
  HStack,
  Avatar,
  Divider
} from '@chakra-ui/react';
import { getContactById } from '../../lib/contacts/data';
import { Contact } from '../../lib/contacts/types';
import DisputeTab from '../../components/disputes/DisputeTab';

export default function ContactProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContact() {
      if (!id || typeof id !== 'string') return;
      
      try {
        setLoading(true);
        const contactData = await getContactById(id);
        if (contactData) {
          setContact(contactData);
          setError(null);
        } else {
          setError('Contact not found');
        }
      } catch (err) {
        console.error('Error loading contact:', err);
        setError('Failed to load contact information');
      } finally {
        setLoading(false);
      }
    }

    loadContact();
  }, [id]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={10}>
        <Flex direction="column" align="center" justify="center" h="50vh">
          <Spinner size="xl" />
          <Text mt={4}>Loading contact information...</Text>
        </Flex>
      </Container>
    );
  }

  if (error || !contact) {
    return (
      <Container maxW="container.xl" py={10}>
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="red.50">
          <Heading size="md" color="red.500">Error</Heading>
          <Text mt={2}>{error || 'Contact information not available'}</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Box mb={8}>
        <Flex align="center" mb={6}>
          <Avatar 
            size="xl" 
            name={`${contact.firstName} ${contact.lastName}`} 
            mr={6}
          />
          <VStack align="start" spacing={1}>
            <Heading size="lg">
              {contact.firstName} {contact.lastName}
            </Heading>
            <Text color="gray.600">{contact.email}</Text>
            {contact.company && (
              <Text color="gray.600">{contact.company}</Text>
            )}
            {contact.personalityType && (
              <Badge colorScheme="purple" mt={2}>
                {contact.personalityType}
              </Badge>
            )}
          </VStack>
        </Flex>
        
        <Divider my={4} />
        
        <Tabs variant="enclosed">
          <TabList>
            <Tab>Profile</Tab>
            <Tab>Interactions</Tab>
            <Tab>Personality</Tab>
            <Tab>Dispute Resolver</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
                <VStack align="start" spacing={4}>
                  <Box width="100%">
                    <Heading size="sm" mb={2}>Contact Information</Heading>
                    <HStack spacing={8}>
                      <VStack align="start">
                        <Text fontWeight="bold">Email</Text>
                        <Text>{contact.email}</Text>
                      </VStack>
                      {contact.company && (
                        <VStack align="start">
                          <Text fontWeight="bold">Company</Text>
                          <Text>{contact.company}</Text>
                        </VStack>
                      )}
                    </HStack>
                  </Box>
                  
                  <Divider />
                  
                  <Box width="100%">
                    <Heading size="sm" mb={2}>Additional Information</Heading>
                    <Text>
                      {contact.additionalInfo || 'No additional information available.'}
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </TabPanel>
            
            <TabPanel>
              <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
                <Heading size="sm" mb={4}>Recent Interactions</Heading>
                {contact.lastInteractionDate ? (
                  <Text>
                    Last interaction: {new Date(contact.lastInteractionDate).toLocaleDateString()}
                  </Text>
                ) : (
                  <Text>No recent interactions recorded.</Text>
                )}
              </Box>
            </TabPanel>
            
            <TabPanel>
              <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
                <Heading size="sm" mb={4}>Personality Profile</Heading>
                {contact.personalityType ? (
                  <VStack align="start" spacing={4}>
                    <Box>
                      <Text fontWeight="bold">Personality Type</Text>
                      <Badge colorScheme="purple" mt={1}>
                        {contact.personalityType}
                      </Badge>
                    </Box>
                    
                    {contact.personalityNotes && (
                      <Box>
                        <Text fontWeight="bold">Personality Notes</Text>
                        <Text mt={1}>{contact.personalityNotes}</Text>
                      </Box>
                    )}
                  </VStack>
                ) : (
                  <Text>No personality data available for this contact.</Text>
                )}
              </Box>
            </TabPanel>
            
            <TabPanel>
              <DisputeTab contact={contact} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
}
