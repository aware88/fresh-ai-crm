/**
 * Client-side API functions for Metakocka product synchronization
 */
import { ProductSyncResult, ProductSyncStatus, BulkProductSyncStatus } from '@/types/product';

/**
 * Sync result interface
 */
export interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{
    productId: string;
    error: string;
  }>;
}

/**
 * Single product sync result
 */
export interface SingleProductSyncResult {
  success: boolean;
  metakockaId?: string;
  error?: string;
  type?: string;
  code?: string;
}

/**
 * Product sync status interface
 */
export interface ProductSyncStatusResult {
  synced: boolean;
  lastSyncedAt?: string;
  syncStatus?: string;
  syncError?: string;
  metakockaId?: string;
}

/**
 * Sync a single product with Metakocka
 * @param productId Product ID to sync
 * @returns Sync result
 */
export async function syncProductWithMetakocka(
  productId: string
): Promise<SingleProductSyncResult> {
  try {
    // Use the new API endpoint
    const response = await fetch('/api/products/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to sync product',
        type: data.type,
        code: data.code,
      };
    }
    
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get sync status for a product
 * @param productId Product ID
 * @returns Sync status
 */
export async function getProductSyncStatus(
  productId: string
): Promise<ProductSyncStatusResult> {
  try {
    const response = await fetch(`/api/products/sync?productId=${encodeURIComponent(productId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        synced: false,
        syncError: data.error || 'Failed to get sync status',
      };
    }
    
    return data;
  } catch (error) {
    return {
      synced: false,
      syncError: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Sync multiple products with Metakocka
 * @param productIds Array of product IDs to sync
 * @returns Sync result
 */
export async function syncProductsWithMetakocka(
  productIds: string[]
): Promise<SyncResult> {
  try {
    // Use the new API endpoint
    const response = await fetch('/api/products/sync/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productIds }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        created: 0,
        updated: 0,
        failed: productIds ? productIds.length : 0,
        errors: [{
          productId: 'general',
          error: data.error || 'Failed to sync products',
        }],
      };
    }
    
    return data;
  } catch (error) {
    return {
      success: false,
      created: 0,
      updated: 0,
      failed: productIds ? productIds.length : 0,
      errors: [{
        productId: 'general',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }],
    };
  }
}

/**
 * Get sync status for multiple products
 * @param productIds Array of product IDs
 * @returns Bulk sync status
 */
export async function getProductsSyncStatus(
  productIds: string[]
): Promise<BulkProductSyncStatus> {
  try {
    const productIdsParam = productIds.join(',');
    const response = await fetch(`/api/products/sync/bulk?productIds=${encodeURIComponent(productIdsParam)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        mappings: productIds.map(id => ({
          productId: id,
          synced: false,
          syncError: data.error || 'Failed to get sync status',
        })),
      };
    }
    
    return data;
  } catch (error) {
    return {
      mappings: productIds.map(id => ({
        productId: id,
        synced: false,
        syncError: error instanceof Error ? error.message : 'Unknown error occurred',
      })),
    };
  }
}
