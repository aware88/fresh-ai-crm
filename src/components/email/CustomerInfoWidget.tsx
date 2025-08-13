'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  ShoppingBag, 
  Calendar, 
  Package, 
  Euro,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface MetakockaCustomer {
  id: string;
  email: string;
  name: string;
  totalOrders: number;
  lastOrderDate: string;
  status: 'active' | 'inactive';
}

interface MetakockaOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  total: number;
  orderDate: string;
}

interface CustomerInfoWidgetProps {
  customerEmail: string;
  className?: string;
}

export default function CustomerInfoWidget({ customerEmail, className }: CustomerInfoWidgetProps) {
  const [customer, setCustomer] = useState<MetakockaCustomer | null>(null);
  const [orders, setOrders] = useState<MetakockaOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [checked, setChecked] = useState(false);
  const [metakockaEnabled, setMetakockaEnabled] = useState<boolean | null>(null);

  // Check if Metakocka is enabled for this user's organization
  const checkMetakockaEnabled = async () => {
    try {
      // Skip feature flag check for now to avoid 400 errors
      // const response = await fetch('/api/feature-flags/METAKOCKA_INTEGRATION');
      // For now, default to disabled
      setMetakockaEnabled(false);
      return;
      if (response.ok) {
        const data = await response.json();
        setMetakockaEnabled(data.enabled);
      } else {
        setMetakockaEnabled(false);
      }
    } catch (err) {
      console.error('Error checking Metakocka feature flag:', err);
      setMetakockaEnabled(false);
    }
  };

  const checkCustomerInMetakocka = async () => {
    if (checked || !customerEmail || metakockaEnabled === false) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/integrations/metakocka/customer-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: customerEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.customer) {
          setCustomer(data.customer);
          setOrders(data.orders || []);
        }
      } else if (response.status !== 404) {
        // 404 means customer not found, which is fine
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to check customer');
      }
    } catch (err) {
      setError('Failed to connect to Metakocka');
    } finally {
      setLoading(false);
      setChecked(true);
    }
  };

  useEffect(() => {
    checkMetakockaEnabled();
  }, []);

  useEffect(() => {
    if (metakockaEnabled === true) {
    checkCustomerInMetakocka();
    } else if (metakockaEnabled === false) {
      setChecked(true); // Don't show Metakocka functionality
    }
  }, [customerEmail, metakockaEnabled]);

  if (!checked && !loading) {
    return (
      <div className={`${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={checkCustomerInMetakocka}
          className="w-full"
        >
          <User className="h-4 w-4 mr-2" />
          Check Customer in Metakocka
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Checking Metakocka...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="pt-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!customer || metakockaEnabled === false) {
    return null; // Customer not found or Metakocka not enabled, don't show anything
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return `€${price.toFixed(2)}`;
  };

  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <User className="h-4 w-4 text-green-600" />
            <span className="text-green-800">Existing Customer</span>
            <Badge className={getStatusColor(customer.status)}>
              {customer.status}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-6 px-2"
          >
            {showDetails ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-green-800">{customer.name}</p>
            <p className="text-xs text-green-600">{customer.email}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end space-x-1">
              <ShoppingBag className="h-3 w-3 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {customer.totalOrders} orders
              </span>
            </div>
            <div className="flex items-center justify-end space-x-1">
              <Calendar className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">
                Last: {formatDate(customer.lastOrderDate)}
              </span>
            </div>
          </div>
        </div>

        {showDetails && orders.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium text-green-800 mb-2">Recent Orders</h4>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="bg-white p-2 rounded border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">#{order.orderNumber}</span>
                        <Badge className={getOrderStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {formatDate(order.orderDate)} • {formatPrice(order.total)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items.slice(0, 2).map(item => item.name).join(', ')}
                        {order.items.length > 2 && ` +${order.items.length - 2} more`}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
          💡 This customer exists in Metakocka. Consider their order history when responding.
        </div>
      </CardContent>
    </Card>
  );
} 