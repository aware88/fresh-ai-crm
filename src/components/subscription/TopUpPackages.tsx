'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { topUpPackages } from '@/lib/subscription-plans-v2';
import { 
  Plus, 
  Zap, 
  Star, 
  CheckCircle,
  CreditCard,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface TopUpPackagesProps {
  onPurchaseComplete?: () => void;
  variant?: 'grid' | 'list';
  className?: string;
}

export default function TopUpPackages({ 
  onPurchaseComplete,
  variant = 'grid',
  className = '' 
}: TopUpPackagesProps) {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    if (!organization?.id) {
      toast({
        title: "Error",
        description: "Organization not found. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }

    setPurchasingPackage(packageId);
    
    try {
      // Create Stripe checkout session for top-up
      const response = await fetch('/api/topup/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: organization.id,
          packageId: packageId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error: any) {
      console.error('Error purchasing top-up:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to start checkout process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPurchasingPackage(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getPackageIcon = (packageId: string) => {
    if (packageId.includes('100')) return <Zap className="h-5 w-5 text-blue-600" />;
    if (packageId.includes('500')) return <TrendingUp className="h-5 w-5 text-purple-600" />;
    if (packageId.includes('1000')) return <Sparkles className="h-5 w-5 text-gold-600" />;
    return <Plus className="h-5 w-5 text-gray-600" />;
  };

  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="font-semibold text-lg mb-4">Top-up Packages</h3>
        {topUpPackages.map((pkg) => (
          <Card key={pkg.id} className={`transition-all hover:shadow-md ${pkg.popular ? 'ring-2 ring-purple-200 bg-purple-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getPackageIcon(pkg.id)}
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {pkg.name}
                      {pkg.popular && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                          <Star className="h-3 w-3 mr-1" />
                          Most Popular
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {pkg.description} • ${pkg.pricePerMessage.toFixed(3)} per token
                    </div>
                    {pkg.discountPercent && (
                      <div className="text-xs text-green-600 font-medium">
                        {pkg.discountPercent}% discount included
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{formatPrice(pkg.priceUsd)}</div>
                  <Button 
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchasingPackage === pkg.id}
                    size="sm"
                    className={pkg.popular ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    {purchasingPackage === pkg.id ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Buy Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2">Top-up AI Tokens</h3>
        <p className="text-gray-600 text-sm">
          Need more AI tokens? Purchase additional tokens that never expire.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topUpPackages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`relative transition-all hover:shadow-lg cursor-pointer group ${
              pkg.popular 
                ? 'ring-2 ring-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 scale-105' 
                : 'hover:scale-105'
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 p-3 bg-white rounded-full shadow-sm">
                {getPackageIcon(pkg.id)}
              </div>
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(pkg.priceUsd)}
                </div>
                <div className="text-sm text-gray-600">
                  {pkg.messages.toLocaleString()} AI tokens
                </div>
                <div className="text-xs text-gray-500">
                  ${pkg.pricePerMessage.toFixed(3)} per token
                </div>
              </div>

              {pkg.discountPercent && (
                <div className="flex items-center justify-center gap-1 text-green-600 text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  {pkg.discountPercent}% savings
                </div>
              )}

              <Button 
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasingPackage === pkg.id}
                className={`w-full ${
                  pkg.popular 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : ''
                }`}
              >
                {purchasingPackage === pkg.id ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase Now
                  </>
                )}
              </Button>
              
              <div className="text-xs text-gray-500">
                Tokens never expire • Instant delivery
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">How Top-ups Work</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Top-up tokens are used automatically when your subscription limit is reached</li>
              <li>• Tokens are consumed on a first-in, first-out basis</li>
              <li>• Top-up tokens never expire and carry over month to month</li>
              <li>• Perfect for handling usage spikes or seasonal increases</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
