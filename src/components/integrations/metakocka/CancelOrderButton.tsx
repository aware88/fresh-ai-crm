/**
 * CancelOrderButton Component
 * 
 * A button component for cancelling orders in Metakocka
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, XCircle } from 'lucide-react';
import { cancelOrder } from '@/lib/integrations/metakocka/order-api';

interface CancelOrderButtonProps {
  orderId: string;
  disabled?: boolean;
  onCancellationComplete?: () => void;
}

export default function CancelOrderButton({ 
  orderId, 
  disabled = false,
  onCancellationComplete 
}: CancelOrderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  
  const { toast } = useToast();
  
  const handleCancel = async () => {
    if (!orderId) return;
    
    setIsLoading(true);
    
    try {
      const result = await cancelOrder(orderId, cancellationReason);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Order has been cancelled successfully',
        });
        
        setIsOpen(false);
        setCancellationReason('');
        
        if (onCancellationComplete) {
          onCancellationComplete();
        }
      } else {
        toast({
          title: 'Error',
          description: `Failed to cancel order: ${result.error || 'Unknown error'}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
      >
        <XCircle className="mr-1 h-4 w-4" />
        Cancel
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Cancellation Reason
              </Label>
              <Textarea
                id="reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="col-span-3"
                rows={3}
                placeholder="Please provide a reason for cancellation"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Back
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel} 
              disabled={isLoading || !cancellationReason.trim()}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
