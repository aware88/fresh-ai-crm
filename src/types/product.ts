/**
 * Product and product mapping types for the CRM system
 */

/**
 * Base product type from the database
 */
export interface Product {
  id: string;
  user_id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  unit: string | null; // kg, each, liter, etc.
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Input type for creating a new product
 */
export interface ProductInput {
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  unit?: string;
  metadata?: Record<string, any>;
}

/**
 * Input type for updating an existing product
 */
export interface ProductUpdateInput {
  name?: string;
  sku?: string;
  description?: string;
  category?: string;
  unit?: string;
  metadata?: Record<string, any>;
}

/**
 * Metakocka product type from their API
 */
export interface MetakockaProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit?: string;
  price_with_tax?: number;
  price_without_tax?: number;
  tax_rate?: number;
  stock_quantity?: number;
  category?: string;
  active: boolean;
  ean?: string;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  attributes?: Record<string, any>;
}

/**
 * Mapping between CRM product and Metakocka product
 */
export interface ProductMapping {
  id: string;
  product_id: string;
  metakocka_id: string;
  metakocka_code: string | null;
  last_synced_at: string;
  sync_status: 'synced' | 'error' | 'pending';
  sync_error: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

/**
 * Input type for creating a product mapping
 */
export interface ProductMappingInput {
  product_id: string;
  metakocka_id: string;
  metakocka_code?: string;
}

/**
 * Result of a product sync operation
 */
export interface ProductSyncResult {
  created: number;
  updated: number;
  failed: number;
  errors?: Array<{
    product_id?: string;
    metakocka_id?: string;
    message: string;
  }>;
}

/**
 * Status of a product sync operation
 */
export interface ProductSyncStatus {
  synced: boolean;
  lastSyncedAt?: string;
  syncStatus?: string;
  syncError?: string;
  metakockaId?: string;
}

/**
 * Bulk product sync status response
 */
export interface BulkProductSyncStatus {
  mappings: Array<{
    productId: string;
    synced: boolean;
    lastSyncedAt?: string;
    syncStatus?: string;
    syncError?: string;
    metakockaId?: string;
  }>;
}
