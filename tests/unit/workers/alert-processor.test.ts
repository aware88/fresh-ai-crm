import { processAlerts } from '@/workers/alert-processor';
import { createServerClient } from '@/lib/supabase/server';
import { AlertNotificationService } from '@/lib/services/alert-notification-service';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/services/alert-notification-service');

// Mock the process.exit function
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
  throw new Error(`Process exited with code ${code}`);
});

describe('Alert Processor', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };

  const testAlert = {
    id: 'test-alert-id',
    user_id: 'test-user-id',
    product_id: 'test-product-id',
    threshold_quantity: 10,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_triggered_at: null,
  };

  const testInventory = {
    product_id: 'test-product-id',
    quantity_available: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('processAlerts', () => {
    it('should process all active alerts', async () => {
      // Setup
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'test-user-id', email: 'test@example.com' },
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [testAlert],
        error: null,
      });

      // Execute
      await processAlerts();

      // Verify
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory_alerts');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should handle no active alerts', async () => {
      // Setup
      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Execute
      await processAlerts();

      // Verify
      expect(console.log).toHaveBeenCalledWith('No active alerts to process');
    });

    it('should handle database errors', async () => {
      // Setup
      const testError = new Error('Database error');
      mockSupabase.select.mockRejectedValueOnce(testError);

      // Execute
      await processAlerts();

      // Verify
      expect(console.error).toHaveBeenCalledWith('Error processing alerts:', testError);
    });
  });

  // Note: The processSingleAlert function is not directly exported from alert-processor
  // as it's an internal function. We test it indirectly through processAlerts.
  
  describe('processAlerts', () => {
    it('should process alerts for all active alerts', async () => {
      // Setup
      const testAlerts = [testAlert];
      
      // Mock getAlerts to return test alerts
      mockSupabase.select.mockResolvedValueOnce({
        data: testAlerts,
        error: null,
      });
      
      // Mock inventory check
      mockSupabase.single.mockResolvedValueOnce({
        data: testInventory,
        error: null,
      });
      
      // Mock AlertNotificationService
      jest.spyOn(AlertNotificationService, 'sendAlertNotification').mockResolvedValue(true);
      jest.spyOn(AlertNotificationService, 'sendSmsNotification').mockResolvedValue(true);
      
      // Execute
      await processAlerts();
      
      // Verify
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory_alerts');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
      
      // Verify notifications were sent for the alert
      expect(AlertNotificationService.sendAlertNotification).toHaveBeenCalled();
      expect(AlertNotificationService.sendSmsNotification).toHaveBeenCalled();
    });
    
    it('should handle errors when processing alerts', async () => {
      // Mock getAlerts to return test alerts
      mockSupabase.select.mockResolvedValueOnce({
        data: [testAlert],
        error: null,
      });
      
      // Mock inventory check to fail
      const testError = new Error('Database error');
      mockSupabase.single.mockRejectedValueOnce(testError);
      
      // Execute
      await processAlerts();
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error processing alert'),
        expect.anything()
      );
    });
  });

  afterAll(() => {
    mockExit.mockRestore();
  });
});
