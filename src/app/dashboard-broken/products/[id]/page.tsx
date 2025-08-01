'use client';

import { use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Package, PackageOpen, Tag, List, DollarSign, AlertTriangle, Calendar, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

export default function ProductDetailPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  
  // In a real app, you would fetch the product data here
  // const { data: product, isLoading } = useProduct(resolvedParams.id);
  const product = mockProduct;
  const isLowStock = product.quantity_on_hand <= product.min_stock_level;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/products" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-medium">SKU: {product.sku}</span>
                <span>•</span>
                <span>{product.category}</span>
                <Badge 
                  variant={isLowStock ? "destructive" : "default"}
                  className={`ml-2 ${isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                >
                  {isLowStock ? (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Low Stock
                    </>
                  ) : (
                    'In Stock'
                  )}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/products/${resolvedParams.id}/edit`} className="flex items-center">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Package className="mr-2 h-4 w-4" />
                Add Stock
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 mb-1">Current Stock</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {product.quantity_on_hand} {product.unit}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-full">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Selling Price</p>
                      <p className="text-2xl font-bold text-green-900">
                        ${product.selling_price.toFixed(2)} / {product.unit}
                      </p>
                    </div>
                    <div className="p-3 bg-green-200 rounded-full">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 mb-1">Min Stock Level</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {product.min_stock_level} {product.unit}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-200 rounded-full">
                      <PackageOpen className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 mb-1">Cost Price</p>
                      <p className="text-2xl font-bold text-purple-900">
                        ${product.cost_price?.toFixed(2) || 'N/A'} / {product.unit}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-200 rounded-full">
                      <TrendingDown className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Product Description */}
            {product.description && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Product Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Stock History */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Stock History</CardTitle>
                <CardDescription>Recent stock movements and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No stock history available</h3>
                  <p className="text-gray-600">Stock movements will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:border-blue-200">
                  <Package className="h-4 w-4 mr-3" />
                  Receive Stock
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-green-50 hover:border-green-200">
                  <List className="h-4 w-4 mr-3" />
                  View All Transactions
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-purple-50 hover:border-purple-200">
                  <Tag className="h-4 w-4 mr-3" />
                  Update Pricing
                </Button>
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">Created</span>
                  </div>
                  <span className="text-sm font-medium">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">Last Updated</span>
                  </div>
                  <span className="text-sm font-medium">
                    {new Date(product.updated_at).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
