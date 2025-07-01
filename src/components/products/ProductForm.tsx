import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { fetchProducts, createProduct, updateProduct, Product } from '@/lib/products/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface ProductFormProps {
  productId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category: string;
  unit: string;
}

export function ProductForm({ productId, onComplete, onCancel }: ProductFormProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(!!productId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ProductFormData>();
  
  // Load existing product data if editing
  useEffect(() => {
    if (productId) {
      const loadProductData = async () => {
        setIsLoadingProduct(true);
        try {
          const products = await fetchProducts();
          const product = products.find(p => p.id === productId);
          
          if (product) {
            // Populate form with product data
            setValue('name', product.name || '');
            setValue('sku', product.sku || '');
            setValue('description', product.description || '');
            setValue('category', product.category || '');
            setValue('unit', product.unit || '');
            setErrorMessage(null);
          } else {
            setErrorMessage('Product not found');
          }
        } catch (error) {
          console.error('Error loading product data:', error);
          setErrorMessage('Failed to load product data');
        } finally {
          setIsLoadingProduct(false);
        }
      };
      
      loadProductData();
    }
  }, [productId, setValue]);
  
  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      if (productId) {
        // Update existing product
        await updateProduct({
          id: productId,
          ...data
        });
      } else {
        // Create new product
        await createProduct(data);
      }
      
      setErrorMessage(null);
      reset(); // Clear form
      onComplete(); // Signal completion to parent
    } catch (error) {
      console.error('Error saving product:', error);
      setErrorMessage('Failed to save product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {errorMessage}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Product name is required' })}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sku">SKU / Product Code</Label>
        <Input
          id="sku"
          {...register('sku')}
          placeholder="Optional product code"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Product description"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            {...register('category')}
            placeholder="e.g., Electronics, Office Supplies"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            {...register('unit')}
            placeholder="e.g., each, kg, liter"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            productId ? 'Update Product' : 'Add Product'
          )}
        </Button>
      </div>
    </form>
  );
}
