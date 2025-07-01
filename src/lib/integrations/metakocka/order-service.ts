/**
 * Order Service for Metakocka Integration
 * Extends the SalesDocumentSyncService with order-specific functionality
 */

import { MetakockaApiService } from './api-service';
import { MetakockaError } from './error-logger';
import { SalesDocumentSyncService } from './sales-document-sync-service';
import { InventoryService } from './inventory-service';
import { 
  SalesDocument, 
  SalesDocumentItem, 
  SalesDocumentMapping,
  SalesDocumentSyncResult,
  BulkSalesDocumentSyncResult
} from '@/types/sales-document';
import { OrderStatus } from '@/types/order';

/**
 * Order statuses in Metakocka
 */
const METAKOCKA_ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  'draft': 'draft',
  'confirmed': 'confirmed',
  'processing': 'processing',
  'partially_fulfilled': 'partially_fulfilled',
  'fulfilled': 'fulfilled',
  'cancelled': 'cancelled',
  'on_hold': 'on_hold'
};

/**
 * Reverse mapping of Metakocka order statuses to CRM order statuses
 */
const REVERSE_ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  'draft': 'draft',
  'confirmed': 'confirmed',
  'processing': 'processing',
  'partially_fulfilled': 'partially_fulfilled',
  'fulfilled': 'fulfilled',
  'cancelled': 'cancelled',
  'on_hold': 'on_hold'
};

export class OrderService extends SalesDocumentSyncService {
  private inventoryService: InventoryService;

  constructor(secretKey: string, companyId: string, userId: string) {
    super(secretKey, companyId);
    this.inventoryService = new InventoryService(secretKey, companyId, userId);
  }

