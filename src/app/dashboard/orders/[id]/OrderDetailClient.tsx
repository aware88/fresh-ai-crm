'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Mail, Edit, Truck, Clock } from "lucide-react";
import Link from "next/link";
import { Order, statusVariantMap, paymentStatusVariantMap } from './types';
import { useThemeValues } from '@/lib/theme/theme-utils';

interface OrderDetailClientProps {
  order: Order;
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter();
  const {
    bgColor,
    cardBg,
    cardBorder,
    cardHover,
    textPrimary,
    textSecondary,
    textMuted,
    borderColor,
    buttonHover,
    buttonBorder,
    dividerColor,
    bgMuted
  } = useThemeValues();
  
  // Get status variants from our defined maps
  const statusVariant = statusVariantMap[order.status]?.variant || 'outline';
  const paymentStatusVariant = paymentStatusVariantMap[order.paymentStatus]?.variant || 'outline';

  return (
    <div className={`container mx-auto px-4 py-6 min-h-screen ${bgColor}`}>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          asChild
          className={cardHover}
        >
          <Link href="/dashboard/orders" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className={textPrimary}>Back to Orders</span>
          </Link>
        </Button>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            className={`flex-1 sm:flex-none ${buttonHover} ${buttonBorder}`}
          >
            <Printer className="mr-2 h-4 w-4" />
            <span className={textPrimary}>Print</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className={`flex-1 sm:flex-none ${buttonHover} ${buttonBorder}`}
          >
            <Mail className="mr-2 h-4 w-4" />
            <span className={textPrimary}>Email</span>
          </Button>
          <Button 
            asChild
            className="flex-1 sm:flex-none"
          >
            <Link href={`/dashboard/orders/${order.id}/edit`} className="flex items-center">
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <Card className={`${cardBg} ${cardBorder} border`}>
            <CardHeader className={`${cardBg} border-b ${borderColor}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <CardTitle className={textPrimary}>Order #{order.id}</CardTitle>
                  <p className={`text-sm ${textSecondary}`}>
                    Placed on {new Date(order.date).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={statusVariant} 
                    className="text-sm px-3 py-1"
                  >
                    {statusVariantMap[order.status]?.label || order.status}
                  </Badge>
                  <Badge 
                    variant={paymentStatusVariant} 
                    className="text-sm px-3 py-1"
                  >
                    {paymentStatusVariantMap[order.paymentStatus]?.label || order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className={`rounded-b-lg ${bgMuted} p-4`}>
                <p className={`text-center ${textMuted}`}>Order items will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Customer Information */}
          <Card className={`${cardBg} ${cardBorder} border`}>
            <CardHeader className={`${cardBg} border-b ${borderColor}`}>
              <CardTitle className={textPrimary}>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`space-y-2 ${textPrimary}`}>
                <div className="font-medium">{order.customer}</div>
                {order.shippingAddress.company && (
                  <div className={textSecondary}>{order.shippingAddress.company}</div>
                )}
                <div className={textSecondary}>{order.shippingAddress.street1}</div>
                <div className={textSecondary}>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </div>
                <div className={textSecondary}>{order.shippingAddress.country}</div>
              </div>
            </CardContent>
          </Card>
          
          {/* Shipping Information */}
          <Card className={`${cardBg} ${cardBorder} border`}>
            <CardHeader className={`${cardBg} border-b ${borderColor}`}>
              <CardTitle className={textPrimary}>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`space-y-2 ${textPrimary}`}>
                <p className={textSecondary}>
                  <span className={textMuted}>Method:</span> {order.shippingMethod.name}
                </p>
                <p className={textSecondary}>
                  <span className={textMuted}>Status:</span> {order.fulfillmentStatus}
                </p>
                <p className={textSecondary}>
                  <span className={textMuted}>Estimated delivery:</span> {order.shippingMethod.estimatedDelivery}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`mt-2 ${buttonHover} ${buttonBorder}`}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  <span className={textPrimary}>Track Package</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
