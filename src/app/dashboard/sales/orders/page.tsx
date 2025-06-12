'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Search, X, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MapPin, Package, Calendar, Clock } from "lucide-react";
import Link from "next/link";

// Mock data - will be replaced with actual data from Supabase later
interface Order {
  id: string;
  customer: string;
  email: string;
  date: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  total: number;
  items: number;
  location: string;
  orderItems: {
    name: string;
    quantity: number;
    price: number;
  }[];
}

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  // Format relative time
  let relativeTime;
  if (diffInDays === 0) relativeTime = 'Today';
  else if (diffInDays === 1) relativeTime = 'Yesterday';
  else if (diffInDays < 7) relativeTime = `${diffInDays} days ago`;
  else if (diffInDays < 30) relativeTime = `${Math.floor(diffInDays / 7)} weeks ago`;
  else relativeTime = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  // Format full date and time
  const fullDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return { relativeTime, fullDate };
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Mock data - will be replaced with actual data from Supabase later
const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customer: "Fresh Market Inc.",
    email: "orders@freshmarket.com",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: "completed",
    paymentStatus: "paid",
    total: 249.95,
    items: 5,
    location: "New York, NY",
    orderItems: [
      { name: "Organic Apples", quantity: 2, price: 4.99 },
      { name: "Whole Grain Bread", quantity: 1, price: 5.99 },
      { name: "Free Range Eggs (Dozen)", quantity: 2, price: 7.49 }
    ]
  },
  {
    id: "ORD-002",
    customer: "Gourmet Delights",
    email: "orders@gourmet.com",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: "processing",
    paymentStatus: "paid",
    total: 189.50,
    items: 3,
    location: "San Francisco, CA",
    orderItems: [
      { name: "Artisanal Cheese", quantity: 3, price: 12.99 },
      { name: "Prosciutto", quantity: 2, price: 18.99 },
      { name: "Olive Oil", quantity: 1, price: 24.99 }
    ]
  },
  {
    id: "ORD-003",
    customer: "City Restaurant",
    email: "orders@cityrestaurant.com",
    date: new Date().toISOString(), // Today
    status: "pending",
    paymentStatus: "pending",
    total: 425.75,
    items: 8,
    location: "Chicago, IL",
    orderItems: [
      { name: "Beef Tenderloin", quantity: 5, price: 32.99 },
      { name: "Salmon Fillet", quantity: 3, price: 28.99 }
    ]
  },
  {
    id: "ORD-004",
    customer: "Organic Market",
    email: "orders@organicmarket.com",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    status: "completed",
    paymentStatus: "paid",
    total: 312.40,
    items: 6,
    location: "Seattle, WA",
    orderItems: [
      { name: "Organic Kale", quantity: 4, price: 3.99 },
      { name: "Avocados", quantity: 6, price: 2.49 },
      { name: "Cherry Tomatoes", quantity: 3, price: 4.99 }
    ]
  },
  {
    id: "ORD-005",
    customer: "Cafe Bella",
    email: "orders@cafebella.com",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    status: "cancelled",
    paymentStatus: "refunded",
    total: 156.80,
    items: 2,
    location: "Miami, FL",
    orderItems: [
      { name: "Specialty Coffee Beans", quantity: 2, price: 18.99 },
      { name: "Organic Tea Selection", quantity: 1, price: 15.99 }
    ]
  },
];

// Types
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  date: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  items: number;
  location: string;
  orderItems: OrderItem[];
}

const statusVariantMap = {
  completed: { label: "Completed", variant: "default" },
  processing: { label: "Processing", variant: "secondary" },
  pending: { label: "Pending", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
} as const;

const paymentStatusVariantMap = {
  paid: { label: "Paid", variant: "default" },
  pending: { label: "Pending", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Refunded", variant: "secondary" },
} as const;

const statusOptions: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const paymentStatusOptions: { value: PaymentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

// Pagination component
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
        Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
        <span className="font-medium">
          {Math.min(currentPage * pageSize, totalItems)}
        </span>{' '}
        of <span className="font-medium">{totalItems}</span> orders
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
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <span className="sr-only">Next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <span className="sr-only">Last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  
  // State for pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter orders based on search term and filters
  const filteredOrders = useMemo(() => {
    return mockOrders.filter(order => {
      // Search filter
      const matchesSearch = !searchTerm || 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      // Payment filter
      const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
      
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [searchTerm, statusFilter, paymentFilter]);

  // Calculate pagination
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  // Reset to first page when filters change
  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || paymentFilter !== 'all';
  
  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Optional: Scroll to top of the table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sales Orders</h1>
            <p className="text-muted-foreground">Manage and track your sales orders</p>
          </div>
          <Link href="/dashboard/sales/orders/new" className="w-full md:w-auto">
            <Button className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search orders by ID, customer, or email..."
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

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value: OrderStatus | 'all') => setStatusFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status Filter */}
            <div className="w-full sm:w-48">
              <Select
                value={paymentFilter}
                onValueChange={(value: PaymentStatus | 'all') => setPaymentFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Payment" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {paymentStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
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
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1.5 rounded-full hover:bg-accent"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="px-2 py-1 text-xs font-normal">
                  Status: {statusVariantMap[statusFilter].label}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1.5 rounded-full hover:bg-accent"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {paymentFilter !== 'all' && (
                <Badge variant="secondary" className="px-2 py-1 text-xs font-normal">
                  Payment: {paymentStatusVariantMap[paymentFilter].label}
                  <button
                    onClick={() => setPaymentFilter('all')}
                    className="ml-1.5 rounded-full hover:bg-accent"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
                {searchTerm ? ` matching "${searchTerm}"` : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ORDER</TableHead>
                <TableHead>CUSTOMER</TableHead>
                <TableHead>DATE</TableHead>
                <TableHead>ITEMS</TableHead>
                <TableHead>TOTAL</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>PAYMENT</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{order.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.customer}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <div className="font-medium">{formatDate(order.date).relativeTime}</div>
                        <div className="text-xs text-muted-foreground" title={formatDate(order.date).fullDate}>
                          {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">
                          {order.items} {order.items === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]" title={order.orderItems.map(item => `${item.quantity}x ${item.name}`).join(', ')}>
                        {order.orderItems.slice(0, 2).map(item => `${item.quantity}x ${item.name}`).join(', ')}
                        {order.orderItems.length > 2 ? '...' : ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <div>{formatCurrency(order.total)}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.items} {order.items === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={statusVariantMap[order.status].variant as any}>
                        {statusVariantMap[order.status].label}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[100px]" title={order.location}>
                          {order.location}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={paymentStatusVariantMap[order.paymentStatus].variant as any}>
                      {paymentStatusVariantMap[order.paymentStatus].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/sales/orders/${order.id}`} className="text-foreground">
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
    </div>
  );
}
