import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SubscriptionGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SubscriptionGate({ feature, children, fallback }: SubscriptionGateProps) {
  const { subscription, isLoading } = useSubscription();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const hasFeature = subscription?.features.includes(feature);

  if (!hasFeature) {
    return fallback || (
      <Alert>
        <AlertDescription className="flex items-center justify-between">
          <span>This feature requires a higher subscription tier.</span>
          <Link href="/settings/subscription">
            <Button size="sm">Upgrade Plan</Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

// Usage examples:
export function EmailAccountLimitGate({ children }: { children: React.ReactNode }) {
  const { subscription } = useSubscription();
  
  // This would check against current count vs limits
  const canAddMore = subscription?.limits.emailAccounts === -1 || 
    (subscription?.limits.emailAccounts || 0) > 0; // You'd get current count from somewhere
  
  if (!canAddMore) {
    return (
      <Alert>
        <AlertDescription>
          You've reached your email account limit. Upgrade to add more accounts.
        </AlertDescription>
      </Alert>
    );
  }
  
  return <>{children}</>;
}