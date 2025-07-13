/**
 * Metakocka Inventory Service
 * 
 * Provides real-time inventory data from Metakocka ERP system.
 */

import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { MetakockaService } from './service';
// Using createServerClient from the existing import
import { Database } from '@/types/supabase';

export class InventoryService {
  /**
   * Sync inventory data for a specific product from Metakocka
   * 
   * @param userId User ID
   * @param productId Product ID in the CRM system
   * @returns Sync result with success/failure information and updated inventory data
   */
  static async syncProductInventoryFromMetakocka(userId: string, productId: string) {
    const supabase = await createLazyServerClient();
    
    try {
      // Get the product mapping to find the Metakocka product ID
      const { data: mapping, error: mappingError } = await supabase
        .from('metakocka_product_mappings')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .single();
      
      if (mappingError || !mapping) {
        return { 
          success: false, 
          message: 'Product is not mapped to Metakocka',
          error: 'No Metakocka mapping found for this product'
        };
      }
      
      // Get the Metakocka service instance
      const metakockaService = await MetakockaService.getInstance(userId);
      
      // Get current inventory from Metakocka
      const inventoryData = await metakockaService.getProductInventory(mapping.metakocka_id);
      
      // Update local inventory record
      const { error: updateError } = await supabase
        .from('product_inventory')
        .upsert(
          {
            product_id: productId,
            quantity_on_hand: inventoryData.quantity_on_hand,
            quantity_reserved: inventoryData.quantity_reserved,
            quantity_available: inventoryData.quantity_available,
            last_updated: new Date().toISOString(),
            user_id: userId,
          },
          { onConflict: 'product_id,user_id' }
        );

      if (updateError) throw updateError;
      
      // Return the updated inventory data
      return {
        success: true,
        message: 'Product inventory synced successfully',
        data: {
          productId,
          metakockaId: mapping.metakocka_id,
          quantityOnHand: inventoryData.quantity_on_hand || 0,
          quantityReserved: inventoryData.quantity_reserved || 0,
          quantityAvailable: inventoryData.quantity_available || 0,
          lastUpdated: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error(`Error syncing inventory for product ${productId}:`, error);
      return {
        success: false,
        message: 'Failed to sync inventory from Metakocka',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get inventory data for a specific product
   * 
   * @param userId User ID
   * @param productId Product ID in the CRM system
   * @returns Inventory data including quantity on hand, reserved, and available
   */
  static async getProductInventory(userId: string, productId: string) {
    try {
      const supabase = await createLazyServerClient();
      
      // Get the product from the database
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', userId)
        .single();
      
      if (productError || !product) {
        throw new Error('Product not found');
      }
      
      // Get the product mapping to find the Metakocka product ID
      const { data: mapping, error: mappingError } = await supabase
        .from('metakocka_product_mappings')
        .select('*')
        .eq('product_id', productId)
        .single();
      
      if (mappingError || !mapping) {
        throw new Error('Product is not synced with Metakocka');
      }
      
      // Get the Metakocka credentials
      const metakockaService = await MetakockaService.getInstance(userId);
      
      // Get the inventory data from Metakocka
      const inventoryData = await metakockaService.getProductInventory(mapping.metakocka_id);
      
      return {
        productId,
        metakockaId: mapping.metakocka_id,
        quantityOnHand: inventoryData.quantity_on_hand || 0,
        quantityReserved: inventoryData.quantity_reserved || 0,
        quantityAvailable: inventoryData.quantity_available || 0,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting product inventory:', error);
      throw error;
    }
  }
  
  /**
   * Get inventory data for multiple products
   * 
   * @param userId User ID
   * @param productIds Array of product IDs in the CRM system
   * @returns Array of inventory data for each product
   */
  static async getProductsInventory(userId: string, productIds: string[]) {
    try {
      const results = [];
      
      for (const productId of productIds) {
        try {
          const inventoryData = await this.getProductInventory(userId, productId);
          results.push(inventoryData);
        } catch (error) {
          console.error(`Error getting inventory for product ${productId}:`, error);
          results.push({
            productId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error getting products inventory:', error);
      throw error;
    }
  }
  
  /**
   * Get inventory data for all products
   * 
   * @param userId User ID
   * @returns Array of inventory data for all products
   */
  static async getAllProductsInventory(userId: string) {
    try {
      const supabase = await createLazyServerClient();
      
      // Get all products from the database
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', userId);
      
      if (productsError) {
        throw productsError;
      }
      
      const productIds = products?.map(product => product.id) || [];
      
      return this.getProductsInventory(userId, productIds);
    } catch (error) {
      console.error('Error getting all products inventory:', error);
      throw error;
    }
  }
  
  /**
   * Check if a product is available in the required quantity
   * 
   * @param userId User ID
   * @param productId Product ID in the CRM system
   * @param quantity Required quantity
   * @returns Boolean indicating if the product is available in the required quantity
   */
  static async isProductAvailable(userId: string, productId: string, quantity: number) {
    try {
      const inventoryData = await this.getProductInventory(userId, productId);
      return inventoryData.quantityAvailable >= quantity;
    } catch (error) {
      console.error('Error checking product availability:', error);
      return false;
    }
  }

  /**
   * Sync inventory data for all mapped products from Metakocka
   * @param userId User ID
   * @returns Sync result with success/failure information
   */
  static async syncInventoryFromMetakocka(userId: string) {
    const supabase = await createLazyServerClient();
    
    try {
      // Get all mapped products for this user
      const { data: mappings, error } = await supabase
        .from('metakocka_product_mappings')
        .select('product_id, metakocka_id')
        .eq('user_id', userId);

      if (error) throw error;
      if (!mappings || mappings.length === 0) {
        return { success: true, syncedCount: 0, message: 'No mapped products found' };
      }

      const metakockaService = await MetakockaService.getInstance(userId);
      let syncedCount = 0;
      const errors: string[] = [];

      // Process each mapping
      for (const mapping of mappings) {
        try {
          // Get current inventory from Metakocka
          const inventoryData = await metakockaService.getProductInventory(mapping.metakocka_id);
          
          // Update local inventory record
          const { error: updateError } = await supabase
            .from('product_inventory')
            .upsert(
              {
                product_id: mapping.product_id,
                quantity_on_hand: inventoryData.quantity_on_hand,
                quantity_reserved: inventoryData.quantity_reserved,
                quantity_available: inventoryData.quantity_available,
                last_updated: new Date().toISOString(),
                user_id: userId,
              },
              { onConflict: 'product_id,user_id' }
            );

          if (updateError) throw updateError;
          syncedCount++;
        } catch (err) {
          const errorMsg = `Error syncing inventory for product ${mapping.product_id}: ${err instanceof Error ? err.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      return {
        success: errors.length === 0,
        syncedCount,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Synced ${syncedCount} products${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
      };
    } catch (error) {
      console.error('Error in syncInventoryFromMetakocka:', error);
      return {
        success: false,
        syncedCount: 0,
        errorCount: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Failed to sync inventory from Metakocka',
      };
    }
  }
}
