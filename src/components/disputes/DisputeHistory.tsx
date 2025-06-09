import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { DisputeDetails, DisputeStatus } from '../../lib/disputes/types';
import { Contact } from '../../lib/contacts/types';

interface DisputeHistoryProps {
  contact: Contact;
}

const DisputeHistory: React.FC<DisputeHistoryProps> = ({ contact }) => {
  const [disputes, setDisputes] = useState<DisputeDetails[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/disputes?contactId=${contact.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch disputes');
        }
        const allDisputes = await response.json();
        // Filter disputes for this contact
        const contactDisputes = allDisputes.filter(
          (dispute: DisputeDetails) => dispute.contactId === contact.id
        );
        setDisputes(contactDisputes);
        setError(null);
      } catch (err) {
        console.error('Error fetching disputes:', err);
        setError('Failed to load dispute history');
      } finally {
        setIsLoading(false);
      }
    };

    if (contact.id) {
      fetchDisputes();
    }
  }, [contact.id]);

  const handleViewDetails = (dispute: DisputeDetails) => {
    setSelectedDispute(dispute);
    onOpen();
  };

  const getStatusBadge = (status: DisputeStatus) => {
    const statusProps = {
      [DisputeStatus.OPEN]: { colorScheme: 'red', text: 'Open' },
      [DisputeStatus.IN_PROGRESS]: { colorScheme: 'yellow', text: 'In Progress' },
      [DisputeStatus.RESOLVED]: { colorScheme: 'green', text: 'Resolved' },
      [DisputeStatus.ESCALATED]: { colorScheme: 'purple', text: 'Escalated' }
    };

    const { colorScheme, text } = statusProps[status];
    return <Badge colorScheme={colorScheme}>{text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading dispute history...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>Dispute History</Heading>

      {disputes.length === 0 ? (
        <Text>No dispute history found for this contact.</Text>
      ) : (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Category</Th>
              <Th>Severity</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {disputes.map((dispute) => (
              <Tr key={dispute.id}>
                <Td>{formatDate(dispute.createdAt)}</Td>
                <Td>{dispute.category.replace(/_/g, ' ')}</Td>
                <Td>{dispute.severity}</Td>
                <Td>{getStatusBadge(dispute.status)}</Td>
                <Td>
                  <Button size="xs" onClick={() => handleViewDetails(dispute)}>
                    View Details
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {selectedDispute && (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Dispute Details - {selectedDispute.category.replace(/_/g, ' ')}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Box mb={4}>
                <Text fontWeight="bold">Status: </Text>
                {getStatusBadge(selectedDispute.status)}
              </Box>
              
              <Box mb={4}>
                <Text fontWeight="bold">Description:</Text>
                <Text>{selectedDispute.description}</Text>
              </Box>
              
              <Box mb={4}>
                <Text fontWeight="bold">Context:</Text>
                <Text>{selectedDispute.context}</Text>
              </Box>
              
              <Box mb={4}>
                <Text fontWeight="bold">Desired Outcome:</Text>
                <Text>{selectedDispute.desiredOutcome}</Text>
              </Box>
              
              {selectedDispute.resolutionNotes && (
                <Box mb={4}>
                  <Text fontWeight="bold">Resolution Notes:</Text>
                  <Text>{selectedDispute.resolutionNotes}</Text>
                </Box>
              )}
              
              {selectedDispute.resolvedAt && (
                <Box mb={4}>
                  <Text fontWeight="bold">Resolved On:</Text>
                  <Text>{formatDate(selectedDispute.resolvedAt)}</Text>
                </Box>
              )}
              
              {selectedDispute.resolutionStrategy && (
                <Button 
                  colorScheme="blue" 
                  mt={4} 
                  onClick={onClose}
                >
                  View Resolution Strategy
                </Button>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default DisputeHistory;
