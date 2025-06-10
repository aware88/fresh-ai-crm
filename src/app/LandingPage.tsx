'use client';

import { Button, Container, Flex, Heading, Text, VStack, Box, SimpleGrid, Icon, ButtonProps } from '@chakra-ui/react';
import { useColorModeValue } from '@chakra-ui/color-mode';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import React, { forwardRef } from 'react';

// Create a custom button component that supports rightIcon
interface CustomButtonProps extends ButtonProps {
  rightIcon?: React.ReactNode;
}

const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(({ 
  rightIcon, 
  children, 
  ...props 
}, ref) => {
  return (
    <Button ref={ref} {...props}>
      {children}
      {rightIcon && (
        <Box as="span" ml={2}>
          {rightIcon}
        </Box>
      )}
    </Button>
  );
});

CustomButton.displayName = 'CustomButton';

export default function LandingPage() {
  const bgGradient = useColorModeValue(
    'linear(to-r, blue.50, white, blue.50)',
    'linear(to-r, gray.900, gray.800, gray.900)'
  );

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      {/* Header */}
      <Box as="header" w="full" py={6} borderBottomWidth="1px" borderColor="gray.100" _dark={{ borderColor: 'gray.700' }}>
        <Container maxW="container.xl">
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={3}>
              <Box w={10} h={10} rounded="full" bgGradient="linear(to-r, blue.500, indigo.500)" display="flex" alignItems="center" justifyContent="center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 6-10 10-10 10S2 18 2 12A10 10 0 0 1 12 2Z"></path>
                  <path d="M12 12v4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </Box>
              <Heading size="lg" bgGradient="linear(to-r, blue.500, indigo.500)" bgClip="text">
                AI CRM
              </Heading>
            </Flex>
            <Box display={{ base: 'none', md: 'flex' }} alignItems="center" gap={6}>
              <Link href="#features">
                <Button variant="ghost" colorScheme="blue">Features</Button>
              </Link>
              <Link href="#science">
                <Button variant="ghost" colorScheme="blue">Science</Button>
              </Link>
              <Link href="#benefits">
                <Button variant="ghost" colorScheme="blue">Benefits</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" colorScheme="blue">Dashboard</Button>
              </Link>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box as="section" py={20}>
        <Container maxW="container.lg" textAlign="center">
          <VStack gap={6}>
            <Box
              px={4}
              py={1.5}
              rounded="full"
              bgGradient="linear(to-r, blue.50, indigo.50)"
              display="inline-flex"
              mb={4}
            >
              <Text fontSize="sm" fontWeight="medium" bgGradient="linear(to-r, blue.600, indigo.600)" bgClip="text">
                🚀 Coming Soon
              </Text>
            </Box>
            <Heading as="h1" size="3xl" lineHeight="1.2" maxW="3xl" mx="auto">
              AI-Powered CRM for the
              <Box as="span" display="block" bgGradient="linear(to-r, blue.600, indigo.600)" bgClip="text">
                Modern Sales Team
              </Box>
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl" mx="auto">
              Transform your customer relationships with our AI-powered CRM that understands
              your customers better than ever before.
            </Text>
            <Box pt={4}>
              <Link href="/dashboard">
                <CustomButton 
                  as="a"
                  size="lg" 
                  colorScheme="blue"
                  rightIcon={<FiArrowRight />}
                >
                  Get Started
                </CustomButton>
              </Link>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box as="section" id="features" py={20} bg={useColorModeValue('white', 'gray.800')}>
        <Container maxW="container.xl">
          <VStack gap={16}>
            <VStack gap={4} textAlign="center" maxW="3xl" mx="auto">
              <Text color="blue.500" fontWeight="semibold">FEATURES</Text>
              <Heading as="h2" size="2xl">Everything you need to succeed</Heading>
              <Text fontSize="lg" color="gray.500">
                Our AI-powered features help you close more deals and build better relationships.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8} w="full">
              {[
                {
                  title: 'AI-Powered Insights',
                  description: 'Get actionable insights about your customers and leads.',
                  icon: '🔍',
                },
                {
                  title: 'Smart Follow-ups',
                  description: 'Never miss an opportunity with intelligent follow-up reminders.',
                  icon: '⏰',
                },
                {
                  title: 'Email Integration',
                  description: 'Connect your email and manage all communications in one place.',
                  icon: '📧',
                },
                {
                  title: 'Analytics Dashboard',
                  description: 'Track your sales performance with beautiful, easy-to-read dashboards.',
                  icon: '📊',
                },
                {
                  title: 'Team Collaboration',
                  description: 'Work seamlessly with your team on deals and accounts.',
                  icon: '👥',
                },
                {
                  title: 'Mobile App',
                  description: 'Manage your pipeline on the go with our mobile app.',
                  icon: '📱',
                },
              ].map((feature, index) => (
                <Box
                  key={index}
                  p={6}
                  bg={useColorModeValue('white', 'gray.700')}
                  rounded="lg"
                  shadow="md"
                  borderWidth="1px"
                  borderColor={useColorModeValue('gray.100', 'gray.600')}
                  _hover={{
                    transform: 'translateY(-5px)',
                    shadow: 'lg',
                    transition: 'all 0.3s',
                  }}
                >
                  <Box fontSize="3xl" mb={4}>
                    {feature.icon}
                  </Box>
                  <Heading as="h3" size="md" mb={2}>
                    {feature.title}
                  </Heading>
                  <Text color={useColorModeValue('gray.600', 'gray.300')}>
                    {feature.description}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box as="section" py={20} bgGradient="linear(to-r, blue.600, indigo.600)" color="white">
        <Container maxW="4xl" textAlign="center">
          <VStack gap={6}>
            <Heading as="h2" size="2xl">Ready to transform your sales process?</Heading>
            <Text fontSize="xl" maxW="2xl" mx="auto">
              Join thousands of sales professionals who are already using our AI-powered CRM to close more deals.
            </Text>
            <Box pt={4}>
              <Link href="/dashboard">
                <CustomButton 
                  as="a"
                  size="lg" 
                  colorScheme="whiteAlpha" 
                  rightIcon={<FiArrowRight />}
                >
                  Get Started for Free
                </CustomButton>
              </Link>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box as="footer" py={8} borderTopWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
        <Container maxW="container.xl">
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center">
            <Flex align="center" gap={3} mb={{ base: 4, md: 0 }}>
              <Box w={8} h={8} rounded="full" bgGradient="linear(to-r, blue.500, indigo.500)" display="flex" alignItems="center" justifyContent="center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 6-10 10-10 10S2 18 2 12A10 10 0 0 1 12 2Z"></path>
                  <path d="M12 12v4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </Box>
              <Text fontWeight="bold" fontSize="lg">AI CRM</Text>
            </Flex>
            <Flex gap={6}>
              <Link href="#features">
                <Button variant="ghost" colorScheme="blue">Features</Button>
              </Link>
              <Link href="#science">
                <Button variant="ghost" colorScheme="blue">Science</Button>
              </Link>
              <Link href="#benefits">
                <Button variant="ghost" colorScheme="blue">Benefits</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" colorScheme="blue">Dashboard</Button>
              </Link>
            </Flex>
          </Flex>
          <Box mt={8} textAlign="center" color={useColorModeValue('gray.500', 'gray.400')}>
            <Text>&copy; {new Date().getFullYear()} AI CRM. All rights reserved.</Text>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
