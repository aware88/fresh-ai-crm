'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Sparkles, 
  Zap, 
  Target, 
  Users, 
  Package, 
  ShoppingCart, 
  UserCheck,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  Rocket,
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  BarChart3,
  Database,
  Cpu,
  Shield
} from 'lucide-react';
import AIFutureChat from '@/components/ai/AIFutureChat';
import AIFutureSubscriptionGate from '@/components/ai/AIFutureSubscriptionGate';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';

export default function AIFuturePage() {
  const [activeTab, setActiveTab] = useState('chat');
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const { data: session } = useSession();
  const { organization } = useOrganization();
  
  // Fetch organization ID from user preferences if organization context is not available
  useEffect(() => {
    const fetchUserOrgId = async () => {
      if (organization?.id) {
        setUserOrgId(organization.id);
        return;
      }
      
      if (session?.user && !userOrgId) {
        try {
          const response = await fetch('/api/user/preferences');
          if (response.ok) {
            const preferences = await response.json();
            if (preferences.current_organization_id) {
              setUserOrgId(preferences.current_organization_id);
            }
          }
        } catch (error) {
          console.error('Error fetching user preferences:', error);
        }
      }
    };
    
    fetchUserOrgId();
  }, [session, organization, userOrgId]);
  
  // Get organization ID for subscription checking
  const organizationId = organization?.id || 
                         userOrgId || 
                         (session?.user as any)?.organizationId;
  
  // Check subscription features
  const { 
    features, 
    plan, 
    isLoading: isLoadingFeatures 
  } = useSubscriptionFeatures(organizationId || '');
  
  // Check if user has access to CRM Assistant
  const hasAIFutureAccess = features?.AI_FUTURE_ACCESS?.enabled || false;
  const currentPlanName = plan?.name?.toLowerCase() || 'starter';
  
  // Show subscription gate if no access
  if (!isLoadingFeatures && !hasAIFutureAccess) {
    return (
      <AIFutureSubscriptionGate 
        currentPlan={currentPlanName}
        organizationId={organizationId}
      />
    );
  }
  
  // Show loading state
  if (isLoadingFeatures) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 animate-pulse text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading CRM Assistant...</p>
        </div>
      </div>
    );
  }

  const capabilities = [
    {
      icon: Users,
      title: 'Supplier Management',
      description: 'Add, update, and find suppliers with natural language',
      examples: [
        'Add TechCorp supplier with email info@tech.com',
        'Show me suppliers with reliability score above 8',
        'Update GreenTech\'s phone number to 555-1234'
      ]
    },
    {
      icon: Package,
      title: 'Product Catalog',
      description: 'Manage your entire product inventory conversationally',
      examples: [
        'Add iPhone 15 product for $999 in Electronics category',
        'Find all products from TechCorp supplier',
        'Show me products with low inventory levels'
      ]
    },
    {
      icon: UserCheck,
      title: 'Contact Management',
      description: 'Handle contacts and relationships intelligently',
      examples: [
        'Add John Smith from Microsoft as CTO',
        'Find all contacts who haven\'t been contacted in 30 days',
        'Show me contacts from companies that are also suppliers'
      ]
    },
    {
      icon: ShoppingCart,
      title: 'Order Processing',
      description: 'Create and manage orders through conversation',
      examples: [
        'Create order for john@example.com with 5 iPhone units',
        'Show me all pending orders from last week',
        'Find orders above $1000 from TechCorp customers'
      ]
    },
    {
      icon: BarChart3,
      title: 'Business Analytics',
      description: 'Get insights and reports instantly',
      examples: [
        'Analyze sales trends for the past quarter',
        'Compare supplier performance metrics',
        'Show me revenue breakdown by product category'
      ]
    },
    {
      icon: Database,
      title: 'Cross-Entity Queries',
      description: 'Complex operations across multiple data types',
      examples: [
        'Show products from suppliers with reliability > 8',
        'Find customers who bought from our top 3 suppliers',
        'List contacts from companies with pending orders'
      ]
    }
  ];

  const aiFeatures = [
    {
      icon: Brain,
      title: 'Thinking Agent',
      description: 'See AI\'s reasoning process in real-time',
      color: 'text-blue-600'
    },
    {
      icon: Target,
      title: 'Confidence Scoring',
      description: 'Know how sure AI is about each response',
      color: 'text-green-600'
    },
    {
      icon: Cpu,
      title: 'Memory & Learning',
      description: 'AI remembers and learns from interactions',
      color: 'text-purple-600'
    },
    {
      icon: Shield,
      title: 'Smart Validation',
      description: 'Prevents errors with intelligent checks',
      color: 'text-orange-600'
    }
  ];

  const stats = [
    { label: 'Faster Data Entry', value: '10x', icon: Zap },
    { label: 'Training Reduction', value: '90%', icon: TrendingUp },
    { label: 'Error Reduction', value: '95%', icon: CheckCircle },
    { label: 'User Satisfaction', value: '98%', icon: Star }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-start)] via-[var(--brand-mid)] to-[var(--brand-end)] opacity-10 rounded-2xl"></div>
        <div className="relative p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-[var(--brand-start)] to-[var(--brand-end)] rounded-full">
              <div className="relative">
                <Brain className="h-8 w-8 text-white" />
                <Sparkles className="w-5 h-5 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--brand-start)] via-[var(--brand-mid)] to-[var(--brand-end)] bg-clip-text text-transparent">
                CRM Assistant
              </h1>
              <p className="text-lg text-gray-600 mt-1">Your Intelligent Business Partner</p>
            </div>
          </div>
          
          <p className="text-xl text-gray-700 mb-6 max-w-3xl mx-auto">
            Manage your entire business through natural language. No forms, no clicking through pages, 
            just conversation with an AI that thinks, learns, and acts like your business partner.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border">
                <stat.icon className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                <span className="font-bold" style={{ color: 'var(--accent-color)' }}>{stat.value}</span>
                <span className="text-sm text-gray-600">{stat.label}</span>
              </div>
            ))}
          </div>


        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8 p-1 rounded-xl shadow-inner border" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 5%, white)', borderColor: 'color-mix(in srgb, var(--accent-color) 15%, white)' }}>
          <TabsTrigger 
            value="chat" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--brand-start)] data-[state=active]:to-[var(--brand-end)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--accent-color)_10%,white)] data-[state=active]:hover:from-[var(--brand-start)] data-[state=active]:hover:to-[var(--brand-end)]"
          >
            <MessageSquare className="h-4 w-4" /> AI Chat
          </TabsTrigger>
          <TabsTrigger 
            value="capabilities" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--brand-start)] data-[state=active]:to-[var(--brand-end)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--accent-color)_10%,white)] data-[state=active]:hover:from-[var(--brand-start)] data-[state=active]:hover:to-[var(--brand-end)]"
          >
            <Rocket className="h-4 w-4" /> Capabilities
          </TabsTrigger>
          <TabsTrigger 
            value="features" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--brand-start)] data-[state=active]:to-[var(--brand-end)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--accent-color)_10%,white)] data-[state=active]:hover:from-[var(--brand-start)] data-[state=active]:hover:to-[var(--brand-end)]"
          >
            <Sparkles className="h-4 w-4" /> Features
          </TabsTrigger>
          <TabsTrigger 
            value="examples" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--brand-start)] data-[state=active]:to-[var(--brand-end)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--accent-color)_10%,white)] data-[state=active]:hover:from-[var(--brand-start)] data-[state=active]:hover:to-[var(--brand-end)]"
          >
            <Target className="h-4 w-4" /> Examples
          </TabsTrigger>
        </TabsList>

        {/* AI Chat Tab */}
        <TabsContent value="chat" className="mt-0">
          <AIFutureChat />
        </TabsContent>

        {/* Capabilities Tab */}
        <TabsContent value="capabilities" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                      <capability.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{capability.title}</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">
                    {capability.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Try these examples:</h4>
                    {capability.examples.map((example, exampleIndex) => (
                      <div key={exampleIndex} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                        <ArrowRight className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 font-mono">{example}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature Cards */}
            <div className="space-y-6">
              {aiFeatures.map((feature, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full bg-gray-50 ${feature.color}`}>
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Feature Showcase */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    How CRM Assistant Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 text-white rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--accent-color)' }}>1</div>
                      <span className="text-sm">You type your request in natural language</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 text-white rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--accent-color)' }}>2</div>
                      <span className="text-sm">AI analyzes and shows its thinking process</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 text-white rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--accent-color)' }}>3</div>
                      <span className="text-sm">AI validates data and asks if needed</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 text-white rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--accent-color)' }}>4</div>
                      <span className="text-sm">AI executes action and shows results</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 text-white rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--accent-color)' }}>5</div>
                      <span className="text-sm">AI learns and remembers for next time</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">The Result:</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      A transparent, intelligent, and learning AI that becomes your perfect business partner.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Simple Examples */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Simple Operations
                </CardTitle>
                <CardDescription>
                  Basic CRUD operations made conversational
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { input: 'Add TechCorp supplier', output: 'Creates supplier with validation' },
                  { input: 'Show all products', output: 'Displays products in table format' },
                  { input: 'Update John\'s phone to 555-1234', output: 'Finds and updates contact' },
                  { input: 'Delete old supplier ABC Corp', output: 'Safely removes after confirmation' }
                ].map((example, index) => (
                  <div key={index} className="space-y-2">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 5%, white)' }}>
                      <span className="text-sm font-mono" style={{ color: 'var(--accent-color)' }}>"{example.input}"</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ArrowRight className="w-3 h-3" />
                      {example.output}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Complex Examples */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Complex Queries
                </CardTitle>
                <CardDescription>
                  Advanced operations across multiple entities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { 
                    input: 'Show products from suppliers with reliability > 8', 
                    output: 'Joins tables and filters results intelligently' 
                  },
                  { 
                    input: 'Find contacts from companies that are also suppliers', 
                    output: 'Complex relationship analysis across entities' 
                  },
                  { 
                    input: 'Create order for john@example.com with 5 iPhone units', 
                    output: 'Multi-step process with validation and linking' 
                  },
                  { 
                    input: 'Analyze sales trends for Electronics category', 
                    output: 'Generates insights with visual charts' 
                  }
                ].map((example, index) => (
                  <div key={index} className="space-y-2">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-mono text-purple-800">"{example.input}"</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ArrowRight className="w-3 h-3" />
                      {example.output}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-[var(--brand-start)] via-[var(--brand-mid)] to-[var(--brand-end)] text-white mt-8">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Experience the Future?</h3>
              <p className="text-white/70 mb-6 max-w-2xl mx-auto">
                Join thousands of businesses already using CRM Assistant to revolutionize their CRM experience. 
                No training required, no complex interfaces - just natural conversation.
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => setActiveTab('chat')}
                className="bg-white hover:bg-gray-100" style={{ color: 'var(--accent-color)' }}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Start Chatting with CRM Assistant
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}