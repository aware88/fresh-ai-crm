'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Package, PackageOpen, Tag, List, DollarSign, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";

// Mock data - replace with actual data fetching
const mockProduct = {
  id: "1",
  sku: "PROD-001",
  name: "Organic Apples",
  description: "Fresh organic apples from local farms. Perfect for healthy snacks and baking.",
  category: "Fruits",
  unit: "kg",
  quantity_on_hand: 45.5,
  selling_price: 3.99,
  cost_price: 2.50,
  min_stock_level: 50,
  created_at: "2023-10-15T10:30:00Z",
  updated_at: "2023-10-20T14:45:00Z",
};

interface PageParams {
  id: string;
}

export default function ProductDetailPage({ params }: { params: PageParams }) {
  const router = useRouter();
  
  // In a real app, you would fetch the product data here
  // const { data: product, isLoading } = useProduct(params.id);
  const product = mockProduct;
  const isLowStock = product.quantity_on_hand <= product.min_stock_level;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/inventory/products" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
        
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/inventory/products/${params.id}/edit`} className="flex items-center">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button>Add Stock</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Product Details Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <CardDescription className="mt-1">
                    SKU: {product.sku} • {product.category}
                  </CardDescription>
                </div>
                <Badge 
                  variant={isLowStock ? "destructive" : "default"}
                  className="flex items-center gap-1"
                >
                  {isLowStock ? (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock
                    </>
                  ) : (
                    'In Stock'
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current Stock</p>
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">
                        {product.quantity_on_hand} {product.unit}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Minimum Stock Level</p>
                    <div className="flex items-center">
                      <PackageOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">
                        {product.min_stock_level} {product.unit}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Selling Price</p>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">
                        ${product.selling_price.toFixed(2)} / {product.unit}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Cost Price</p>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">
                        ${product.cost_price?.toFixed(2) || 'N/A'} / {product.unit}
                      </span>
                    </div>
                  </div>
                </div>
                
                {product.description && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{product.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Stock History Card */}
          <Card>
            <CardHeader>
              <CardTitle>Stock History</CardTitle>
              <CardDescription>Recent stock movements for this product</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2" />
                <p>No stock history available</p>
                <p className="text-sm">Stock movements will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Receive Stock
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <List className="h-4 w-4 mr-2" />
                View All Transactions
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Tag className="h-4 w-4 mr-2" />
                Update Pricing
              </Button>
            </CardContent>
          </Card>
          
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">
                  {new Date(product.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">
                  {new Date(product.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
