import { InventoryAlertService } from '@/lib/services/inventory-alert-service';
import { createServerClient } from '@/lib/supabase/server';

// Mock the Supabase client
jest.mock('@/lib/supabase/server');

describe('InventoryAlertService', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    rpc: jest.fn().mockReturnThis(),
    data: [],
    error: null,
  };

  const testUserId = 'test-user-id';
  const testAlertId = 'test-alert-id';
  const testProductId = 'test-product-id';
  
  const testAlert = {
    id: testAlertId,
    user_id: testUserId,
    product_id: testProductId,
    threshold_quantity: 10,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_triggered_at: null,
  };

  const testAlertWithProduct = {
    ...testAlert,
    product_name: 'Test Product',
    product_sku: 'TEST-123',
    current_quantity: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('getAlerts', () => {
    it('should fetch all alerts for a user', async () => {
      // Setup
      const testAlerts = [testAlertWithProduct];
      mockSupabase.select.mockResolvedValueOnce({
        data: testAlerts,
        error: null,
      });

      // Execute
      const result = await InventoryAlertService.getAlerts(testUserId);

      // Verify
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory_alerts');
      expect(mockSupabase.select).toHaveBeenCalledWith(`
        *,
        products:product_id (id, name, sku)
      `);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', testUserId);
      expect(result).toEqual(testAlerts);
    });

    it('should handle database errors', async () => {
      // Setup
      const testError = new Error('Database error');
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: testError,
      });

      // Execute & Verify
      await expect(InventoryAlertService.getAlerts(testUserId)).rejects.toThrow(testError);
    });
  });

  describe('getAlertById', () => {
    it('should fetch a specific alert by ID', async () => {
      // Setup
      mockSupabase.single.mockResolvedValueOnce({
        data: testAlertWithProduct,
        error: null,
      });

      // Execute
      const result = await InventoryAlertService.getAlertById(testUserId, testAlertId);

      // Verify
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory_alerts');
      expect(mockSupabase.select).toHaveBeenCalledWith(`
        *,
        products:product_id (id, name, sku)
      `);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', testAlertId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', testUserId);
      expect(mockSupabase.single).toHaveBeenCalled();
      expect(result).toEqual(testAlertWithProduct);
    });
  });

  describe('createAlert', () => {
    it('should create a new alert', async () => {
      // Setup
      const newAlert = {
        product_id: testProductId,
        threshold_quantity: 15,
        is_active: true,
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: testAlert,
        error: null,
      });

      // Execute
      const result = await InventoryAlertService.createAlert(testUserId, newAlert);

      // Verify
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory_alerts');
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        {
          ...newAlert,
          user_id: testUserId,
        },
      ]);
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(result).toEqual(testAlert);
    });
  });

  describe('updateAlert', () => {
    it('should update an existing alert', async () => {
      // Setup
      const updates = {
        threshold_quantity: 20,
        is_active: false,
      };

      const updatedAlert = {
        ...testAlert,
        ...updates,
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: updatedAlert,
        error: null,
      });

      // Execute
      const result = await InventoryAlertService.updateAlert(testUserId, testAlertId, updates);

      // Verify
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory_alerts');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String),
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', testAlertId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', testUserId);
      expect(result).toEqual(updatedAlert);
    });
  });

  describe('deleteAlert', () => {
    it('should delete an alert', async () => {
      // Setup
      mockSupabase.single.mockResolvedValueOnce({
        data: testAlert,
        error: null,
      });

      // Execute
      await InventoryAlertService.deleteAlert(testUserId, testAlertId);

      // Verify
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory_alerts');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', testAlertId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', testUserId);
    });
  });

  describe('checkAlerts', () => {
    it('should check for triggered alerts', async () => {
      // Setup
      const triggeredAlerts = [
        {
          alert_id: testAlertId,
          alert: testAlertWithProduct,
          is_triggered: true,
          current_quantity: 5,
          threshold_quantity: 10,
          triggered_at: new Date().toISOString(),
        },
      ];

      // Mock the RPC call
      const mockRpc = jest.fn().mockResolvedValueOnce({
        data: triggeredAlerts,
        error: null,
      });
      
      // Mock the Supabase client to return our mockRpc
      (createServerClient as jest.Mock)().rpc = mockRpc;

      // Execute
      const result = await InventoryAlertService.checkAlerts(testUserId);

      // Verify
      expect(mockRpc).toHaveBeenCalledWith('check_inventory_alerts', {
        p_user_id: testUserId,
      });
      expect(result).toEqual(triggeredAlerts);
    });
  });

  describe('getAlertStats', () => {
    it('should return alert statistics', async () => {
      // Setup
      const stats = {
        total_alerts: 5,
        active_alerts: 3,
        triggered_alerts: 1,
        recent_alerts: [testAlertWithProduct],
      };

      // Mock the RPC call
      const mockRpc = jest.fn().mockResolvedValueOnce({
        data: [stats],
        error: null,
      });
      
      // Mock the Supabase client to return our mockRpc
      (createServerClient as jest.Mock)().rpc = mockRpc;

      // Execute
      const result = await InventoryAlertService.getAlertStats(testUserId);

      // Verify
      expect(mockRpc).toHaveBeenCalledWith('get_inventory_alert_stats', {
        p_user_id: testUserId,
      });
      expect(result).toEqual(stats);
    });
  });
});
