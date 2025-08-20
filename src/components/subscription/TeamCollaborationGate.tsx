'use client';

import React from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Users, 
  MessageSquare, 
  Crown, 
  ArrowRight, 
  Zap,
  CheckCircle,
  Lock
} from 'lucide-react';

interface TeamCollaborationGateProps {
  children: React.ReactNode;
  feature?: 'full' | 'sidebar' | 'minimal';
  fallbackMessage?: string;
}

export default function TeamCollaborationGate({ 
  children, 
  feature = 'full',
  fallbackMessage 
}: TeamCollaborationGateProps) {
  const { organization, loading: orgLoading } = useOrganization();
  const { hasFeature, isLoading: featuresLoading, plan } = useSubscriptionFeatures(organization?.id || '');

  // Show loading state
  if (orgLoading || featuresLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team collaboration...</p>
        </div>
      </div>
    );
  }

  // Check if user has access to team collaboration
  const hasTeamCollaboration = hasFeature('TEAM_COLLABORATION');

  // If has access, render children
  if (hasTeamCollaboration) {
    return <>{children}</>;
  }

  // If no access, show upgrade prompt based on feature type
  const getUpgradeContent = () => {
    switch (feature) {
      case 'minimal':
        return (
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <Lock className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              {fallbackMessage || 'Team collaboration requires Pro plan'}
            </span>
            <Link href="/settings/subscription">
              <Button variant="outline" size="sm" className="ml-2">
                Upgrade
              </Button>
            </Link>
          </div>
        );

      case 'sidebar':
        return (
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">Pro Feature</span>
              </div>
              <p className="text-sm text-amber-700 mb-3">
                Unlock team collaboration features with Pro plan
              </p>
              <Link href="/settings/subscription">
                <Button size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </Link>
            </CardContent>
          </Card>
        );

      default: // 'full'
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Team Collaboration</h1>
              <p className="text-muted-foreground">
                Collaborate with your team in real-time, manage assignments, and track activity
              </p>
            </div>

            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Users className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Team Collaboration
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300">
                          Pro Feature
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Current plan: <strong>{plan?.name || 'Starter'}</strong>
                      </CardDescription>
                    </div>
                  </div>
                  <Crown className="h-8 w-8 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <Lock className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-amber-800 mb-2">
                    Unlock Team Collaboration Features
                  </h3>
                  <p className="text-amber-700 mb-6 max-w-md mx-auto">
                    Team collaboration features are available with Pro and Premium plans. 
                    Upgrade to start collaborating with your team in real-time.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-amber-800">What you'll get:</h4>
                    <div className="space-y-2">
                      {[
                        'Real-time collaborative notes',
                        'Team presence indicators',
                        'Activity tracking & feeds',
                        '@mentions and notifications',
                        'Task assignment system',
                        'Team performance analytics'
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-amber-800">Perfect for:</h4>
                    <div className="space-y-2">
                      {[
                        'Growing teams (2+ members)',
                        'Customer support teams',
                        'Sales team coordination',
                        'Project collaboration',
                        'Remote team management',
                        'Activity transparency'
                      ].map((useCase, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-700">{useCase}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Link href="/settings/subscription" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade to Pro Plan
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return getUpgradeContent();
}
