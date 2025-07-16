'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Package, Package2, BarChart3, History } from "lucide-react";
import Link from "next/link";

// Mock data - will be replaced with actual data from Supabase later
const mockProducts = [
  {
    id: "1",
    sku: "PROD-001",
    name: "Organic Apples",
    category: "Fruits",
    unit: "kg",
    quantity_on_hand: 150.5,
    selling_price: 3.99,
    min_stock_level: 50,
  },
  {
    id: "2",
    sku: "PROD-002",
    name: "Fresh Salmon Fillet",
    category: "Seafood",
    unit: "kg",
    quantity_on_hand: 25.2,
    selling_price: 24.99,
    min_stock_level: 10,
  },
  {
    id: "3",
    sku: "PROD-003",
    name: "Free Range Eggs (Dozen)",
    category: "Dairy & Eggs",
    unit: "dozen",
    quantity_on_hand: 42,
    selling_price: 5.99,
    min_stock_level: 20,
  },
];

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('products');
  const router = useRouter();

  const handleProductClick = (productId: string) => {
    router.push(`/dashboard/products/${productId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product catalog, inventory, and get AI-powered insights
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 p-1 bg-blue-50 rounded-xl shadow-inner border border-blue-100">
          <TabsTrigger 
            value="products" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <Package className="h-4 w-4" /> Products
          </TabsTrigger>
          <TabsTrigger 
            value="inventory" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <Package2 className="h-4 w-4" /> Inventory
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <History className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Product Management</CardTitle>
                    <CardDescription className="text-blue-100">
                      View, add, edit, and manage your product catalog
                    </CardDescription>
                  </div>
                </div>
                <Link href="/dashboard/products/new">
                  <Button variant="secondary" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-20">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">In Stock</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProducts.map((product) => (
                    <TableRow 
                      key={product.id} 
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => handleProductClick(product.id)}
                    >
                      <TableCell className="font-medium">{product.sku}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">
                        {product.quantity_on_hand} {product.unit}
                        {product.quantity_on_hand <= product.min_stock_level && (
                          <span className="ml-2 text-xs text-yellow-600">
                            (Low Stock)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        ${product.selling_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.quantity_on_hand > product.min_stock_level 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.quantity_on_hand > product.min_stock_level ? 'In Stock' : 'Low Stock'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(product.id);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <Package2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Inventory Management</CardTitle>
                  <CardDescription className="text-blue-100">
                    Track stock levels, manage inventory, and set reorder points
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Package2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inventory Management</h3>
                <p className="text-gray-600 mb-4">
                  Advanced inventory tracking features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Product Analytics</CardTitle>
                  <CardDescription className="text-blue-100">
                    View sales performance, trends, and insights
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Product Analytics</h3>
                <p className="text-gray-600 mb-4">
                  Advanced analytics and reporting features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <History className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Product History</CardTitle>
                  <CardDescription className="text-blue-100">
                    View product changes, stock movements, and audit trail
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <History className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Product History</h3>
                <p className="text-gray-600 mb-4">
                  Product history and audit trail features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
