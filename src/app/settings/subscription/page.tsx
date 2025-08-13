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

  // Check if a plan is currently active
  const isPlanActive = (planName: string) => {
    const currentPlanName = getCurrentPlanName().toLowerCase();
    const targetPlan = planName.toLowerCase();
    
    // Handle Premium Advanced as Premium plan
    if (targetPlan === 'premium') {
      return currentPlanName.includes('premium');
    }
    
    return currentPlanName === targetPlan;
  };

  // Pricing data based on screenshots
  const getPlanPricing = (planName: string, isAnnual: boolean) => {
    const pricing = {
      starter: {
        monthly: { original: 19, current: 0, savings: 0 },
        annual: { original: 15, current: 0, savings: 48 }
      },
      pro: {
        monthly: { original: 59, current: 0, savings: 0 },
        annual: { original: 45, current: 0, savings: 168 }
      },
      premium: {
        monthly: { original: 197, current: 197, savings: 0 },
        annual: { original: 157, current: 157, savings: 480 }
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

  const handleChangeBillingCycle = async () => {
    // Handle billing cycle change
    console.log('Change billing cycle');
  };

  const handleCancelSubscription = async () => {
    // Handle subscription cancellation
    console.log('Cancel subscription');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
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
                  {currentPlan.description || 'Your current subscription plan'}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {currentPlan.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(currentPlan.price)}/
                  {currentPlan.billing_interval}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Current Period</div>
                <div className="font-medium">
                  {format(new Date(currentSubscription.current_period_start), 'MMM dd, yyyy')} - {' '}
                  {format(new Date(currentSubscription.current_period_end), 'MMM dd, yyyy')}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Next Billing Date</div>
                <div className="font-medium">
                  {format(new Date(currentSubscription.current_period_end), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
            
            {currentSubscription.cancel_at_period_end && (
              <Alert className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Your subscription will be canceled at the end of the current billing period on{' '}
                  {format(new Date(currentSubscription.current_period_end), 'MMM dd, yyyy')}.
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Starter Plan */}
            <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isPlanActive('Starter') ? 'border-blue-500 bg-blue-50' : ''}`}>
              <div className="text-lg font-semibold">Starter</div>
              <div className="text-2xl font-bold mt-2">
                <span className="line-through text-gray-400">
                  ${getPlanPricing('starter', isAnnual).original}.00
                </span>
                <span className="ml-2 text-green-600">
                  ${getPlanPricing('starter', isAnnual).current}.00
                </span>
                <span className="text-sm text-muted-foreground">/{isAnnual ? 'mo' : 'monthly'}</span>
              </div>
              {isAnnual && getPlanPricing('starter', isAnnual).savings > 0 && (
                <div className="text-xs text-green-600 font-medium">Save ${getPlanPricing('starter', isAnnual).savings}/year</div>
              )}
              <div className="text-xs text-green-600 font-medium">Free for Limited Time</div>
              <div className="text-sm text-muted-foreground mt-1">Perfect for Solo Entrepreneurs</div>
              {isPlanActive('Starter') && (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Active Plan</span>
                </div>
              )}
              <Button 
                className="w-full mt-4" 
                variant={isPlanActive('Starter') ? 'secondary' : 'default'}
                disabled={isPlanActive('Starter')}
                onClick={() => {
                  if (!isPlanActive('Starter')) {
                    handleUpgradePlan({
                      id: 'starter',
                      name: 'Starter',
                      description: 'Perfect for Solo Entrepreneurs',
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
                {isPlanActive('Starter') ? 'Current Plan' : (isAnnual ? 'Join Beta - Free Limited Time' : 'Select Plan')}
              </Button>
            </div>

            {/* Pro Plan */}
            <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isPlanActive('Pro') ? 'border-blue-500 bg-blue-50' : ''}`}>
              <div className="text-lg font-semibold">Pro</div>
              <div className="text-2xl font-bold mt-2">
                <span className="line-through text-gray-400">
                  ${getPlanPricing('pro', isAnnual).original}.00
                </span>
                <span className="ml-2 text-green-600">
                  ${getPlanPricing('pro', isAnnual).current}.00
                </span>
                <span className="text-sm text-muted-foreground">/{isAnnual ? 'mo' : 'monthly'}</span>
              </div>
              {isAnnual && getPlanPricing('pro', isAnnual).savings > 0 && (
                <div className="text-xs text-green-600 font-medium">Save ${getPlanPricing('pro', isAnnual).savings}/year</div>
              )}
              <div className="text-xs text-green-600 font-medium">Free for Limited Time</div>
              <div className="text-sm text-muted-foreground mt-1">Perfect for growing teams</div>
              <div className="text-xs text-blue-600 font-medium mt-1">Most Popular Choice</div>
              {isPlanActive('Pro') && (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Active Plan</span>
                </div>
              )}
              <Button 
                className="w-full mt-4" 
                variant={isPlanActive('Pro') ? 'secondary' : 'default'}
                disabled={isPlanActive('Pro')}
                onClick={() => {
                  if (!isPlanActive('Pro')) {
                    handleUpgradePlan({
                      id: 'pro',
                      name: 'Pro',
                      description: 'Perfect for growing teams',
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
                {isPlanActive('Pro') ? 'Current Plan' : (isAnnual ? 'Join Beta - Free Limited Time' : 'Select Plan')}
              </Button>
            </div>

            {/* Premium Plan */}
            <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isPlanActive('Premium') ? 'border-blue-500 bg-blue-50' : ''}`}>
              <div className="text-lg font-semibold">Premium</div>
              <div className="text-2xl font-bold mt-2">
                ${getPlanPricing('premium', isAnnual).current}.00
                <span className="text-sm text-muted-foreground">/{isAnnual ? 'mo' : 'monthly'}</span>
              </div>
              {isAnnual && getPlanPricing('premium', isAnnual).savings > 0 && (
                <div className="text-xs text-green-600 font-medium">Save ${getPlanPricing('premium', isAnnual).savings}/year</div>
              )}
              <div className="text-sm text-muted-foreground mt-1">Built for sales-led organizations</div>
              <div className="text-xs text-orange-600 font-medium mt-2">Enterprise Features</div>
              {isPlanActive('Premium') && (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Active Plan</span>
                </div>
              )}
              <Button 
                className="w-full mt-4" 
                variant={isPlanActive('Premium') ? 'secondary' : 'outline'}
                disabled={isPlanActive('Premium')}
                onClick={() => {
                  if (!isPlanActive('Premium')) {
                    window.location.href = 'mailto:tim@neuroai.agency?subject=Premium Subscription Inquiry&body=Hi, I am interested in the Premium subscription plan for my organization. Please contact me to discuss pricing and features.';
                  }
                }}
              >
                {isPlanActive('Premium') ? 'Current Plan' : 'Contact Sales'}
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
            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Select a new plan and billing cycle. Changes will be prorated based on your current billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Plan</label>
              <Select 
                value={selectedPlan?.id || ''} 
                onValueChange={(value) => {
                  const plan = availablePlans.find(p => p.id === value);
                  setSelectedPlan(plan || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(plan.price)}/{plan.billing_interval}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Billing Cycle</label>
              <Select 
                value={selectedBillingCycle} 
                onValueChange={(value: 'monthly' | 'yearly') => setSelectedBillingCycle(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly (Save 20%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedPlan && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span>New Plan:</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Billing:</span>
                  <span>{formatCurrency(selectedPlan.price)}/{selectedBillingCycle}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangeBillingCycle}
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
                <span>{format(new Date(currentSubscription.current_period_end), 'MMM dd, yyyy')}</span>
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
    </div>
  );
}
