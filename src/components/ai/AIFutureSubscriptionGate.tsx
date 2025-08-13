'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Sparkles, 
  Lock, 
  Zap, 
  Star, 
  ArrowRight,
  CheckCircle,
  Rocket
} from 'lucide-react';
import Link from 'next/link';

interface AIFutureSubscriptionGateProps {
  currentPlan?: string;
  organizationId?: string;
}

export default function AIFutureSubscriptionGate({ 
  currentPlan = 'starter', 
  organizationId 
}: AIFutureSubscriptionGateProps) {
  const features = [
    {
      icon: Brain,
      title: 'Natural Language CRM',
      description: 'Manage suppliers, products, contacts, and orders through conversation',
      color: 'text-blue-600'
    },
    {
      icon: Sparkles,
      title: 'Thinking Agent',
      description: 'See AI\'s reasoning process in real-time with transparent thinking',
      color: 'text-purple-600'
    },
    {
      icon: Zap,
      title: '10x Faster Operations',
      description: 'Eliminate forms and manual data entry with intelligent automation',
      color: 'text-green-600'
    },
    {
      icon: Star,
      title: 'Memory & Learning',
      description: 'AI remembers your preferences and learns from every interaction',
      color: 'text-yellow-600'
    }
  ];

  const planBenefits = {
    pro: {
      title: 'Pro Plan',
      price: 'Free during Beta',
      originalPrice: '$59/month',
      features: [
        '500 CRM Assistant conversations per month',
        'Full natural language CRM access',
        'Memory and learning capabilities',
        'Visual data display (tables, cards)',
        'Cross-entity queries',
        'Priority email support'
      ],
      badge: 'Most Popular',
      badgeColor: 'bg-blue-500'
    },
    premium: {
      title: 'Premium Plan',
      price: '$157/month',
      originalPrice: '$197/month',
      features: [
        'Unlimited CRM Assistant conversations',
        'Advanced AI customization',
        'Priority CRM Assistant support',
        'Dedicated success manager',
        'Custom integrations',
        'Advanced analytics',
        'White-label options'
      ],
      badge: 'Enterprise',
      badgeColor: 'bg-purple-500'
    }
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
              <div className="relative">
                <Brain className="h-8 w-8 text-white" />
                <Sparkles className="w-5 h-5 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                CRM Assistant
              </h1>
              <p className="text-lg text-gray-600">The Revolutionary CRM Experience</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">Upgrade Required</span>
          </div>

          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            CRM Assistant transforms how you manage your business. Experience the power of natural language CRM 
            where you can manage everything through simple conversation.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
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

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {Object.entries(planBenefits).map(([planId, plan]) => (
            <Card 
              key={planId}
              className={`border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
                planId === 'pro' ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50' : 'border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50'
              }`}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CardTitle className="text-2xl">{plan.title}</CardTitle>
                  <Badge className={`${plan.badgeColor} text-white`}>
                    {plan.badge}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-900">
                    {plan.price}
                  </div>
                  {plan.originalPrice && plan.price !== plan.originalPrice && (
                    <div className="text-sm text-gray-500 line-through">
                      {plan.originalPrice}
                    </div>
                  )}
                  {planId === 'pro' && (
                    <div className="text-sm text-green-600 font-medium">
                      Save 100% during Beta!
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className={`w-full ${
                    planId === 'pro' 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700' 
                      : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
                  } text-white`}
                  size="lg"
                  asChild
                >
                  <Link href={`/settings/subscription?plan=${planId}${organizationId ? `&org=${organizationId}` : ''}`}>
                    <Rocket className="w-4 h-4 mr-2" />
                    Upgrade to {plan.title}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white mt-8">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Experience the Future of CRM?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of businesses already using CRM Assistant to revolutionize their operations. 
              No training required, no complex interfaces - just natural conversation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100"
                asChild
              >
                <Link href={`/settings/subscription?plan=pro${organizationId ? `&org=${organizationId}` : ''}`}>
                  <Star className="w-4 h-4 mr-2" />
                  Start Free Beta
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
                asChild
              >
                <Link href="/settings/subscription">
                  View All Plans
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Plan Info */}
        {currentPlan && (
          <div className="text-center text-sm text-gray-500">
            Current plan: <span className="font-medium capitalize">{currentPlan}</span>
            {currentPlan === 'starter' && (
              <span className="text-orange-600 ml-2">
                • CRM Assistant requires Pro or Premium plan
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}