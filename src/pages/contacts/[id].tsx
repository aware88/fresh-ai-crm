import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Heading,
  Flex,
  Spinner,
  Text,
  Badge
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
          <Text 
            fontSize="xl" 
            fontWeight="bold" 
            mr={6}
          >
            {contact.firstName} {contact.lastName}
          </Text>
          <Flex align="start" gap={1}>
            <Text color="gray.600">{contact.email}</Text>
            {contact.company && (
              <Text color="gray.600">{contact.company}</Text>
            )}
            {contact.personalityType && (
              <Badge colorScheme="purple" mt={2}>
                {contact.personalityType}
              </Badge>
            )}
          </Flex>
        </Flex>
        
        <DisputeTab contact={contact} />
      </Box>
    </Container>
  );
}
