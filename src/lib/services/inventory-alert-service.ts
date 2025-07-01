import { createServerClient } from '@/lib/supabase/server';
import { InventoryAlert, InventoryAlertInsert, InventoryAlertUpdate, InventoryAlertWithProduct, InventoryAlertCheckResult, InventoryAlertStats } from '@/types/inventory';

export class InventoryAlertService {
  /**
   * Get all inventory alerts for a user
   */
  static async getAlerts(userId: string): Promise<InventoryAlertWithProduct[]> {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('inventory_alerts')
      .select(`
        *,
        product:products(id, name, sku)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory alerts:', error);
      throw error;
    }

    return data.map(alert => ({
      ...alert,
      product_name: alert.product?.name,
      product_sku: alert.product?.sku,
    }));
  }

  /**
   * Get a single inventory alert by ID
   */
  static async getAlertById(userId: string, alertId: string): Promise<InventoryAlertWithProduct | null> {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('inventory_alerts')
      .select(`
        *,
        product:products(id, name, sku)
      `)
      .eq('id', alertId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error(`Error fetching inventory alert ${alertId}:`, error);
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      product_name: data.product?.name,
      product_sku: data.product?.sku,
    };
  }

  /**
   * Create a new inventory alert
   */
  static async createAlert(userId: string, alertData: Omit<InventoryAlertInsert, 'user_id'>): Promise<InventoryAlert> {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('inventory_alerts')
      .insert([{ ...alertData, user_id: userId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory alert:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update an existing inventory alert
   */
  static async updateAlert(
    userId: string, 
    alertId: string, 
    updates: InventoryAlertUpdate
  ): Promise<InventoryAlert> {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('inventory_alerts')
      .update(updates)
      .eq('id', alertId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating inventory alert ${alertId}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Delete an inventory alert
   */
  static async deleteAlert(userId: string, alertId: string): Promise<void> {
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('inventory_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', userId);

    if (error) {
      console.error(`Error deleting inventory alert ${alertId}:`, error);
      throw error;
    }
  }

  /**
   * Check for triggered inventory alerts
   */
  static async checkAlerts(userId: string): Promise<InventoryAlertCheckResult[]> {
    const supabase = createServerClient();
    
    // Get all active alerts with current inventory levels
    const { data, error } = await supabase.rpc('check_inventory_alerts', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error checking inventory alerts:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get alert statistics
   */
  static async getAlertStats(userId: string): Promise<InventoryAlertStats> {
    const supabase = createServerClient();
    
    // Use the database function to get all stats in a single query
    const { data, error } = await supabase
      .rpc('get_inventory_alert_stats', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error getting alert stats:', error);
      throw error;
    }

    // Default values in case the database function fails
    const defaultStats: InventoryAlertStats = {
      total_alerts: 0,
      active_alerts: 0,
      triggered_alerts: 0,
      recent_alerts: []
    };

    // If we got data from the database function, use it
    if (data) {
      return {
        total_alerts: data.total_alerts || 0,
        active_alerts: data.active_alerts || 0,
        triggered_alerts: data.triggered_alerts || 0,
        recent_alerts: data.recent_alerts || []
      };
    }

    // Fallback to the default values
    return defaultStats;
  }

  /**
   * Toggle alert active status
   */
  static async toggleAlert(userId: string, alertId: string, isActive: boolean): Promise<InventoryAlert> {
    return this.updateAlert(userId, alertId, { is_active: isActive });
  }
}