  /**
   * Create a new order in Metakocka with inventory allocation
   * @param order Order document
   * @returns Sync result with Metakocka ID
   */
  public async createOrderInMetakocka(order: SalesDocument): Promise<SalesDocumentSyncResult> {
    try {
      // Validate that this is an order
      if (order.document_type !== 'order') {
        throw new MetakockaError(
          'validation_error',
          'Document type must be "order"',
          { documentId: order.id, documentType: order.document_type }
        );
      }

      // Check inventory availability for all items
      const inventoryCheckResults = await this.checkInventoryForOrder(order);
      
      if (!inventoryCheckResults.allAvailable) {
        return {
          success: false,
          documentId: order.id,
          error: 'Insufficient inventory for one or more items',
          errorCode: 'inventory_insufficient',
          errorDetails: { unavailableItems: inventoryCheckResults.unavailableItems }
        };
      }

      // Create the order in Metakocka
      const result = await this.createInMetakocka(order);
      
      if (result.success && result.metakockaId) {
        // Allocate inventory for the order
        await this.allocateInventoryForOrder(order);
      }

      return result;
    } catch (error) {
      if (error instanceof MetakockaError) {
        return {
          success: false,
          documentId: order.id,
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details
        };
      }

      return {
        success: false,
        documentId: order.id,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update order status in Metakocka
   * @param orderId Order ID
   * @param metakockaId Metakocka order ID
   * @param status New order status
   * @returns Sync result
   */
  public async updateOrderStatus(
    orderId: string, 
    metakockaId: string, 
    status: OrderStatus
  ): Promise<SalesDocumentSyncResult> {
    try {
      // Get the Metakocka status
      const metakockaStatus = METAKOCKA_ORDER_STATUS_MAP[status];
      
      if (!metakockaStatus) {
        throw new MetakockaError(
          'validation_error',
          `Invalid order status: ${status}`,
          { orderId, status }
        );
      }

      // Update the status in Metakocka
      const response = await this.apiService.put(`sales_order/${metakockaId}/status`, {
        status: metakockaStatus
      });

      if (!response.success) {
        return {
          success: false,
          documentId: orderId,
          metakockaId,
          error: response.error || 'Failed to update order status in Metakocka',
          errorCode: response.code,
          errorDetails: response.details
        };
      }

      // Handle inventory based on status change
      if (status === 'fulfilled') {
        // Release allocated inventory
        await this.completeInventoryAllocation(orderId);
      } else if (status === 'cancelled') {
        // Return allocated inventory
        await this.releaseInventoryAllocation(orderId);
      }

      return {
        success: true,
        documentId: orderId,
        metakockaId
      };
    } catch (error) {
      if (error instanceof MetakockaError) {
        return {
          success: false,
          documentId: orderId,
          metakockaId,
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details
        };
      }

      return {
        success: false,
        documentId: orderId,
        metakockaId,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fulfill an order in Metakocka
   * @param orderId Order ID
   * @param metakockaId Metakocka order ID
   * @param fulfillmentData Optional fulfillment data
   * @returns Sync result
   */
  public async fulfillOrder(
    orderId: string, 
    metakockaId: string,
    fulfillmentData?: Record<string, any>
  ): Promise<SalesDocumentSyncResult> {
    try {
      // Update the order status to fulfilled
      const statusResult = await this.updateOrderStatus(orderId, metakockaId, 'fulfilled');
      
      if (!statusResult.success) {
        return statusResult;
      }

      // Add fulfillment data if provided
      if (fulfillmentData) {
        const response = await this.apiService.put(`sales_order/${metakockaId}/fulfillment`, fulfillmentData);
        
        if (!response.success) {
          return {
            success: false,
            documentId: orderId,
            metakockaId,
            error: response.error || 'Failed to add fulfillment data',
            errorCode: response.code,
            errorDetails: response.details
          };
        }
      }

      return {
        success: true,
        documentId: orderId,
        metakockaId
      };
    } catch (error) {
      if (error instanceof MetakockaError) {
        return {
          success: false,
          documentId: orderId,
          metakockaId,
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details
        };
      }

      return {
        success: false,
        documentId: orderId,
        metakockaId,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Cancel an order in Metakocka
   * @param orderId Order ID
   * @param metakockaId Metakocka order ID
   * @param cancellationReason Optional cancellation reason
   * @returns Sync result
   */
  public async cancelOrder(
    orderId: string, 
    metakockaId: string,
    cancellationReason?: string
  ): Promise<SalesDocumentSyncResult> {
    try {
      // Update the order status to cancelled
      const statusResult = await this.updateOrderStatus(orderId, metakockaId, 'cancelled');
      
      if (!statusResult.success) {
        return statusResult;
      }

      // Add cancellation reason if provided
      if (cancellationReason) {
        const response = await this.apiService.put(`sales_order/${metakockaId}/notes`, {
          cancellation_reason: cancellationReason
        });
        
        if (!response.success) {
          // Non-critical error, still consider the cancellation successful
          console.warn('Failed to add cancellation reason:', response.error);
        }
      }

      return {
        success: true,
        documentId: orderId,
        metakockaId
      };
    } catch (error) {
      if (error instanceof MetakockaError) {
        return {
          success: false,
          documentId: orderId,
          metakockaId,
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details
        };
      }

      return {
        success: false,
        documentId: orderId,
        metakockaId,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check inventory availability for all items in an order
   * @param order Order document
   * @returns Check result with availability status
   */
  private async checkInventoryForOrder(order: SalesDocument): Promise<{
    allAvailable: boolean;
    unavailableItems: Array<{
      itemId: string;
      productId: string;
      requestedQuantity: number;
      availableQuantity: number;
    }>;
  }> {
    try {
      if (!order.items || order.items.length === 0) {
        return { allAvailable: true, unavailableItems: [] };
      }

      const unavailableItems = [];

      // Check each item's availability
      for (const item of order.items) {
        if (!item.product_id) continue; // Skip items without product ID

        const availabilityCheck = await this.inventoryService.checkProductAvailability(
          item.product_id,
          item.quantity
        );

        if (!availabilityCheck.available) {
          unavailableItems.push({
            itemId: item.id || '',
            productId: item.product_id,
            requestedQuantity: item.quantity,
            availableQuantity: availabilityCheck.availableQuantity
          });
        }
      }

      return {
        allAvailable: unavailableItems.length === 0,
        unavailableItems
      };
    } catch (error) {
      console.error('Error checking inventory for order:', error);
      throw new MetakockaError(
        'inventory_check_error',
        'Failed to check inventory availability',
        { orderId: order.id, error }
      );
    }
  }

  /**
   * Allocate inventory for an order
   * @param order Order document
   */
  private async allocateInventoryForOrder(order: SalesDocument): Promise<void> {
    try {
      if (!order.items || order.items.length === 0) return;

      // Allocate inventory for each product in the order
      for (const item of order.items) {
        if (!item.product_id) continue; // Skip items without product ID

        // Call inventory service to allocate inventory
        // This is a placeholder - actual implementation would depend on your inventory allocation system
        await this.inventoryService.allocateInventory(
          item.product_id,
          item.quantity,
          order.id || ''
        );
      }
    } catch (error) {
      console.error('Error allocating inventory for order:', error);
      throw new MetakockaError(
        'inventory_allocation_error',
        'Failed to allocate inventory for order',
        { orderId: order.id, error }
      );
    }
  }

  /**
   * Complete inventory allocation for a fulfilled order
   * @param orderId Order ID
   */
  private async completeInventoryAllocation(orderId: string): Promise<void> {
    try {
      // Call inventory service to complete allocation
      // This is a placeholder - actual implementation would depend on your inventory allocation system
      await this.inventoryService.completeAllocation(orderId);
    } catch (error) {
      console.error('Error completing inventory allocation:', error);
      throw new MetakockaError(
        'inventory_allocation_error',
        'Failed to complete inventory allocation',
        { orderId, error }
      );
    }
  }

  /**
   * Release inventory allocation for a cancelled order
   * @param orderId Order ID
   */
  private async releaseInventoryAllocation(orderId: string): Promise<void> {
    try {
      // Call inventory service to release allocation
      // This is a placeholder - actual implementation would depend on your inventory allocation system
      await this.inventoryService.releaseAllocation(orderId);
    } catch (error) {
      console.error('Error releasing inventory allocation:', error);
      throw new MetakockaError(
        'inventory_allocation_error',
        'Failed to release inventory allocation',
        { orderId, error }
      );
    }
  }
}
