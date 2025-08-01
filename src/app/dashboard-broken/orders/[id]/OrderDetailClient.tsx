'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Printer, 
  Mail, 
  Edit, 
  Truck, 
  Clock, 
  Package, 
  CreditCard,
  MapPin,
  User,
  Building,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  History,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Download
} from "lucide-react";
import Link from "next/link";
import { Order, statusVariantMap, paymentStatusVariantMap } from './types';

interface OrderDetailClientProps {
  order: Order;
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get status variants from our defined maps
  const statusVariant = statusVariantMap[order.status]?.variant || 'outline';
  const paymentStatusVariant = paymentStatusVariantMap[order.paymentStatus]?.variant || 'outline';

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
      case 'shipped':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          asChild
          className="flex items-center hover:bg-gray-100 transition-colors"
        >
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 sm:flex-none rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 sm:flex-none rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button 
            asChild
            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Link href={`/dashboard/orders/${order.id}/edit`} className="flex items-center">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Order Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            <div className="flex items-center">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Order #{order.id}</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Placed on {formatDate(order.date)}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge 
                variant={statusVariant} 
                className="text-sm px-4 py-2 bg-white bg-opacity-20 text-white border-white border-opacity-30"
              >
                {getStatusIcon(order.status)}
                <span className="ml-2">{statusVariantMap[order.status]?.label || order.status}</span>
              </Badge>
              <Badge 
                variant={paymentStatusVariant} 
                className="text-sm px-4 py-2 bg-white bg-opacity-20 text-white border-white border-opacity-30"
              >
                {getStatusIcon(order.paymentStatus)}
                <span className="ml-2">{paymentStatusVariantMap[order.paymentStatus]?.label || order.paymentStatus}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg mr-3">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(order.total)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg mr-3">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Items</p>
                <p className="text-xl font-bold text-gray-900">{order.items.length}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg mr-3">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="text-lg font-semibold text-gray-900">{order.customer}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg mr-3">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-lg font-semibold text-gray-900">{statusVariantMap[order.status]?.label}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 p-1 bg-blue-50 rounded-xl shadow-inner border border-blue-100">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <Eye className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger 
            value="items" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <Package className="h-4 w-4" /> Items
          </TabsTrigger>
          <TabsTrigger 
            value="shipping" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <Truck className="h-4 w-4" /> Shipping
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <History className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary */}
              <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Order Summary</CardTitle>
                      <CardDescription className="text-blue-100">
                        Financial breakdown of this order
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">{formatCurrency(order.tax)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">{formatCurrency(order.shipping)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Discount</span>
                        <span className="font-medium">-{formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              {order.notes && (
                <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Order Notes</CardTitle>
                        <CardDescription className="text-blue-100">
                          Special instructions for this order
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{order.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {/* Customer Information */}
              <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Customer</CardTitle>
                      <CardDescription className="text-blue-100">
                        Customer information
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{order.customer}</p>
                        <p className="text-sm text-gray-500">{order.email}</p>
                      </div>
                    </div>
                    {order.phone && (
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium text-gray-900">{order.phone}</p>
                        </div>
                      </div>
                    )}
                    {order.shippingAddress.company && (
                      <div className="flex items-start">
                        <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Company</p>
                          <p className="font-medium text-gray-900">{order.shippingAddress.company}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Shipping Address</p>
                        <div className="font-medium text-gray-900">
                          <p>{order.shippingAddress.street1}</p>
                          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                          <p>{order.shippingAddress.country}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Payment</CardTitle>
                      <CardDescription className="text-blue-100">
                        Payment method and status
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status</span>
                      <Badge variant={paymentStatusVariant} className="text-sm">
                        {getStatusIcon(order.paymentStatus)}
                        <span className="ml-1">{paymentStatusVariantMap[order.paymentStatus]?.label}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Method</span>
                      <span className="font-medium capitalize">{order.paymentMethod.type.replace('_', ' ')}</span>
                    </div>
                    {order.paymentMethod.cardType && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Card</span>
                        <span className="font-medium">
                          {order.paymentMethod.cardType.toUpperCase()} •••• {order.paymentMethod.last4}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information */}
              <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                      <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Shipping Information</CardTitle>
                      <CardDescription className="text-blue-100">
                        Delivery details and tracking
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Method</span>
                      <span className="font-medium">{order.shippingMethod.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Carrier</span>
                      <span className="font-medium">{order.shippingMethod.carrier}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status</span>
                      <Badge variant="outline" className="text-sm">
                        {getStatusIcon(order.fulfillmentStatus)}
                        <span className="ml-1 capitalize">{order.fulfillmentStatus}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Estimated delivery</span>
                      <span className="font-medium">{formatDate(order.shippingMethod.estimatedDelivery)}</span>
                    </div>
                    {order.shippingMethod.trackingNumber && (
                      <div className="pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          Track Package
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Order Items</CardTitle>
                  <CardDescription className="text-blue-100">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} in this order
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item.total)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.unitPrice)} each</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Shipping Details</CardTitle>
                  <CardDescription className="text-blue-100">
                    Complete shipping and delivery information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Shipping Address</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{order.shippingAddress.name}</p>
                    {order.shippingAddress.company && (
                      <p className="text-gray-600">{order.shippingAddress.company}</p>
                    )}
                    <p className="text-gray-600">{order.shippingAddress.street1}</p>
                    <p className="text-gray-600">
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                    </p>
                    <p className="text-gray-600">{order.shippingAddress.country}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Billing Address</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{order.billingAddress.name}</p>
                    {order.billingAddress.company && (
                      <p className="text-gray-600">{order.billingAddress.company}</p>
                    )}
                    <p className="text-gray-600">{order.billingAddress.street1}</p>
                    <p className="text-gray-600">
                      {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zip}
                    </p>
                    <p className="text-gray-600">{order.billingAddress.country}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <History className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Order History</CardTitle>
                  <CardDescription className="text-blue-100">
                    Timeline of order status changes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {order.history.map((event) => (
                  <div key={event.id} className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <History className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.message}</p>
                      <p className="text-sm text-gray-500">by {event.user}</p>
                      <p className="text-xs text-gray-400">{formatDate(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
