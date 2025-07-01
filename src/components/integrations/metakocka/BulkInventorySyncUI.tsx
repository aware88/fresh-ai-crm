'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/icons';

interface Product {
  id: string;
  name: string;
  sku?: string;
  metakockaId?: string;
  lastSynced?: string;
}

interface BulkInventorySyncUIProps {
  onSyncComplete?: () => void;
  className?: string;
}

export function BulkInventorySyncUI({ onSyncComplete, className = '' }: BulkInventorySyncUIProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResults, setSyncResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const [showResults, setShowResults] = useState(false);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/products?limit=100');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(lowercasedTerm) ||
      (product.sku?.toLowerCase().includes(lowercasedTerm) || false)
    );
    
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(product => product.id));
    } else {
      setSelectedProducts([]);
    }
  };

  // Handle individual selection
  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  // Sync selected products
  const syncSelectedProducts = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: 'No products selected',
        description: 'Please select at least one product to sync',
        variant: 'default',
      });
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncResults({ success: 0, failed: 0 });
    setShowResults(false);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < selectedProducts.length; i++) {
      const productId = selectedProducts[i];
      
      try {
        const response = await fetch(`/api/integrations/metakocka/inventory/sync/${productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Error syncing product ${productId}:`, error);
        failedCount++;
      }
      
      // Update progress
      const progress = Math.round(((i + 1) / selectedProducts.length) * 100);
      setSyncProgress(progress);
      setSyncResults({ success: successCount, failed: failedCount });
    }
    
    setIsSyncing(false);
    setShowResults(true);
    
    toast({
      title: 'Sync Complete',
      description: `Successfully synced ${successCount} products. ${failedCount} products failed.`,
      variant: failedCount > 0 ? 'default' : 'default',
    });
    
    if (onSyncComplete) {
      onSyncComplete();
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Bulk Inventory Sync</CardTitle>
        <CardDescription>
          Select products to sync inventory data from Metakocka
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="select-all" 
                checked={selectedProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                onCheckedChange={(checked) => handleSelectAll(!!checked)}
              />
              <Label htmlFor="select-all">Select All</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button 
                onClick={syncSelectedProducts} 
                disabled={isSyncing || selectedProducts.length === 0}
              >
                {isSyncing ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>Sync Selected ({selectedProducts.length})</>
                )}
              </Button>
            </div>
          </div>
          
          {isSyncing && (
            <div className="space-y-2">
              <Progress value={syncProgress} className="h-2" />
              <div className="text-sm text-muted-foreground">
                Syncing {syncProgress}% complete ({syncResults.success} succeeded, {syncResults.failed} failed)
              </div>
            </div>
          )}
          
          {showResults && !isSyncing && (
            <div className="rounded-md border p-4 bg-muted/50">
              <h3 className="font-medium mb-2">Sync Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Icons.check className="h-5 w-5 text-green-500" />
                  <span>Successfully synced: {syncResults.success}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icons.x className="h-5 w-5 text-red-500" />
                  <span>Failed to sync: {syncResults.failed}</span>
                </div>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-8">
              <Icons.spinner className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No products match your search' : 'No products available'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Metakocka ID</TableHead>
                    <TableHead>Last Synced</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || 'N/A'}</TableCell>
                      <TableCell>{product.metakockaId || 'Not mapped'}</TableCell>
                      <TableCell>
                        {product.lastSynced 
                          ? new Date(product.lastSynced).toLocaleString() 
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
