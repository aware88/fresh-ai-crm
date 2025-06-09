import React from 'react';
import { Box, Container, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import LogoUploader from '../../components/settings/LogoUploader';

const SettingsPage: React.FC = () => {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading mb={2}>Settings</Heading>
          <Text color="gray.600">
            Customize your AI CRM system settings
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <LogoUploader />
          
          {/* Additional settings components can be added here */}
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default SettingsPage;
