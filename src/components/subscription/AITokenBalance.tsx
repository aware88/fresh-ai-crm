'use client';

import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { 
  Zap, 
  Plus, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface TokenUsageData {
  subscription: {
    current: number;
    limit: number;
    remaining: number;
    exceeded: boolean;
  };
  topup: {
    available: number;
    totalSpent: number;
    totalPurchases: number;
  };
  total: {
    available: number;
    canMakeRequest: boolean;
  };
}

interface AITokenBalanceProps {
  variant?: 'card' | 'compact' | 'detailed';
  showTopUpButton?: boolean;
  className?: string;
}

export default function AITokenBalance({ 
  variant = 'card', 
  showTopUpButton = true,
  className = '' 
}: AITokenBalanceProps) {
  const { organization } = useOrganization();
  const [usage, setUsage] = useState<TokenUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsageData = async (showRefreshLoader = false) => {
    if (!organization?.id) return;
    
    if (showRefreshLoader) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await fetch(`/api/usage/status?organizationId=${organization.id}`);
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, [organization?.id]);

  const handleRefresh = () => {
    fetchUsageData(true);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="animate-spin">
              <Zap className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 text-gray-500">
            <AlertCircle className="h-5 w-5" />
            <span>Unable to load token usage</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const subscriptionUsagePercent = usage.subscription.limit > 0 
    ? (usage.subscription.current / usage.subscription.limit) * 100 
    : 0;

  const getStatusColor = () => {
    if (!usage.total.canMakeRequest) return 'text-red-600';
    if (usage.subscription.exceeded) return 'text-orange-600';
    if (subscriptionUsagePercent > 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (!usage.total.canMakeRequest) return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (usage.subscription.exceeded) return <AlertCircle className="h-4 w-4 text-orange-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (!usage.total.canMakeRequest) return 'No tokens available';
    if (usage.subscription.exceeded) return 'Using top-up tokens';
    return 'Active';
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <Zap className="h-4 w-4 text-blue-600" />
          <div>
            <div className="font-medium text-sm">
              {usage.total.available.toLocaleString()} tokens available
            </div>
            <div className="text-xs text-gray-600">
              {usage.subscription.remaining} subscription + {usage.topup.available} top-up
            </div>
          </div>
        </div>
        {showTopUpButton && (
          <Link href="/settings/subscription">
            <Button size="sm" variant="outline">
              <Plus className="h-3 w-3 mr-1" />
              Top-up
            </Button>
          </Link>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle>AI Token Usage</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {getStatusIcon()}
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <CardDescription>
            Track your AI usage and manage your token balance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Usage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Subscription Tokens</h4>
              <Badge variant={usage.subscription.exceeded ? 'destructive' : 'secondary'}>
                {usage.subscription.current} / {usage.subscription.limit} used
              </Badge>
            </div>
            <Progress 
              value={Math.min(subscriptionUsagePercent, 100)} 
              className="h-2"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{usage.subscription.remaining} remaining</span>
              <span>{Math.round(subscriptionUsagePercent)}% used</span>
            </div>
          </div>

          {/* Top-up Balance */}
          {usage.topup.available > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-600" />
                  Top-up Tokens
                </h4>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {usage.topup.available} available
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Total spent: ${usage.topup.totalSpent.toFixed(2)} ({usage.topup.totalPurchases} purchases)
              </div>
            </div>
          )}

          {/* Total Available */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900">Total Available</h4>
                <p className="text-sm text-blue-700">
                  {usage.total.available.toLocaleString()} tokens ready to use
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {showTopUpButton && (
              <Link href="/settings/subscription" className="flex-1">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Buy Top-up Tokens
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
            <Link href="/settings/subscription">
              <Button variant="outline">
                Manage Plan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default card variant
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">AI Tokens</CardTitle>
          </div>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subscription Usage</span>
            <span className="font-medium">
              {usage.subscription.current} / {usage.subscription.limit}
            </span>
          </div>
          <Progress 
            value={Math.min(subscriptionUsagePercent, 100)} 
            className="h-2"
          />
        </div>

        {usage.topup.available > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-700">Top-up tokens</span>
            <span className="font-medium text-green-700">
              +{usage.topup.available}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <div className="font-semibold">
              {usage.total.available.toLocaleString()} total
            </div>
            <div className={`text-sm ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>
          {showTopUpButton && (
            <Link href="/settings/subscription">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Top-up
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
