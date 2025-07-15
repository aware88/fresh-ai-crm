'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArisTable, ArisTableColumn, ArisTableFilter, ArisTableAction, createTableActions } from '@/components/ui/aris-table';
import { Eye, Edit, Trash2 } from 'lucide-react';

// Product interface
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  lastUpdated: string;
  supplier?: string;
}

// Sample product data
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Organic Apples',
    sku: 'ORG-APP-001',
    category: 'Fruits',
    price: 4.99,
    stock: 150,
    status: 'active',
    lastUpdated: '2024-01-15',
    supplier: 'Fresh Farms Co.'
  },
  {
    id: '2',
    name: 'Whole Grain Bread',
    sku: 'WGB-001',
    category: 'Bakery',
    price: 5.99,
    stock: 75,
    status: 'active',
    lastUpdated: '2024-01-14',
    supplier: 'Artisan Bakery'
  },
  {
    id: '3',
    name: 'Premium Coffee Beans',
    sku: 'COF-PREM-001',
    category: 'Beverages',
    price: 24.99,
    stock: 0,
    status: 'out_of_stock',
    lastUpdated: '2024-01-13',
    supplier: 'Mountain Coffee Co.'
  },
  {
    id: '4',
    name: 'Organic Kale',
    sku: 'ORG-KAL-001',
    category: 'Vegetables',
    price: 3.99,
    stock: 200,
    status: 'active',
    lastUpdated: '2024-01-12',
    supplier: 'Green Valley Farms'
  },
  {
    id: '5',
    name: 'Artisan Cheese',
    sku: 'ART-CHE-001',
    category: 'Dairy',
    price: 12.99,
    stock: 45,
    status: 'active',
    lastUpdated: '2024-01-11',
    supplier: 'Dairy Delights'
  },
  {
    id: '6',
    name: 'Discontinued Item',
    sku: 'DIS-ITM-001',
    category: 'Misc',
    price: 9.99,
    stock: 0,
    status: 'inactive',
    lastUpdated: '2024-01-10',
    supplier: 'Old Supplier'
  }
];

interface ProductsTableProps {
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  className?: string;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  onView,
  onEdit,
  onDelete,
  className = '',
}) => {
  // Define table columns
  const columns: ArisTableColumn<Product>[] = [
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{value}</span>
          <span className="text-sm text-muted-foreground">{row.sku}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      align: 'right',
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      align: 'right',
      render: (value, row) => (
        <div className="flex flex-col items-end">
          <span className={`font-medium ${value === 0 ? 'text-red-600' : value < 50 ? 'text-orange-600' : 'text-green-600'}`}>
            {value}
          </span>
          {value === 0 && (
            <span className="text-xs text-red-500">Out of stock</span>
          )}
          {value > 0 && value < 50 && (
            <span className="text-xs text-orange-500">Low stock</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusConfig = {
          active: { label: 'Active', variant: 'default' as const },
          inactive: { label: 'Inactive', variant: 'secondary' as const },
          out_of_stock: { label: 'Out of Stock', variant: 'destructive' as const },
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'supplier',
      label: 'Supplier',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  // Define filters
  const filters: ArisTableFilter[] = [
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'Fruits', label: 'Fruits' },
        { value: 'Vegetables', label: 'Vegetables' },
        { value: 'Bakery', label: 'Bakery' },
        { value: 'Beverages', label: 'Beverages' },
        { value: 'Dairy', label: 'Dairy' },
        { value: 'Misc', label: 'Miscellaneous' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'out_of_stock', label: 'Out of Stock' },
      ],
    },
    {
      key: 'supplier',
      label: 'Supplier',
      type: 'text',
      placeholder: 'Filter by supplier...',
    },
  ];

  // Define actions
  const actions: ArisTableAction<Product>[] = [];
  
  if (onView) {
    actions.push({
      label: 'View',
      icon: Eye,
      onClick: onView,
      variant: 'outline',
    });
  }
  
  if (onEdit) {
    actions.push({
      label: 'Edit',
      icon: Edit,
      onClick: onEdit,
      variant: 'outline',
    });
  }
  
  if (onDelete) {
    actions.push({
      label: 'Delete',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive',
    });
  }

  return (
    <ArisTable
      data={sampleProducts}
      columns={columns}
      filters={filters}
      actions={actions}
      searchPlaceholder="Search products by name, SKU, or supplier..."
      emptyMessage="No products found. Add some products to get started."
      className={className}
    />
  );
};

export default ProductsTable; 