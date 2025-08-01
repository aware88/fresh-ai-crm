// Status types
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'shipped' | 'delivered';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
export type FulfillmentStatus = 'unfulfilled' | 'processing' | 'fulfilled' | 'returned';

// Map for order status variants
export const statusVariantMap = {
  pending: { label: 'Pending', variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Processing', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
  shipped: { label: 'Shipped', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Delivered', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
} as const;

export const paymentStatusVariantMap = {
  paid: { label: 'Paid', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
  pending: { label: 'Pending', variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800' },
  failed: { label: 'Failed', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
  partially_refunded: { label: 'Partially Refunded', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
} as const;

export interface OrderItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  status: FulfillmentStatus;
  image: string;
  productId: string;
  unitPrice: number;
}

export interface OrderAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface OrderPaymentMethod {
  type: string;
  cardType?: string;
  last4?: string;
  expiry?: string;
}

export interface OrderShippingMethod {
  name: string;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
}

export interface OrderHistoryItem {
  id: string;
  date: string;
  status: string;
  message: string;
  user: string;
}

export interface Order {
  id: string;
  customer: string;
  customerId: string;
  email: string;
  phone: string;
  date: string;
  updatedAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  paymentMethod: OrderPaymentMethod;
  shippingMethod: OrderShippingMethod;
  notes: string;
  history: OrderHistoryItem[];
}
