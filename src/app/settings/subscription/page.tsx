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
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<SubscriptionInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const organizationId = (session?.user as any)?.organizationId || '';

  useEffect(() => {
    if (organizationId) {
      fetchSubscriptionData();
    }
  }, [organizationId]);

  const fetchSubscriptionData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch current subscription
      const subscriptionResponse = await fetch(`/api/subscription/current?organizationId=${organizationId}`);
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setCurrentSubscription(subscriptionData.subscription);
      }
      
      // Fetch available plans
      const plansResponse = await fetch('/api/subscription/plans');
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setAvailablePlans(plansData.plans || []);
      }
      
      // Fetch recent invoices
      const invoicesResponse = await fetch(`/api/subscription/invoices?organizationId=${organizationId}&limit=5`);
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setRecentInvoices(invoicesData.invoices || []);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Failed to load subscription data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradePlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setSelectedBillingCycle(plan.billing_interval);
    setShowUpgradeDialog(true);
  };

  const handleChangeBillingCycle = async () => {
    if (!currentSubscription || !selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          planId: selectedPlan.id,
          billingCycle: selectedBillingCycle,
          subscriptionId: currentSubscription.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change subscription');
      }
      
      toast({
        title: 'Subscription Updated',
        description: `Successfully ${selectedPlan.id === currentSubscription.subscription_plan_id ? 'changed billing cycle' : 'upgraded plan'}.`,
      });
      
      setShowUpgradeDialog(false);
      fetchSubscriptionData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update subscription.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          subscriptionId: currentSubscription.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will remain active until the end of the current billing period.',
      });
      
      setShowCancelDialog(false);
      fetchSubscriptionData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to cancel subscription.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getNextBillingDate = () => {
    if (!currentSubscription) return null;
    
    const currentPeriodEnd = new Date(currentSubscription.current_period_end);
    return currentPeriodEnd;
  };

  const getNextBillingAmount = () => {
    if (!currentSubscription?.subscription_plan) return 0;
    
    return currentSubscription.subscription_plan.price;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      trial: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      canceled: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      past_due: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      expired: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.expired;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription and billing</p>
          </div>
        </div>
        <div className="grid gap-6">
          <div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription and billing</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
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

      {/* Current Subscription Card */}
      {currentSubscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan
                  {getStatusBadge(currentSubscription.status)}
                </CardTitle>
                <CardDescription>
                  {currentSubscription.subscription_plan?.description || 'Your current subscription plan'}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {currentSubscription.subscription_plan?.name || 'Unknown Plan'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(currentSubscription.subscription_plan?.price || 0)}/
                  {currentSubscription.subscription_plan?.billing_interval || 'month'}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Next Billing</div>
                  <div className="text-sm text-muted-foreground">
                    {getNextBillingDate() ? format(getNextBillingDate()!, 'MMM dd, yyyy') : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Next Amount</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(getNextBillingAmount())}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Payment Method</div>
                  <div className="text-sm text-muted-foreground">
                    {currentSubscription.payment_method_id ? 'Card ending in ****' : 'No payment method'}
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex flex-wrap gap-2">
              {currentSubscription.status === 'active' && !currentSubscription.cancel_at_period_end && (
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

      {/* Available Plans */}
      {!currentSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Plan</CardTitle>
            <CardDescription>Select a subscription plan to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availablePlans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-lg font-semibold">{plan.name}</div>
                  <div className="text-2xl font-bold mt-2">
                    {formatCurrency(plan.price)}
                    <span className="text-sm text-muted-foreground">/{plan.billing_interval}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{plan.description}</div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => handleUpgradePlan(plan)}
                  >
                    Select Plan
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <span className="font-semibold">{currentSubscription.subscription_plan?.name}</span>
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
