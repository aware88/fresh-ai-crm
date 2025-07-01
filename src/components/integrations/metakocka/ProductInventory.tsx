'use client';

import { useState, useEffect } from 'react';
import { getProductInventory } from '@/lib/integrations/metakocka/inventory-api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

interface ProductInventoryProps {
  productId: string;
}

interface InventoryData {
  productId: string;
  metakockaId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  lastUpdated: string;
}

export function ProductInventory({ productId }: ProductInventoryProps) {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductInventory(productId);
        setInventory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory data');
        console.error('Error fetching inventory:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchInventory();
    }
  }, [productId]);

  const getAvailabilityBadge = () => {
    if (!inventory) return null;

    if (inventory.quantityAvailable > 10) {
      return (
        <Badge variant="success" className="ml-2">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          In Stock
        </Badge>
      );
    } else if (inventory.quantityAvailable > 0) {
      return (
        <Badge variant="warning" className="ml-2">
          <Clock className="w-4 h-4 mr-1" />
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertCircle className="w-4 h-4 mr-1" />
          Out of Stock
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-lg">Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-destructive">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!inventory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            No inventory data available. This product may not be synced with Metakocka.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          Inventory {getAvailabilityBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">On Hand:</span>
            <span className="font-medium">{inventory.quantityOnHand}</span>
          </div>
          <div className="flex justify-between">
            <Tooltip content="Quantity reserved for existing orders">
              <span className="text-muted-foreground flex items-center">
                Reserved:
              </span>
            </Tooltip>
            <span className="font-medium">{inventory.quantityReserved}</span>
          </div>
          <div className="flex justify-between">
            <Tooltip content="Quantity available for new orders">
              <span className="text-muted-foreground flex items-center">
                Available:
              </span>
            </Tooltip>
            <span className="font-bold">{inventory.quantityAvailable}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-4">
            Last updated: {new Date(inventory.lastUpdated).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
