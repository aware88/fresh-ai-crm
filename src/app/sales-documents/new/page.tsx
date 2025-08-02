'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface DocumentItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function NewSalesDocumentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    document_number: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    client_id: '',
    client_name: '',
    client_email: '',
    client_address: '',
    status: 'draft',
    notes: '',
  });
  const [items, setItems] = useState<DocumentItem[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  // Fetch clients for dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, email, address')
          .order('name');

        if (error) {
          throw error;
        }

        setClients(data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, [supabase]);

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setFormData({
        ...formData,
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        client_email: selectedClient.email || '',
        client_address: selectedClient.address || '',
      });
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle status change
  const handleStatusChange = (value: string) => {
    setFormData({
      ...formData,
      status: value,
    });
  };

  // Add new item
  const addItem = () => {
    const newItem: DocumentItem = {
      id: uuidv4(),
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    };
    setItems([...items, newItem]);
  };

  // Remove item
  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // Update item
  const updateItem = (itemId: string, field: keyof DocumentItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate total price if quantity or unit price changes
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const taxRate = 0.1; // 10% tax rate
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    
    return {
      subtotal,
      taxAmount,
      total,
    };
  };

  // Handle back button click
  const handleBackClick = () => {
    router.push('/sales-documents');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.document_number || !formData.client_name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    if (items.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one item',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if all items have names and valid quantities
    const invalidItems = items.filter(item => !item.name || item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast({
        title: 'Validation Error',
        description: 'All items must have a name and a quantity greater than zero',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { subtotal, taxAmount, total } = calculateTotals();
      
      // Create document
      const { data: documentData, error: documentError } = await supabase
        .from('sales_documents')
        .insert({
          name: formData.name,
          document_number: formData.document_number,
          date: formData.date,
          due_date: formData.due_date,
          client_id: formData.client_id,
          client_name: formData.client_name,
          client_email: formData.client_email,
          client_address: formData.client_address,
          status: formData.status,
          notes: formData.notes,
          subtotal_amount: subtotal,
          tax_amount: taxAmount,
          total_amount: total,
        })
        .select('id')
        .single();
      
      if (documentError) {
        throw documentError;
      }
      
      // Create document items
      const documentItems = items.map(item => ({
        document_id: documentData.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));
      
      const { error: itemsError } = await supabase
        .from('sales_document_items')
        .insert(documentItems);
      
      if (itemsError) {
        throw itemsError;
      }
      
      toast({
        title: 'Document Created',
        description: 'Sales document has been created successfully',
      });
      
      // Navigate to the document detail page
      router.push(`/sales-documents/${documentData.id}`);
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to create sales document',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleBackClick} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Button>
        <h1 className="text-2xl font-bold">New Sales Document</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Document Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Invoice for Website Development"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_number">Document Number *</Label>
                <Input
                  id="document_number"
                  name="document_number"
                  value={formData.document_number}
                  onChange={handleInputChange}
                  placeholder="e.g. INV-2025-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Select Client</Label>
              <Select onValueChange={handleClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleInputChange}
                  placeholder="Client name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_email">Client Email</Label>
                <Input
                  id="client_email"
                  name="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={handleInputChange}
                  placeholder="client@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_address">Client Address</Label>
              <Textarea
                id="client_address"
                name="client_address"
                value={formData.client_address}
                onChange={handleInputChange}
                placeholder="Client address"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Items</CardTitle>
              <Button
                type="button"
                onClick={addItem}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No items added. Click "Add Item" to add your first item.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            placeholder="Item name"
                            className="max-w-[200px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            className="max-w-[80px] text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(item.id, 'unit_price', Number(e.target.value))}
                            className="max-w-[100px] text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total_price)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end mt-4">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (10%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes or payment instructions"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBackClick}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Document'}
          </Button>
        </div>
      </form>
    </div>
  );
}
