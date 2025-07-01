import { Database } from './supabase';

export type InventoryAlert = Database['public']['Tables']['inventory_alerts']['Row'] & {
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
};

export type InventoryAlertInsert = Database['public']['Tables']['inventory_alerts']['Insert'];

export type InventoryAlertUpdate = Database['public']['Tables']['inventory_alerts']['Update'];

export interface InventoryAlertWithProduct {
  id: string;
  product_id: string;
  user_id: string;
  threshold_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_triggered_at: string | null;
  product_name: string;
  product_sku: string;
  current_quantity: number;
  is_triggered?: boolean;
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
}

export interface InventoryAlertCheckResult {
  alert_id: string;
  alert: InventoryAlertWithProduct;
  is_triggered: boolean;
  current_quantity: number;
  threshold_quantity: number;
  triggered_at: string;
}

export interface InventoryAlertStats {
  total_alerts: number;
  active_alerts: number;
  triggered_alerts: number;
  recent_alerts: InventoryAlertWithProduct[];
}

export const INVENTORY_ALERT_TYPES = {
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  REORDER: 'reorder',
} as const;

export type InventoryAlertType = keyof typeof INVENTORY_ALERT_TYPES;
