'use client';

import React, { useState } from 'react';
import { ProductList } from '@/components/products/ProductList';
import { ProductForm } from '@/components/products/ProductForm';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { SyncAllProductsButton } from '@/components/integrations/metakocka';

export default function ProductsPage() {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex items-center gap-2">
          <SyncAllProductsButton variant="outline" />
          <Button 
            onClick={() => {
              setIsAddingProduct(true);
              setEditingProduct(null);
            }}
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Add Product
          </Button>
        </div>
      </div>
      
      {isAddingProduct && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
          <ProductForm 
            onComplete={() => {
              setIsAddingProduct(false);
            }}
            onCancel={() => {
              setIsAddingProduct(false);
            }}
          />
        </div>
      )}

      <ProductList 
        onEdit={(productId) => {
          setEditingProduct(productId);
          setIsAddingProduct(false);
        }}
      />
      
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
            <ProductForm 
              productId={editingProduct}
              onComplete={() => {
                setEditingProduct(null);
              }}
              onCancel={() => {
                setEditingProduct(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
