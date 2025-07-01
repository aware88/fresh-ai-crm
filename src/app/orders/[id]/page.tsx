/**
 * Order Detail Page
 * 
 * Displays detailed information for a specific order
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import OrderDetailPageComponent from '@/components/integrations/metakocka/OrderDetailPage';

export default function OrderDetailRoute() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const orderId = params?.id as string;
  
  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to access order details.',
        variant: 'destructive',
      });
    }
  }, [status]);
  
  // Navigate back to orders list
  const handleBackToOrders = () => {
    router.push('/orders');
  };
  
  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  // Show authentication required message if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <h1 className="text-xl font-semibold mb-2">Authentication Required</h1>
              <p className="text-gray-500 mb-4">
                Please sign in to access order details.
              </p>
              <Button onClick={() => router.push('/auth/signin')}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <OrderDetailPageComponent 
        orderId={orderId} 
        userId={session?.user?.id || ''} 
      />
    </div>
  );
}
