import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
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
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your inventory items</p>
        </div>
        <Link href="/dashboard/inventory/products/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            View and manage your product inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                <TableRow key={product.id}>
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
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/inventory/products/${product.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
