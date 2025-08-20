'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Download,
  RefreshCw
} from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import AITokenBalance from '@/components/subscription/AITokenBalance';
import TopUpPackages from '@/components/subscription/TopUpPackages';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_interval: 'monthly' | 'yearly';
  features: Record<string, boolean | number>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OrganizationSubscription {
  id: string;
  organization_id: string;
  subscription_plan_id: string;
  subscription_plan?: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trial' | 'expired';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method_id: string | null;
  subscription_provider: string | null;
  provider_subscription_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionInvoice {
  id: string;
  organization_id: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'void';
  due_date: string;
  paid_at: string | null;
  invoice_url: string | null;
  invoice_pdf: string | null;
  created_at: string;
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentSubscription, setCurrentSubscription] = useState<OrganizationSubscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<SubscriptionInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  
  // Dialog states
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine if user is part of an organization or individual
  const organizationId = (session?.user as any)?.organizationId;
  const userId = session?.user?.id;
  const isIndividualUser = !organizationId && userId;

  useEffect(() => {
    if (organizationId || isIndividualUser) {
      fetchSubscriptionData();
    }
  }, [organizationId, isIndividualUser]);

  const fetchSubscriptionData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch current subscription - use different endpoints for individual vs organization
      if (organizationId) {
        // Organization subscription
        const subscriptionResponse = await fetch(`/api/subscription/current?organizationId=${organizationId}`, {
          credentials: 'include'
        });
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setCurrentSubscription(subscriptionData.subscription);
          setCurrentPlan(subscriptionData.plan);
        }
        
        // Fetch recent invoices for organization
        const invoicesResponse = await fetch(`/api/subscription/invoices?organizationId=${organizationId}&limit=5`, {
          credentials: 'include'
        });
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setRecentInvoices(invoicesData.invoices || []);
        }
      } else if (isIndividualUser) {
        // Individual user subscription - use user ID
        const subscriptionResponse = await fetch(`/api/subscription/current?userId=${userId}`, {
          credentials: 'include'
        });
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setCurrentSubscription(subscriptionData.subscription);
          setCurrentPlan(subscriptionData.plan);
        }
        
        // Fetch recent invoices for individual user
        const invoicesResponse = await fetch(`/api/subscription/invoices?userId=${userId}&limit=5`, {
          credentials: 'include'
        });
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setRecentInvoices(invoicesData.invoices || []);
        }
      }
      
      // Fetch available plans (same for both)
      const plansResponse = await fetch('/api/subscription/plans', {
        credentials: 'include'
      });
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setAvailablePlans(plansData.plans || []);
      }
      
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('Failed to load subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current plan name (case-insensitive comparison)
  const getCurrentPlanName = () => {
    return currentPlan?.name || currentSubscription?.subscription_plan?.name || '';
  };

  // Check if a plan is currently active (reactive to current plan state)
  const isPlanActive = (planName: string) => {
    // Use currentPlan state if available, fallback to getCurrentPlanName()
    const activePlanName = currentPlan?.name || getCurrentPlanName();
    const currentPlanName = activePlanName.toLowerCase();
    const targetPlan = planName.toLowerCase();
    
    // Handle Premium Advanced as Premium plan
    if (targetPlan === 'premium') {
      return currentPlanName.includes('premium');
    }
    
    return currentPlanName === targetPlan;
  };

  // Pricing data from LOVABLE_PRICING_PAGE_PROMPT.md - exact pricing structure
  const getPlanPricing = (planName: string, isAnnual: boolean) => {
    const pricing = {
      starter: {
        monthly: { original: 0, current: 0, savings: 0 }, // Always Free
        annual: { original: 0, current: 0, savings: 0 }   // Always Free
      },
      pro: {
        monthly: { original: 29, current: 29, savings: 0 }, // $29/month
        annual: { original: 29, current: 24, savings: 60 }  // $24/month when billed annually
      },
      premium: {
        monthly: { original: 197, current: 197, savings: 0 }, // $197/month (Premium Basic)
        annual: { original: 197, current: 157, savings: 480 } // $157/month when billed annually
      },
      premium_basic: {
        monthly: { original: 197, current: 197, savings: 0 }, // $197/month
        annual: { original: 197, current: 157, savings: 480 } // $157/month when billed annually
      },
      premium_advanced: {
        monthly: { original: 297, current: 297, savings: 0 }, // $297/month
        annual: { original: 297, current: 237, savings: 720 } // $237/month when billed annually
      },
      premium_enterprise: {
        monthly: { original: 497, current: 497, savings: 0 }, // $497/month
        annual: { original: 497, current: 397, savings: 1200 } // $397/month when billed annually
      }
    };

    const plan = pricing[planName.toLowerCase() as keyof typeof pricing];
    return plan ? plan[isAnnual ? 'annual' : 'monthly'] : { original: 0, current: 0, savings: 0 };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { variant: 'default', label: 'Active' },
      trial: { variant: 'secondary', label: 'Trial' },
      canceled: { variant: 'destructive', label: 'Canceled' },
      past_due: { variant: 'destructive', label: 'Past Due' },
      expired: { variant: 'destructive', label: 'Expired' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { variant: 'outline', label: status };
    
    return (
      <Badge variant={statusInfo.variant as any}>
        {statusInfo.label}
      </Badge>
    );
  };

  const handleUpgradePlan = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setSelectedBillingCycle(plan.billing_interval);
    setShowUpgradeDialog(true);
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) return;
    
    console.log('🔄 Starting plan change:', {
      selectedPlan: selectedPlan.id,
      billingCycle: selectedBillingCycle,
      organizationId: organizationId || userId,
      subscriptionId: currentSubscription?.id
    });
    
    setIsProcessing(true);
    
    try {
      const requestBody = {
        planId: selectedPlan.id,
        billingCycle: selectedBillingCycle,
        organizationId: organizationId || userId,
        subscriptionId: currentSubscription?.id
      };
      
      console.log('📤 Sending request to /api/subscription/change-plan:', requestBody);
      
      const response = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('📥 API Response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change subscription plan');
      }

      toast({
        title: "Plan Changed Successfully",
        description: `Your subscription has been updated to ${selectedPlan.name} (${selectedBillingCycle}).`,
      });

      // Refresh subscription data and reset state
      console.log('🔄 Refreshing subscription data...');
      setSelectedPlan(null); // Clear selected plan
      setShowUpgradeDialog(false);
      
      // Refresh all subscription data
      await Promise.all([
        fetchSubscriptionData(),
        // Force re-fetch of current subscription to update the UI
        fetch(`/api/subscription/current?userId=${userId}`, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }).then(async (res) => {
          if (res.ok) {
            const { plan, subscription } = await res.json();
            // Ensure billing cycle is preserved in the subscription metadata
            const updatedSubscription = {
              ...subscription,
              subscription_plans: plan,
              metadata: {
                ...subscription.metadata,
                billing_cycle: selectedBillingCycle // Use the billing cycle from the plan change
              }
            };
            setCurrentSubscription(updatedSubscription);
            setCurrentPlan(plan);
            console.log('🔄 Updated current plan state:', plan.name, 'with billing cycle:', selectedBillingCycle);
          }
        })
      ]);
      
    } catch (error: any) {
      console.error('❌ Error changing plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change subscription plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    // Handle subscription cancellation
    console.log('Cancel subscription');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and billing</p>
        </div>
        <Button variant="outline" onClick={fetchSubscriptionData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Subscription Status */}
      {/* AI Token Balance */}
      <AITokenBalance variant="detailed" className="mb-6" />

      {currentSubscription && currentPlan && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan
                  {getStatusBadge(currentSubscription.status)}
                </CardTitle>
                <CardDescription>
                  {(() => {
                    if (!currentPlan) return 'Your current subscription plan';
                    
                    // Get billing cycle and show appropriate description
                    const billingCycle = currentSubscription?.metadata?.billing_cycle || currentPlan.billing_interval || 'monthly';
                    const isAnnual = billingCycle === 'yearly';
                    
                    // Get base description from plan
                    let baseDescription = currentPlan.description || 'Your current subscription plan';
                    
                    // Add billing cycle info for premium plans
                    if (currentPlan.name.toLowerCase().includes('premium')) {
                      baseDescription = isAnnual ? 'Perfect for large organizations (Annual billing)' : 'Perfect for large organizations';
                    } else if (currentPlan.name.toLowerCase().includes('pro')) {
                      baseDescription = isAnnual ? 'Built for growing teams (Annual billing)' : 'Built for growing teams';
                    } else if (currentPlan.name.toLowerCase().includes('starter')) {
                      baseDescription = 'Great to get started';
                    }
                    
                    return baseDescription;
                  })()}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {currentPlan.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {(() => {
                    if (!currentPlan) return '$0.00/monthly';
                    
                    // Get billing cycle from subscription metadata or current plan
                    const billingCycle = currentSubscription?.metadata?.billing_cycle || currentPlan.billing_interval || 'monthly';
                    const isAnnual = billingCycle === 'yearly';
                    
                    // Get the correct price based on plan and billing cycle
                    const planName = currentPlan.name.toLowerCase().replace(/\s+/g, '_');
                    const planPricing = getPlanPricing(planName, isAnnual);
                    const displayPrice = planPricing.current;
                    
                    return `${formatCurrency(displayPrice)}/${isAnnual ? 'mo (billed annually)' : 'monthly'}`;
                  })()}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-sm text-muted-foreground">Current Period</div>
                <div className="font-medium">
                  {(() => {
                    // Calculate proper period based on billing cycle and metadata
                    const billingCycle = currentSubscription?.metadata?.billing_cycle || currentPlan?.billing_interval || 'monthly';
                    const isAnnual = billingCycle === 'yearly';
                    
                    // Use current_period_start from subscription data as the actual subscription start date
                    const startDate = new Date(currentSubscription?.current_period_start || currentSubscription?.created_at);
                    
                    const endDate = isAnnual 
                      ? addYears(startDate, 1)
                      : addMonths(startDate, 1);
                    
                    return `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
                  })()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Next Billing Date</div>
                <div className="font-medium">
                  {(() => {
                    // Calculate next billing date based on billing cycle
                    const billingCycle = currentSubscription?.metadata?.billing_cycle || currentPlan?.billing_interval || 'monthly';
                    const isAnnual = billingCycle === 'yearly';
                    
                    const startDate = new Date(currentSubscription?.current_period_start || currentSubscription?.created_at);
                    
                    const nextBillingDate = isAnnual 
                      ? addYears(startDate, 1)
                      : addMonths(startDate, 1);
                    
                    return format(nextBillingDate, 'MMM dd, yyyy');
                  })()}
                </div>
              </div>
            </div>
            
            {currentSubscription.cancel_at_period_end && (
              <Alert className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Your subscription will be canceled at the end of the current billing period on{' '}
                  {(() => {
                    const billingCycle = currentSubscription?.metadata?.billing_cycle || currentPlan?.billing_interval || 'monthly';
                    const isAnnual = billingCycle === 'yearly';
                    
                    const startDate = new Date(currentSubscription?.current_period_start || currentSubscription?.created_at);
                    
                    const endDate = isAnnual 
                      ? addYears(startDate, 1)
                      : addMonths(startDate, 1);
                    
                    return format(endDate, 'MMM dd, yyyy');
                  })()}.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-2">
              {!currentSubscription.cancel_at_period_end && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUpgradeDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Change Plan
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCancelDialog(true)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    Cancel Subscription
                  </Button>
                </>
              )}
              {currentSubscription.cancel_at_period_end && (
                <Button 
                  variant="outline" 
                  onClick={() => {/* Handle reactivation */}}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reactivate Subscription
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => router.push('/settings/subscription/billing-history')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                View Billing History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans - Always show for plan comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Choose Your Plan</CardTitle>
              <CardDescription>Select a subscription plan to get started</CardDescription>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Monthly</span>
                <Switch
                  checked={isAnnual}
                  onCheckedChange={setIsAnnual}
                />
                <span className="text-sm">Annual</span>
              </div>
              {isAnnual && (
                <Badge variant="secondary" className="text-xs">Save up to 25%</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Starter Plan */}
            <div className={`border rounded-lg p-3 hover:shadow-md transition-shadow ${isPlanActive('Starter') ? 'border-blue-500 bg-blue-50' : ''}`}>
              <div className="text-lg font-semibold">Starter</div>
              <div className="text-2xl font-bold mt-2">
                <span className="text-green-600">
                  $0.00
                </span>
                <span className="text-sm text-muted-foreground">/{isAnnual ? 'mo' : 'monthly'}</span>
              </div>
              <div className="text-xs text-green-600 font-medium">Free</div>
              <div className="text-sm text-muted-foreground mt-1">Great to get started</div>
              {isPlanActive('Starter') && (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Active Plan</span>
                </div>
              )}
              <Button 
                className="w-full mt-3" 
                variant={isPlanActive('Starter') ? 'secondary' : 'default'}
                disabled={isPlanActive('Starter') || isPlanActive('Premium')}
                onClick={() => {
                  if (!isPlanActive('Starter') && !isPlanActive('Premium')) {
                    handleUpgradePlan({
                      id: 'starter',
                      name: 'Starter',
                      description: 'Great to get started',
                      price: 0,
                      billing_interval: 'monthly',
                      features: {},
                      is_active: true,
                      created_at: '',
                      updated_at: ''
                    });
                  }
                }}
              >
                {isPlanActive('Starter') ? 'Current Plan' : isPlanActive('Premium') ? 'Not Available' : 'Get Started Free'}
              </Button>
            </div>

            {/* Pro Plan */}
            <div className={`border rounded-lg p-3 hover:shadow-md transition-shadow ${isPlanActive('Pro') ? 'border-blue-500 bg-blue-50' : ''}`}>
              <div className="text-lg font-semibold">Pro</div>
              <div className="text-2xl font-bold mt-2">
                <span className="text-blue-600">
                  ${isAnnual ? '24' : '29'}.00
                </span>
                <span className="text-sm text-muted-foreground">/{isAnnual ? 'mo' : 'monthly'}</span>
              </div>
              {isAnnual && (
                <div className="text-xs text-green-600 font-medium">Save 25%</div>
              )}
              <div className="text-sm text-muted-foreground mt-1">Built for growing teams</div>
              <div className="text-xs text-blue-600 font-medium mt-1">Most Popular</div>
              {isPlanActive('Pro') && (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Active Plan</span>
                </div>
              )}
              <Button 
                className="w-full mt-3" 
                variant={isPlanActive('Pro') ? 'secondary' : 'default'}
                disabled={isPlanActive('Pro') || isPlanActive('Premium')}
                onClick={() => {
                  if (!isPlanActive('Pro') && !isPlanActive('Premium')) {
                    handleUpgradePlan({
                      id: 'pro',
                      name: 'Pro',
                      description: 'Built for growing teams',
                      price: isAnnual ? 24 : 29,
                      billing_interval: 'monthly',
                      features: {},
                      is_active: true,
                      created_at: '',
                      updated_at: ''
                    });
                  }
                }}
              >
                {isPlanActive('Pro') ? 'Current Plan' : isPlanActive('Premium') ? 'Not Available' : 'Start Pro'}
              </Button>
            </div>


          </div>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      {recentInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Invoices</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/settings/subscription/billing-history')}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{formatCurrency(invoice.amount)}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                      {invoice.status}
                    </Badge>
                    {invoice.invoice_pdf && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade/Change Plan Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Select a new plan and billing cycle. Changes will be prorated based on your current billing period.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4">
              <span className={`text-sm font-medium ${selectedBillingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch 
                checked={selectedBillingCycle === 'yearly'}
                onCheckedChange={(checked) => setSelectedBillingCycle(checked ? 'yearly' : 'monthly')}
              />
              <span className={`text-sm font-medium ${selectedBillingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Yearly <span className="text-green-600">(Save 25%)</span>
              </span>
            </div>

            {/* Available Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Starter Plan - only show if not current and not on Premium */}
              {!isPlanActive('Starter') && !isPlanActive('Premium') && (
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                    selectedPlan?.id === 'starter' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedPlan({ 
                      id: 'starter', 
                      name: 'Starter', 
                      description: 'Great to get started', 
                      price: 0, 
                      billing_interval: selectedBillingCycle, 
                      features: {}, 
                      is_active: false, 
                      created_at: '', 
                      updated_at: '' 
                    });
                  }}
                >
                  <div className="text-lg font-semibold">Starter</div>
                  <div className="text-2xl font-bold mt-2 text-green-600">
                    $0.00
                    <span className="text-sm text-muted-foreground">/{selectedBillingCycle === 'yearly' ? 'year' : 'month'}</span>
                  </div>
                  <div className="text-xs text-green-600 font-medium">Free</div>
                  <div className="text-sm text-muted-foreground mt-1">Great to get started</div>
                </div>
              )}

              {/* Pro Plan - only show if not current and not on Premium */}
              {!isPlanActive('Pro') && !isPlanActive('Premium') && (
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                    selectedPlan?.id === 'pro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedPlan({ 
                      id: 'pro', 
                      name: 'Pro', 
                      description: 'Built for growing teams', 
                      price: selectedBillingCycle === 'yearly' ? 24 : 29, 
                      billing_interval: selectedBillingCycle, 
                      features: {}, 
                      is_active: false, 
                      created_at: '', 
                      updated_at: '' 
                    });
                  }}
                >
                  <div className="text-lg font-semibold">Pro</div>
                  <div className="text-2xl font-bold mt-2 text-blue-600">
                    ${selectedBillingCycle === 'yearly' ? '24' : '29'}.00
                    <span className="text-sm text-muted-foreground">/{selectedBillingCycle === 'yearly' ? 'mo' : 'month'}</span>
                  </div>
                  {selectedBillingCycle === 'yearly' && (
                    <div className="text-xs text-green-600 font-medium">Save 25%</div>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">Built for growing teams</div>
                  <div className="text-xs text-blue-600 font-medium mt-1">Most Popular</div>
                </div>
              )}

              {/* Premium Basic - only show if not current */}
              {!isPlanActive('Premium') || getCurrentPlanName().toLowerCase() !== 'premium basic' ? (
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                    selectedPlan?.id === 'premium_basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedPlan({ 
                      id: 'premium_basic', 
                      name: 'Premium Basic', 
                      description: 'Built for sales-led organizations', 
                      price: selectedBillingCycle === 'yearly' ? 157 : 197, 
                      billing_interval: selectedBillingCycle, 
                      features: {}, 
                      is_active: false, 
                      created_at: '', 
                      updated_at: '' 
                    });
                  }}
                >
                  <div className="text-lg font-semibold">Premium Basic</div>
                  <div className="text-2xl font-bold mt-2">
                    ${selectedBillingCycle === 'yearly' ? '157' : '197'}.00
                    <span className="text-sm text-muted-foreground">/{selectedBillingCycle === 'yearly' ? 'mo' : 'month'}</span>
                  </div>
                  {selectedBillingCycle === 'yearly' && (
                    <div className="text-xs text-green-600 font-medium">Save 20%</div>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">Team Scale</div>
                </div>
              ) : null}

              {/* Premium Advanced - only show if not current */}
              {!isPlanActive('Premium') || getCurrentPlanName().toLowerCase() !== 'premium advanced' ? (
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                    selectedPlan?.id === 'premium_advanced' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedPlan({ 
                      id: 'premium_advanced', 
                      name: 'Premium Advanced', 
                      description: 'Built for sales-led organizations', 
                      price: selectedBillingCycle === 'yearly' ? 237 : 297, 
                      billing_interval: selectedBillingCycle, 
                      features: {}, 
                      is_active: false, 
                      created_at: '', 
                      updated_at: '' 
                    });
                  }}
                >
                  <div className="text-lg font-semibold">Premium Advanced</div>
                  <div className="text-2xl font-bold mt-2">
                    ${selectedBillingCycle === 'yearly' ? '237' : '297'}.00
                    <span className="text-sm text-muted-foreground">/{selectedBillingCycle === 'yearly' ? 'mo' : 'month'}</span>
                  </div>
                  {selectedBillingCycle === 'yearly' && (
                    <div className="text-xs text-green-600 font-medium">Save 20%</div>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">Best Value</div>
                  <div className="text-xs text-orange-600 font-medium mt-1">Recommended</div>
            </div>
              ) : null}

              {/* Premium Enterprise - only show if not current */}
              {!isPlanActive('Premium') || getCurrentPlanName().toLowerCase() !== 'premium enterprise' ? (
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                    selectedPlan?.id === 'premium_enterprise' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedPlan({ 
                      id: 'premium_enterprise', 
                      name: 'Premium Enterprise', 
                      description: 'Built for sales-led organizations', 
                      price: selectedBillingCycle === 'yearly' ? 397 : 497, 
                      billing_interval: selectedBillingCycle, 
                      features: {}, 
                      is_active: false, 
                      created_at: '', 
                      updated_at: '' 
                    });
                  }}
                >
                  <div className="text-lg font-semibold">Premium Enterprise</div>
                  <div className="text-2xl font-bold mt-2">
                    ${selectedBillingCycle === 'yearly' ? '397' : '497'}.00
                    <span className="text-sm text-muted-foreground">/{selectedBillingCycle === 'yearly' ? 'mo' : 'month'}</span>
                  </div>
                  {selectedBillingCycle === 'yearly' && (
                    <div className="text-xs text-green-600 font-medium">Save 20%</div>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">Everything Unlimited</div>
                </div>
              ) : null}
            </div>

            {/* Selected Plan Summary */}
            {selectedPlan && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg">{selectedPlan.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedPlan.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl">
                      {selectedPlan.id === 'starter' ? formatCurrency(0) :
                       selectedPlan.id === 'pro' ? formatCurrency(selectedBillingCycle === 'yearly' ? 24 : 29) :
                       selectedPlan.id === 'premium_basic' ? formatCurrency(selectedBillingCycle === 'yearly' ? 157 : 197) :
                       selectedPlan.id === 'premium_advanced' ? formatCurrency(selectedBillingCycle === 'yearly' ? 237 : 297) :
                       selectedPlan.id === 'premium_enterprise' ? formatCurrency(selectedBillingCycle === 'yearly' ? 397 : 497) :
                       formatCurrency(selectedPlan.price)}
                    </div>
                    <div className="text-sm text-muted-foreground">per {selectedBillingCycle === 'yearly' ? 'month (billed annually)' : 'month'}</div>
                </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmPlanChange}
              disabled={!selectedPlan || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          {currentSubscription && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span>Current Plan:</span>
                <span className="font-semibold">{currentPlan?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Access until:</span>
                <span>
                  {(() => {
                    const billingCycle = currentSubscription?.metadata?.billing_cycle || currentPlan?.billing_interval || 'monthly';
                    const isAnnual = billingCycle === 'yearly';
                    
                    const startDate = new Date(currentSubscription?.current_period_start || currentSubscription?.created_at);
                    
                    const endDate = isAnnual 
                      ? addYears(startDate, 1)
                      : addMonths(startDate, 1);
                    
                    return format(endDate, 'MMM dd, yyyy');
                  })()}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Cancel Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top-up Packages */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>AI Token Top-ups</CardTitle>
          <CardDescription>
            Need more AI tokens? Purchase additional tokens for when you exceed your subscription limit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopUpPackages 
            onPurchaseComplete={() => {
              // Refresh usage data after purchase
              window.location.reload();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
