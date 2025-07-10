/**
 * Metakocka Product Synchronization Service
 * 
 * Handles synchronization of products between the CRM and Metakocka
 */
import { createClient } from '@supabase/supabase-js';
// Remove cookies import as it causes issues in service contexts
// import { cookies } from 'next/headers';
import { MetakockaClient, MetakockaService, MetakockaProduct, MetakockaError, MetakockaErrorType } from './index';
import { MetakockaRetryHandler } from './metakocka-retry-handler';
import { MetakockaErrorLogger, LogCategory } from './error-logger';
import { Database } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

// Type for CRM product
type Product = Database['public']['Tables']['products']['Row'];

// Type for sync result
interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{
    productId: string;
    error: string;
  }>;
}

// Type for product mapping
interface ProductMapping {
  id?: string;
  productId: string;
  metakockaId: string;
  metakockaCode: string;
  lastSyncedAt?: string;
  syncStatus?: string;
  syncError?: string | null;
}

/**
 * Product Synchronization Service
 */
/**
 * Create a Supabase service client that bypasses RLS policies
 * @returns Supabase client with service role permissions
 */
function createServiceClient(): SupabaseClient<Database> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variables for Supabase service client');
  }
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export class ProductSyncService {
  /**
   * Sync a single product to Metakocka
   * @param userId User ID
   * @param product CRM product
   * @param supabaseClient Optional Supabase client (to bypass RLS policies)
   * @returns Metakocka product ID
   */
  static async syncProductToMetakocka(
    userId: string,
    product: Product,
    supabaseClient?: SupabaseClient
  ): Promise<string> {
    // Log the sync attempt
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `Syncing product to Metakocka: ${product.name}`,
      {
        userId,
        documentId: product.id,
        details: {
          productName: product.name,
          productId: product.id
        }
      }
    );
    
    return MetakockaRetryHandler.executeWithRetry(
      async () => {
        // Get Metakocka client for user
        const client = await MetakockaService.getClientForUser(userId);
        
        // Check if product already exists in Metakocka
        const mapping = await this.getProductMapping(product.id, userId, supabaseClient);
        
        // Convert CRM product to Metakocka format
        const metakockaProduct: MetakockaProduct = {
          count_code: mapping?.metakockaCode || `PROD-${product.id.substring(0, 8)}`,
          name: product.name,
          name_desc: product.description || undefined,
          unit: 'piece', // Default unit
          service: 'false', // Default to physical product
          sales: 'true', // Enable for sales
        };
        
        let metakockaId: string;
        let isUpdate = false;
        
        if (mapping) {
          // Update existing product
          isUpdate = true;
          metakockaProduct.mk_id = mapping.metakockaId;
          await client.updateProduct(metakockaProduct);
          metakockaId = mapping.metakockaId;
          
          MetakockaErrorLogger.logInfo(
            LogCategory.SYNC,
            `Updated product in Metakocka: ${product.name}`,
            {
              userId,
              documentId: product.id,
              metakockaId,
              details: {
                productName: product.name,
                metakockaCode: metakockaProduct.count_code
              }
            }
          );
        } else {
          // Create new product
          const response = await client.addProduct(metakockaProduct);
          metakockaId = response.mk_id || '';
          
          if (!metakockaId) {
            throw new MetakockaError(
              'Failed to get Metakocka product ID from response',
              MetakockaErrorType.VALIDATION,
              'MISSING_ID'
            );
          }
          
          MetakockaErrorLogger.logInfo(
            LogCategory.SYNC,
            `Created product in Metakocka: ${product.name}`,
            {
              userId,
              documentId: product.id,
              metakockaId,
              details: {
                productName: product.name,
                metakockaCode: metakockaProduct.count_code
              }
            }
          );
        }
        
        // Save mapping with latest sync time
        await this.saveProductMapping(
          product.id,
          metakockaId,
          metakockaProduct.count_code,
          userId
        );
        
        // Log successful sync event
        MetakockaErrorLogger.logSyncEvent(
          true,
          `Successfully ${isUpdate ? 'updated' : 'created'} product in Metakocka: ${product.name}`,
          {
            userId,
            metakockaId,
            created: isUpdate ? 0 : 1,
            updated: isUpdate ? 1 : 0,
            details: {
              productId: product.id,
              productName: product.name,
              metakockaCode: metakockaProduct.count_code
            }
          }
        );
        
        return metakockaId;
      },
      {
        userId,
        operationName: 'syncProductToMetakocka',
        documentId: product.id,
        details: {
          productName: product.name,
          productId: product.id
        }
      }
    );
  }
  
  /**
   * Sync multiple products to Metakocka
   * @param userId User ID
   * @param productIds Optional array of product IDs to sync (if not provided, all products will be synced)
   * @param supabaseClient Optional Supabase client (to bypass RLS policies)
   * @returns Sync result
   */
  static async syncProductsToMetakocka(
    userId: string,
    productIds?: string[],
    supabaseClient?: SupabaseClient
  ): Promise<SyncResult> {
    // Initialize result object
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };
    
    // Log the bulk sync attempt
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `Starting bulk product sync to Metakocka${productIds ? ` for ${productIds.length} products` : ' for all products'}`,
      {
        userId,
        documentIds: productIds,
        details: {
          productCount: productIds?.length || 'all'
        }
      }
    );
    
    try {
      // Get products to sync, using the provided client or creating a new one
      const supabase = supabaseClient || createServiceClient();
      
      // Verify we have a working Supabase client with proper methods
      if (!supabase || typeof supabase.from !== 'function') {
        throw new Error('Invalid Supabase client: missing required methods');
      }
      
      // If we have a service role client, query by organization memberships instead of user_id directly
      let query;
      
      if (supabaseClient) {
        // First get all organizations the user belongs to
        const { data: organizations, error: orgError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId);
          
        if (orgError) {
          throw new Error(`Failed to fetch user's organizations: ${orgError.message}`);
        }
        
        if (!organizations || organizations.length === 0) {
          throw new Error('User has no organizations');
        }
        
        // Get organization IDs
        const orgIds = organizations.map(org => org.organization_id);
        
        // Query products by organization IDs
        query = supabase
          .from('products')
          .select('*')
          .in('organization_id', orgIds);
      } else {
        // Use the regular query with user_id
        query = supabase
          .from('products')
          .select('*')
          .eq('user_id', userId);
      }
      
      // Filter by product IDs if provided
      if (productIds && productIds.length > 0) {
        query = query.in('id', productIds);
      }
      
      const { data: products, error } = await query;
      
      if (error) {
        MetakockaErrorLogger.logError(
          LogCategory.SYNC,
          `Failed to fetch products for sync: ${error.message}`,
          {
            userId,
            documentIds: productIds,
            error
          }
        );
        throw error;
      }
      
      if (!products || products.length === 0) {
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          'No products found to sync',
          { userId }
        );
        return result;
      }
      
      // Log the number of products found
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Found ${products.length} products to sync`,
        {
          userId,
          details: {
            productCount: products.length
          }
        }
      );
      
      // Get existing mappings
      const mappings = await this.getProductMappings(
        products.map(p => p.id),
        userId
      );
      
      // Sync each product
      for (const product of products) {
        try {
          const mapping = mappings.find(m => m.productId === product.id);
          
          // Sync product to Metakocka
          const metakockaId = await this.syncProductToMetakocka(userId, product);
          
          // Update result counts
          if (mapping) {
            result.updated++;
          } else {
            result.created++;
          }
        } catch (error) {
          result.failed++;
          result.success = false;
          
          // Ensure error is properly serialized for JSON response
          let errorMessage: string;
          
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object') {
            try {
              errorMessage = JSON.stringify(error);
            } catch (e) {
              errorMessage = 'Unknown error object (cannot stringify)';
            }
          } else {
            errorMessage = String(error);
          }
          
          // Log the error
          MetakockaErrorLogger.logError(
            LogCategory.SYNC,
            `Failed to sync product ${product.name} (${product.id}): ${errorMessage}`,
            {
              userId,
              documentId: product.id,
              details: {
                productName: product.name,
                error: errorMessage
              }
            }
          );
          
          result.errors.push({
            productId: product.id,
            error: errorMessage,
          });
        }
      }
      
      // Log the final result
      MetakockaErrorLogger.logSyncEvent(
        result.success,
        `Completed bulk product sync to Metakocka: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
        {
          userId,
          created: result.created,
          updated: result.updated,
          failed: result.failed,
          details: {
            errors: result.errors
          }
        }
      );
      
      return result;
    } catch (error) {
      // Ensure error is properly serialized for JSON response
      let errorMessage: string;
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object') {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          errorMessage = 'Unknown error object (cannot stringify)';
        }
      } else {
        errorMessage = String(error);
      }
      
      // Log the critical error
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Critical error during bulk product sync: ${errorMessage}`,
        {
          userId,
          documentIds: productIds,
          error: error instanceof Error ? 
            { message: error.message, stack: error.stack } : 
            errorMessage
        }
      );
      
      result.success = false;
      
      result.errors.push({
        productId: 'general',
        error: errorMessage,
      });
      
      return result;
    }
  }
  
  /**
   * Sync products from Metakocka to CRM
   * @param userId User ID
   * @param metakockaIds Optional array of Metakocka product IDs to sync (if not provided, all products will be synced)
   * @returns Sync result
   */
  static async syncProductsFromMetakocka(
    userId: string,
    metakockaIds?: string[]
  ): Promise<SyncResult> {
    // Initialize result object
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };
    
    // Log the bulk sync attempt
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `Starting bulk product sync from Metakocka${metakockaIds ? ` for ${metakockaIds.length} products` : ' for all products'}`,
      {
        userId,
        details: {
          metakockaIds,
          productCount: metakockaIds?.length || 'all'
        }
      }
    );
    
    try {
      // Get Metakocka client for user
      const client = await MetakockaService.getClientForUser(userId);
      
      // Get products from Metakocka with retry logic
      const response = await MetakockaRetryHandler.executeWithRetry(
        async () => client.listProducts(),
        {
          userId,
          operationName: 'getProductsFromMetakocka',
          details: {
            metakockaIds
          }
        }
      );
      
      // Validate the response format
      if (!response || !response.product_list) {
        MetakockaErrorLogger.logWarning(
          LogCategory.SYNC,
          'Invalid response format from Metakocka API',
          { 
            userId,
            details: { response }
          }
        );
        
        result.success = false;
        result.errors.push({
          productId: 'general',
          error: 'Invalid response format from Metakocka API'
        });
        
        return result;
      }
      
      // Extract products from the response
      const products = Array.isArray(response.product_list) ? response.product_list : [];
      
      if (products.length === 0) {
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          'No products found in Metakocka to sync',
          { userId }
        );
        return result;
      }
      
      // Log the number of products found
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Found ${products.length} products in Metakocka to sync`,
        {
          userId,
          details: {
            productCount: products.length
          }
        }
      );
      
      // Process each product
      for (const metakockaProduct of products) {
        try {
          // Check if product already exists in CRM
          const supabase = createServiceClient();
          
          // Look up by Metakocka ID in mappings
          const { data: mappingData } = await supabase
            .from('metakocka_product_mappings')
            .select('product_id')
            .eq('metakocka_id', metakockaProduct.mk_id)
            .eq('user_id', userId)
            .maybeSingle();
          
          let productId: string = mappingData?.product_id || '';
          let isUpdate = !!productId && productId !== '';
          
          // Convert Metakocka product to CRM format
          const productData: any = {
            name: metakockaProduct.name,
            description: metakockaProduct.name_desc || '',
            user_id: userId,
            metadata: {
              metakockaId: metakockaProduct.mk_id,
              countCode: metakockaProduct.count_code,
            },
          };
          
          // Execute with retry logic
          await MetakockaRetryHandler.executeWithRetry(
            async () => {
              if (isUpdate && productId) {
                // Update existing product
                const { error } = await supabase
                  .from('products')
                  .update(productData)
                  .eq('id', productId)
                  .eq('user_id', userId);
                
                if (error) throw error;
                
                // Update mapping
                if (productId) {
                  await this.saveProductMapping(
                    productId,
                    metakockaProduct.mk_id || '',
                    metakockaProduct.count_code || '',
                    userId
                  );
                }
                
                MetakockaErrorLogger.logInfo(
                  LogCategory.SYNC,
                  `Updated product in CRM from Metakocka: ${metakockaProduct.name}`,
                  {
                    userId,
                    documentId: productId,
                    metakockaId: metakockaProduct.mk_id,
                    details: {
                      productName: metakockaProduct.name,
                      metakockaCode: metakockaProduct.count_code
                    }
                  }
                );
                
                result.updated++;
              } else {
                // Create new product
                const { data, error } = await supabase
                  .from('products')
                  .insert(productData)
                  .select('id')
                  .single();
                
                if (error) throw error;
                
                productId = data.id;
                
                // Save mapping
                if (productId) {
                  await this.saveProductMapping(
                    productId,
                    metakockaProduct.mk_id || '',
                    metakockaProduct.count_code || '',
                    userId
                  );
                }
                
                MetakockaErrorLogger.logInfo(
                  LogCategory.SYNC,
                  `Created product in CRM from Metakocka: ${metakockaProduct.name}`,
                  {
                    userId,
                    documentId: productId,
                    metakockaId: metakockaProduct.mk_id,
                    details: {
                      productName: metakockaProduct.name,
                      metakockaCode: metakockaProduct.count_code
                    }
                  }
                );
                
                result.created++;
              }
            },
            {
              userId,
              operationName: 'syncProductFromMetakocka',
              documentId: productId || '',
              metakockaId: metakockaProduct.mk_id,
              details: {
                productName: metakockaProduct.name,
                metakockaCode: metakockaProduct.count_code
              }
            }
          );
        } catch (error) {
          result.failed++;
          result.success = false;
          
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Log the error
          MetakockaErrorLogger.logError(
            LogCategory.SYNC,
            `Failed to sync product from Metakocka: ${metakockaProduct.name} (${metakockaProduct.mk_id}): ${errorMessage}`,
            {
              userId,
              metakockaId: metakockaProduct.mk_id,
              details: {
                productName: metakockaProduct.name,
                error: errorMessage
              }
            }
          );
          
          result.errors.push({
            productId: metakockaProduct.mk_id || 'unknown',
            error: errorMessage,
          });
        }
      }
      
      // Log the final result
      MetakockaErrorLogger.logSyncEvent(
        result.success,
        `Completed bulk product sync from Metakocka: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
        {
          userId,
          created: result.created,
          updated: result.updated,
          failed: result.failed,
          details: {
            errors: result.errors
          }
        }
      );
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log the critical error
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Critical error during bulk product sync from Metakocka: ${errorMessage}`,
        {
          userId,
          details: {
            metakockaIds,
            error: errorMessage
          }
        }
      );
      
      result.success = false;
      
      result.errors.push({
        productId: 'general',
        error: errorMessage,
      });
      
      return result;
    }
  }

  /**
   * Get product mapping for a product
   * @param productId Product ID
   * @param userId User ID
   * @param supabaseClient Optional Supabase client (to bypass RLS policies)
   * @returns Product mapping
   */
  static async getProductMapping(
    productId: string,
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<ProductMapping | null> {
    // Use provided client or create service client
    const supabase = supabaseClient || createServiceClient();
    
    // Get mapping from the dedicated mapping table
    const { data, error } = await supabase
      .from('metakocka_product_mappings')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      // Check if there's a legacy mapping in the metadata field
      const { data: legacyData, error: legacyError } = await supabase
        .from('products')
        .select('id, metadata')
        .eq('id', productId)
        .eq('user_id', userId)
        .single();
      
      if (legacyError || !legacyData || !legacyData.metadata) {
        return null;
      }
      
      const metadata = legacyData.metadata as any;
      
      if (!metadata.metakockaId || !metadata.countCode) {
        return null;
      }
      
      // Migrate the legacy mapping to the new table
      const mapping = {
        productId: legacyData.id,
        metakockaId: metadata.metakockaId,
        metakockaCode: metadata.countCode,
      };
      
      // Save to the new table
      await this.saveProductMapping(
        mapping.productId,
        mapping.metakockaId,
        mapping.metakockaCode,
        userId
      );
      
      return mapping;
    }
    
    return {
      id: data.id,
      productId: data.product_id,
      metakockaId: data.metakocka_id,
      metakockaCode: data.metakocka_code || '',
      lastSyncedAt: data.last_synced_at,
      syncStatus: data.sync_status,
      syncError: data.sync_error,
    };
  }
  
  /**
   * Get product mappings for multiple products
   * @param productIds Array of CRM product IDs
   * @param userId User ID
   * @returns Array of product mappings
   */
  static async getProductMappings(productIds: string[], userId: string): Promise<ProductMapping[]> {
    // No need to use cookies for service client
    const supabase = createServiceClient();
    
    // Get mappings from the dedicated mapping table
    const { data, error } = await supabase
      .from('metakocka_product_mappings')
      .select('*')
      .in('product_id', productIds)
      .eq('user_id', userId);
    
    if (error || !data) {
      return [];
    }
    
    // Check for any missing mappings that might be in legacy format
    const mappedProductIds = data.map((item: any) => item.product_id);
    const unmappedProductIds = productIds.filter(id => !mappedProductIds.includes(id));
    
    if (unmappedProductIds.length > 0) {
      // Check for legacy mappings
      const { data: legacyData, error: legacyError } = await supabase
        .from('products')
        .select('id, metadata')
        .in('id', unmappedProductIds)
        .eq('user_id', userId);
      
      if (!legacyError && legacyData) {
        const legacyMappings = legacyData
          .filter((item: any) => item.metadata && (item.metadata as any).metakockaId)
          .map((item: any) => ({
            productId: item.id,
            metakockaId: (item.metadata as any).metakockaId,
            metakockaCode: (item.metadata as any).countCode,
          }));
        
        // Migrate legacy mappings to the new table
        for (const mapping of legacyMappings) {
          await this.saveProductMapping(
            mapping.productId,
            mapping.metakockaId,
            mapping.metakockaCode,
            userId
          );
        }
        
        // Add legacy mappings to the result
        return [
          ...data.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            metakockaId: item.metakocka_id,
            metakockaCode: item.metakocka_code || '',
            lastSyncedAt: item.last_synced_at,
            syncStatus: item.sync_status,
            syncError: item.sync_error,
          })),
          ...legacyMappings,
        ];
      }
    }
    
    return data.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      metakockaId: item.metakocka_id,
      metakockaCode: item.metakocka_code || '',
      lastSyncedAt: item.last_synced_at,
      syncStatus: item.sync_status,
      syncError: item.sync_error,
    }));
  }
  
  /**
   * Save product mapping
   * @param productId CRM product ID
   * @param metakockaId Metakocka product ID
   * @param metakockaCode Metakocka product code
   * @param userId User ID
   * @param syncStatus Optional sync status
   * @param syncError Optional sync error
   */
  static async saveProductMapping(
    productId: string,
    metakockaId: string,
    metakockaCode: string,
    userId: string,
    syncStatus: string = 'synced',
    syncError: string | null = null
  ): Promise<void> {
    // No need to use cookies for service client
    const supabase = createServiceClient();
    
    // Check if mapping already exists
    const { data, error } = await supabase
      .from('metakocka_product_mappings')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();
    
    const now = new Date().toISOString();
    
    if (error || !data) {
      // Create new mapping
      const { error: insertError } = await supabase
        .from('metakocka_product_mappings')
        .insert({
          user_id: userId,
          product_id: productId,
          metakocka_id: metakockaId,
          metakocka_code: metakockaCode,
          last_synced_at: now,
          created_at: now,
          updated_at: now,
          sync_status: syncStatus,
          sync_error: syncError,
        });
      
      if (insertError) {
        throw insertError;
      }
    } else {
      // Update existing mapping
      const { error: updateError } = await supabase
        .from('metakocka_product_mappings')
        .update({
          metakocka_id: metakockaId,
          metakocka_code: metakockaCode,
          last_synced_at: now,
          updated_at: now,
          sync_status: syncStatus,
          sync_error: syncError,
        })
        .eq('id', data.id);
      
      if (updateError) {
        throw updateError;
      }
    }
  }
}
