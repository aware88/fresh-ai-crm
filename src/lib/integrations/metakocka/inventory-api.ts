/**
 * Client-side API functions for Metakocka inventory operations
 */
import { fetchWithErrorHandling } from '@/lib/api-utils';

/**
 * Get inventory data for a specific product
 * @param productId Product ID
 * @returns Inventory data
 */
export async function getProductInventory(productId: string) {
  return fetchWithErrorHandling(`/api/integrations/metakocka/inventory?productId=${productId}`, {
    method: 'GET',
  });
}

/**
 * Get inventory data for multiple products
 * @param productIds Array of product IDs
 * @returns Inventory data for each product
 */
export async function getProductsInventory(productIds: string[]) {
  return fetchWithErrorHandling(`/api/integrations/metakocka/inventory?productIds=${productIds.join(',')}`, {
    method: 'GET',
  });
}

/**
 * Get inventory data for all products
 * @returns Inventory data for all products
 */
export async function getAllProductsInventory() {
  return fetchWithErrorHandling('/api/integrations/metakocka/inventory', {
    method: 'GET',
  });
}

/**
 * Check if products are available in the required quantities
 * @param items Array of items with productId and quantity
 * @returns Availability status for each item
 */
export async function checkInventoryAvailability(items: Array<{ productId: string; quantity: number }>) {
  return fetchWithErrorHandling('/api/integrations/metakocka/inventory/check', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}
