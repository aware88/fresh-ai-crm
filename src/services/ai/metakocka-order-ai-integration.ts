/**
 * Metakocka Order AI Integration
 * 
 * This module provides functions for integrating Metakocka order data with the AI system.
 * It includes functions for fetching order data, formatting it for AI context, and
 * generating specialized prompts for order-related queries.
 */

import { createServerClient } from '@/utils/supabase/server';
import { MetakockaClient } from '../integrations/metakocka/metakocka-client';
import { MetakockaService } from '../integrations/metakocka/metakocka-service';
import { OrderService } from '../integrations/metakocka/order-service';
import { formatCurrency } from '@/utils/format';

/**
 * Interface for order data formatted for AI context
 */
export interface OrderDataForAI {
  orderId: string;
  metakockaId?: string;
  orderNumber?: string;
  customerName: string;
  status: string;
  totalAmount: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }[];
  fulfillmentDetails?: {
    trackingNumber?: string;
    shippingCarrier?: string;
    fulfillmentDate?: string;
  };
  inventoryStatus?: {
    allItemsInStock: boolean;
    lowStockItems?: string[];
  };
}

/**
 * Fetches order data for a specific order ID
 * @param orderId The ID of the order to fetch
 * @param userId The ID of the user making the request
 * @returns Formatted order data for AI context
 */
export async function getOrderDataForAI(orderId: string, userId: string): Promise<OrderDataForAI | null> {
  try {
    const supabase = createServerClient();
    
    // Fetch order data from the database
    const { data: orderData, error } = await supabase
      .from('sales_documents')
      .select(`
        id,
        document_number,
        customer_name,
        status,
        total_amount,
        items:sales_document_items(*),
        metakocka_sales_document_mappings!inner(*)
      `)
      .eq('id', orderId)
      .eq('document_type', 'order')
      .single();
    
    if (error || !orderData) {
      console.error('Error fetching order data for AI context:', error);
      return null;
    }
    
    // Get inventory status for order items
    const metakockaService = new MetakockaService(supabase);
    const credentials = await metakockaService.getCredentialsForUser(userId);
    
    if (!credentials) {
      console.warn('No Metakocka credentials found for user:', userId);
      return formatOrderForAI(orderData, null);
    }
    
    const metakockaClient = new MetakockaClient(credentials.company_id, credentials.api_key);
    const orderService = new OrderService(supabase, metakockaClient);
    
    // Check inventory status for order items
    const inventoryStatus = await orderService.checkInventoryForOrder(orderId);
    
    return formatOrderForAI(orderData, inventoryStatus);
  } catch (error) {
    console.error('Error in getOrderDataForAI:', error);
    return null;
  }
}

/**
 * Formats raw order data for AI context
 * @param orderData Raw order data from the database
 * @param inventoryStatus Inventory status data
 * @returns Formatted order data for AI context
 */
function formatOrderForAI(orderData: any, inventoryStatus: any): OrderDataForAI {
  // Extract Metakocka ID from mappings
  const metakockaId = orderData.metakocka_sales_document_mappings?.metakocka_id || undefined;
  
  // Format items
  const items = orderData.items.map((item: any) => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: formatCurrency(item.unit_price),
    totalPrice: formatCurrency(item.total_price)
  }));
  
  // Format inventory status
  let formattedInventoryStatus = undefined;
  if (inventoryStatus) {
    formattedInventoryStatus = {
      allItemsInStock: inventoryStatus.allInStock,
      lowStockItems: inventoryStatus.lowStockItems?.map((item: any) => item.name)
    };
  }
  
  // Format fulfillment details if available
  let fulfillmentDetails = undefined;
  if (orderData.fulfillment_date || orderData.tracking_number || orderData.shipping_carrier) {
    fulfillmentDetails = {
      trackingNumber: orderData.tracking_number,
      shippingCarrier: orderData.shipping_carrier,
      fulfillmentDate: orderData.fulfillment_date
    };
  }
  
  return {
    orderId: orderData.id,
    metakockaId,
    orderNumber: orderData.document_number,
    customerName: orderData.customer_name,
    status: orderData.status,
    totalAmount: formatCurrency(orderData.total_amount),
    items,
    fulfillmentDetails,
    inventoryStatus: formattedInventoryStatus
  };
}

