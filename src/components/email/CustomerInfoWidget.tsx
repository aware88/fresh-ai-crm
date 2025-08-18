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
  AlertCircle,
  TrendingUp,
  Clock,
  Star,
  MapPin,
  ExternalLink,
  Phone,
  MessageSquare
} from 'lucide-react';

interface MetakockaCustomer {
  id: string;
  email: string;
  name: string;
  totalOrders: number;
  lastOrderDate: string;
  status: 'active' | 'inactive';
  totalValue?: number;
  averageOrderValue?: number;
  firstOrderDate?: string;
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
          className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <User className="h-4 w-4 mr-2" />
          Check Customer in Metakocka
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
        <CardContent className="pt-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <div>
              <p className="text-sm font-medium text-blue-800">Checking Metakocka</p>
              <p className="text-xs text-blue-600">Looking up customer information...</p>
            </div>
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

  // Calculate customer insights
  const totalValue = orders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = customer.totalOrders > 0 ? totalValue / customer.totalOrders : 0;
  const daysSinceLastOrder = customer.lastOrderDate 
    ? Math.floor((Date.now() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-blue-100 rounded-full">
                <User className="h-3 w-3 text-blue-600" />
              </div>
              <span className="text-blue-800 font-medium">Metakocka Customer</span>
              <Badge className={getStatusColor(customer.status)}>
                {customer.status}
              </Badge>
            </div>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-6 px-2 hover:bg-blue-100"
          >
            {showDetails ? (
              <ChevronDown className="h-3 w-3 text-blue-600" />
            ) : (
              <ChevronRight className="h-3 w-3 text-blue-600" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Customer Basic Info */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">{customer.name}</p>
            <p className="text-xs text-blue-600">{customer.email}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end space-x-1 mb-1">
              <ShoppingBag className="h-3 w-3 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {customer.totalOrders} orders
              </span>
            </div>
            {daysSinceLastOrder !== null && (
              <div className="flex items-center justify-end space-x-1">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-blue-600">
                  {daysSinceLastOrder === 0 ? 'Today' : 
                   daysSinceLastOrder === 1 ? 'Yesterday' : 
                   daysSinceLastOrder < 30 ? `${daysSinceLastOrder} days ago` :
                   daysSinceLastOrder < 365 ? `${Math.floor(daysSinceLastOrder / 30)} months ago` :
                   `${Math.floor(daysSinceLastOrder / 365)} years ago`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Customer Value Metrics */}
        {totalValue > 0 && (
          <div className="grid grid-cols-2 gap-3 p-2 bg-white/50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Euro className="h-3 w-3 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  {formatPrice(totalValue)}
                </span>
              </div>
              <p className="text-xs text-gray-600">Total Value</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <TrendingUp className="h-3 w-3 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  {formatPrice(averageOrderValue)}
                </span>
              </div>
              <p className="text-xs text-gray-600">Avg Order</p>
            </div>
          </div>
        )}

        {showDetails && orders.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Order Timeline</span>
              </h4>
              <ScrollArea className="h-40">
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order, index) => (
                    <div key={order.id} className="relative">
                      {/* Timeline line */}
                      {index < orders.length - 1 && index < 4 && (
                        <div className="absolute left-2 top-8 w-0.5 h-6 bg-blue-200"></div>
                      )}
                      
                      <div className="flex items-start space-x-3">
                        {/* Timeline dot */}
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 ${
                          order.status === 'delivered' ? 'bg-green-500' :
                          order.status === 'shipped' ? 'bg-blue-500' :
                          order.status === 'confirmed' ? 'bg-yellow-500' :
                          order.status === 'pending' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}></div>
                        
                        {/* Order details */}
                        <div className="flex-1 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-900">#{order.orderNumber}</span>
                            <Badge className={getOrderStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1 text-xs text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(order.orderDate)}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs font-medium text-green-700">
                              <Euro className="h-3 w-3" />
                              <span>{formatPrice(order.total)}</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            <div className="flex items-center space-x-1 mb-1">
                              <Package className="h-3 w-3" />
                              <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="truncate">
                              {order.items.slice(0, 2).map(item => item.name).join(', ')}
                              {order.items.length > 2 && ` +${order.items.length - 2} more`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {/* Quick Actions */}
        {showDetails && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => window.open(`https://metakocka.si/customers/${customer.id}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View in Metakocka
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => {
                // This could trigger a new email compose with customer context
                console.log('Create follow-up email for:', customer.email);
              }}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Follow Up
            </Button>
          </div>
        )}

        {/* Contextual Tips */}
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <Star className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Customer Insights</p>
              <p>
                {customer.totalOrders === 0 ? 'New customer - no previous orders' :
                 customer.totalOrders === 1 ? 'First-time buyer - great opportunity to build loyalty' :
                 customer.totalOrders < 5 ? 'Regular customer - consider personalized recommendations' :
                 'Loyal customer - high value relationship'}
              </p>
              {daysSinceLastOrder !== null && daysSinceLastOrder > 90 && (
                <p className="mt-1 text-orange-700">
                  ⚠️ Haven't ordered in {Math.floor(daysSinceLastOrder / 30)} months - consider re-engagement
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 