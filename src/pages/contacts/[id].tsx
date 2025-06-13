import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getContactById } from '../../lib/contacts/data';
import { Contact } from '../../lib/contacts/types';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Badge,
  Spinner,
} from '@chakra-ui/react';

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
      <Flex justify="center" align="center" minH="200px">
        <Spinner mr={4} />
        <Text fontSize="lg">Loading contact...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8} textAlign="center">
        <Box p={4} bg="red.50" borderRadius="md" borderWidth="1px" borderColor="red.200">
          <Heading size="md" color="red.500" mb={2}>Error</Heading>
          <Text>{error}</Text>
        </Box>
      </Container>
    );
  }

  if (!contact) {
    return (
      <Container maxW="container.xl" py={8} textAlign="center">
        <Heading size="lg" mb={4}>Contact Not Found</Heading>
        <Text>The requested contact could not be found.</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
        <Box mb={6}>
          <Flex direction={{ base: "column", md: "row" }} gap={4}>
            <Heading size="lg">
              {contact.firstName} {contact.lastName}
            </Heading>
            <Box>
              <Text color="gray.600">{contact.email}</Text>
              {contact.company && (
                <Text color="gray.600">{contact.company}</Text>
              )}
              {contact.personalityType && (
                <Badge colorScheme="purple" mt={2}>
                  {contact.personalityType}
                </Badge>
              )}
            </Box>
          </Flex>
        </Box>
        
        <Box p={6} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
          <Heading size="md" mb={4}>
            Contact Information
          </Heading>
          <Text mb={4}>
            Dispute resolution features are temporarily unavailable during this deployment.
          </Text>
          <Text fontSize="sm" color="gray.500">
            Full contact management features will be restored in the next update.
          </Text>
        </Box>
      </Box>
    </Container>
  );
}
