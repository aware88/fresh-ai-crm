'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

type SalesDocumentItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
};

export default function NewSalesDocumentPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState<string>('invoice');
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [documentDate, setDocumentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<SalesDocumentItem[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 22, // Default tax rate in Slovenia
      total: 0
    }
  ]);

  const calculateItemTotal = (item: SalesDocumentItem) => {
    return item.quantity * item.unit_price * (1 + item.tax_rate / 100);
  };

  const updateItem = (id: string, field: keyof SalesDocumentItem, value: any) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate total if quantity, unit_price, or tax_rate changes
          if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate') {
            updatedItem.total = calculateItemTotal(updatedItem);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: 22,
        total: 0
      }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTaxTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.tax_rate / 100)), 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create the sales document
      const { data: document, error: documentError } = await supabase
        .from('sales_documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          client_name: clientName,
          client_email: clientEmail,
          document_date: documentDate,
          due_date: dueDate || null,
          notes: notes,
          subtotal_amount: calculateSubtotal(),
          tax_amount: calculateTaxTotal(),
          total_amount: calculateTotal(),
          status: 'draft'
        })
        .select()
        .single();

      if (documentError) {
        throw documentError;
      }

      // Create the document items
      const documentItems = items.map(item => ({
        document_id: document.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        total: item.total
      }));

      const { error: itemsError } = await supabase
        .from('sales_document_items')
        .insert(documentItems);

      if (itemsError) {
        throw itemsError;
      }

      toast({
        title: 'Success',
        description: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} created successfully`,
      });

      // Redirect to the document page
      router.push(`/dashboard/sales-documents/${document.id}`);
    } catch (error) {
      console.error('Error creating sales document:', error);
      toast({
        title: 'Error',
        description: 'Failed to create sales document',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/sales-documents" className="mr-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Sales Document</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="documentType">Document Type</Label>
                  <Select
                    value={documentType}
                    onValueChange={setDocumentType}
                  >
                    <SelectTrigger id="documentType">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="documentDate">Document Date</Label>
                  <Input
                    id="documentDate"
                    type="date"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    required
                  />
                </div>
                {documentType === 'invoice' && (
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end border-b pb-4">
                    <div className="col-span-12 md:col-span-3">
                      <Label htmlFor={`item-name-${index}`}>Item</Label>
                      <Input
                        id={`item-name-${index}`}
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <Label htmlFor={`item-description-${index}`}>Description</Label>
                      <Input
                        id={`item-description-${index}`}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                      <Label htmlFor={`item-quantity-${index}`}>Qty</Label>
                      <Input
                        id={`item-quantity-${index}`}
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label htmlFor={`item-price-${index}`}>Price</Label>
                      <Input
                        id={`item-price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, 'unit_price', Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                      <Label htmlFor={`item-tax-${index}`}>Tax %</Label>
                      <Input
                        id={`item-tax-${index}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.tax_rate}
                        onChange={(e) => updateItem(item.id, 'tax_rate', Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-span-10 md:col-span-1">
                      <Label htmlFor={`item-total-${index}`}>Total</Label>
                      <Input
                        id={`item-total-${index}`}
                        type="number"
                        value={item.total.toFixed(2)}
                        disabled
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div>
                <div className="text-sm text-gray-500">Subtotal: ${calculateSubtotal().toFixed(2)}</div>
                <div className="text-sm text-gray-500">Tax: ${calculateTaxTotal().toFixed(2)}</div>
                <div className="font-bold">Total: ${calculateTotal().toFixed(2)}</div>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/sales-documents">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Document'}
          </Button>
        </div>
      </form>
    </div>
  );
}
