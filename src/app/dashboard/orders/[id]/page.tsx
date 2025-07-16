import { Order } from './types';
import { OrderDetailClient } from './OrderDetailClient';

// Mock data - in a real app, this would come from your API
const mockOrder: Order = {
  id: "ORD-001",
  customer: "Fresh Market Inc.",
  customerId: "CUST-001",
  email: "john.doe@freshmarket.com",
  phone: "(555) 123-4567",
  date: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: "processing",
  paymentStatus: "paid",
  fulfillmentStatus: "processing",
  total: 156.93,
  subtotal: 139.90,
  tax: 12.03,
  shipping: 5.00,
  discount: 0,
  notes: "Please deliver to the back entrance after 2 PM.",
  items: [
    {
      id: "ITEM-001",
      sku: "ORG-APPLE-001",
      name: "Organic Apples",
      quantity: 5,
      price: 2.99,
      total: 14.95,
      status: "processing",
      image: "/placeholder-product.jpg",
      productId: "PROD-001",
      unitPrice: 2.99
    }
  ],
  shippingAddress: {
    name: "John Doe",
    company: "Fresh Market Inc.",
    street1: "123 Market St",
    city: "San Francisco",
    state: "CA",
    zip: "94103",
    country: "USA"
  },
  billingAddress: {
    name: "John Doe",
    company: "Fresh Market Inc.",
    street1: "456 Billing St",
    city: "San Francisco",
    state: "CA",
    zip: "94105",
    country: "United States"
  },
  paymentMethod: {
    type: "credit_card",
    cardType: "visa",
    last4: "4242",
    expiry: "12/25"
  },
  shippingMethod: {
    name: "Standard Shipping",
    carrier: "USPS",
    trackingNumber: "9400100000000000000000",
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  history: [
    {
      id: "HIST-001",
      date: new Date().toISOString(),
      status: "order_placed",
      message: "Order was placed",
      user: "john.doe@example.com"
    }
  ]
};

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function OrderDetailPage({ params }: PageProps) {
  // In a real app, you would fetch the order by ID from your database
  // const order = await fetchOrderById(params.id);
  
  // Await params to fix Next.js 15 requirement
  const resolvedParams = await params;
  
  // For now, we'll use the mock data with the ID from params
  const order = { ...mockOrder, id: resolvedParams.id };
  
  // If order is not found, return 404
  if (!order) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Order not found</h1>
          <p className="text-muted-foreground">The order you are looking for does not exist.</p>
        </div>
      </div>
    );
  }
  
  return <OrderDetailClient order={order} />;
}
