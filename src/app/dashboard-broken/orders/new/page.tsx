'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Trash2, Package, User, MapPin, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface NewOrderForm {
  customer: string;
  email: string;
  phone: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  notes: string;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    company: string;
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<NewOrderForm>({
    customer: '',
    email: '',
    phone: '',
    status: 'pending',
    paymentStatus: 'pending',
    notes: '',
    items: [
      {
        id: '1',
        name: '',
        quantity: 1,
        price: 0,
        total: 0
      }
    ],
    shippingAddress: {
      name: '',
      company: '',
      street1: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    }
  });

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      price: 0,
      total: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'price') {
            updatedItem.total = updatedItem.quantity * updatedItem.price;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08; // 8% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the data to your API
      // For now, we'll just simulate a successful creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Order Created',
        description: 'The order has been successfully created.',
      });
      
      // Redirect to the orders list
      router.push('/dashboard/orders');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create the order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Order</h1>
            <p className="text-muted-foreground">
              Add a new order to your system
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
              <CardDescription>
                Enter the customer details for this order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer Name</Label>
                <Input
                  id="customer"
                  value={formData.customer}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer: e.target.value }))}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="customer@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Status
              </CardTitle>
              <CardDescription>
                Set the initial status for this order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Order Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'pending' | 'processing' | 'completed' | 'cancelled') => 
                    setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value: 'pending' | 'paid' | 'failed' | 'refunded') => 
                    setFormData(prev => ({ ...prev, paymentStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any special instructions or notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
              <CardDescription>
                Where should this order be delivered?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shippingName">Full Name</Label>
                <Input
                  id="shippingName"
                  value={formData.shippingAddress.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shippingAddress: { ...prev.shippingAddress, name: e.target.value }
                  }))}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingCompany">Company</Label>
                <Input
                  id="shippingCompany"
                  value={formData.shippingAddress.company}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shippingAddress: { ...prev.shippingAddress, company: e.target.value }
                  }))}
                  placeholder="Company name (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingStreet">Street Address</Label>
                <Input
                  id="shippingStreet"
                  value={formData.shippingAddress.street1}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shippingAddress: { ...prev.shippingAddress, street1: e.target.value }
                  }))}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="shippingCity">City</Label>
                  <Input
                    id="shippingCity"
                    value={formData.shippingAddress.city}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shippingAddress: { ...prev.shippingAddress, city: e.target.value }
                    }))}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingState">State</Label>
                  <Input
                    id="shippingState"
                    value={formData.shippingAddress.state}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shippingAddress: { ...prev.shippingAddress, state: e.target.value }
                    }))}
                    placeholder="State"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingZip">ZIP Code</Label>
                <Input
                  id="shippingZip"
                  value={formData.shippingAddress.zip}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shippingAddress: { ...prev.shippingAddress, zip: e.target.value }
                  }))}
                  placeholder="12345"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>
              Add items to this order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="Item name"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                    />
                  </div>
                  <div className="w-32 text-right font-medium">
                    ${item.total.toFixed(2)}
                  </div>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%):</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/orders">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  );
} 