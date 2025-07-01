'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { SyncInventoryButton } from './SyncInventoryButton';
import { InventoryAlerts } from './InventoryAlerts';
import { getAllProductsInventory } from '@/lib/integrations/metakocka/inventory-api';

interface InventoryItem {
  productId: string;
  metakockaId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  lastUpdated: string;
  productName?: string;
  productSku?: string;
  error?: string;
}

export function InventoryDashboard() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem; direction: 'ascending' | 'descending' }>(
    { key: 'quantityAvailable', direction: 'ascending' }
  );

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const data = await getAllProductsInventory();
      
      // Fetch product names and SKUs
      const inventoryWithProductDetails = await Promise.all(
        data.map(async (item: InventoryItem) => {
          try {
            // Get product details from the database
            const productResponse = await fetch(`/api/products/${item.productId}`);
            if (productResponse.ok) {
              const product = await productResponse.json();
              return {
                ...item,
                productName: product.name,
                productSku: product.sku || 'N/A'
              };
            }
            return item;
          } catch (error) {
            console.error(`Error fetching product details for ${item.productId}:`, error);
            return item;
          }
        })
      );
      
      setInventory(inventoryWithProductDetails);
      setFilteredInventory(inventoryWithProductDetails);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sync completion
  const handleSyncComplete = () => {
    fetchInventory();
  };

  // Filter inventory based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInventory(inventory);
      return;
    }

    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = inventory.filter(item => 
      (item.productName?.toLowerCase().includes(lowercasedTerm) || false) ||
      (item.productSku?.toLowerCase().includes(lowercasedTerm) || false) ||
      item.metakockaId.toLowerCase().includes(lowercasedTerm)
    );
    
    setFilteredInventory(filtered);
  }, [searchTerm, inventory]);

  // Sort inventory
  const requestSort = (key: keyof InventoryItem) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
    
    const sortedItems = [...filteredInventory].sort((a, b) => {
      if (a[key] === null || a[key] === undefined) return 1;
      if (b[key] === null || b[key] === undefined) return -1;
      
      if (a[key] < b[key]) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredInventory(sortedItems);
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof InventoryItem) => {
    if (sortConfig.key !== key) return null;
    
    return sortConfig.direction === 'ascending' 
      ? <Icons.arrowUp className="h-4 w-4 ml-1" />
      : <Icons.arrowDown className="h-4 w-4 ml-1" />;
  };

  // Get stock status badge
  const getStockStatusBadge = (item: InventoryItem) => {
    if (item.quantityAvailable > 10) {
      return <Badge variant="success">In Stock</Badge>;
    } else if (item.quantityAvailable > 0) {
      return <Badge variant="warning">Low Stock</Badge>;
    } else {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <SyncInventoryButton onSyncComplete={handleSyncComplete} />
      </div>
      
      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Overview</CardTitle>
              <CardDescription>
                Real-time inventory data synchronized from Metakocka
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by product name or SKU"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No products match your search' : 'No inventory data available'}
                  </p>
                  {!searchTerm && (
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => fetchInventory()}
                    >
                      Refresh
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('productName')}
                        >
                          <div className="flex items-center">
                            Product {getSortIndicator('productName')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('productSku')}
                        >
                          <div className="flex items-center">
                            SKU {getSortIndicator('productSku')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('quantityOnHand')}
                        >
                          <div className="flex items-center">
                            On Hand {getSortIndicator('quantityOnHand')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('quantityReserved')}
                        >
                          <div className="flex items-center">
                            Reserved {getSortIndicator('quantityReserved')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('quantityAvailable')}
                        >
                          <div className="flex items-center">
                            Available {getSortIndicator('quantityAvailable')}
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('lastUpdated')}
                        >
                          <div className="flex items-center">
                            Last Updated {getSortIndicator('lastUpdated')}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">
                            {item.productName || 'Unknown Product'}
                          </TableCell>
                          <TableCell>{item.productSku || 'N/A'}</TableCell>
                          <TableCell>{item.quantityOnHand}</TableCell>
                          <TableCell>{item.quantityReserved}</TableCell>
                          <TableCell className="font-bold">{item.quantityAvailable}</TableCell>
                          <TableCell>{getStockStatusBadge(item)}</TableCell>
                          <TableCell>{new Date(item.lastUpdated).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="mt-4 text-sm text-muted-foreground">
                {!isLoading && (
                  <p>
                    Showing {filteredInventory.length} of {inventory.length} products
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts">
          <InventoryAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
