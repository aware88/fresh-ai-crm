import React, { useEffect, useState } from 'react';
import { 
  fetchPricing, 
  createPricing, 
  updatePricing, 
  deletePricing,
  SupplierProductPricing,
  SupplierPricing
} from '@/lib/products/api';
import { fetchSuppliers, Supplier } from '@/lib/suppliers/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Edit, Trash } from 'lucide-react';

interface ProductPricingDetailsProps {
  productId: string;
  onClose: () => void;
}

// Form data for creating/editing pricing
interface PricingFormData {
  id?: string;
  supplier_id: string;
  price: number;
  currency: string;
  unit_price: boolean;
  quantity: number;
  unit?: string;
  valid_from?: string;
  valid_to?: string;
  notes?: string;
}

export function ProductPricingDetails({ 
  productId, 
  onClose 
}: ProductPricingDetailsProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(true);
  const [pricingData, setPricingData] = useState<SupplierProductPricing[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<PricingFormData>({
    supplier_id: '',
    price: 0,
    currency: 'USD',
    unit_price: true,
    quantity: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load pricing data and suppliers
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load pricing for this product
        const pricingData = await fetchPricing(productId);
        setPricingData(pricingData as SupplierProductPricing[]);
        
        // Load suppliers for dropdown
        const suppliersData = await fetchSuppliers();
        setSuppliers(suppliersData);
        
        setError(null);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load pricing data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [productId]);

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      supplier_id: '',
      price: 0,
      currency: 'USD',
      unit_price: true,
      quantity: 1,
      notes: ''
    });
    setEditingId(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value
    });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // Load pricing data for editing
  const handleEdit = (pricingId: string) => {
    const pricingToEdit = pricingData.find(p => p.pricing_id === pricingId);
    if (pricingToEdit) {
      setFormData({
        id: pricingToEdit.id,
        supplier_id: pricingToEdit.supplier_id,
        price: pricingToEdit.price,
        currency: pricingToEdit.currency || 'USD',
        unit_price: pricingToEdit.unit_price !== false, // Default to true if undefined
        quantity: pricingToEdit.quantity || 1,
        unit: pricingToEdit.unit,
        valid_from: pricingToEdit.valid_from,
        valid_to: pricingToEdit.valid_to,
        notes: pricingToEdit.notes
      });
      setEditingId(pricingId);
      setIsAddMode(true);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Add product_id to the form data
      const pricingRequest: Omit<SupplierPricing, 'id'> | SupplierPricing = {
        ...formData,
        product_id: productId
      };
      
      let result;
      
      if (editingId) {
        // Update existing pricing
        result = await updatePricing(pricingRequest as SupplierPricing);
      } else {
        // Create new pricing
        result = await createPricing(pricingRequest);
      }
      
      // Reload pricing data
      const updatedPricing = await fetchPricing(productId);
      setPricingData(updatedPricing as SupplierProductPricing[]);
      
      // Reset form and exit add mode
      resetForm();
      setIsAddMode(false);
      setError(null);
    } catch (error) {
      console.error('Error saving pricing:', error);
      setError('Failed to save pricing information');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle pricing deletion
  const handleDelete = async (pricingId: string) => {
    if (window.confirm('Are you sure you want to delete this pricing entry?')) {
      try {
        await deletePricing(pricingId);
        
        // Reload pricing data
        const updatedPricing = await fetchPricing(productId);
        setPricingData(updatedPricing as SupplierProductPricing[]);
        
        setError(null);
      } catch (error) {
        console.error('Error deleting pricing:', error);
        setError('Failed to delete pricing information');
      }
    }
  };
  
  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  // Format currency for display
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {!isAddMode && (
        <div className="flex justify-end">
          <Button 
            onClick={() => {
              resetForm();
              setIsAddMode(true);
            }}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Pricing
          </Button>
        </div>
      )}
      
      {isAddMode && (
        <div className="bg-gray-50 p-4 rounded-lg border mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editingId ? 'Edit Pricing' : 'Add New Pricing'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier *</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => handleSelectChange('supplier_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleSelectChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="AUD">AUD ($)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  name="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valid_to">Valid To</Label>
                <Input
                  id="valid_to"
                  name="valid_to"
                  type="date"
                  value={formData.valid_to}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  name="unit"
                  value={formData.unit || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., each, kg, liter"
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox 
                  id="unit_price" 
                  checked={formData.unit_price}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('unit_price', checked as boolean)
                  }
                />
                <Label htmlFor="unit_price">Unit Price (vs. Total Price)</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                placeholder="Additional notes about this pricing"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsAddMode(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingId ? 'Update Pricing' : 'Save Pricing'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {/* Pricing table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  </div>
                </TableCell>
              </TableRow>
            ) : pricingData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No pricing information available for this product.
                </TableCell>
              </TableRow>
            ) : (
              pricingData.map((pricing) => (
                <TableRow key={pricing.pricing_id}>
                  <TableCell>{pricing.supplier_name}</TableCell>
                  <TableCell>
                    <div>{formatCurrency(pricing.price, pricing.currency)}</div>
                    <div className="text-sm text-gray-500">
                      {pricing.unit_price !== false ? 'Per Unit' : 'Total'}
                    </div>
                  </TableCell>
                  <TableCell>{pricing.quantity || 1}</TableCell>
                  <TableCell>{pricing.unit || '-'}</TableCell>
                  <TableCell>
                    {pricing.valid_from || pricing.valid_to ? (
                      <div className="text-sm">
                        {pricing.valid_from && <div>From: {formatDate(pricing.valid_from)}</div>}
                        {pricing.valid_to && <div>To: {formatDate(pricing.valid_to)}</div>}
                      </div>
                    ) : (
                      'No date restriction'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(pricing.pricing_id)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(pricing.pricing_id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
