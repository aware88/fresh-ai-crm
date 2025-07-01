/**
 * FulfillOrderButton Component
 * 
 * A button component for fulfilling orders in Metakocka
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PackageCheck } from 'lucide-react';
import { fulfillOrder } from '@/lib/integrations/metakocka/order-api';

interface FulfillOrderButtonProps {
  orderId: string;
  disabled?: boolean;
  onFulfillmentComplete?: () => void;
}

export default function FulfillOrderButton({ 
  orderId, 
  disabled = false,
  onFulfillmentComplete 
}: FulfillOrderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [notes, setNotes] = useState('');
  
  const { toast } = useToast();
  
  const handleFulfill = async () => {
    if (!orderId) return;
    
    setIsLoading(true);
    
    try {
      const fulfillmentData = {
        fulfillment_date: new Date().toISOString().split('T')[0],
        tracking_number: trackingNumber,
        shipping_carrier: shippingCarrier,
        notes: notes
      };
      
      const result = await fulfillOrder(orderId, fulfillmentData);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Order has been fulfilled successfully',
        });
        
        setIsOpen(false);
        resetForm();
        
        if (onFulfillmentComplete) {
          onFulfillmentComplete();
        }
      } else {
        toast({
          title: 'Error',
          description: `Failed to fulfill order: ${result.error || 'Unknown error'}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fulfilling order:', error);
      toast({
        title: 'Error',
        description: 'Failed to fulfill order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setTrackingNumber('');
    setShippingCarrier('');
    setNotes('');
  };
  
  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
      >
        <PackageCheck className="mr-1 h-4 w-4" />
        Fulfill
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fulfill Order</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tracking" className="text-right">
                Tracking #
              </Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="carrier" className="text-right">
                Shipping Carrier
              </Label>
              <Input
                id="carrier"
                value={shippingCarrier}
                onChange={(e) => setShippingCarrier(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleFulfill} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Fulfill Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
