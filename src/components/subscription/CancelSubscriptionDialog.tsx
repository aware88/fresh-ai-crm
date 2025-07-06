'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface CancelSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  organizationId: string;
  planName: string;
  endDate: string;
  onCancelled: () => void;
}

export default function CancelSubscriptionDialog({
  isOpen,
  onClose,
  subscriptionId,
  organizationId,
  planName,
  endDate,
  onCancelled
}: CancelSubscriptionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          organizationId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      
      toast({
        title: 'Subscription Cancelled',
        description: `Your ${planName} subscription will end on ${new Date(endDate).toLocaleDateString()}.`,
        variant: 'default',
      });
      
      onCancelled();
      onClose();
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      toast({
        title: 'Error',
        description: err.message || 'An error occurred while cancelling your subscription.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="mb-4">
            Are you sure you want to cancel your {planName} subscription?
          </p>
          
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded relative">
            <p className="font-medium">Important Information:</p>
            <ul className="list-disc list-inside mt-2 text-sm">
              <li>Your subscription will remain active until {new Date(endDate).toLocaleDateString()}.</li>
              <li>You will continue to have access to all features until that date.</li>
              <li>You will not be charged again after cancellation.</li>
              <li>After your subscription ends, your account will be downgraded to the Free tier.</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Keep Subscription
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {isLoading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
