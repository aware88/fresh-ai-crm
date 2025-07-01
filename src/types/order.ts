/**
 * Order types for the CRM system
 * Extends the sales document types with order-specific fields and types
 */

import { SalesDocument, SalesDocumentItem } from './sales-document';

/**
 * Order status types
 */
export type OrderStatus = 
  | 'draft' 
  | 'confirmed' 
  | 'processing' 
  | 'partially_fulfilled' 
  | 'fulfilled' 
  | 'cancelled' 
  | 'on_hold';

/**
 * Order fulfillment status
 */
export type FulfillmentStatus = 
  | 'unfulfilled' 
  | 'partially_fulfilled' 
  | 'fulfilled';

/**
 * Order payment status
 */
export type PaymentStatus = 
  | 'unpaid' 
  | 'partially_paid' 
  | 'paid' 
  | 'refunded' 
  | 'partially_refunded';

/**
 * Order item interface
 * Extends SalesDocumentItem with order-specific fields
 */
export interface OrderItem extends SalesDocumentItem {
  fulfillment_status?: FulfillmentStatus;
  allocated_quantity?: number;
  fulfilled_quantity?: number;
  warehouse_id?: string;
  warehouse_location?: string;
  tracking_number?: string;
  shipping_date?: string;
}

/**
 * Order interface
 * Extends SalesDocument with order-specific fields
 */
export interface Order extends SalesDocument {
  document_type: 'order'; // Always 'order' for Order type
  order_status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  payment_status: PaymentStatus;
  shipping_address?: string;
  shipping_method?: string;
  tracking_number?: string;
  shipping_cost?: number;
  discount_amount?: number;
  expected_delivery_date?: string;
  fulfillment_date?: string;
  items?: OrderItem[];
}

/**
 * Order inventory allocation interface
 */
export interface OrderInventoryAllocation {
  id?: string;
  order_id: string;
  product_id: string;
  allocated_quantity: number;
  fulfilled_quantity: number;
  allocation_status: 'pending' | 'allocated' | 'fulfilled' | 'released';
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Order fulfillment interface
 */
export interface OrderFulfillment {
  id?: string;
  order_id: string;
  fulfillment_date: string;
  tracking_number?: string;
  shipping_carrier?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    warehouse_id?: string;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Order sync result interface
 */
export interface OrderSyncResult {
  success: boolean;
  orderId?: string;
  metakockaId?: string;
  error?: string;
  errorCode?: string;
  errorDetails?: Record<string, any>;
}
