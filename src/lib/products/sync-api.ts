/**
 * Client-side API functions for product synchronization with Metakocka
 */
import { ProductSyncResult, ProductSyncStatus, BulkProductSyncStatus } from '@/types/product';

/**
 * Sync a single product with Metakocka
 * @param productId Product ID
 * @returns Promise with sync result
 */
export async function syncProduct(productId: string): Promise<{ success: boolean; metakockaId: string }> {
  const response = await fetch('/api/products/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sync product');
  }

  return response.json();
}

/**
 * Get sync status for a product
 * @param productId Product ID
 * @returns Promise with sync status
 */
export async function getProductSyncStatus(productId: string): Promise<ProductSyncStatus> {
  const response = await fetch(`/api/products/sync?productId=${encodeURIComponent(productId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get product sync status');
  }

  return response.json();
}

/**
 * Sync multiple products with Metakocka
 * @param productIds Array of product IDs
 * @returns Promise with sync result
 */
export async function syncProducts(productIds: string[]): Promise<ProductSyncResult> {
  const response = await fetch('/api/products/sync/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sync products');
  }

  return response.json();
}

/**
 * Get sync status for multiple products
 * @param productIds Array of product IDs
 * @returns Promise with sync status for each product
 */
export async function getProductsSyncStatus(productIds: string[]): Promise<BulkProductSyncStatus> {
  const productIdsParam = productIds.join(',');
  const response = await fetch(`/api/products/sync/bulk?productIds=${encodeURIComponent(productIdsParam)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get products sync status');
  }

  return response.json();
}
