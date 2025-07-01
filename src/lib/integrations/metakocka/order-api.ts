/**
 * Client-side API functions for Metakocka order management
 */

import { OrderSyncResult } from '@/types/order';

/**
 * Get sync status for an order
 * @param orderId Order ID
 * @returns Sync status response
 */
export async function getOrderSyncStatus(orderId: string) {
  const response = await fetch(`/api/integrations/metakocka/orders/sync?orderId=${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get order sync status');
  }
  
  return response.json();
}

/**
 * Get sync status for multiple orders
 * @param orderIds Array of order IDs
 * @returns Sync status response with mappings
 */
export async function getBulkOrderSyncStatus(orderIds: string[]) {
  const response = await fetch(`/api/integrations/metakocka/orders/sync?orderIds=${orderIds.join(',')}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get bulk order sync status');
  }
  
  return response.json();
}

/**
 * Sync an order to Metakocka
 * @param orderId Order ID
 * @returns Sync response with Metakocka ID
 */
export async function syncOrder(orderId: string): Promise<OrderSyncResult> {
  try {
    const response = await fetch('/api/integrations/metakocka/orders/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync order');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error syncing order:', error);
    return {
      success: false,
      orderId,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Sync multiple orders to Metakocka
 * @param orderIds Array of order IDs
 * @returns Sync result with success/failure counts
 */
export async function syncMultipleOrders(orderIds: string[]) {
  try {
    const response = await fetch('/api/integrations/metakocka/orders/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderIds }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync multiple orders');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error syncing multiple orders:', error);
    throw error;
  }
}

/**
 * Update order status in Metakocka
 * @param orderId Order ID
 * @param status New order status
 * @returns Status update result
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<OrderSyncResult> {
  try {
    const response = await fetch(`/api/integrations/metakocka/orders/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, status }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update order status');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      orderId,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Fulfill an order in Metakocka
 * @param orderId Order ID
 * @param fulfillmentData Optional fulfillment data
 * @returns Fulfillment result
 */
export async function fulfillOrder(
  orderId: string, 
  fulfillmentData?: Record<string, any>
): Promise<OrderSyncResult> {
  try {
    const response = await fetch(`/api/integrations/metakocka/orders/fulfill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, fulfillmentData }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fulfill order');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fulfilling order:', error);
    return {
      success: false,
      orderId,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Cancel an order in Metakocka
 * @param orderId Order ID
 * @param cancellationReason Optional cancellation reason
 * @returns Cancellation result
 */
export async function cancelOrder(
  orderId: string, 
  cancellationReason?: string
): Promise<OrderSyncResult> {
  try {
    const response = await fetch(`/api/integrations/metakocka/orders/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, cancellationReason }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel order');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error cancelling order:', error);
    return {
      success: false,
      orderId,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get unsynced orders from Metakocka
 * @returns List of unsynced orders
 */
export async function getUnsyncedOrdersFromMetakocka() {
  try {
    const response = await fetch('/api/integrations/metakocka/orders/sync-from-metakocka', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get unsynced orders');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting unsynced orders:', error);
    throw error;
  }
}

/**
 * Sync an order from Metakocka to CRM
 * @param metakockaId Metakocka order ID
 * @returns Sync result
 */
export async function syncOrderFromMetakocka(metakockaId: string): Promise<OrderSyncResult> {
  try {
    const response = await fetch('/api/integrations/metakocka/orders/sync-from-metakocka', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metakockaId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync order from Metakocka');
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing order from Metakocka:', error);
    return {
      success: false,
      metakockaId,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Sync multiple orders from Metakocka to CRM
 * @returns Sync result with success/failure counts
 */
export async function syncOrdersFromMetakocka() {
  try {
    const response = await fetch('/api/integrations/metakocka/orders/sync-from-metakocka', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ syncAll: true }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync orders from Metakocka');
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing orders from Metakocka:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      created: 0,
      updated: 0,
      failed: 0
    };
  }
}
