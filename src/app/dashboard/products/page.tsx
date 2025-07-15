'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArisPageHeader } from '@/components/ui/aris-page-header';
import { ArisStatsCard } from '@/components/ui/aris-stats-card';
import { ProductsTable, Product } from '@/components/products/ProductsTable';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Boxes
} from 'lucide-react';
import Link from 'next/link';

// Mock stats data
const productStats = [
  {
    title: "Total Products",
    value: "1,247",
    change: "+12%",
    trend: "up" as const,
    icon: Package,
    color: "#3B82F6"
  },
  {
    title: "Low Stock Alerts",
    value: "23",
    change: "-5%",
    trend: "down" as const,
    icon: AlertTriangle,
    color: "#F59E0B"
  },
  {
    title: "Inventory Value",
    value: "$47,392",
    change: "+18%",
    trend: "up" as const,
    icon: DollarSign,
    color: "#8B5CF6"
  },
  {
    title: "Categories",
    value: "12",
    change: "+2%",
    trend: "up" as const,
    icon: Boxes,
    color: "#EC4899"
  }
];

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Action handlers
  const handleView = (product: Product) => {
    console.log('View product:', product);
    setSelectedProduct(product);
  };

  const handleEdit = (product: Product) => {
    console.log('Edit product:', product);
    // Navigate to edit page or open modal
  };

  const handleDelete = (product: Product) => {
    console.log('Delete product:', product);
    // Show confirmation dialog and delete
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ArisPageHeader
        title="Products"
        description="Manage your product catalog, inventory, and pricing"
        icon={Package}
      >
        <Button variant="secondary" size="lg" asChild>
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </ArisPageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {productStats.map((stat, index) => (
          <ArisStatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon}
            color={stat.color}
            index={index}
          />
        ))}
      </div>

      {/* Mobile Add Product Button */}
      <div className="md:hidden">
        <Button size="lg" className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" asChild>
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Products Table */}
      <ProductsTable
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
