'use client';

import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from 'next-themes';

// Create a custom button component that supports rightIcon
interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(({ 
  rightIcon, 
  children, 
  className,
  ...props 
}, ref) => {
  return (
    <Button ref={ref} {...props}>
      {children}
      {rightIcon && (
        <span className="ml-2">
          {rightIcon}
        </span>
      )}
    </Button>
  );
});

CustomButton.displayName = 'CustomButton';

export default function LandingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="w-full py-6 border-b border-gray-100 dark:border-gray-700">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 6-10 10-10 10S2 18 2 12A10 10 0 0 1 12 2Z"></path>
                  <path d="M12 12v4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </Box>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                CRM MIND
              </Heading>
            </Flex>
            <div className="hidden md:flex items-center gap-6">
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
                <Button variant="outline" className="text-blue-600 hover:text-blue-800 border-blue-600">Dashboard</Button>
              </Link>
            </Box>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <VStack gap={6}>
            <div
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 inline-flex mb-4"
            >
              <p className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                🚀 Coming Soon
              </Text>
            </Box>
            <h1 className="text-5xl font-bold leading-tight max-w-3xl mx-auto">
              AI-Powered CRM MIND for the
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Modern Sales Team
              </Box>
            </Heading>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Transform your customer relationships with our AI-powered CRM MIND that understands
              your customers better than ever before.
            </Text>
            <Box pt={4}>
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <span>Get Started</span>
                  <FiArrowRight className="ml-2" />
                  Get Started
                </CustomButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" id="features">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <div className="flex flex-col items-center gap-12">
            <div className="flex flex-col items-center">
              <p className="text-xl font-bold text-blue-600">FEATURES</p>
              <h2 className="text-4xl font-bold mb-4">Everything you need to succeed</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
                Our AI-powered features help you close more deals and build better relationships.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                <Card
                  key={index}
                  className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md border border-gray-100 dark:border-gray-600 hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-3xl mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </Box>
              ))}
            </div>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <VStack gap={6}>
            <Heading as="h2" size="2xl">Ready to transform your sales process?</Heading>
            <p className="text-xl max-w-2xl mx-auto">
              Join thousands of sales professionals who are already using our AI-powered CRM MIND to close more deals.
            </Text>
            <Box pt={4}>
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/10 hover:bg-white/20 text-white border-white"
                >
                  <span>Get Started for Free</span>
                  <FiArrowRight className="ml-2" />
                  Get Started for Free
                </CustomButton>
              </Link>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 dark:border-gray-700">
        <Container maxW="container.xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 6-10 10-10 10S2 18 2 12A10 10 0 0 1 12 2Z"></path>
                  <path d="M12 12v4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </Box>
              <p className="font-bold text-lg">CRM MIND</Text>
            </Flex>
            <div className="flex gap-6">
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
          <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} CRM MIND. All rights reserved.</Text>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
