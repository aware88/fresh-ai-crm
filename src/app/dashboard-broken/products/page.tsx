'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Package, Package2, BarChart3, History, Search, AlertTriangle, Filter, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";

// Product interface (matching actual database schema)
interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  user_id: string;
  organization_id: string | null;
  created_at: string;
}

// Pagination component (matching orders page)
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalItems: number;
}) {
  const pageNumbers = [];
  const maxPageButtons = 5;
  
  // Calculate range of page numbers to show
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
  
  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange(Number(e.target.value));
    onPageChange(1); // Reset to first page when changing page size
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
        <span className="font-medium">
          {Math.min(currentPage * pageSize, totalItems)}
        </span>{' '}
        of <span className="font-medium">{totalItems}</span> products
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="bg-transparent border-0 p-1 pr-6 text-sm rounded-md focus:ring-1 focus:ring-ring"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">First page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {pageNumbers.map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ))}
            {endPage < totalPages && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span className="sr-only">Next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <span className="sr-only">Last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Check if there are active filters
  const hasActiveFilters = searchTerm || categoryFilter !== 'all';

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(pageSize)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[300px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product inventory and pricing
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
          <TabsTrigger 
            value="inventory" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <Package2 className="h-4 w-4" /> Inventory
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
                      Track your products, stock levels, and pricing
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
              {/* Search and Filters */}
              <div className="space-y-3 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search products by name or description..."
                      className="pl-9 pr-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={() => setSearchTerm('')}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                      </Button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div className="w-full sm:w-48">
                    <Select
                      value={categoryFilter}
                      onValueChange={(value: string) => setCategoryFilter(value)}
                    >
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Category" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category || ''}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-sm text-muted-foreground">Filters:</span>
                    
                    {searchTerm && (
                      <Badge variant="secondary" className="px-2 py-1 text-xs font-normal">
                        Search: {searchTerm}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                          onClick={() => setSearchTerm('')}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    )}
                    
                    {categoryFilter !== 'all' && (
                      <Badge variant="secondary" className="px-2 py-1 text-xs font-normal">
                        Category: {categoryFilter}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                          onClick={() => setCategoryFilter('all')}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Products Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NAME</TableHead>
                    <TableHead>DESCRIPTION</TableHead>
                    <TableHead>CATEGORY</TableHead>
                    <TableHead>CREATED</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32">
                        <LoadingSkeleton />
                      </TableCell>
                    </TableRow>
                  ) : paginatedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {error ? `Error: ${error}` : 'No products found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProducts.map((product) => (
                      <TableRow 
                        key={product.id} 
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                        onClick={() => router.push(`/dashboard/products/${product.id}`)}
                      >
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {product.description || '—'}
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge variant="secondary">{product.category}</Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(product.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link href={`/dashboard/products/${product.id}`} className="text-foreground">
                                View
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="px-6 pb-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                  totalItems={totalItems}
                />
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
                    Insights and trends for your product inventory
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Product Analytics</h3>
                <p className="text-gray-600 mb-4">
                  Advanced analytics and insights for your products coming soon
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
                    Track changes and updates to your products
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <History className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Product History</h3>
                <p className="text-gray-600 mb-4">
                  Product change history and audit trail will be available here
                </p>
              </div>
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
                    Track stock levels, alerts, and inventory movements
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Package2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inventory Management</h3>
                <p className="text-gray-600 mb-4">
                  Advanced inventory tracking and management features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
