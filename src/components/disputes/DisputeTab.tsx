import React, { useState } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  Text,
  Button,
  Flex
} from '@chakra-ui/react';
import DisputeResolver from './DisputeResolver';
import DisputeHistory from './DisputeHistory';
import { Contact } from '../../lib/contacts/types';

interface DisputeTabProps {
  contact: Contact;
}

const DisputeTab: React.FC<DisputeTabProps> = ({ contact }) => {
  const [tabIndex, setTabIndex] = useState(0);

  // Check if contact has personality data
  const hasPersonalityData = Boolean(contact.personalityType || contact.personalityNotes);

  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Dispute Resolution</Heading>
      </Flex>

      {!hasPersonalityData ? (
        <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
          <Text mb={4}>
            Personality data is required to generate personalized dispute resolution strategies.
            Please analyze this contact's emails first to generate personality insights.
          </Text>
          <Button colorScheme="blue" size="sm">
            Analyze Personality
          </Button>
        </Box>
      ) : (
        <Tabs index={tabIndex} onChange={setTabIndex} variant="enclosed">
          <TabList>
            <Tab>New Resolution</Tab>
            <Tab>History</Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0} pt={4}>
              <DisputeResolver contact={contact} />
            </TabPanel>
            <TabPanel p={0} pt={4}>
              <DisputeHistory contact={contact} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

export default DisputeTab;
