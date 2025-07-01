import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProducts, deleteProduct, Product } from '@/lib/products/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Edit, Trash, Search, FilterX, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ProductPricingDetails } from '@/components/products/ProductPricingDetails';
import { SyncProductButton } from '@/components/products/SyncProductButton';
import { ProductInventory } from '@/components/integrations/metakocka/ProductInventory';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductListProps {
  onEdit: (productId: string) => void;
}

export function ProductList({ onEdit }: ProductListProps): React.ReactElement {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [viewingPricingFor, setViewingPricingFor] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load products on mount and when filters change
  useEffect(() => {
    loadProducts();
  }, [categoryFilter]);

  // Function to load products with optional filters
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProducts(categoryFilter || undefined, searchQuery || undefined);
      setProducts(data);
      
      // Extract unique categories for filtering
      const uniqueCategories = Array.from(
        new Set(
          data
            .map(product => product.category)
            .filter((category): category is string => !!category)
        )
      ).sort();
      
      setCategories(uniqueCategories);
      setErrorMessage(null);
    } catch (error) {
      console.error('Error loading products:', error);
      setErrorMessage('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search with debounce
  const handleSearch = async () => {
    loadProducts();
  };

  // Handle product deletion
  const handleDelete = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        loadProducts(); // Reload the list after deletion
      } catch (error) {
        console.error('Error deleting product:', error);
        setErrorMessage('Failed to delete the product. Please try again.');
      }
    }
  };

  // Calculate available categories for filtering
  const availableCategories = categories.filter(cat => cat !== categoryFilter);

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleSearch}
            size="sm"
          >
            Search
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {categoryFilter ? `Category: ${categoryFilter}` : 'Filter by Category'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {availableCategories.map((category) => (
                <DropdownMenuItem 
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </DropdownMenuItem>
              ))}
              {categoryFilter && (
                <DropdownMenuItem onClick={() => setCategoryFilter(null)}>
                  <FilterX className="mr-2 h-4 w-4" />
                  Clear filter
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {errorMessage}
        </div>
      )}
      
      {/* Products table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No products found. {searchQuery || categoryFilter ? 'Try adjusting your filters.' : ''}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell>
                      {product.category && (
                        <Badge variant="secondary">{product.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{product.unit || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <SyncProductButton productId={product.id} size="icon" variant="ghost" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Sync with Metakocka</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onEdit(product.id)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setViewingPricingFor(product.id)}
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Pricing and inventory modal */}
      {viewingPricingFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Product Details: {products.find(p => p.id === viewingPricingFor)?.name}
              </h2>
              <Button 
                variant="ghost" 
                onClick={() => setViewingPricingFor(null)}
              >
                Close
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Pricing</h3>
                <ProductPricingDetails 
                  productId={viewingPricingFor} 
                  onClose={() => setViewingPricingFor(null)}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Inventory</h3>
                <ProductInventory productId={viewingPricingFor} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