/**
 * Fetches recent orders for a customer
 * @param customerId The ID of the customer
 * @param userId The ID of the user making the request
 * @param limit Maximum number of orders to return
 * @returns Array of formatted order data for AI context
 */
export async function getRecentOrdersForCustomer(
  customerId: string,
  userId: string,
  limit: number = 5
): Promise<OrderDataForAI[]> {
  try {
    const supabase = createServerClient();
    
    // Fetch recent orders for the customer
    const { data: orders, error } = await supabase
      .from('sales_documents')
      .select(`
        id,
        document_number,
        customer_name,
        status,
        total_amount,
        items:sales_document_items(*),
        metakocka_sales_document_mappings(*)
      `)
      .eq('document_type', 'order')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !orders) {
      console.error('Error fetching recent orders for customer:', error);
      return [];
    }
    
    // Format orders for AI context
    return orders.map(order => formatOrderForAI(order, null));
  } catch (error) {
    console.error('Error in getRecentOrdersForCustomer:', error);
    return [];
  }
}

/**
 * Generates a specialized prompt for order-related queries
 * @param orderData Order data for context
 * @param query The user's query
 * @returns A specialized prompt for the AI
 */
export function generateOrderPrompt(orderData: OrderDataForAI, query: string): string {
  return `
    You are analyzing an order with the following details:
    
    Order ID: ${orderData.orderId}
    ${orderData.orderNumber ? `Order Number: ${orderData.orderNumber}` : ''}
    ${orderData.metakockaId ? `Metakocka ID: ${orderData.metakockaId}` : ''}
    Customer: ${orderData.customerName}
    Status: ${orderData.status}
    Total Amount: ${orderData.totalAmount}
    
    Items:
    ${orderData.items.map(item => `- ${item.name}: ${item.quantity} x ${item.unitPrice} = ${item.totalPrice}`).join('\n')}
    
    ${orderData.fulfillmentDetails ? `
    Fulfillment Details:
    ${orderData.fulfillmentDetails.trackingNumber ? `Tracking Number: ${orderData.fulfillmentDetails.trackingNumber}` : ''}
    ${orderData.fulfillmentDetails.shippingCarrier ? `Shipping Carrier: ${orderData.fulfillmentDetails.shippingCarrier}` : ''}
    ${orderData.fulfillmentDetails.fulfillmentDate ? `Fulfillment Date: ${orderData.fulfillmentDetails.fulfillmentDate}` : ''}
    ` : ''}
    
    ${orderData.inventoryStatus ? `
    Inventory Status:
    All Items In Stock: ${orderData.inventoryStatus.allItemsInStock ? 'Yes' : 'No'}
    ${orderData.inventoryStatus.lowStockItems?.length ? `Low Stock Items: ${orderData.inventoryStatus.lowStockItems.join(', ')}` : ''}
    ` : ''}
    
    Based on this order information, please answer the following question:
    ${query}
    
    Provide a concise and helpful response focusing specifically on the order details provided.
  `;
}

/**
 * Builds AI context with Metakocka order data
 * @param contextData Base context data
 * @param userId User ID for fetching Metakocka data
 * @returns Enhanced context with Metakocka order data
 */
export async function enhanceContextWithOrderData(contextData: any, userId: string): Promise<any> {
  // If there's no order ID in the context, return the original context
  if (!contextData.orderId) {
    return contextData;
  }
  
  try {
    // Fetch order data
    const orderData = await getOrderDataForAI(contextData.orderId, userId);
    
    if (!orderData) {
      return contextData;
    }
    
    // If there's a customer ID, fetch recent orders for the customer
    let recentOrders = [];
    if (contextData.customerId) {
      recentOrders = await getRecentOrdersForCustomer(contextData.customerId, userId, 3);
    }
    
    // Enhance the context with order data
    return {
      ...contextData,
      metakockaOrderData: orderData,
      metakockaRecentOrders: recentOrders.length > 0 ? recentOrders : undefined
    };
  } catch (error) {
    console.error('Error enhancing context with order data:', error);
    return contextData;
  }
}
