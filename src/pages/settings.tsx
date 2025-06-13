import React from 'react';
import Head from 'next/head';
import NextLink from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Link,
  Flex,
} from '@chakra-ui/react';

export default function Settings() {
  return (
    <>
      <Head>
        <title>Settings | CRM MIND</title>
      </Head>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Heading as="h1" size="xl" mb={2}>Settings</Heading>
          <Text color="gray.600">Customize your CRM MIND system settings</Text>
        </Box>

        <Flex direction="column" gap={6}>
          <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
            <Heading size="md" mb={4}>Company Settings</Heading>
            <Text mb={4}>
              Company settings are temporarily unavailable during this deployment.
            </Text>
            <Text fontSize="sm" color="gray.500">
              Logo upload and company website scanning features will be restored in the next update.
            </Text>
          </Box>
          
          <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
            <Heading size="md" mb={4}>User Preferences</Heading>
            <Text mb={4}>
              User preference settings are temporarily unavailable during this deployment.
            </Text>
            <Text fontSize="sm" color="gray.500">
              User preferences will be restored in the next update.
            </Text>
          </Box>
        </Flex>
        
        <Box mt={8}>
          <NextLink href="/" passHref>
            <Button as={Link} colorScheme="blue">
              Back to Dashboard
            </Button>
          </NextLink>
        </Box>
      </Container>
    </>
  );
}
