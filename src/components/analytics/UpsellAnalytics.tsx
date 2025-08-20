'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  ArrowUpRight,
  ShoppingCart,
  Zap,
  Star
} from 'lucide-react';

interface UpsellOpportunity {
  id: string;
  customerName: string;
  currentValue: number;
  potentialValue: number;
  uplift: number;
  confidence: 'high' | 'medium' | 'low';
  category: string;
  lastInteraction: string;
  recommendedAction: string;
}

interface UpsellMetrics {
  totalRevenue: number;
  upsellRevenue: number;
  conversionRate: number;
  averageUplift: number;
  activeOpportunities: number;
  monthlyGrowth: number;
}

export default function UpsellAnalytics() {
  // Mock data - in real app, this would come from API
  const metrics: UpsellMetrics = {
    totalRevenue: 45600,
    upsellRevenue: 12800,
    conversionRate: 24.5,
    averageUplift: 67,
    activeOpportunities: 18,
    monthlyGrowth: 15.3
  };

  const opportunities: UpsellOpportunity[] = [
    {
      id: '1',
      customerName: 'Bulk Nutrition Europe',
      currentValue: 2400,
      potentialValue: 4200,
      uplift: 75,
      confidence: 'high',
      category: 'Premium Package',
      lastInteraction: '2 days ago',
      recommendedAction: 'Schedule premium demo call'
    },
    {
      id: '2',
      customerName: 'Nordic Supplements',
      currentValue: 1800,
      potentialValue: 3100,
      uplift: 72,
      confidence: 'high',
      category: 'Volume Upgrade',
      lastInteraction: '1 week ago',
      recommendedAction: 'Send volume pricing proposal'
    },
    {
      id: '3',
      customerName: 'Fitness Direct Ltd',
      currentValue: 950,
      potentialValue: 1450,
      uplift: 53,
      confidence: 'medium',
      category: 'Add-on Services',
      lastInteraction: '3 days ago',
      recommendedAction: 'Propose logistics optimization'
    },
    {
      id: '4',
      customerName: 'HealthTech Solutions',
      currentValue: 1200,
      potentialValue: 1800,
      uplift: 50,
      confidence: 'medium',
      category: 'Service Upgrade',
      lastInteraction: '5 days ago',
      recommendedAction: 'Introduce AI analytics package'
    }
  ];

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUpliftColor = (uplift: number) => {
    if (uplift >= 70) return 'text-green-600';
    if (uplift >= 50) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upsell Analytics</h2>
          <p className="text-gray-600 mt-1">AI-powered revenue optimization insights</p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          AI-Powered
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Upsell Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              €{metrics.upsellRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{metrics.monthlyGrowth}% this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {metrics.conversionRate}%
            </div>
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Above industry avg (18%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Active Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {metrics.activeOpportunities}
            </div>
            <p className="text-xs text-purple-600 flex items-center mt-1">
              <Star className="h-3 w-3 mr-1" />
              €{((metrics.activeOpportunities * metrics.averageUplift * 100)).toLocaleString()} potential
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upsell Opportunities */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5 text-indigo-600" />
            Top Upsell Opportunities
          </CardTitle>
          <p className="text-sm text-gray-600">AI-identified revenue expansion opportunities</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <div key={opp.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{opp.customerName}</h4>
                      <Badge className={getConfidenceColor(opp.confidence)}>
                        {opp.confidence} confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {opp.category}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Current Value</p>
                        <p className="font-medium">€{opp.currentValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Potential Value</p>
                        <p className="font-medium">€{opp.potentialValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Uplift Potential</p>
                        <p className={`font-medium ${getUpliftColor(opp.uplift)}`}>
                          +{opp.uplift}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{opp.recommendedAction}</p>
                        <p className="text-xs text-gray-500">Last interaction: {opp.lastInteraction}</p>
                      </div>
                      <Button size="sm" className="ml-4">
                        Take Action
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Base Revenue</span>
                <span className="font-semibold">€{(metrics.totalRevenue - metrics.upsellRevenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Upsell Revenue</span>
                <span className="font-semibold text-green-600">€{metrics.upsellRevenue.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Revenue</span>
                  <span className="font-bold text-lg">€{metrics.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Upsells represent {((metrics.upsellRevenue / metrics.totalRevenue) * 100).toFixed(1)}% of total revenue
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">🎯 Best Time to Upsell</p>
                <p className="text-xs text-blue-700 mt-1">
                  Customers are 3x more likely to accept upsells 2-3 weeks after initial purchase
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900">💡 Top Performing Category</p>
                <p className="text-xs text-green-700 mt-1">
                  Premium packages show highest conversion (34%) and average uplift (€1,200)
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900">⚡ Quick Win</p>
                <p className="text-xs text-purple-700 mt-1">
                  4 high-confidence opportunities ready for immediate action
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
