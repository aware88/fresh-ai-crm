'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Package, DollarSign, Tag, Barcode, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface ProductForm {
  name: string;
  description: string;
  sku: string;
  category: string;
  price: string;
  cost: string;
  stockQuantity: string;
  minStockLevel: string;
  weight: string;
  dimensions: string;
  supplier: string;
  tags: string;
  imageUrl: string;
  status: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    description: '',
    sku: '',
    category: '',
    price: '',
    cost: '',
    stockQuantity: '',
    minStockLevel: '',
    weight: '',
    dimensions: '',
    supplier: '',
    tags: '',
    imageUrl: '',
    status: 'active'
  });

  const handleInputChange = (field: keyof ProductForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Price).",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          sku: formData.sku || null,
          category: formData.category || null,
          price: parseFloat(formData.price),
          cost: formData.cost ? parseFloat(formData.cost) : null,
          stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : 0,
          minStockLevel: formData.minStockLevel ? parseInt(formData.minStockLevel) : 0,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          dimensions: formData.dimensions || null,
          supplier: formData.supplier || null,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
          imageUrl: formData.imageUrl || null,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      const result = await response.json();
      
      toast({
        title: "Product Created",
        description: `${formData.name} has been added to your products.`,
      });

      router.push('/dashboard/products');
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button variant="ghost" size="icon" className="hover-brand">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary">Add New Product</h1>
            <p className="text-muted-foreground">Create a new product in your inventory</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="card-brand">
            <CardHeader className="card-header-brand">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-white" />
                <CardTitle className="text-white">Basic Information</CardTitle>
              </div>
              <CardDescription className="text-white/80">
                Essential product details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-primary">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  className="focus-brand"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-primary">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your product..."
                  className="focus-brand min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-primary">SKU</Label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="PROD-001"
                      className="pl-10 focus-brand"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-primary">Category</Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      placeholder="Electronics"
                      className="pl-10 focus-brand"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card className="card-brand">
            <CardHeader className="card-header-brand">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-white" />
                <CardTitle className="text-white">Pricing & Inventory</CardTitle>
              </div>
              <CardDescription className="text-white/80">
                Set pricing and stock information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-primary">Selling Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="29.99"
                      className="pl-10 focus-brand"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-primary">Cost Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => handleInputChange('cost', e.target.value)}
                      placeholder="15.99"
                      className="pl-10 focus-brand"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity" className="text-primary">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                    placeholder="100"
                    className="focus-brand"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStockLevel" className="text-primary">Minimum Stock Level</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => handleInputChange('minStockLevel', e.target.value)}
                    placeholder="10"
                    className="focus-brand"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card className="card-brand">
            <CardHeader className="card-header-brand">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-white" />
                <CardTitle className="text-white">Additional Details</CardTitle>
              </div>
              <CardDescription className="text-white/80">
                Optional product specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-primary">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    placeholder="0.5"
                    className="focus-brand"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dimensions" className="text-primary">Dimensions (L×W×H)</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange('dimensions', e.target.value)}
                    placeholder="10×5×3 cm"
                    className="focus-brand"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-primary">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Supplier name"
                  className="focus-brand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-primary">Product Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  placeholder="https://example.com/product-image.jpg"
                  className="focus-brand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-primary">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="electronics, gadget, popular (comma-separated)"
                  className="focus-brand"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple tags with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-primary">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="focus-brand">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <Link href="/dashboard/products">
            <Button variant="outline" className="btn-brand-secondary">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="btn-brand-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
